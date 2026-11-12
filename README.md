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

## Investment Data Hub (`/hub`)

An additive section of the site — every existing page, route and nav item is
unchanged; the header gained one **Data Hub** link. The hub covers:

| Route | Contents |
| --- | --- |
| `/hub` | Landing page + source registry status (enabled/sample/stale/delay flags) |
| `/hub/mutual-funds` | Searchable fund table with a Shariah filter and per-fund links |
| `/hub/mutual-funds/[slug]` | Per-fund NAV history chart, latest NAV points, Shariah status source |
| `/hub/savings` | Sonchayapatra / savings-scheme rates |
| `/hub/opportunities` | FDR rates, Bangladesh Bank treasury, DSE & CSE indexes |
| `/hub/calculators` | SIP, lump sum, FDR and Sonchayapatra calculators |

Display rules enforced in code (`src/lib/hub/freshness.ts`,
`src/components/hub/provenance.tsx`):

- **Every** table/chart shows source name (linked), data date, last fetched time
  in **Asia/Dhaka**, and a “Delayed by up to X minutes” badge where the source
  declares a delay. Nothing delayed or manual is ever presented as real-time.
- Past the expected refresh interval (36 h daily / 45 min for 15-minute sources)
  the block shows **“Data may be outdated”**. Manual and unknown schedules are
  never flagged stale — they are labelled **“manually updated on [date]”** instead.
- Sample data shipped so pages render before the first fetch is badged
  **“Sample data”** everywhere it appears.
- **Shariah status is never inferred from a fund name.** Only entries in
  `data/shariah-status.json` with a citable official source (name, URL, quote,
  checked-on date) are shown as confirmed; every other fund reads
  **“Not confirmed”** — which is not the same as non-compliant.
- No buy/sell recommendations, no rankings without a shown method, and
  “Past performance does not guarantee future results.” under every fund/return
  figure plus the site-wide notice “Information only. Not investment advice.
  Check the fund's official prospectus before investing.”

### Hub data files

```
data/
├─ sources.json               source registry — every source starts enabled: false
├─ shariah-status.json        source-documented Shariah statuses only
├─ nav-history/{slug}.json    per-fund NAV history (merged by the fetcher)
├─ {type}-{source-id}.json    result files: rates-*, fdr-*, index-*, nav-*
├─ manual/{slug}.json         manual overrides; "draft": true = template, skipped
config/
└─ tax.json                   calculator tax assumptions (shown with the results)
```

Result files carry `source_name`, `source_url`, `data_date`, `fetched_at`,
`schedule`, `delay_minutes` and `records[]`; sample copies add `"sample": true`.
`src/lib/hub/` reads them server-side (filesystem, like `src/lib/data.ts`).

### Enabling a source

1. Open `data/sources.json` and confirm the source is **public**, needs **no
   login**, does **not prohibit automated access**, and is **not a paid/licensed
   feed**. If any check fails, leave it `enabled: false` — the hub then shows the
   placeholder interface with no invented numbers.
2. Flip `"enabled": true` for that source.
3. Run the matching fetch and check the output:

   ```bash
   npm run fetch:nav       # data_type: nav   → NAV history per fund
   npm run fetch:rates     # data_type: rates → savings-scheme rates
   npm run fetch:index     # data_type: index → DSE/CSE/BB levels
   ```

4. Validation runs before anything is written: NAV > 0, rates within 0–30 %,
   index levels > 0, every record needs a source URL and a real calendar date.
   If more than 20 % of a batch fails (or the batch is empty), the run is
   rejected and the **last good file is kept**. Fetch failures, logins, CAPTCHAs
   and bot blocks stop that source immediately.

The fetcher (`scripts/fetch/`) checks `robots.txt` first, sends a clear User-Agent
with a contact address, waits ≥ 3 s between requests to the same host, times out
at 15 s, retries at most twice with backoff, and never writes a file that fails
validation.

### Manual updates

For sources with `"type": "manual"` (e.g. bank FDR rates) copy
`data/manual/_template.json` to `data/manual/<label-slug>.json`, fill in
`value`, `data_date`, `label`, `source_name` and `source_url`, and **delete the
`"draft": true` line** — files still marked `draft` are skipped as templates.
Run `npm run fetch:rates` (or the matching type) to ingest; the site then shows
“manually updated on [date]” for those rows.

### Schedules

`.github/workflows/hub-fetch.yml`:

- **NAV + rates + FDR**: daily at 09:00 UTC (15:00 Asia/Dhaka, after close).
- **Indexes**: every 15 minutes, Sun–Thu 04:00–08:30 UTC
  (10:00–14:30 Asia/Dhaka); the script self-gates to the trading window.
- Paid/licensed sources stay `enabled: false` — placeholder interface only.
- The workflow commits only `data/` (fetched results), so site code deploys via
  Vercel on push while refreshed data lands from Actions.

### Tests

`npm test` includes `tests/hub.test.ts`: SIP/lump/FDR arithmetic, Sonchayapatra
payout and compounding math, validation rules (including the >20 % rejection and
last-good fallback), stale-data warnings, Asia/Dhaka formatting, delay/manual
labels.


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
| `npm run fetch:nav` | Fetch enabled NAV sources into `data/nav-history/` |
| `npm run fetch:rates` | Fetch enabled savings/manual rate sources |
| `npm run fetch:index` | Fetch enabled index sources (DSE/CSE/BB) |
| `npm run test` | Run the arithmetic, importer and hub unit tests |

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
