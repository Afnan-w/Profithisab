export const site = {
  name: "Profithisab",
  tagline: "Real returns of Bangladeshi mutual funds",
  taglineShort: "Real returns. Real funds. Real ৳.",
  /** Bangla: "How much did you make?" — the honest answer to that question, per fund. */
  taglineBn: "টাকার সত্যিকারের হিসাব",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://Profithisab.com").replace(/\/$/, ""),
  description:
    "Profithisab replays published NAV history of Bangladeshi open-end mutual funds so you can see, in black and white, what ৳1,00,000 — or a ৳5,000 monthly SIP — would actually have turned into. One uniform 3-year window. Dividends reinvested. No sales talk.",
  locale: "en_BD",
  currency: "BDT",
  asOf: "2026-10-29",
  asOfLong: "29 Oct 2026",
  twitter: "@Profithisab",
  socialProof: {
    // Off by default: we only show a user counter once there is a real number to show.
    enabled: false,
    count: 0,
    text: "people using Profithisab",
  },
  trustedSources:
    "Figures are rebuilt from published NAV history (AMC disclosures to BSEC), dividends are added per declaration, and every fund page shows exactly how each number was built.",
  links: {
    linkedin: "https://www.linkedin.com/company/Profithisab",
    facebook: "https://www.facebook.com/Profithisab",
    instagram: "https://www.instagram.com/Profithisab",
    youtube: "https://www.youtube.com/@Profithisab",
  },
  contactEmail: "data@Profithisab.com",
} as const;

export type SiteConfig = typeof site;
