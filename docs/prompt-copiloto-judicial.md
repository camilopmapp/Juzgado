# Prompt: Copiloto Judicial (v2)

Actúa como Desarrollador Full-Stack Senior y Arquitecto de Software con experiencia en Legal-Tech. Vas a construir **Copiloto Judicial**, una aplicación web de apoyo a la gestión de despachos judiciales en Colombia.

Es una herramienta de **apoyo**: no reemplaza el criterio del funcionario judicial. Cada cálculo debe mostrar paso a paso cómo llegó al resultado y qué norma aplicó.

---

## 0. Alcance y fases

- **MVP (fase 1):** una sola especialidad piloto, **Civil**, más la **acción de tutela** (transversal a todos los despachos).
- La arquitectura debe permitir agregar después Penal, Laboral, Familia, Promiscuo y Contencioso Administrativo como módulos, sin reescribir el núcleo.
- Fases:
  1. Núcleo: autenticación, despachos, calendario judicial y tablero de términos (tutela y art. 121 CGP).
  2. Liquidador de créditos y generador de providencias (civil).
  3. Medidas cautelares.
  4. Otras especialidades (Penal: Ley 906 y dosificación punitiva; Contencioso: CPACA e indexación; Laboral; Familia).
- No implementes nada de una fase posterior sin mi orden expresa.

## 1. Arquitectura y stack

- **Next.js (App Router)** con **TypeScript en modo estricto**. Una sola aplicación; no uses un monorepo con workspaces salvo que lo justifiques.
- **Lecturas** en Server Components. **Mutaciones** en Server Actions. Route Handlers solo para descargas de archivos u otros casos justificados.
- **Lógica de dominio** (calendario, términos, liquidaciones, penas) en `src/domain/`, como funciones puras de TypeScript, sin dependencias de Next.js ni de Supabase, para poder probarlas de forma aislada.
- **Supabase:** PostgreSQL, Auth y Storage, integrados estrictamente con `@supabase/ssr`.
  - RLS activado en **todas** las tablas y en `storage.objects`.
  - Multi-tenant por despacho: ningún usuario ve datos de un despacho al que no pertenece.
  - La clave `service_role` nunca llega al cliente.
- **UI:** React, Tailwind CSS y shadcn/ui. Diseño limpio, formal, responsivo y accesible (WCAG 2.1 AA).
- **Documentos:** generación en **DOCX** a partir de plantillas (docxtemplater o similar), que es el formato que usan los despachos. El PDF es opcional: propone una alternativa compatible con serverless y no dependas de LibreOffice ni Chrome headless en Vercel sin justificarlo.
- **Git/GitHub + Vercel:** despliegues de vista previa por PR y producción desde `main`. GitHub Actions ejecuta lint, typecheck y tests antes de desplegar.
- **Costos:** indica las limitaciones de los planes gratuitos (Vercel Hobby no permite uso comercial ni institucional; Supabase Free pausa proyectos inactivos) y qué plan se necesitaría en producción.

## 2. Seguridad, datos y cumplimiento (requisito obligatorio)

- **Ley 1581 de 2012 y reserva legal:** los procesos y documentos con reserva (menores de edad, delitos sexuales, familia) se marcan como reservados y su acceso se restringe por rol.
- **Residencia de datos:** Supabase no tiene región en Colombia. Documenta esto como riesgo y como decisión pendiente de validar con la Rama Judicial (políticas del Consejo Superior de la Judicatura, Ley 2213 de 2022) antes de usar datos reales. La fase piloto debe poder operar con datos ficticios o anonimizados.
- **Bitácora de auditoría** inmutable: quién creó, consultó, modificó o descargó qué, y cuándo.
- **Storage** privado, URLs firmadas de corta duración, validación de tipo y tamaño de archivo.
- **Roles:** Juez (administrador del despacho), Secretario y Sustanciador, con permisos definidos en base de datos. Un usuario puede pertenecer a más de un despacho.
- Nunca uses datos reales en pruebas ni en datos semilla.

## 3. Metodología (estricta: TDD e iterativa)

- Un módulo a la vez. No avances al siguiente sin mi aprobación.
- **TDD obligatorio en `src/domain/`:** escribe primero los tests (Vitest), con casos límite: festivos trasladados al lunes, vacancia judicial, suspensiones que se cruzan, cambio de tasa a mitad de mes, años bisiestos, términos que vencen en día inhábil.
- Pruebas de las políticas RLS (pgTAP o tests de integración contra Supabase local).
- **Zod** en servidor y cliente, con esquemas compartidos.
- Manejo de errores y carga: `error.tsx`, `loading.tsx`/Suspense, `useFormStatus`/`useActionState`.
- Migraciones SQL versionadas con Supabase CLI. Ningún cambio manual en el dashboard.
- **Si una regla jurídica es ambigua o no estás seguro, no la inventes:** márcala como `PENDIENTE DE VALIDACIÓN JURÍDICA` y pregúntame.

## 4. Datos de referencia (nunca en el código)

