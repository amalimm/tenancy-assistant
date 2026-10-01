# Tenancy Assistant

Tenancy Assistant helps a shared household track tenants, absence ranges,
utility billing cycles, bill uploads, allocation runs, and payment status.

## Stack

- Deployment: Vercel
- Framework: Next.js App Router + TypeScript
- Database: Turso/libSQL with Drizzle ORM
- Auth: Better Auth with Google OAuth
- Permissions: CASL app abilities over admin and tenant roles
- UI: shadcn/ui native components with no custom component rewrites
- Calendar: FullCalendar free React plugins
- Quality gates: Oxlint, TypeScript, Vitest, Playwright

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
Copy-Item .env.example .env.local
```

3. Configure Turso:

```bash
turso db create tenancy-assistant
turso db show tenancy-assistant --url
turso db tokens create tenancy-assistant
```

Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`.

4. Configure Google OAuth:

- Local redirect URI: `http://localhost:3000/api/auth/callback/google`
- Production redirect URI: `https://<your-vercel-domain>/api/auth/callback/google`
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

5. Bootstrap first admin:

Set `ADMIN_EMAILS` to a comma-separated list of Google account emails that
should receive the `admin` role on first sign-in.

6. Apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

7. Run locally:

```bash
npm run dev
```

## Public demo

A separate Vercel project runs this app against its own Turso database,
`tenancy-assistant-demo`, which holds only sample data. Setting
`DEMO_MODE=true`, `DEMO_EMAIL` and `DEMO_PASSWORD` replaces the sign-in tabs
with a one-click "Try the demo" button and blocks password, profile and admin
account changes. Put `DEMO_EMAIL` in `ADMIN_EMAILS` too, so the demo user stays
an admin.

`.github/workflows/demo-reset.yml` migrates the demo database and runs
`scripts/demo-reset.mjs` every night, which wipes it and reseeds the sample
house. The script refuses any database URL that is not the demo database.

## Scripts

- `npm run lint` - Oxlint with warnings denied
- `npm run typecheck` - TypeScript strict check
- `npm run test` - Vitest unit tests
- `npm run test:e2e` - Playwright smoke tests
- `npm run build` - Next production build

## Project Contract

The `src/` tree follows the same README format and ownership discipline as the
provided reference. Keep the source root shallow, add a local `README.md` for
new top-level `src/` folders, and keep domain code inside its owning feature.
