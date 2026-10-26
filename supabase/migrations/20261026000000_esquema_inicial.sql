-- =====================================================================
-- Copiloto Judicial · Esquema inicial (fase 1)
--
-- Principios:
--   * Multi-tenant por despacho: toda fila operativa lleva despacho_id y
--     RLS impide ver datos de despachos ajenos.
--   * Los procesos con reserva solo los ven el juez, el secretario y el
--     sustanciador asignado.
--   * Calendario, tasas y catálogo de términos son datos de referencia
--     globales: todos los leen, solo un administrador de plataforma escribe.
--   * Nada se borra físicamente en tablas judiciales: se cambia el estado.
--   * Toda escritura queda en la bitácora de auditoría (inmutable).
-- =====================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.especialidad as enum (
  'civil', 'familia', 'laboral', 'penal', 'promiscuo', 'contencioso_administrativo'
);
create type public.rol_despacho as enum ('juez', 'secretario', 'sustanciador');
create type public.unidad_termino as enum ('horas', 'dias_habiles', 'dias_calendario', 'meses', 'anios');
create type public.estado_validacion as enum ('pendiente_validacion', 'validado');
create type public.estado_proceso as enum ('activo', 'terminado', 'archivado');
create type public.estado_termino as enum ('en_curso', 'suspendido', 'cumplido', 'cancelado');
create type public.tipo_novedad_termino as enum ('suspension', 'interrupcion', 'prorroga');
create type public.alcance_suspension as enum ('nacional', 'seccional', 'despacho');
create type public.tipo_suspension as enum (
  'vacancia_colectiva', 'semana_santa', 'acuerdo_csj', 'cierre_despacho', 'otro'
);
create type public.tipo_indice as enum ('interes_bancario_corriente', 'ipc');
create type public.tipo_parte as enum (
  'demandante', 'demandado', 'accionante', 'accionado', 'vinculado',
  'apoderado', 'ministerio_publico', 'tercero'
);
create type public.categoria_plantilla as enum ('auto', 'sentencia', 'oficio', 'otro');
create type public.tipo_documento_judicial as enum ('providencia', 'oficio', 'anexo', 'expediente');
create type public.tipo_medida as enum (
  'embargo_cuenta_bancaria', 'embargo_vehiculo', 'embargo_inmueble', 'embargo_salario',
  'secuestro', 'inscripcion_demanda', 'medida_aseguramiento', 'suspension_provisional', 'otra'
);
create type public.estado_medida as enum ('decretada', 'oficiada', 'registrada', 'levantada', 'sin_efecto');
create type public.accion_auditoria as enum ('crear', 'modificar', 'eliminar', 'consultar', 'descargar');

-- ---------------------------------------------------------------------
-- Usuarios y despachos
-- ---------------------------------------------------------------------

-- Administradores de la plataforma (cargan festivos, tasas, catálogo).
-- Solo se gestiona con la service_role: no hay políticas de escritura.
create table public.administradores_plataforma (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  creado_en  timestamptz not null default now()
);

-- Un perfil por usuario de Supabase Auth (lo crea un trigger).
create table public.perfiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null default '' check (char_length(nombre_completo) <= 200),
  correo          text not null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create table public.despachos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null check (char_length(nombre) between 3 and 200),
  -- Código de 12 dígitos: departamento(2) + municipio(3) + entidad(2) + especialidad(2) + despacho(3)
  codigo              char(12) not null unique check (codigo ~ '^[0-9]{12}$'),
  departamento        text not null,
  municipio           text not null,
  seccional           text not null,
  especialidad        public.especialidad not null,
  -- Algunos despachos (p. ej. control de garantías) no tienen vacancia colectiva.
  vacancia_colectiva  boolean not null default true,
  -- Semáforo: % del término consumido a partir del cual cambia el color.
  umbral_amarillo_pct smallint not null default 50,
  umbral_rojo_pct     smallint not null default 80,
  creado_por          uuid not null references public.perfiles (id),
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  constraint umbrales_validos check (
    umbral_amarillo_pct between 1 and 99
    and umbral_rojo_pct between 2 and 100
    and umbral_amarillo_pct < umbral_rojo_pct
  )
);

-- Relación usuario ↔ despacho con su rol. Un usuario puede estar en varios despachos.
create table public.membresias (
  id             uuid primary key default gen_random_uuid(),
  despacho_id    uuid not null references public.despachos (id) on delete cascade,
  usuario_id     uuid not null references public.perfiles (id) on delete cascade,
  rol            public.rol_despacho not null,
  activo         boolean not null default true,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (despacho_id, usuario_id)
);
create index membresias_usuario_idx on public.membresias (usuario_id) where activo;

