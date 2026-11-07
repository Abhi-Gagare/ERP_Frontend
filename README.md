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
approvals, category budgets, staff/vendor payouts and a read-only cash-basis ledger
are implemented. Payroll includes staff profiles, approved effective-dated fixed
salary structures, monthly previews and saved payout breakdowns. Reports provide
date-filtered cash summaries, comparisons/charts, collections, current balances,
ageing, awards/refunds, budget variance and staff/vendor summaries with paged CSV
export. Accountant Settings saves personal report defaults and displays current
finance rules, and supports personal password changes that revoke old sessions.
New fee plans support the whole university or multiple courses, all/selected study
years and final-year targeting, with a frozen preview before batched assignment.
Existing single-course plans keep their original program/semester rules. See
backend migration 021 and its documented course-matching/year conventions.
Audit Logs provides filtered, paged finance request activity, Accountant sign-ins
and security/preferences events with page-only CSV export.

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


Fee cohort multi-selection: course, study-year, semester and admission-batch
selectors support All or multiple values. Semester/year choices derive from active
course duration (two semesters per year); admission batches come from approved
admissions. Course catalogs refresh on opening/focus and support search/pagination.
