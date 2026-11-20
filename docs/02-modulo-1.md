# Módulo 1 · Autenticación, despacho y tablero de términos

Estado: terminado y probado en local contra Supabase real (20-nov-2026).

## Qué hace

| Pantalla | Quién | Qué permite |
|---|---|---|
| `/login`, `/recuperar` | Todos | Ingresar y recuperar la contraseña. No hay registro público (D3). |
| `/auth/confirmar` | Todos | Destino de los enlaces de invitación y recuperación. |
| `/cuenta/contrasena` | Invitado | Crear la contraseña (mínimo 12 caracteres) y el nombre. |
| `/onboarding` | Juez invitado | Registrar su despacho: nombre, código de 12 dígitos, especialidad, ubicación. |
| `/pendiente` | Juez | Espera mientras un administrador verifica el despacho (D4). |
| `/tablero` | Equipo | Semáforo de términos activos: vencido, crítico, atención, a tiempo, suspendido. Filtro por color. |
| `/procesos`, `/procesos/nuevo` | Equipo | Lista, búsqueda por radicado o clase, creación con reserva legal y asignación. |
| `/procesos/[id]` | Equipo | Términos del proceso, memoria de cálculo, suspensiones, interrupciones, prórrogas, cumplido/cancelado. |
| `/configuracion` | Equipo | Datos del despacho, umbrales del semáforo, vacancia colectiva, equipo e invitaciones, cierres del despacho. |
| `/admin` | Admin de plataforma | Invitar jueces, verificar despachos, cargar calendario anual, suspensiones generales, validar términos. |

### Cómo se calcula un término

1. El motor (`src/domain/terminos/calcular-vencimiento.ts`) lee el calendario del despacho desde la base de datos: festivos, vacancia, Semana Santa, acuerdos del CSJ y cierres propios.
2. Aplica el art. 118 CGP:
   - Los días hábiles se cuentan desde el día siguiente.
   - Los meses y años se cuentan sobre el calendario.
   - Si el último día es inhábil, el término se corre al siguiente día hábil.
3. Las novedades del término cambian el cálculo:
   - Una suspensión corre el vencimiento.
   - Una interrupción reinicia el conteo.
   - Una prórroga se suma al vencimiento.
4. El resultado se guarda en `terminos.fecha_vencimiento`. Se recalcula solo cuando cambian el calendario, la configuración del despacho o las novedades.
5. Cada término muestra su **memoria de cálculo** paso a paso.

## Pruebas

| Tipo | Cantidad | Cómo correrlas |
|---|---|---|
| Unitarias (dominio, validaciones, formato) | 74 | `npm test` |
| Seguridad de la base (RLS, restricciones, auditoría) | 46 | `npm run db:pruebas -- "postgresql://…"` sobre un Postgres vacío |
| Punta a punta en navegador | 17 pasos | `node pruebas-e2e/modulo1.cjs <carpeta>` con la app y Supabase local corriendo |

La prueba de punta a punta recorre el flujo completo:

1. El administrador invita a un juez.
2. El correo de invitación llega.
3. El juez crea su contraseña y registra el despacho.
4. El tablero queda bloqueado hasta que el administrador verifica el despacho.
5. El administrador carga el calendario.
6. El juez crea un proceso y registra cuatro términos con vencimientos verificados.
7. El juez suspende y reanuda un término, revisa el tablero e invita a un sustanciador.

GitHub Actions (`.github/workflows/ci.yml`) corre lint, tipos, pruebas unitarias, build y las pruebas de RLS en cada PR y en cada push a `main`.

## Correrlo en local

```bash
npm ci
cp .env.example .env.local
npx supabase start                  # requiere Docker
npx supabase status -o env          # copie la URL y las claves a .env.local
npm run dev
```

Crear el primer administrador de plataforma (una sola vez):

1. Cree el usuario en el panel de Supabase: **Authentication → Users → Add user**, con su correo y contraseña.
2. Ejecute en el editor SQL:

```sql
insert into public.administradores_plataforma
select id from auth.users where email = 'su-correo@dominio.co';
```

3. Ingrese en `/admin` y cargue el calendario del año actual y del siguiente.

## Desplegar (Supabase en la nube + Vercel)

1. **Base de datos:** `npx supabase link --project-ref <REF>` y luego `npx supabase db push`.
2. **Authentication → Sign In / Providers:** desactive **Allow new users to sign up**. Deje **activo** el proveedor Email: si lo desactiva, nadie puede ingresar. Este error se encontró en las pruebas.
3. **Authentication → URL Configuration:**
   - **Site URL** = la URL de Vercel. Debe ser igual a `SITIO_URL`; si no coinciden, la sesión se pierde al aceptar la invitación.
   - **Redirect URLs** = `https://<su-dominio>/**`.
4. **Authentication → Email Templates:**
   - Copie `supabase/plantillas-correo/invitacion.html` a **Invite user**.
   - Copie `supabase/plantillas-correo/recuperacion.html` a **Reset password**.
5. **Authentication → Emails → SMTP:** configure un servidor de correo propio. El servicio incluido en Supabase solo sirve para pruebas y tiene un límite muy bajo de envíos.
6. **Vercel:** cargue `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `SITIO_URL`. Use la región `gru1`.

## Decisiones aplicadas

| Decisión | Cómo quedó |
|---|---|
| D1 · Datos ficticios en el piloto | El formulario de procesos lo recuerda. No hay datos reales en semillas ni pruebas. |
| D3 · Solo invitación | Registro público cerrado. El admin invita jueces y el juez invita a su equipo. |
| D4 · Verificación de despachos | Columna `verificado`. RLS no da acceso a nada del despacho hasta que se verifica. |
| D5 · Descargas solo por el servidor | Se quitó la política de lectura directa del bucket `expedientes`. La ruta de descarga con auditoría se construye en el Módulo 3. |

## Decisiones técnicas que conviene conocer

- **Cache Components desactivado** (`next.config.ts`). Next 16.4 lo trae activo, pero aquí toda página depende de la sesión y muestra datos reservados: nada se cachea en el servidor.
- **Clave secreta (`SUPABASE_SECRET_KEY`).** Solo la usan tres funciones:
  - Invitar usuarios.
  - Buscar si un correo ya tiene cuenta.
  - Recalcular los términos de todos los despachos cuando el admin cambia el calendario general.

  En los tres casos se comprueba antes el permiso con la sesión del usuario.
- **Recálculos hechos por el sistema.** Los que dispara el admin quedan en la auditoría sin usuario, porque los hace el sistema.

## Pendiente

- **Validación jurídica (J1–J5):** los 7 términos siguen como "pendiente de validación" y así se muestran en el tablero. Hay que confirmar:
  - Si las horas de la tutela se cuentan corridas o hábiles (hoy son corridas).
  - Si la Semana Santa aplica a los despachos sin vacancia colectiva (hoy no aplica).
  - Si los acuerdos generales del CSJ extienden los términos de meses y años. Hoy solo los extienden las suspensiones del propio proceso.
- **Partes del proceso:** la tabla existe, pero la pantalla llega con el Módulo 3, donde se usan en las providencias.
- **Importación por CSV** de procesos (T4).
- **Notificaciones** (correo diario con términos en rojo) si el despacho las quiere.
