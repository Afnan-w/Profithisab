# Profithisab 🇧🇩

**Real returns of Bangladeshi mutual funds** — replayed from published NAV history, counted honestly, shown with the recipe attached. Built to be the site where a Bangladeshi investor asks the only question that matters:

> লাভ কতো? (_how much did I actually make?_)

---

## Stack

- **Next.js 15 (App Router) + TypeScript + React 19**
- **Tailwind CSS 3.4** (dark/light via `next-themes`)
- **Recharts not used** — all charts are hand-rolled **server-rendered SVG**: they work without JS, ship zero client bytes, and can't cause layout shift
- No database, no CMS: content and data live in typed modules under `src/data/`
- Host anywhere Node runs; Vercel-ready out of the box

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
```

> Fonts (Inter + Noto Sans Bengali) download from Google Fonts at build time; first build needs network.

## Project map

```
src/
├─ app/                       # routes (all statically generated)
│  ├─ page.tsx                # homepage: hero + honest replay calculator + FAQ (JSON-LD)
│  ├─ funds/page.tsx          # directory: 38 funds, filters, grouped Growth/Balanced/Income/Shariah
│  ├─ funds/[slug]/page.tsx   # fund page: ৳1,00,000 replay, NAV + total-return charts, SIP replay,
│  │                          #   fees, dividend record, benchmarks, method notes, FAQ, related funds
│  │  └─ opengraph-image.tsx  # per-fund OG card (auto-generated PNG)
│  ├─ compare/page.tsx        # side-by-side table, shareable via ?funds=slug1,slug2,slug3
│  ├─ guides/…                # learn hub + 6 guides (4 text-block guides, 2 data-computed)
│  ├─ blog/…                  # dated posts with live ranking tables
│  ├─ about | methodology | invest | privacy | not-found
│  ├─ sitemap.ts | robots.ts | manifest.ts | opengraph-image.tsx | icon.svg
├─ components/…               # site chrome, calculator (client), charts, cards, badges, SEO blocks
├─ data/
│  ├─ funds.ts                # ★ THE FUND CATALOG — 38 Bangladeshi open-end funds + anchors
│  ├─ guides.ts | custom-guides.ts | posts.ts
└─ lib/
   ├─ engine.ts               # deterministic series builder (mulberry32; server = client output)
   ├─ returns.ts              # total-return math, SIP+IRR, drawdown, beta, benchmark trails
   ├─ benchmarks.ts           # Sanchayapatra / FDR / CPI / gold / DSEX reference instruments
   ├─ seo.ts                  # metadata helper + all JSON-LD builders
   ├─ format.ts               # ৳ lakh/crore formatting
   └─ site.ts                 # brand, domain, as-of date, social-proof switch
```

## The data model, honestly

Fund facts in `src/data/funds.ts` are the **published anchors** of each tracked open-end scheme, e.g.:

```ts
{ slug: "idlc-growth-fund", name: "IDLC Growth Fund", amc: "IDLC", type: "growth",
  verified: true, inception: "2019-07", g3: 8.58, gSince: 7.87, worstFall: -12.0,
  fee: 2.5, aumCr: 96, divAnnualPct: 4, divMonths: [1] }
