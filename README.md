# Copiloto Judicial

Aplicación de apoyo para despachos judiciales en Colombia: control de términos con calendario judicial, semáforo de vencimientos y gestión del equipo del despacho. No reemplaza el criterio del funcionario: cada cálculo muestra su memoria paso a paso.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres con RLS, Auth, Storage) · Tailwind + shadcn/ui · Zod · Vitest.

## Documentación

- [`docs/prompt-copiloto-judicial.md`](docs/prompt-copiloto-judicial.md): alcance y reglas del proyecto.
- [`docs/01-configuracion-inicial.md`](docs/01-configuracion-inicial.md): esquema de base de datos, estructura y riesgos.
- [`docs/02-modulo-1.md`](docs/02-modulo-1.md): Módulo 1, cómo correrlo, probarlo y desplegarlo.

## Inicio rápido

```bash
npm ci
cp .env.example .env.local
npx supabase start            # requiere Docker
npx supabase status -o env    # copie URL y claves a .env.local
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas unitarias (calendario, términos, validaciones). |
| `npm run typecheck` | Tipos de TypeScript, incluidas las rutas de Next. |
| `npm run lint` | ESLint. |
| `npm run db:pruebas -- "<url-postgres>"` | Migraciones y políticas RLS sobre un Postgres vacío. |
