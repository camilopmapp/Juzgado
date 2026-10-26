# Copiloto Judicial · Configuración inicial

Entrega de la primera tarea del prompt (`docs/prompt-copiloto-judicial.md`):

1. Comandos de inicialización
2. Esquema de base de datos
3. Estructura de carpetas
4. Decisiones pendientes y riesgos

Estado de verificación (26-oct-2026):

- Los comandos de los pasos 1, 2, 4 (solo `supabase init`) y 7 se ejecutaron en limpio: compilan, pasan lint y build.
- `shadcn init` no se pudo probar: la red del entorno de prueba bloquea `ui.shadcn.com`.
- La migración SQL se aplicó en PostgreSQL 16 con una simulación de Supabase y pasó 37 pruebas de RLS y restricciones (`supabase/pruebas/`).

---

## 1. Comandos

### Requisitos

- Node.js 22 LTS (`node -v` → `v22.x`)
- Git y una cuenta de GitHub
- Una cuenta de Supabase y otra de Vercel
- Docker Desktop (solo para correr Supabase en local)

### 1.1 Crear el proyecto

```bash
npx create-next-app@16.4.3 juzgado \
  --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --yes
cd juzgado
```

`create-next-app` ya hace `git init` y un primer commit.

### 1.2 Dependencias

```bash
# Producción
npm i @supabase/supabase-js@2.118.0 @supabase/ssr@0.12.7 zod@4.6.7 docxtemplater@3.71.1 pizzip

# Desarrollo (vitest 5 exige @types/node 22 o superior)
npm i -D vitest@5.0.5 @types/node@^22 @vitejs/plugin-react vite-tsconfig-paths supabase@2.122.0
```

### 1.3 shadcn/ui

```bash
npx shadcn@4.22.1 init -d
```

Los componentes se agregan al iniciar el Módulo 1 (`npx shadcn@4.22.1 add button input label card …`).

### 1.4 Supabase

```bash
npx supabase init                 # crea supabase/config.toml
# Copia supabase/migrations/20261026000000_esquema_inicial.sql a supabase/migrations/
npx supabase start                # Supabase local (requiere Docker)
npx supabase db reset             # aplica las migraciones en local

# Proyecto en la nube (región recomendada: South America · São Paulo)
npx supabase login
npx supabase link --project-ref <REF_DEL_PROYECTO>
npx supabase db push              # aplica las migraciones en la nube

# Tipos de TypeScript generados desde el esquema
npx supabase gen types typescript --local > src/types/database.ts
```

En el panel de Supabase, en **Authentication → Sign In / Providers**, desactiva **Allow new users to sign up**: el ingreso será solo por invitación (ver riesgo D3).

### 1.5 Variables de entorno

```bash
cat > .env.local <<'ENV'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave publishable>
SUPABASE_SECRET_KEY=<clave secreta: solo servidor, nunca con prefijo NEXT_PUBLIC_>
ENV
```

`npx supabase start` muestra las claves locales. `.env.local` ya está en `.gitignore`.

### 1.6 Scripts

```bash
npm pkg set scripts.test="vitest run --passWithNoTests"
npm pkg set scripts.typecheck="tsc --noEmit"
npm pkg set engines.node=">=22 <23"
```

### 1.7 Verificación

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

### 1.8 Primer commit y push a GitHub

```bash
git add -A
git commit -m "chore: configuración inicial (Next.js, Supabase, shadcn, Vitest)"
git branch -M main
git remote add origin https://github.com/camilopmapp/Juzgado.git
git push -u origin main
```

### 1.9 Vercel

1. En vercel.com: **Add New → Project** e importa `camilopmapp/Juzgado`.
2. Carga las tres variables de entorno con los valores del proyecto en la nube.
3. En **Settings → Functions** elige la región `gru1` (São Paulo), la misma de Supabase, para reducir la latencia.
4. Cada push a `main` despliega a producción y cada PR genera una vista previa.

El workflow de GitHub Actions (lint, typecheck, tests y build) se agrega en el Módulo 1.

---

## 2. Esquema de base de datos

Archivo completo: `supabase/migrations/20261026000000_esquema_inicial.sql`.

### 2.1 Tablas

