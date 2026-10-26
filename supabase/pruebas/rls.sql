-- Pruebas de RLS y restricciones. Ejecutar con supabase/pruebas/ejecutar.sh
\set ON_ERROR_STOP 1
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''
\set C '''cccccccc-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values
  (:A, 'a@x.co', '{"nombre_completo":"Jueza A"}'), (:B, 'b@x.co', '{}'), (:C, 'c@x.co', '{}');
select count(*) = 3 as perfiles_creados from public.perfiles \gset
\if :perfiles_creados \echo OK perfiles creados por trigger \else \echo FALLA perfiles \quit \endif

create schema pruebas;
create function pruebas.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', msg; else raise exception 'FALLA %', msg; end if; end $$;
create function pruebas.falla(sql text, msg text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'OK % (rechazado: %)', msg, sqlerrm; return; end;
  raise exception 'FALLA % (se permitió)', msg;
end $$;
grant usage on schema pruebas to authenticated, anon; grant execute on all functions in schema pruebas to authenticated, anon;

-- ===== Usuario A crea despacho 1
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}', false);
select public.crear_despacho('Juzgado 1 Civil Municipal', '110014003001', 'Bogotá', 'Bogotá', 'Bogotá', 'civil') as d1 \gset
select pruebas.ok((select count(*) from public.membresias where rol='juez') = 1, 'A queda como juez');
insert into public.membresias (despacho_id, usuario_id, rol) values (:'d1', :B, 'sustanciador');
insert into public.procesos (despacho_id, radicado, especialidad, clase, creado_por)
  values (:'d1', '11001400300120260012300', 'civil', 'ejecutivo', :A) returning id as p_normal \gset
insert into public.procesos (despacho_id, radicado, especialidad, clase, reservado, creado_por)
  values (:'d1', '11001400300120260012400', 'civil', 'verbal', true, :A) returning id as p_reservado \gset
insert into public.partes (proceso_id, despacho_id, tipo, nombre, creado_por)
  values (:'p_reservado', :'d1', 'demandante', 'Persona reservada', :A);
insert into public.terminos (proceso_id, despacho_id, tipo_codigo, unidad, cantidad, fecha_evento, creado_por)
  values (:'p_normal', :'d1', 'cgp121_primera_instancia', 'anios', 1, '2026-03-02', :A) returning id as t1 \gset
insert into public.documentos (despacho_id, proceso_id, tipo, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, creado_por)
  values (:'d1', :'p_reservado', 'providencia', 'auto.docx', :'d1' || '/' || :'p_reservado' || '/auto.docx',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000, :A) returning id as doc1 \gset
insert into storage.objects (bucket_id, name) values ('expedientes', :'d1' || '/' || :'p_reservado' || '/auto.docx');
select pruebas.falla($$insert into storage.objects (bucket_id, name) values ('expedientes', 'otra/ruta/x.docx')$$, 'subir a ruta inválida');
select public.registrar_acceso_documento(:'doc1', 'descargar');
select pruebas.ok((select count(*) from public.auditoria where accion='descargar') = 1, 'juez ve descarga auditada');
select pruebas.ok((select count(*) from public.auditoria) >= 7, 'escrituras auditadas');
select pruebas.falla($$update public.auditoria set accion='crear'$$, 'modificar auditoría');
select pruebas.falla($$delete from public.auditoria$$, 'borrar auditoría');
select pruebas.falla(format($$update public.despachos set codigo='999999999999' where id=%L$$, :'d1'), 'cambiar código del despacho');
select pruebas.falla(format($$update public.procesos set despacho_id=gen_random_uuid() where id=%L$$, :'p_normal'), 'mover proceso de despacho');
select pruebas.falla(format($$update public.membresias set rol='secretario' where usuario_id=%L$$, :A), 'quitar el único juez');
select pruebas.falla($$insert into public.festivos values ('2026-12-25','Navidad')$$, 'no admin carga festivos');
select pruebas.falla($$insert into public.despachos (nombre,codigo,departamento,municipio,seccional,especialidad,creado_por) values ('x','000000000000','a','b','c','civil','aaaaaaaa-0000-0000-0000-000000000001')$$, 'insertar despacho directo');
select pruebas.falla(format($$insert into public.procesos (despacho_id, radicado, especialidad, clase, creado_por) values (%L, '123', 'civil', 'ejecutivo', %L)$$, :'d1', :A), 'radicado inválido');

-- ===== Usuario B (sustanciador)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}', false);
select pruebas.ok((select count(*) from public.procesos) = 1, 'sustanciador no ve proceso reservado');
select pruebas.ok((select count(*) from public.partes) = 0, 'sustanciador no ve partes reservadas');
select pruebas.ok((select count(*) from storage.objects) = 0, 'sustanciador no ve archivo reservado');
select pruebas.ok((select count(*) from public.auditoria) = 0, 'sustanciador no ve auditoría');
select pruebas.ok((select count(*) from public.perfiles) = 2, 've perfiles de compañeros');
select pruebas.falla(format($$update public.procesos set reservado=true where id=%L$$, :'p_normal'), 'sustanciador cambia reserva');
select pruebas.falla(format($$insert into public.membresias (despacho_id, usuario_id, rol) values (%L, %L, 'juez')$$, :'d1', :C), 'sustanciador agrega miembros');
select pruebas.falla(format($$select public.registrar_acceso_documento(%L, 'descargar')$$, :'doc1'), 'acceso a doc reservado');
update public.terminos set estado='cumplido', cumplido_en='2026-10-01' where id = :'t1';
select pruebas.ok((select estado from public.terminos where id = :'t1') = 'cumplido', 'sustanciador actualiza término');

-- ===== A asigna el reservado a B
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}', false);
update public.procesos set asignado_a = :B where id = :'p_reservado';
select pruebas.falla(format($$update public.procesos set asignado_a=%L where id=%L$$, :C, :'p_normal'), 'asignar a no miembro');
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}', false);
select pruebas.ok((select count(*) from public.procesos) = 2, 'sustanciador asignado ve el reservado');
select pruebas.ok((select count(*) from storage.objects) = 1, 'sustanciador asignado ve el archivo');

-- ===== Usuario C (otro despacho)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003"}', false);
select public.crear_despacho('Juzgado 2 Civil Municipal', '110014003002', 'Bogotá', 'Bogotá', 'Bogotá', 'civil') as d2 \gset
select pruebas.ok((select count(*) from public.despachos) = 1, 'C solo ve su despacho');
select pruebas.ok((select count(*) from public.procesos) = 0, 'C no ve procesos ajenos');
select pruebas.ok((select count(*) from public.perfiles) = 1, 'C no ve perfiles ajenos');
select pruebas.ok((select count(*) from public.tipos_termino) = 7, 'catálogo visible');
select pruebas.falla(format($$insert into public.procesos (despacho_id, radicado, especialidad, clase, creado_por) values (%L, '11001400300120260099900', 'civil', 'x', %L)$$, :'d1', :C), 'crear proceso en despacho ajeno');
select pruebas.falla(format($$insert into public.partes (proceso_id, despacho_id, tipo, nombre, creado_por) values (%L, %L, 'demandado', 'x', %L)$$, :'p_normal', :'d2', :C), 'parte con despacho cruzado');
select pruebas.falla(format($$insert into public.suspensiones_terminos (tipo, alcance, fecha_inicio, fecha_fin, motivo, soporte) values ('acuerdo_csj','nacional','2026-11-01','2026-11-02','x','y')$$), 'no admin crea suspensión nacional');
insert into public.suspensiones_terminos (tipo, alcance, despacho_id, fecha_inicio, fecha_fin, motivo, soporte, creado_por)
  values ('cierre_despacho', 'despacho', :'d2', '2026-11-03', '2026-11-03', 'Traslado de sede', 'Acta 1', :C);

-- ===== anon
reset role; set role anon;
select pruebas.falla($$select * from public.procesos$$, 'anon lee procesos');
select pruebas.falla($$select public.crear_despacho('x','111111111111','a','b','c','civil')$$, 'anon crea despacho');

-- ===== Admin plataforma y tasas
reset role;
insert into public.administradores_plataforma values (:A);
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}', false);
insert into public.indices_economicos (tipo, modalidad, vigencia, valor, unidad, fuente)
  values ('interes_bancario_corriente', 'consumo_ordinario', '[2026-10-01,2026-11-01)', 17.5, 'efectivo_anual_pct', 'SFC (dato de prueba)');
select pruebas.falla($$insert into public.indices_economicos (tipo, modalidad, vigencia, valor, unidad, fuente) values ('interes_bancario_corriente','consumo_ordinario','[2026-10-15,2026-11-15)',18,'efectivo_anual_pct','x')$$, 'tasas traslapadas');
insert into public.festivos values ('2026-12-25', 'Navidad');
\echo FIN
reset role;
select pruebas.falla(format($$insert into public.partes (proceso_id, despacho_id, tipo, nombre, creado_por) values (%L, %L, 'demandado', 'xx', %L)$$, :'p_normal', :'d2', :C), 'FK compuesta impide despacho cruzado (superusuario)');
select pruebas.falla(format($$insert into public.documentos (despacho_id, proceso_id, tipo, nombre_archivo, ruta_archivo, tipo_mime, tamano_bytes, creado_por) values (%L, %L, 'oficio', 'a.docx', 'otra/ruta.docx', 'x', 10, %L)$$, :'d1', :'p_normal', :A), 'ruta de documento debe coincidir');
\echo FIN2
