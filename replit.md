# Prescription Pad

Prescription Pad is a local-first mobile prescription-writing tool for doctors that produces A4 PDFs for printing, signing, and sharing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo Router, React Native, AsyncStorage, expo-print, expo-sharing

## Where things live

- `artifacts/prescription-pad/app/(tabs)/index.tsx` — prescription editor and A4 preview flow
- `artifacts/prescription-pad/app/(tabs)/settings.tsx` — local doctor profile/template settings
- `artifacts/prescription-pad/app/(tabs)/history.tsx` — lightweight local history
- `artifacts/prescription-pad/state/PrescriptionContext.tsx` — AsyncStorage-backed local state
- `artifacts/prescription-pad/data/medicineCatalog.ts` — unused future catalogue interface; current prescriptions are catalogue-independent
- `artifacts/prescription-pad/utils/pdf.ts` — A4 HTML/PDF renderer and native share/save helpers

## Architecture decisions

- The core workflow is fully offline and stores doctor/patient data in AsyncStorage; no backend is involved.
- The current medicine workflow is entirely manual and stores editable `PrescriptionMedication` fields; a future catalogue can optionally prefill them without becoming a dependency.
- The PDF is generated from a dedicated A4 HTML renderer with print CSS rather than capturing the mobile editor UI.

## Product

Doctors can configure their prescription header, manually enter fully editable medicines and dosing instructions, preview an A4 prescription, generate/share/save the PDF, and revisit local history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