```

`lib/engine.ts` then reconstructs a **month-by-month NAV + dividend series** that compounds exactly to
`g3` over the fixed 3-year window and to `gSince` over the tracked window, with its deepest drawdown shaped
toward `worstFall` by a shared DSEX-style market factor. Consequences:

- every displayed number is computed through the same documented formulas (no hardcoded display values);
- server pages and the client calculator produce identical results (pure, seeded math — no hydration mismatch);
- the dataset is an **anchored demo**: roster, AMCs, fees, AUMs, verification flags and headline anchors are
  real (as of 29 Oct 2026); the intermediate monthly path is principled reconstruction, *not* verbatim history.

`src/lib/site.ts` → `asOf` controls the single date everything claims ("Figures as of…"). Move it, update
anchors, done.

## ★ Updating funds & data (the important part)

### 1) Swap in verbatim NAV history (recommended next step)

- Source monthly (or daily → resample month-end) NAV + dividend history per fund from the AMC's published
  disclosures / fact sheets.
- For each fund, add an optional `nav: { m: "YYYY-MM"; nav: number; div: number }[]` array to its catalog
  entry (or place files in `src/data/nav/{slug}.json` — write a tiny loader in `engine.ts`).
- **Delete the `g3 / gSince / worstFall` calibration**: once `nav` exists, `buildSeries` should short-circuit
  to your verbatim series (the code path is already structured for this).

### 2) Add a brand-new fund

1. Append an entry to `FUNDS` in `src/data/funds.ts` (choose `type`, `shariah`, `verified`, `fee`, `aumCr`,
   `divAnnualPct`, `divMonths`, and the anchors `g3/gSince/worstFall` from the prospectus/NAV feed).
2. That's it — directory card, fund page, calculator, compare, sitemap, OG card and JSON-LD are all generated
   from the catalog. **Never** hand-edit generated pages.

### 3) Update the as-of date

- Bump `site.asOf` (`"2026-10-29"`) in `src/lib/site.ts` and align `MARKET_MONTHS`/anchors in `engine.ts`
  to the new window. CI texts and pages will re-render with the new date everywhere.

### 4) Benchmarks

- `src/lib/benchmarks.ts` — certificate/FDR/CPA/gold rates are single-point constants with per-year CPI in
  the `benchMonthlyLog` switch. Update rates there; methodology notes travel with each benchmark.

### 5) AMC-Verified flags

- Flip `verified: true` **only** after actually cross-checking that fund's NAV/dividend series with the asset
  manager. The badge means something or it means nothing — our choice.

## SEO implementation (already wired)

- Per-page `Metadata` with unique titles/descriptions (fund pages include live ৳ outcomes), canonicals,
  keywords, OG + Twitter cards (summary_large_image) with **auto-generated OG art** for home and every fund.
- JSON-LD: `Organization`, `WebSite` (+`SearchAction` → `/funds?q=`), `BreadcrumbList` (every page),
  `InvestmentFund` (fund pages), `FAQPage` (home, guides, fund FAQs), `ItemList` (directory, guides, blog),
  `Article` (guides/posts).
- Dynamic `sitemap.xml` + `robots.txt` + `manifest`; semantic heading hierarchy; internal linking between
  funds ↔ compare ↔ guides everywhere; `?q=` search deep links for the SearchAction.
- To add a Bangla (bn) version later: duplicate route groups with `bn` copy and set
  `alternates.languages` + `hreflang` in `pageMeta` — the helper is the single place to extend.

## Environment variables

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Set at build time (e.g. `Profithisab.com`) to enable cookie-free Plausible analytics. Unset = no analytics script is rendered at all (the default, as committed). |

The privacy page discloses analytics as optional aggregate pageview counts — this gate keeps the
build honest when the variable is absent.

## Conventions

- Title formulas live in page files, not a CMS: e.g. fund pages use
  `"{Fund name} ({ACRONYM}) — Returns, NAV & Fee"`, guides use `"{Guide title}"`.
- Currency formatting is centralised in `lib/format.ts` (৳ with lakh/crore words; `1,00,000` grouping).
- Dark mode is class-based; both themes are first-class — check all pages in both before shipping copy changes.

## Scripts

| command          | what it does                     |
|------------------|----------------------------------|
| `npm run dev`    | local dev server                 |
| `npm run build`  | static production build          |
| `npm start`      | serve the production build       |

## License & stance

Research tool. **Not investment advice.** Past NAVs describe the past, never the future. Partner referral
fees (planned on `/invest`) never purchase rankings, badges or a single digit.

© 2026 Profithisab.
