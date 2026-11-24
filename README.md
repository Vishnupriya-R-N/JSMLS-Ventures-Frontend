# Victory Club – Frontend (Demo Prototype)

JSMLS Ventures LLP · Software Development Document v1.0

Next.js (App Router) frontend for the Victory Club **non-cash demonstration platform**.


## Requirements

- Node.js 18.18 or newer
- npm

## Install

```bash
npm install
```

## Environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

This is the address of the Django REST API that will be connected later.

## Run in development

```bash
npm run dev
```

Open http://localhost:3000

## Build and run for production

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

### How it was set up

1. Created the app with `create-next-app` (TypeScript, ESLint, `src/` folder, App Router,
   import alias `@/*`; no Tailwind, no React Compiler, no Cache Components).
2. Created the route groups `(public)`, `(participant)` and `(admin)`, and moved the
   home page into `(public)`.
3. Created the `components`, `lib`, `services` and `types` folders for shared code.
4. Added `.env.local` with the API address for the future Django backend.
5. Imports use the `@/` alias, for example `@/components/layout/Navbar`....
