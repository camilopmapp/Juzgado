-- =====================================================================
-- Copiloto Judicial · Módulo 1
-- Decisiones aprobadas:
--   D4: un administrador de plataforma verifica cada despacho antes de activarlo.
--   D5: los archivos de expedientes solo se descargan a través del servidor
--       (que verifica permisos y deja constancia en la auditoría).
-- Además: cierre de suspensiones de un término (fecha_fin).
-- =====================================================================

-- ---------------------------------------------------------------------
-- D4 · Verificación de despachos
-- ---------------------------------------------------------------------
alter table public.despachos
  add column verificado     boolean not null default false,
  add column verificado_en  timestamptz,
  add column verificado_por uuid references public.perfiles (id);

-- Solo cuentan las membresías de despachos verificados.
create or replace function public.tiene_rol(p_despacho uuid, p_roles public.rol_despacho[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.membresias m
    join public.despachos d on d.id = m.despacho_id and d.verificado
    where m.despacho_id = p_despacho
      and m.usuario_id = (select auth.uid())
      and m.activo
      and (p_roles is null or m.rol = any (p_roles))
  );
$$;

create or replace function public.puede_ver_proceso(p_proceso uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.procesos p
    join public.despachos d on d.id = p.despacho_id and d.verificado
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

-- Quien creó un despacho lo ve mientras espera la verificación; el admin los ve todos.
create policy "despachos: creador ve el suyo" on public.despachos
  for select to authenticated using (creado_por = (select auth.uid()));
create policy "despachos: admin ve todos" on public.despachos
  for select to authenticated using (public.es_admin_plataforma());

-- Cada usuario ve sus propias membresías (también de despachos sin verificar).
create policy "membresias: ver propias" on public.membresias
  for select to authenticated using (usuario_id = (select auth.uid()));

-- El admin ve los perfiles (para saber quién solicitó cada despacho).
create policy "perfiles: admin ve todos" on public.perfiles
  for select to authenticated using (public.es_admin_plataforma());

create function public.verificar_despacho(p_despacho uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin_plataforma() then
    raise exception 'Solo un administrador de plataforma puede verificar despachos' using errcode = '42501';
  end if;
  update public.despachos
     set verificado = true, verificado_en = now(), verificado_por = (select auth.uid())
   where id = p_despacho and not verificado;
  if not found then
    raise exception 'Despacho no encontrado o ya verificado';
  end if;
end;
$$;
revoke execute on function public.verificar_despacho(uuid) from public, anon;
grant execute on function public.verificar_despacho(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- D5 · Descargas solo por el servidor
-- ---------------------------------------------------------------------
drop policy "expedientes: leer" on storage.objects;

-- ---------------------------------------------------------------------
-- Cierre de suspensiones e interrupciones de un término
-- ---------------------------------------------------------------------
grant update (fecha_fin) on public.novedades_termino to authenticated;
create policy "novedades: cerrar" on public.novedades_termino
  for update to authenticated
  using (exists (select 1 from public.terminos t
                 where t.id = termino_id and public.puede_ver_proceso(t.proceso_id)))
  with check (exists (select 1 from public.terminos t
                      where t.id = termino_id and public.puede_ver_proceso(t.proceso_id)));