| Grupo | Tabla | Para qué sirve |
|---|---|---|
| Usuarios | `perfiles` | Un perfil por usuario de Supabase Auth (lo crea un trigger). |
| | `administradores_plataforma` | Quién puede cargar festivos, tasas y catálogo. Solo se gestiona con la clave secreta. |
| Despachos | `despachos` | Nombre, código de 12 dígitos, ubicación, especialidad, si tiene vacancia colectiva, umbrales del semáforo. |
| | `membresias` | Usuario ↔ despacho con rol (`juez`, `secretario`, `sustanciador`). Un usuario puede estar en varios despachos. |
| Procesos | `procesos` | Radicado de 23 dígitos, clase, instancia, estado, **reserva** y sustanciador asignado. |
| | `partes` | Demandantes, demandados, accionantes, apoderados (con `representa_a`). |
| Calendario | `festivos` | Festivos nacionales (Ley 51 de 1983). |
| | `suspensiones_terminos` | Vacancia, Semana Santa, acuerdos del CSJ, cierres. Alcance nacional, seccional o de un despacho, siempre con soporte. |
| Términos | `tipos_termino` | Catálogo legal (unidad, cantidad, norma). Cada fila nace como `pendiente_validacion`. |
| | `terminos` | Un término que corre en un proceso: fecha del hecho que lo inicia, vencimiento calculado, estado. |
| | `novedades_termino` | Suspensiones, interrupciones y prórrogas de un término, con el auto que las soporta. |
| Finanzas | `indices_economicos` | Interés bancario corriente (Superfinanciera) e IPC (DANE) con vigencia, fuente y acto. La base de datos impide vigencias traslapadas. |
| Documentos | `plantillas` | Plantillas globales o del despacho, por especialidad y categoría. |
| | `versiones_plantilla` | Cada cambio crea una versión nueva, con su archivo DOCX y la definición de variables. |
| | `documentos` | Metadatos de cada archivo en Storage. Inmutables. |
| Medidas | `medidas_cautelares` | Tipo, entidad destinataria, límite, estado y fechas (decreto → oficio → registro → levantamiento), oficio asociado. |
| Control | `auditoria` | Bitácora de toda escritura, más consultas y descargas de documentos. No se puede modificar ni borrar. |

### 2.2 Relaciones

```
auth.users 1─1 perfiles
perfiles  N─M despachos           (a través de membresias, con rol)
despachos 1─N procesos 1─N partes
                       1─N terminos 1─N novedades_termino
                       1─N documentos
                       1─N medidas_cautelares ──> documentos (oficio)
tipos_termino 1─N terminos
plantillas 1─N versiones_plantilla 1─N documentos (generados)
despachos 1─N suspensiones_terminos   (solo las de alcance "despacho")
festivos, indices_economicos           (globales, sin despacho)
```

- **Llaves compuestas `(proceso_id, despacho_id)`.** Partes, términos, documentos y medidas no pueden apuntar a un proceso de otro despacho, ni siquiera por error del servidor.
- **Lo calculado se guarda.** `terminos.fecha_vencimiento` la escribe el motor de dominio (`src/domain/terminos`). Se recalcula cuando cambian el calendario o las novedades, así el tablero no repite el cálculo en cada consulta.
- **La usura no se guarda.** Se deriva: 1,5 veces el interés bancario corriente de la modalidad y el período.

### 2.3 Seguridad (RLS)

- RLS está activado en todas las tablas y en `storage.objects`.
- El rol `anon` no tiene ningún acceso.
- Los permisos se conceden por columna. Por eso nadie puede cambiar `despacho_id`, `creado_por`, el código del despacho ni filas de auditoría.

| Quién | Qué puede hacer |
|---|---|
| Cualquier miembro activo | Ver su despacho, sus compañeros y sus procesos no reservados. Crear y editar procesos, partes, términos y medidas. |
| Juez | Todo lo anterior. Además: editar el despacho, agregar y desactivar miembros, consultar la auditoría. |
| Juez y secretario | Ver procesos **reservados**, cambiar la reserva y la asignación, borrar partes, administrar las plantillas y suspensiones del despacho. |
| Sustanciador | Ve un proceso reservado solo si está asignado a él. |
| Admin de plataforma | Cargar festivos, suspensiones nacionales y seccionales, tasas, catálogo de términos y plantillas globales. |

Reglas reforzadas con triggers:

- Ningún despacho puede quedar sin un juez activo.
- Solo se puede asignar un proceso a un miembro del despacho.
- La auditoría es inmutable (bloquea `update`, `delete` y `truncate`).

Funciones RPC:

- `crear_despacho(...)`: crea el despacho y deja al usuario como juez, en una sola transacción.
- `registrar_acceso_documento(id, 'consultar' | 'descargar')`: deja constancia de consultas y descargas en la auditoría.

