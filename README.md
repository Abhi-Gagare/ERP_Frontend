# University ERP Frontend

Next.js App Router, React, TypeScript and Tailwind CSS. Uses the shared University
ERP backend for authentication, academic/Admin modules and the Accountant portal.

## Run

```text
npm ci
npm run dev
```

Open http://localhost:3000. If the backend is not on port 8080, set a local
`.env.local` file:

```text
BACKEND_URL=http://localhost:8081
```

Use the backend README for environment variables, database migrations and
initial Admin setup. Admins provision Accountant users; sign in at
`/accountant/login`.

## Accountant modules

Dashboard, student fees, fee structures/installments, collections/receipts,
defaulters, scholarships/concessions, refunds, income/expenses and financial
approvals are implemented. Ledger, budget, payroll/vendors, reports, Accountant
settings and audit-log screens remain placeholders.

Accountant routes, components and services are under `src/app/accountant`,
`src/components/accountant` and `src/lib/accountant`. Financial scope and rules
are documented in the backend's `ACCOUNTANT_SETUP.md`.

## Checks

```text
npx tsc --noEmit
npx eslint src/app/accountant src/components/accountant src/lib/accountant
npm run build
```

Keep source, lockfiles and regression checks in Git. Local credentials, runtime
screenshots/logs, `node_modules`, `.next` and build output must stay excluded.