-- ---------------------------------------------------------------------
-- Procesos y partes
-- ---------------------------------------------------------------------
create table public.procesos (
  id             uuid primary key default gen_random_uuid(),
  despacho_id    uuid not null references public.despachos (id),
  -- Radicado de 23 dígitos: despacho(12) + año(4) + consecutivo(5) + recurso(2)
  radicado       char(23) not null check (radicado ~ '^[0-9]{23}$'),
  especialidad   public.especialidad not null,
  clase          text not null check (char_length(clase) between 2 and 100), -- 'tutela', 'ejecutivo', 'verbal'…
  instancia      text not null default 'primera' check (instancia in ('primera', 'segunda', 'unica')),
  fecha_reparto  date,
  estado         public.estado_proceso not null default 'activo',
  reservado      boolean not null default false,
  asignado_a     uuid references public.perfiles (id),
  observaciones  text,
  creado_por     uuid not null references public.perfiles (id),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (despacho_id, radicado),
  unique (id, despacho_id) -- permite FK compuestas que fijan el despacho de las tablas hijas
);
create index procesos_asignado_idx on public.procesos (asignado_a);

create table public.partes (
  id                    uuid primary key default gen_random_uuid(),
  proceso_id            uuid not null,
  despacho_id           uuid not null,
  tipo                  public.tipo_parte not null,
  nombre                text not null check (char_length(nombre) between 2 and 300),
  tipo_identificacion   text check (tipo_identificacion in ('CC', 'CE', 'NIT', 'TI', 'PA', 'PPT', 'RC', 'OTRO')),
  numero_identificacion text check (char_length(numero_identificacion) <= 30),
  correo                text,
  representa_a          uuid references public.partes (id),
  creado_por            uuid not null references public.perfiles (id),
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now(),
  foreign key (proceso_id, despacho_id) references public.procesos (id, despacho_id) on delete cascade
);
create index partes_proceso_idx on public.partes (proceso_id);

-- ---------------------------------------------------------------------
-- Calendario judicial (datos de referencia)
-- ---------------------------------------------------------------------
create table public.festivos (
  fecha  date primary key,
  nombre text not null,
  norma  text not null default 'Ley 51 de 1983'
);

-- Días en que no corren términos: vacancia, Semana Santa, acuerdos del CSJ,
-- cierres puntuales de un despacho.
create table public.suspensiones_terminos (
  id           uuid primary key default gen_random_uuid(),
  tipo         public.tipo_suspension not null,
  alcance      public.alcance_suspension not null,
  seccional    text,
  despacho_id  uuid references public.despachos (id),
  fecha_inicio date not null,
  fecha_fin    date not null,
  motivo       text not null,
  soporte      text not null, -- número de acuerdo, circular o acto
  creado_por   uuid references public.perfiles (id),
  creado_en    timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio),
  check ((alcance = 'despacho') = (despacho_id is not null)),
  check ((alcance = 'seccional') = (seccional is not null))
);
create index suspensiones_rango_idx on public.suspensiones_terminos using gist (daterange(fecha_inicio, fecha_fin, '[]'));
create index suspensiones_despacho_idx on public.suspensiones_terminos (despacho_id) where despacho_id is not null;

-- ---------------------------------------------------------------------
-- Términos
-- ---------------------------------------------------------------------

-- Catálogo de términos legales. Cada fila debe validarla un jurista
-- antes de pasar a 'validado'.
create table public.tipos_termino (
  codigo            text primary key check (codigo ~ '^[a-z0-9_]+$'),
  nombre            text not null,
  especialidades    public.especialidad[], -- null = aplica a todas
  unidad            public.unidad_termino not null,
  cantidad          integer not null check (cantidad > 0),
  norma             text not null,
  descripcion       text,
  estado_validacion public.estado_validacion not null default 'pendiente_validacion',
  activo            boolean not null default true
);

-- Un término concreto que corre dentro de un proceso.
-- fecha_vencimiento la calcula el motor de dominio (src/domain/terminos)
-- y se recalcula cuando cambian el calendario o las novedades.
create table public.terminos (
  id                uuid primary key default gen_random_uuid(),
  proceso_id        uuid not null,
  despacho_id       uuid not null,
  tipo_codigo       text not null references public.tipos_termino (codigo),
  unidad            public.unidad_termino not null,
  cantidad          integer not null check (cantidad > 0),
  fecha_evento      date not null, -- hecho que inicia el término (notificación, reparto…)
  hora_evento       time,          -- solo para términos en horas
  fecha_vencimiento date,
  hora_vencimiento  time,
  calculado_en      timestamptz,
  estado            public.estado_termino not null default 'en_curso',
  cumplido_en       date,
  observaciones     text,
  creado_por        uuid not null references public.perfiles (id),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  foreign key (proceso_id, despacho_id) references public.procesos (id, despacho_id),
  unique (id, despacho_id),
  check ((unidad = 'horas') = (hora_evento is not null)),
  check (estado <> 'cumplido' or cumplido_en is not null),
  check (fecha_vencimiento is null or fecha_vencimiento >= fecha_evento)
);
create index terminos_tablero_idx on public.terminos (despacho_id, estado, fecha_vencimiento);
create index terminos_proceso_idx on public.terminos (proceso_id);