### 2.4 Storage

| Bucket | Ruta | Límite | Tipos permitidos |
|---|---|---|---|
| `expedientes` (privado) | `{despacho_id}/{proceso_id}/{archivo}` | 25 MB | PDF, DOCX |
| `plantillas` (privado) | `global/{plantilla_id}/v{n}.docx` o `{despacho_id}/{plantilla_id}/v{n}.docx` | 10 MB | DOCX |

- Las políticas leen la ruta: para ver un archivo hay que poder ver su proceso, incluida la reserva.
- No hay políticas de actualizar ni borrar: los archivos son inmutables.
- La base de datos obliga a que la ruta guardada en `documentos` coincida con el despacho y el proceso.

### 2.5 Pruebas

```bash
supabase/pruebas/ejecutar.sh "postgresql://postgres@localhost:5432/postgres"
```

Corren sobre cualquier Postgres 15 o superior, sin Docker, gracias a una simulación mínima de Supabase. Verifican:

- Aislamiento entre despachos.
- Reserva y asignación de procesos.
- Roles.
- Inmutabilidad de la auditoría y de los campos protegidos.
- Validación del radicado y de las rutas.
- Vigencias de tasas sin traslape.
- Bloqueo total al rol `anon`.

En el Módulo 1 se agregarán como pruebas pgTAP contra `supabase start`.

---

## 3. Estructura de carpetas

```
juzgado/
├── .github/workflows/ci.yml        # lint, typecheck, tests y build en cada PR (Módulo 1)
├── docs/                           # prompt, esta entrega, decisiones y validación jurídica
├── supabase/
│   ├── config.toml
│   ├── migrations/                 # única fuente del esquema; nada se cambia a mano en el panel
│   ├── seed.sql                    # datos FICTICIOS para desarrollo
│   └── pruebas/                    # pruebas de RLS
├── src/
│   ├── proxy.ts                    # Next 16 (antes middleware.ts): refresca la sesión de Supabase
│   ├── app/
│   │   ├── layout.tsx              # layout raíz, fuentes, <Toaster>
│   │   ├── error.tsx  not-found.tsx
│   │   ├── (publico)/login/        # inicio de sesión
│   │   ├── auth/callback/route.ts  # intercambio de código (invitaciones, enlace mágico)
│   │   ├── onboarding/             # crear despacho (llama a crear_despacho)
│   │   ├── (app)/                  # rutas autenticadas
│   │   │   ├── layout.tsx          # exige sesión y despacho activo; menú según especialidad
│   │   │   ├── tablero/            # semáforo de términos
│   │   │   ├── procesos/  procesos/[id]/
│   │   │   ├── calculadoras/       # fase 2
│   │   │   ├── providencias/       # fase 2
│   │   │   ├── medidas/            # fase 3
│   │   │   └── configuracion/      # despacho, equipo, umbrales, suspensiones locales
│   │   └── api/documentos/[id]/route.ts  # descarga: URL firmada corta + auditoría
│   ├── domain/                     # TypeScript puro: sin Next, sin Supabase. TDD obligatorio.
│   │   ├── calendario/             # días hábiles, festivos, vacancia, suspensiones
│   │   ├── terminos/               # vencimiento, prórrogas, semáforo
│   │   ├── finanzas/               # tasas (EA→mensual→diaria), liquidación, indexación
│   │   ├── penal/                  # dosificación punitiva (fase 4)
│   │   └── radicado.ts             # validación y desglose del radicado de 23 dígitos
│   ├── features/                   # un directorio por módulo
│   │   └── terminos/
│   │       ├── actions.ts          # Server Actions (mutaciones)
│   │       ├── queries.ts          # lecturas para Server Components
│   │       ├── schemas.ts          # Zod, compartido entre cliente y servidor
│   │       └── components/
│   ├── components/
│   │   ├── ui/                     # generados por shadcn
│   │   └── …                       # componentes compartidos propios
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts           # createServerClient (@supabase/ssr) con cookies()
│   │   │   ├── client.ts           # createBrowserClient
│   │   │   ├── proxy.ts            # actualización de sesión usada por src/proxy.ts
│   │   │   └── admin.ts            # clave secreta; import "server-only"
│   │   ├── documentos/             # combinación de plantillas DOCX
│   │   └── utils.ts
│   └── types/database.ts           # generado con supabase gen types
├── vitest.config.ts
└── .env.local                      # no se versiona
```

