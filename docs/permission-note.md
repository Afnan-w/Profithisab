# Permission policy — when a letter is needed

**Current policy (2026-11-11):** Profithisab fetches NAV data directly from
first-party public sources — each asset management company's own published NAV
history, plus the LankaBangla Financial Portal's public weekly fund table. No
signed permission exists because none is required for public first-party
disclosures. The fetcher is polite (clear bot identity with a contact address,
rate-limited, cached, stops on 403/429), and every source is listed in
`data/sources.json`. This policy is recorded in `data/license.json`.

**When a permission letter IS required:** any source that is not a public
first-party disclosure — aggregators like ReturnKoto, paid feeds, or any site
whose terms prohibit automated access. Until permission is granted in writing:

- do not scrape or fetch that site;
- do not import files obtained from it;
- `data/license.json` must not claim their data.

The template below is kept for that situation.

---

# Permission request — copy this message

Send this to the ReturnKoto founder (or the person who owns the fund data). Fill
in the bracketed parts. Keep their reply: it is the record behind
`data/license.json`.

Do **not** scrape the website, and do not import anything until they answer.
The importer only reads files they send you, and automated fetching stays off
unless they explicitly allow it in writing.

---

**Subject:** Permission to use ReturnKoto fund data on Profithisab

Hello [name],

I run Profithisab (https://profithisab.vercel.app), a free research site that
shows Bangladeshi open-end fund returns calculated from published NAV history.
It is a research tool, not investment advice, and it does not sell rankings.

I would like to use the fund data ReturnKoto publishes — fund names, NAV
history, dividend history and basic fund facts — so visitors can see honest,
reproducible return calculations. I am asking for your permission first.

Specifically, may I:

1. receive a CSV, JSON or XLSX export of the fund and NAV/dividend data
   (a one-off export is enough to start);
2. display that data on Profithisab, with a visible attribution and a link to
   ReturnKoto on every page that uses it;
3. refresh it periodically from a new export you send, or — only if you
   explicitly agree — fetch it automatically from a public endpoint you nominate,
   politely and at most weekly.

I will not use ReturnKoto's logo, brand assets or written content, and I will
not describe the data as “verified” unless a named person has checked it and you
have allowed that wording. Missing values will be shown as “Data not available”,
never guessed.

If you agree, please reply with:

- the date permission is granted;
- the exact attribution wording you want (for example, “Data source:
  ReturnKoto”);
- the URL you want the attribution to link to;
- which of the three points above are permitted;
- whether automated fetching is allowed (yes/no). If you are unsure, “no” is
  fine — I will use exports only.

Thank you for considering it.

[Your name]
Profithisab
[your contact email]

---

## After they reply

Fill in `data/license.json` with their answers, then run `npm run data:check`.
The footer, methodology page and `/data-status` read the attribution from that
file. If they say no, leave `permitted` empty and do not import their data.
