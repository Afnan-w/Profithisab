# Profithisab

**Real returns of Bangladeshi mutual funds**, calculated from published NAV
history — with the method attached.

The site answers one question: *how much did an investor actually make?* Every
return, SIP XIRR, drawdown and ranking is computed from files in `/data`. There
are no hand-typed performance numbers and no invented history.

> **Current status:** the real catalogue is empty, so the site is serving a
> clearly labelled **demo dataset** while the licensed export is arranged. The
> yellow banner is deliberate. See `/data-status` for what is loaded and
> `DATA-GUIDE.md` for how to replace it.

---

## Stack

- **Next.js 15 (App Router) + TypeScript + React 19**
- **Tailwind CSS 3.4** with `next-themes` for dark/light
- **No charting dependency** — charts are server-rendered SVG, with client
  overlays only where the calculator needs them
- **No database, no CMS** — validated JSON/CSV files in `/data` are the source
  of truth
- Vercel-ready; the free plan is enough

## Quick start

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # validates /data first, then builds
npm start          # serve the production build
```

Fonts download from Google Fonts at build time, so the first build needs network.

## Project map

```
src/
├─ app/                     routes
│  ├─ page.tsx              homepage: computed chips, calculator, ranked bars
│  ├─ funds/                directory + per-fund pages and OG images
│  ├─ compare/              2–4 fund side-by-side table
│  ├─ data-status/          every fund, freshness, licence and review queue
│  ├─ methodology/          formulas, benchmark status, attribution
│  ├─ guides/ | blog/       evergreen guides and dated notes
│  └─ about | privacy | invest | sitemap | robots
├─ components/              site chrome, calculator, SVG charts, cards, SEO
├─ data/                    guides/posts only (not fund data)
└─ lib/
   ├─ schema.ts             Zod contract for every /data file
   ├─ data.ts               loader, demo fallback, validation
   ├─ calc.ts               lump sum, SIP/XIRR, drawdown, volatility
   ├─ returns.ts            server adapter + headline metrics
   ├─ date.ts | csv.ts      shared pure helpers
   └─ format.ts | site.ts   currency/date formatting and site config

data/
├─ funds.json               real catalogue (empty until import)
├─ nav/{slug}.csv            real NAV history
├─ dividends/{slug}.json     real dividend history
├─ amcs.json                 asset managers
├─ benchmarks.json           cited or clearly approximate reference lines
├─ license.json              permission + attribution (fill this in)
├─ verification.json         named human checks (empty by default)
├─ review-needed.json        suspicious rows held back
├─ approved-deviations.json  reviewed big jumps
├─ meta.json                 generated counts/freshness
├─ templates/                copy-and-edit examples
├─ incoming/                 drop new exports for the weekly workflow
└─ demo/                     labelled demo dataset (fallback only)
```

## The data contract

`src/lib/schema.ts` defines the shape of every file. `npm run data:check` runs
the same validation as the production build, so bad data fails the build instead
of reaching the live site.

Rules enforced in code:

- NAV must be greater than zero and must not be in the future.
- Fund `id` and `slug` must be unique; slugs are lowercase-with-hyphens.
- Missing values are `null`, never a guess. Empty NAV/dividend history is
  allowed and shown as “Data not available”.
- A fund with no NAV in 30 days is flagged **stale** and excluded from rankings.
- A one-step NAV move over 15% goes to `data/review-needed.json` until approved.
- A dividend more than 10 days from any NAV date goes to review.
- A benchmark marked `approximate` says so where the number appears;
  `unavailable` benchmarks are not drawn as if they were real.
- A “source-verified” badge requires a real entry in `data/verification.json`
  **and** `displayVerification: true` in `data/license.json`.
- Investment history shorter than 90 days gets no annualised return; a SIP
  shorter than 12 months gets “Not enough history”.

## Data pipeline

See **[`DATA-GUIDE.md`](DATA-GUIDE.md)** for the plain-English version. In short:

```bash
# Preview an export (CSV, JSON or XLSX; one file or a folder)
npm run data:import -- "C:\path\to\export.xlsx" --dry-run

# Import, then validate
npm run data:import -- "C:\path\to\export.xlsx"
npm run data:check

# Promote reviewed rows after checking them
npm run data:approve -- --dry-run
npm run data:approve

# Check freshness
npm run data:staleness
```

The importer merges and appends; it never deletes existing history. Its column
mapping, counts and coverage are written to `scripts/last-run.md`.

### Weekly update

`.github/workflows/update-data.yml` runs every Monday at 03:17 UTC. It validates
the data, imports files placed in `data/incoming/` **only when**
`data/license.json` is complete, commits with `data: NAV update YYYY-MM-DD`, and
opens an issue if the import fails or the newest NAV is more than 21 days old.
It uses the built-in `GITHUB_TOKEN` with `contents: write` and `issues: write`;
no extra secret is needed.

### Benchmarks

`data/benchmarks.json` currently has Sanchayapatra, FDR and inflation lines
marked `approximate`, and gold/DSEX marked `unavailable`. Update a rate only with
a source and date; never turn an approximate line into a verified one without a
citation.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Validate `/data`, then build for production |
| `npm start` | Serve the production build |
| `npm run data:check` | Validate all data, write `meta.json`, print warnings |
| `npm run data:import -- <path>` | Import/merge a CSV, JSON or XLSX export |
| `npm run data:approve` | Promote reviewed rows from the review queue |
| `npm run data:staleness` | Report funds with no recent NAV |
| `npm run test` | Run the arithmetic and importer unit tests |

## Environment variables

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL. Defaults to `https://profithisab.vercel.app`. Set it after connecting a custom domain. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional cookie-free analytics. Unset = no analytics script at all. |

Copy `.env.example` to `.env.local` for local overrides. Never commit `.env*`
files; only `.env.example` belongs in git.

## Deploy on Vercel

1. Push to `main` on `github.com/Afnan-w/Profithisab`.
2. Vercel builds with `npm run build` (which runs `data:check` first).
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. The build traces `/data` into the deployment so server pages can read it.

## Licence and stance

Research tool. **Not investment advice.** Past NAVs describe the past, never the
future. No ranking or badge is for sale.

Fund data is used only with the permission recorded in `data/license.json`.
Attribution is shown in the footer, on `/methodology` and on `/data-status`.
The permission request template is in `docs/permission-note.md`.

Site code © 2026 Profithisab.