-- Suspensiones, interrupciones y prórrogas de un término específico,
-- siempre con el auto que las soporta.
create table public.novedades_termino (
  id           uuid primary key default gen_random_uuid(),
  termino_id   uuid not null,
  despacho_id  uuid not null,
  tipo         public.tipo_novedad_termino not null,
  fecha_inicio date not null,
  fecha_fin    date,
  cantidad     integer check (cantidad > 0),   -- solo prórroga
  unidad       public.unidad_termino,          -- solo prórroga
  soporte      text not null,
  creado_por   uuid not null references public.perfiles (id),
  creado_en    timestamptz not null default now(),
  foreign key (termino_id, despacho_id) references public.terminos (id, despacho_id) on delete cascade,
  check (fecha_fin is null or fecha_fin >= fecha_inicio),
  check ((tipo = 'prorroga') = (cantidad is not null and unidad is not null))
);
create index novedades_termino_idx on public.novedades_termino (termino_id);

-- ---------------------------------------------------------------------
-- Tasas e índices económicos (datos de referencia)
-- ---------------------------------------------------------------------

-- Interés bancario corriente certificado por la Superfinanciera (la usura
-- se deriva: 1,5 veces) e IPC mensual del DANE. Sin traslapes por tipo y modalidad.
create table public.indices_economicos (
  id           uuid primary key default gen_random_uuid(),
  tipo         public.tipo_indice not null,
  modalidad    text not null default 'general', -- 'consumo_ordinario', 'microcredito'…
  vigencia     daterange not null check (not isempty(vigencia) and not lower_inf(vigencia) and not upper_inf(vigencia)),
  valor        numeric(14, 6) not null check (valor > 0),
  unidad       text not null check (unidad in ('efectivo_anual_pct', 'indice')),
  fuente       text not null,
  acto_soporte text, -- p. ej. número de resolución de la Superfinanciera
  cargado_por  uuid references public.perfiles (id),
  cargado_en   timestamptz not null default now(),
  constraint indices_sin_traslape exclude using gist (tipo with =, modalidad with =, vigencia with &&)
);

-- ---------------------------------------------------------------------
-- Plantillas y documentos
-- ---------------------------------------------------------------------
create table public.plantillas (
  id             uuid primary key default gen_random_uuid(),
  despacho_id    uuid references public.despachos (id), -- null = plantilla global
  especialidad   public.especialidad,                    -- null = todas
  categoria      public.categoria_plantilla not null,
  nombre         text not null check (char_length(nombre) between 3 and 200),
  descripcion    text,
  activo         boolean not null default true,
  creado_por     uuid references public.perfiles (id),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index plantillas_despacho_idx on public.plantillas (despacho_id);

-- Cada cambio de una plantilla crea una versión nueva; las anteriores no se tocan.
create table public.versiones_plantilla (
  id           uuid primary key default gen_random_uuid(),
  plantilla_id uuid not null references public.plantillas (id) on delete cascade,
  version      integer not null check (version > 0),
  ruta_archivo text not null unique, -- bucket 'plantillas'
  -- Definición de variables: [{ "nombre": "radicado", "tipo": "radicado", "obligatoria": true }, …]
  variables    jsonb not null default '[]' check (jsonb_typeof(variables) = 'array'),
  notas        text,
  creado_por   uuid references public.perfiles (id),
  creado_en    timestamptz not null default now(),
  unique (plantilla_id, version)
);

-- Metadatos de cada archivo guardado en el bucket 'expedientes'.
-- Inmutables: para corregir se genera un documento nuevo.
create table public.documentos (
  id                  uuid primary key default gen_random_uuid(),
  despacho_id         uuid not null,
  proceso_id          uuid not null,
  tipo                public.tipo_documento_judicial not null,
  nombre_archivo      text not null,
  ruta_archivo        text not null unique,
  tipo_mime           text not null,
  tamano_bytes        bigint not null check (tamano_bytes > 0 and tamano_bytes <= 26214400),
  sha256              char(64) check (sha256 ~ '^[0-9a-f]{64}$'),
  version_plantilla_id uuid references public.versiones_plantilla (id),
  datos_combinados    jsonb, -- valores usados al generar desde plantilla
  creado_por          uuid not null references public.perfiles (id),
  creado_en           timestamptz not null default now(),
  foreign key (proceso_id, despacho_id) references public.procesos (id, despacho_id),
  -- La ruta en Storage debe ser {despacho_id}/{proceso_id}/…
  check (ruta_archivo like despacho_id::text || '/' || proceso_id::text || '/%')
);
create index documentos_proceso_idx on public.documentos (proceso_id);

-- ---------------------------------------------------------------------
-- Medidas cautelares
-- ---------------------------------------------------------------------
create table public.medidas_cautelares (
  id                  uuid primary key default gen_random_uuid(),
  proceso_id          uuid not null,
  despacho_id         uuid not null,
  tipo                public.tipo_medida not null,
  entidad_destinataria text not null,
  descripcion         text not null,
  valor_limite        numeric(18, 2) check (valor_limite is null or valor_limite > 0),
  estado              public.estado_medida not null default 'decretada',
  fecha_decreto       date not null,
  fecha_oficio        date,
  fecha_registro      date,
  fecha_levantamiento date,
  documento_oficio_id uuid references public.documentos (id),
  observaciones       text,
  creado_por          uuid not null references public.perfiles (id),
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  foreign key (proceso_id, despacho_id) references public.procesos (id, despacho_id),
  check (fecha_oficio is null or fecha_oficio >= fecha_decreto),
  check (fecha_registro is null or fecha_registro >= fecha_decreto),
  check (fecha_levantamiento is null or fecha_levantamiento >= fecha_decreto),
  check (estado <> 'oficiada' or fecha_oficio is not null),
  check (estado <> 'registrada' or fecha_registro is not null),
  check (estado <> 'levantada' or fecha_levantamiento is not null)
);
create index medidas_proceso_idx on public.medidas_cautelares (proceso_id);
create index medidas_tablero_idx on public.medidas_cautelares (despacho_id, estado);

-- ---------------------------------------------------------------------
-- Auditoría (solo inserción, desde triggers y funciones)
-- ---------------------------------------------------------------------
create table public.auditoria (
  id               bigint generated always as identity primary key,
  ocurrido_en      timestamptz not null default now(),
  usuario_id       uuid, -- sin FK: el registro sobrevive al usuario
  despacho_id      uuid,
  accion           public.accion_auditoria not null,
  tabla            text not null,
  registro_id      uuid,
  datos_anteriores jsonb,
  datos_nuevos     jsonb
);
create index auditoria_despacho_idx on public.auditoria (despacho_id, ocurrido_en desc);
create index auditoria_registro_idx on public.auditoria (registro_id);

-- =====================================================================
-- Funciones auxiliares de autorización
-- (security definer para que las políticas no se llamen entre sí en bucle)
-- =====================================================================
create function public.es_admin_plataforma()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.administradores_plataforma
    where usuario_id = (select auth.uid())
  );