- **Calendario judicial:** festivos (Ley 51 de 1983), vacancia judicial colectiva (aprox. 20 de diciembre a 10 de enero), Semana Santa y suspensiones de términos (acuerdos del CSJ, paros, cierres de despacho). Cada registro tiene fecha, alcance (nacional, seccional o despacho) y soporte (número de acuerdo o acto).
- **Tasas e índices:** interés bancario corriente certificado por la Superintendencia Financiera (por período y modalidad) e IPC mensual del DANE. Cada registro tiene vigencia desde/hasta, fuente y fecha de carga.
- Mecanismo para cargar y actualizar estos datos (CSV o pantalla de administración), con datos semilla verificables contra la fuente oficial.

## 5. Módulos funcionales

### Módulo 1 (fase 1): Autenticación, despacho y tablero de términos

- Login con Supabase Auth.
- Configuración inicial del despacho: nombre, código, ciudad y especialidad. La especialidad define qué módulos y términos se muestran.
- **Motor de términos** sobre el calendario judicial: días hábiles vs. calendario, términos en meses y años (art. 118 CGP), suspensiones e interrupciones manuales con su soporte.
- **Semáforo** configurable (verde, amarillo, rojo) por porcentaje consumido o días restantes.
- Términos de la fase 1 (validar cada uno con el usuario antes de darlo por correcto):
  - **Tutela:** fallo en 10 días (art. 29 Decreto 2591 de 1991); impugnación en 3 días (art. 31); fallo de segunda instancia en 20 días (art. 32); incidente de desacato resuelto en 10 días (Sentencia C-367 de 2014); cumplimiento del fallo en el término que fije la orden (usualmente 48 horas). Confirmar si cada término se cuenta en días hábiles.
  - **Art. 121 CGP:** 1 año para la primera instancia, contado desde la notificación del auto admisorio o del mandamiento de pago al demandado; 6 meses para la segunda instancia, desde la recepción del expediente; prórroga de hasta 6 meses por auto motivado. Tener en cuenta la Sentencia C-443 de 2019 (la nulidad ya no opera "de pleno derecho").
- Fases posteriores: Ley 906 de 2004 (art. 317, modificado por la Ley 1786 de 2016, causales de libertad por vencimiento de términos), CPACA, Laboral y Familia.

### Módulo 2: Calculadoras judiciales

- **Liquidación de créditos:** capital, abonos con imputación primero a intereses (art. 1653 C.C.), cuotas, interés corriente y moratorio. Distinguir:
  - Civil: interés legal del 6 % anual (art. 1617 C.C.).
  - Comercial: moratorio de hasta 1,5 veces el bancario corriente (art. 884 C.Co.), con tope de usura.
  - Laboral: indexación, intereses moratorios del art. 141 de la Ley 100 (pensiones) o indemnización moratoria del art. 65 CST, según el caso.
  - Conversión correcta de tasas efectivas anuales a mensuales y diarias.
  - Reporte detallado período a período, exportable.
- **Indexación con IPC:** Vh = Vr × (IPC final / IPC inicial).
- **Dosificación punitiva** (fase penal): arts. 60 y 61 C.P. (ámbito punitivo, circunstancias de mayor y menor punibilidad, sistema de cuartos), concurso (art. 31 C.P.) y rebajas por preacuerdo o aceptación de cargos (art. 351 Ley 906) como opciones explícitas. Solo es una sugerencia, con memoria de cálculo completa.

### Módulo 3: Generador de providencias

- Plantillas DOCX por especialidad, con variables declaradas (nombre, tipo, obligatoria, validación Zod).
- Formulario generado a partir de la definición de la plantilla, con vista previa.
- Versionado de plantillas.
- El documento generado se guarda en Storage asociado al proceso y queda registrado en la auditoría.
- Reutiliza los datos del proceso: radicado de 23 dígitos validado, partes y apoderados.

### Módulo 4: Medidas cautelares

- CRUD por proceso, con tipos según la especialidad:
  - Civil/Laboral: embargos a bancos, tránsito, registro de instrumentos públicos y salarios (con sus límites legales).
  - Penal: medidas de aseguramiento.
  - Contencioso: suspensión provisional.
- Estados con fechas: decretada, oficiada, registrada, levantada.
- Generación del oficio a la entidad desde plantilla y guardado automático en Storage.

## 6. Integraciones y adopción

- No hay API pública confirmada de TYBA, SAMAI ni Justicia XXI: no asumas que existe.
- Fase 1: importación de procesos por CSV (radicado, partes, fechas clave), para no obligar a digitar todo a mano.
- Deja el diseño preparado para una integración futura.

## 7. Primera tarea (no escribas código de UI todavía)

Entrégame únicamente:

1. Los comandos exactos para: crear el proyecto Next.js (TypeScript, Tailwind, ESLint, App Router, carpeta `src/`), instalar `@supabase/supabase-js`, `@supabase/ssr`, `zod` y `vitest`, inicializar shadcn/ui y Supabase CLI, e inicializar Git con el primer commit y push a GitHub.
2. El esquema de base de datos como migración SQL: despachos, perfiles, membresías con rol, procesos, partes, términos, calendario (festivos y suspensiones), tasas e índices, plantillas, documentos, medidas cautelares y auditoría. Incluye claves, índices y políticas RLS, y explica las relaciones.
3. La estructura de carpetas del proyecto, comentada.
4. Una lista de decisiones pendientes y riesgos (sobre todo jurídicos y de datos) que yo debo validar.

Espera mi aprobación antes de empezar el Módulo 1.