- **`domain/` no depende de nada.** Así se prueba con Vitest en milisegundos y se podría reutilizar fuera de Next.
- **`features/` separa lecturas de mutaciones.** Las lecturas van en `queries.ts` (Server Components) y las mutaciones en `actions.ts` (Server Actions), como pide el prompt.
- **`(app)` y `(publico)` son grupos de rutas.** Comparten layout sin afectar la URL.

---

## 4. Decisiones pendientes y riesgos

Necesito tu respuesta o la de un jurista en los puntos marcados con ❓ antes del Módulo 1.

### Jurídicos

| # | Punto | Por qué importa |
|---|---|---|
| J1 ❓ | Validar los 7 términos del catálogo (`tipos_termino`): cantidad, unidad y desde cuándo corre cada uno. | Todos están como `pendiente_validacion`. El tablero lo mostrará hasta que se validen. |
| J2 ❓ | ¿La tutela (10 días) y el desacato (10 días) se cuentan en días hábiles? ¿Las 48 horas de cumplimiento son corridas o hábiles? | Cambia el vencimiento en fines de semana y festivos. |
| J3 ❓ | Art. 121 CGP con varios demandados: ¿el año corre desde la notificación al último? | Define la fecha de inicio. |
| J4 ❓ | Vacancia: ¿qué despachos no tienen vacancia colectiva? ¿Semana Santa suspende de lunes a miércoles santo? | El esquema lo soporta (`vacancia_colectiva`, `semana_santa`), pero hay que confirmar la regla. |
| J5 ❓ | ¿Quién carga y certifica festivos, vacancias y acuerdos del CSJ? | Si un dato falta, todos los vencimientos quedan mal. Propuesta: un administrador de plataforma con soporte obligatorio. |

### Datos y seguridad

| # | Punto | Propuesta |
|---|---|---|
| D1 ❓ | ¿La Rama Judicial autoriza guardar expedientes en una nube de terceros fuera de Colombia (Supabase en São Paulo)? | Piloto solo con datos ficticios o anonimizados hasta tener la autorización por escrito. |
| D2 | Datos sensibles (menores, delitos sexuales, familia). | Ya resuelto con `procesos.reservado` y RLS. Falta definir quién decide la reserva por defecto según la clase de proceso. |
| D3 ❓ | ¿Registro abierto o solo por invitación? | Solo invitación: desactivar el registro público y que el juez invite a su equipo. |
| D4 ❓ | Cualquier usuario puede crear un despacho con cualquier código de 12 dígitos y bloquear el código real. | Que un administrador de plataforma verifique cada despacho nuevo antes de activarlo. Agregaría un campo `verificado`. |
| D5 ❓ | Las descargas se auditan cuando pasan por `/api/documentos/[id]`. Un usuario técnico podría descargar directo de la API de Storage con su sesión, sin dejar rastro. | Opción A: aceptar el riesgo. Opción B (más estricta): quitar la política de lectura del bucket y servir los archivos solo desde el servidor. Recomiendo B. |
| D6 | Los usuarios no se borran: si crearon registros, la base lo impide. | Desactivar la membresía en vez de borrar. Así se conserva la trazabilidad. |
| D7 ❓ | ¿Cuánto tiempo se conservan documentos y auditoría? | Depende de las tablas de retención documental de la Rama. Por ahora no se borra nada. |

### Técnicos y de costos

| # | Punto | Comentario |
|---|---|---|
| T1 | Vercel Hobby no permite uso institucional, y Supabase Free pausa los proyectos inactivos. | Para producción hacen falta Vercel Pro y Supabase Pro. Verifica los precios vigentes en cada sitio. |
| T2 | PDF en Vercel. | Fase 1 solo DOCX. El PDF se evalúa después: conversión externa o PDF generado aparte. |
| T3 | Tasas de la Superfinanciera e IPC del DANE. | Se cargan por CSV con su resolución o fuente. Falta definir qué modalidades de interés aplican a cada tipo de crédito (lo pide el Módulo 2). |
| T4 | Integración con TYBA, SAMAI o Justicia XXI. | No se asume ninguna API. Fase 1: importación CSV (pendiente de diseñar la tabla de importaciones). |
| T5 | Next.js 16 cambió convenciones (`proxy.ts` en lugar de `middleware.ts`). | La estructura ya lo contempla. El código del Módulo 1 se escribirá contra la documentación de la versión instalada. |