$$;

-- ¿El usuario actual es miembro activo del despacho (con alguno de los roles)?
create function public.tiene_rol(p_despacho uuid, p_roles public.rol_despacho[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membresias m
    where m.despacho_id = p_despacho
      and m.usuario_id = (select auth.uid())
      and m.activo
      and (p_roles is null or m.rol = any (p_roles))
  );
$$;

-- ¿El usuario actual puede ver el proceso? (membresía + reserva)
create function public.puede_ver_proceso(p_proceso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.procesos p
    join public.membresias m
      on m.despacho_id = p.despacho_id
     and m.usuario_id = (select auth.uid())
     and m.activo
    where p.id = p_proceso
      and (
        not p.reservado
        or m.rol in ('juez', 'secretario')
        or p.asignado_a = (select auth.uid())
      )
  );
$$;

-- ¿El usuario actual comparte algún despacho con otro usuario?
create function public.comparte_despacho(p_usuario uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.membresias yo
    join public.membresias otro on otro.despacho_id = yo.despacho_id
    where yo.usuario_id = (select auth.uid()) and yo.activo
      and otro.usuario_id = p_usuario
  );
$$;

-- Ruta en bucket 'expedientes': {despacho_id}/{proceso_id}/{archivo}
create function public.puede_ver_ruta_expediente(p_ruta text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_despacho text := split_part(p_ruta, '/', 1);
  v_proceso  text := split_part(p_ruta, '/', 2);
  v_uuid     text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if v_despacho !~ v_uuid or v_proceso !~ v_uuid or split_part(p_ruta, '/', 3) = '' then
    return false;
  end if;
  return exists (
    select 1 from public.procesos p
    where p.id = v_proceso::uuid and p.despacho_id = v_despacho::uuid
  ) and public.puede_ver_proceso(v_proceso::uuid);
end;
$$;

-- Ruta en bucket 'plantillas': global/{plantilla_id}/… o {despacho_id}/{plantilla_id}/…
create function public.puede_usar_ruta_plantilla(p_ruta text, p_escribir boolean)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_raiz text := split_part(p_ruta, '/', 1);
begin
  if split_part(p_ruta, '/', 2) = '' or split_part(p_ruta, '/', 3) = '' then
    return false;
  end if;
  if v_raiz = 'global' then
    return (not p_escribir) or public.es_admin_plataforma();
  end if;
  if v_raiz !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  if p_escribir then
    return public.tiene_rol(v_raiz::uuid, array['juez', 'secretario']::public.rol_despacho[]);
  end if;
  return public.tiene_rol(v_raiz::uuid);
end;
$$;

-- =====================================================================
-- Triggers
-- =====================================================================

-- Perfil automático al registrarse un usuario.
create function public.crear_perfil_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, correo, nombre_completo)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'nombre_completo', ''));
  return new;
end;
$$;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

create function public.fijar_actualizado_en()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'perfiles', 'despachos', 'membresias', 'procesos', 'partes',
    'terminos', 'plantillas', 'medidas_cautelares'
  ] loop
    execute format(
      'create trigger fijar_actualizado_en before update on public.%I
         for each row execute function public.fijar_actualizado_en()', t);
  end loop;
end $$;

-- Ningún despacho puede quedar sin juez activo.
create function public.proteger_ultimo_juez()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.rol = 'juez' and old.activo and (new.rol <> 'juez' or not new.activo) then
    if not exists (
      select 1 from public.membresias
      where despacho_id = old.despacho_id and rol = 'juez' and activo and id <> old.id
    ) then
      raise exception 'El despacho debe conservar al menos un juez activo';
    end if;
  end if;
  return new;
end;
$$;
create trigger proteger_ultimo_juez
  before update on public.membresias
  for each row execute function public.proteger_ultimo_juez();

-- Solo juez o secretario cambian la reserva o la asignación de un proceso,
-- y el asignado debe ser miembro activo del despacho.
create function public.proteger_reserva_proceso()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE'
     and (new.reservado is distinct from old.reservado or new.asignado_a is distinct from old.asignado_a)
     and (select auth.uid()) is not null
     and not public.tiene_rol(new.despacho_id, array['juez', 'secretario']::public.rol_despacho[]) then
    raise exception 'Solo el juez o el secretario pueden cambiar la reserva o la asignación del proceso';
  end if;
  if new.asignado_a is not null and not exists (
    select 1 from public.membresias
    where despacho_id = new.despacho_id and usuario_id = new.asignado_a and activo
  ) then
    raise exception 'El usuario asignado no es miembro activo del despacho';
  end if;
  return new;
end;
$$;
create trigger proteger_reserva_proceso
  before insert or update on public.procesos
  for each row execute function public.proteger_reserva_proceso();

-- Bitácora: registra toda escritura con la fila antes y después.
create function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_fila jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.auditoria (usuario_id, despacho_id, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
  values (
    (select auth.uid()),
    coalesce(
      (v_fila ->> 'despacho_id')::uuid,
      case when tg_table_name = 'despachos' then (v_fila ->> 'id')::uuid end
    ),
    (case tg_op when 'INSERT' then 'crear' when 'UPDATE' then 'modificar' else 'eliminar' end)::public.accion_auditoria,
    tg_table_name,
    (v_fila ->> 'id')::uuid,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'despachos', 'membresias', 'procesos', 'partes', 'terminos', 'novedades_termino',
    'suspensiones_terminos', 'plantillas', 'versiones_plantilla', 'documentos',
    'medidas_cautelares', 'tipos_termino', 'indices_economicos', 'festivos'
  ] loop
    execute format(
      'create trigger auditar after insert or update or delete on public.%I
         for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;

-- La bitácora no se modifica ni se borra.
create function public.impedir_cambios_auditoria()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'La bitácora de auditoría es inmutable';
end;
$$;
create trigger auditoria_inmutable
  before update or delete on public.auditoria
  for each row execute function public.impedir_cambios_auditoria();
create trigger auditoria_sin_truncate
  before truncate on public.auditoria
  for each statement execute function public.impedir_cambios_auditoria();

-- =====================================================================
-- Funciones RPC
-- =====================================================================

-- Onboarding: crea el despacho y deja al usuario como juez, en una sola transacción.
create function public.crear_despacho(
  p_nombre text,
  p_codigo text,
  p_departamento text,
  p_municipio text,
  p_seccional text,
  p_especialidad public.especialidad
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_usuario uuid := (select auth.uid());
  v_id uuid;
begin
  if v_usuario is null then
    raise exception 'Usuario no autenticado' using errcode = '28000';
  end if;
  insert into public.despachos (nombre, codigo, departamento, municipio, seccional, especialidad, creado_por)
  values (p_nombre, p_codigo, p_departamento, p_municipio, p_seccional, p_especialidad, v_usuario)
  returning id into v_id;
  insert into public.membresias (despacho_id, usuario_id, rol) values (v_id, v_usuario, 'juez');
  return v_id;
end;
$$;

-- Registra consultas y descargas de documentos (las escrituras ya se auditan solas).
create function public.registrar_acceso_documento(p_documento uuid, p_accion public.accion_auditoria)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_doc public.documentos;
begin
  if p_accion not in ('consultar', 'descargar') then
    raise exception 'Acción no permitida';
  end if;
  select * into v_doc from public.documentos where id = p_documento;
  if v_doc.id is null or not public.puede_ver_proceso(v_doc.proceso_id) then
    raise exception 'Documento no encontrado' using errcode = '42501';
  end if;
  insert into public.auditoria (usuario_id, despacho_id, accion, tabla, registro_id)
  values ((select auth.uid()), v_doc.despacho_id, p_accion, 'documentos', v_doc.id);
end;
$$;

-- =====================================================================
-- Privilegios
-- Supabase concede todo a anon/authenticated por defecto. Se revoca y se
-- concede solo lo necesario, incluso por columna, para que campos como
-- despacho_id, creado_por o codigo no puedan modificarse.
-- =====================================================================
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.es_admin_plataforma(),
  public.tiene_rol(uuid, public.rol_despacho[]),
  public.puede_ver_proceso(uuid),
  public.comparte_despacho(uuid),
  public.puede_ver_ruta_expediente(text),
  public.puede_usar_ruta_plantilla(text, boolean),
  public.crear_despacho(text, text, text, text, text, public.especialidad),
  public.registrar_acceso_documento(uuid, public.accion_auditoria)
to authenticated;

grant select on all tables in schema public to authenticated;

grant update (nombre_completo) on public.perfiles to authenticated;
grant update (nombre, departamento, municipio, seccional, especialidad, vacancia_colectiva,
              umbral_amarillo_pct, umbral_rojo_pct) on public.despachos to authenticated;
grant insert (despacho_id, usuario_id, rol) on public.membresias to authenticated;
grant update (rol, activo) on public.membresias to authenticated;
grant insert (despacho_id, radicado, especialidad, clase, instancia, fecha_reparto, reservado,
              asignado_a, observaciones, creado_por) on public.procesos to authenticated;
grant update (clase, instancia, fecha_reparto, estado, reservado, asignado_a, observaciones)
  on public.procesos to authenticated;
grant insert (proceso_id, despacho_id, tipo, nombre, tipo_identificacion, numero_identificacion,
              correo, representa_a, creado_por) on public.partes to authenticated;
grant update (tipo, nombre, tipo_identificacion, numero_identificacion, correo, representa_a)
  on public.partes to authenticated;
grant delete on public.partes to authenticated;
grant insert (proceso_id, despacho_id, tipo_codigo, unidad, cantidad, fecha_evento, hora_evento,
              fecha_vencimiento, hora_vencimiento, calculado_en, observaciones, creado_por)
  on public.terminos to authenticated;
grant update (fecha_vencimiento, hora_vencimiento, calculado_en, estado, cumplido_en, observaciones)
  on public.terminos to authenticated;
grant insert (termino_id, despacho_id, tipo, fecha_inicio, fecha_fin, cantidad, unidad, soporte, creado_por)
  on public.novedades_termino to authenticated;
grant insert, update, delete on public.suspensiones_terminos, public.festivos,
  public.tipos_termino, public.indices_economicos to authenticated;
grant insert, update on public.plantillas to authenticated;
grant insert on public.versiones_plantilla to authenticated;
grant insert (despacho_id, proceso_id, tipo, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes,
              sha256, version_plantilla_id, datos_combinados, creado_por) on public.documentos to authenticated;
grant insert (proceso_id, despacho_id, tipo, entidad_destinataria, descripcion, valor_limite, estado,
              fecha_decreto, fecha_oficio, fecha_registro, fecha_levantamiento, documento_oficio_id,
              observaciones, creado_por) on public.medidas_cautelares to authenticated;
grant update (tipo, entidad_destinataria, descripcion, valor_limite, estado, fecha_oficio, fecha_registro,
              fecha_levantamiento, documento_oficio_id, observaciones) on public.medidas_cautelares to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.administradores_plataforma enable row level security;
alter table public.perfiles                   enable row level security;
alter table public.despachos                  enable row level security;
alter table public.membresias                 enable row level security;
alter table public.procesos                   enable row level security;
alter table public.partes                     enable row level security;
alter table public.festivos                   enable row level security;
alter table public.suspensiones_terminos      enable row level security;
alter table public.tipos_termino              enable row level security;
alter table public.terminos                   enable row level security;
alter table public.novedades_termino          enable row level security;
alter table public.indices_economicos         enable row level security;
alter table public.plantillas                 enable row level security;
alter table public.versiones_plantilla        enable row level security;
alter table public.documentos                 enable row level security;
alter table public.medidas_cautelares         enable row level security;
alter table public.auditoria                  enable row level security;

-- administradores_plataforma: cada uno se ve a sí mismo; se gestiona con service_role.
create policy "admins: ver propio" on public.administradores_plataforma
  for select to authenticated using (usuario_id = (select auth.uid()));

-- perfiles
create policy "perfiles: ver propio y compañeros" on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or public.comparte_despacho(id));
create policy "perfiles: editar propio" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- despachos (la creación va por crear_despacho)
create policy "despachos: ver si es miembro" on public.despachos
  for select to authenticated using (public.tiene_rol(id));
create policy "despachos: juez edita" on public.despachos
  for update to authenticated
  using (public.tiene_rol(id, array['juez']::public.rol_despacho[]))
  with check (public.tiene_rol(id, array['juez']::public.rol_despacho[]));

-- membresias: el juez administra el equipo; los miembros ven a sus compañeros.
create policy "membresias: ver del despacho" on public.membresias
  for select to authenticated using (public.tiene_rol(despacho_id));
create policy "membresias: juez agrega" on public.membresias
  for insert to authenticated
  with check (public.tiene_rol(despacho_id, array['juez']::public.rol_despacho[]));
create policy "membresias: juez modifica" on public.membresias
  for update to authenticated
  using (public.tiene_rol(despacho_id, array['juez']::public.rol_despacho[]))
  with check (public.tiene_rol(despacho_id, array['juez']::public.rol_despacho[]));

-- procesos
-- Se evalúa con las columnas de la fila (no con puede_ver_proceso) para que
-- funcione también en insert ... returning, cuando la fila aún no es visible.
create policy "procesos: ver" on public.procesos
  for select to authenticated
  using (
    public.tiene_rol(despacho_id)
    and (
      not reservado
      or public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[])
      or asignado_a = (select auth.uid())
    )
  );
create policy "procesos: crear" on public.procesos
  for insert to authenticated
  with check (public.tiene_rol(despacho_id) and creado_por = (select auth.uid()));
create policy "procesos: editar" on public.procesos
  for update to authenticated
  using (
    public.tiene_rol(despacho_id)
    and (
      not reservado
      or public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[])
      or asignado_a = (select auth.uid())
    )
  )
  with check (public.tiene_rol(despacho_id));

-- partes, términos y medidas siguen la visibilidad del proceso.
create policy "partes: ver" on public.partes
  for select to authenticated using (public.puede_ver_proceso(proceso_id));
create policy "partes: crear" on public.partes
  for insert to authenticated
  with check (public.puede_ver_proceso(proceso_id) and creado_por = (select auth.uid()));
create policy "partes: editar" on public.partes
  for update to authenticated
  using (public.puede_ver_proceso(proceso_id)) with check (public.puede_ver_proceso(proceso_id));
create policy "partes: borrar (juez o secretario)" on public.partes
  for delete to authenticated
  using (public.puede_ver_proceso(proceso_id)
         and public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[]));

create policy "terminos: ver" on public.terminos
  for select to authenticated using (public.puede_ver_proceso(proceso_id));
create policy "terminos: crear" on public.terminos
  for insert to authenticated
  with check (public.puede_ver_proceso(proceso_id) and creado_por = (select auth.uid()));
create policy "terminos: editar" on public.terminos
  for update to authenticated
  using (public.puede_ver_proceso(proceso_id)) with check (public.puede_ver_proceso(proceso_id));

create policy "novedades: ver" on public.novedades_termino
  for select to authenticated
  using (exists (select 1 from public.terminos t
                 where t.id = termino_id and public.puede_ver_proceso(t.proceso_id)));
create policy "novedades: crear" on public.novedades_termino
  for insert to authenticated
  with check (creado_por = (select auth.uid())
              and exists (select 1 from public.terminos t
                          where t.id = termino_id and public.puede_ver_proceso(t.proceso_id)));

create policy "medidas: ver" on public.medidas_cautelares
  for select to authenticated using (public.puede_ver_proceso(proceso_id));
create policy "medidas: crear" on public.medidas_cautelares
  for insert to authenticated
  with check (public.puede_ver_proceso(proceso_id) and creado_por = (select auth.uid()));
create policy "medidas: editar" on public.medidas_cautelares
  for update to authenticated
  using (public.puede_ver_proceso(proceso_id)) with check (public.puede_ver_proceso(proceso_id));

-- Datos de referencia: lectura para todos los autenticados, escritura solo admin.
create policy "festivos: leer" on public.festivos for select to authenticated using (true);
create policy "festivos: admin escribe" on public.festivos for all to authenticated
  using (public.es_admin_plataforma()) with check (public.es_admin_plataforma());

create policy "tipos_termino: leer" on public.tipos_termino for select to authenticated using (true);
create policy "tipos_termino: admin escribe" on public.tipos_termino for all to authenticated
  using (public.es_admin_plataforma()) with check (public.es_admin_plataforma());

create policy "indices: leer" on public.indices_economicos for select to authenticated using (true);
create policy "indices: admin escribe" on public.indices_economicos for all to authenticated
  using (public.es_admin_plataforma()) with check (public.es_admin_plataforma());

-- Suspensiones: las nacionales/seccionales las carga el admin; las del despacho, su juez o secretario.
create policy "suspensiones: leer" on public.suspensiones_terminos
  for select to authenticated
  using (alcance <> 'despacho' or public.tiene_rol(despacho_id));
create policy "suspensiones: escribir" on public.suspensiones_terminos
  for all to authenticated
  using (
    case when alcance = 'despacho'
      then public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[])
      else public.es_admin_plataforma() end)
  with check (
    case when alcance = 'despacho'
      then public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[])
      else public.es_admin_plataforma() end);

-- Plantillas: globales (admin) o del despacho (juez/secretario).
create policy "plantillas: ver" on public.plantillas
  for select to authenticated
  using (despacho_id is null or public.tiene_rol(despacho_id));
create policy "plantillas: crear" on public.plantillas
  for insert to authenticated
  with check (
    case when despacho_id is null then public.es_admin_plataforma()
      else public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[]) end);
create policy "plantillas: editar" on public.plantillas
  for update to authenticated
  using (
    case when despacho_id is null then public.es_admin_plataforma()
      else public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[]) end)
  with check (
    case when despacho_id is null then public.es_admin_plataforma()
      else public.tiene_rol(despacho_id, array['juez', 'secretario']::public.rol_despacho[]) end);

create policy "versiones: ver" on public.versiones_plantilla
  for select to authenticated
  using (exists (select 1 from public.plantillas p
                 where p.id = plantilla_id
                   and (p.despacho_id is null or public.tiene_rol(p.despacho_id))));
create policy "versiones: crear" on public.versiones_plantilla
  for insert to authenticated
  with check (exists (select 1 from public.plantillas p
                      where p.id = plantilla_id
                        and case when p.despacho_id is null then public.es_admin_plataforma()
                              else public.tiene_rol(p.despacho_id, array['juez', 'secretario']::public.rol_despacho[]) end));

-- Documentos: se ven si se ve el proceso; solo inserción.
create policy "documentos: ver" on public.documentos
  for select to authenticated using (public.puede_ver_proceso(proceso_id));
create policy "documentos: crear" on public.documentos
  for insert to authenticated
  with check (public.puede_ver_proceso(proceso_id) and creado_por = (select auth.uid()));

-- Auditoría: solo el juez del despacho la consulta.
create policy "auditoria: juez consulta" on public.auditoria
  for select to authenticated
  using (public.tiene_rol(despacho_id, array['juez']::public.rol_despacho[]));

-- =====================================================================
-- Storage: buckets privados con límites de tamaño y tipo
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('expedientes', 'expedientes', false, 26214400, array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  ('plantillas', 'plantillas', false, 10485760, array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
on conflict (id) do nothing;

-- Sin políticas de update/delete: los archivos son inmutables.
create policy "expedientes: leer" on storage.objects
  for select to authenticated
  using (bucket_id = 'expedientes' and public.puede_ver_ruta_expediente(name));
create policy "expedientes: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'expedientes' and public.puede_ver_ruta_expediente(name));
create policy "plantillas: leer" on storage.objects
  for select to authenticated
  using (bucket_id = 'plantillas' and public.puede_usar_ruta_plantilla(name, false));
create policy "plantillas: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'plantillas' and public.puede_usar_ruta_plantilla(name, true));

-- =====================================================================
-- Catálogo inicial de términos (fase 1). TODOS pendientes de validación jurídica.
-- =====================================================================
insert into public.tipos_termino (codigo, nombre, especialidades, unidad, cantidad, norma, descripcion) values
  ('tutela_fallo', 'Fallo de primera instancia en tutela', null, 'dias_habiles', 10,
   'Decreto 2591 de 1991, art. 29', 'Desde la presentación de la solicitud. Confirmar si se cuentan días hábiles.'),
  ('tutela_impugnacion', 'Impugnación del fallo de tutela', null, 'dias_habiles', 3,
   'Decreto 2591 de 1991, art. 31', 'Desde la notificación del fallo.'),
  ('tutela_segunda_instancia', 'Fallo de segunda instancia en tutela', null, 'dias_habiles', 20,
   'Decreto 2591 de 1991, art. 32', 'Desde la recepción del expediente.'),
  ('tutela_cumplimiento', 'Cumplimiento de la orden de tutela', null, 'horas', 48,
   'Decreto 2591 de 1991, art. 27', 'El término real lo fija la orden; 48 horas es el valor usual.'),
  ('desacato_resolucion', 'Resolución del incidente de desacato', null, 'dias_habiles', 10,
   'Decreto 2591 de 1991, art. 52; Corte Constitucional C-367 de 2014', 'Desde la apertura del incidente.'),
  ('cgp121_primera_instancia', 'Duración de la primera instancia (art. 121 CGP)',
   array['civil', 'familia', 'promiscuo']::public.especialidad[], 'anios', 1,
   'Código General del Proceso, art. 121; Corte Constitucional C-443 de 2019',
   'Desde la notificación del auto admisorio o del mandamiento de pago al demandado. Prorrogable hasta 6 meses por auto motivado.'),
  ('cgp121_segunda_instancia', 'Duración de la segunda instancia (art. 121 CGP)',
   array['civil', 'familia', 'promiscuo']::public.especialidad[], 'meses', 6,
   'Código General del Proceso, art. 121', 'Desde la recepción del expediente en la secretaría.');
