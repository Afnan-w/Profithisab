import { SITE_URL } from "@/lib/config";

export const site = {
  name: "Profithisab",
  tagline: "Real returns of Bangladeshi mutual funds",
  taglineShort: "Real returns. Real funds. Real ৳.",
  /** Bangla: "The true account of your taka". */
  taglineBn: "টাকার সত্যিকারের হিসাব",
  url: SITE_URL,
  description:
    "Profithisab replays published NAV history of Bangladeshi open-end mutual funds so you can see, in black and white, what ৳1,00,000 — or a ৳5,000 monthly SIP — would actually have turned into. Dividends reinvested. Every source and every gap shown.",
  locale: "en_BD",
  currency: "BDT",
  twitter: "@Profithisab",
  socialProof: {
    // Off by default: we only show a user counter once there is a real number to show.
    enabled: false,
    count: 0,
    text: "people using Profithisab",
  },
  trustedSources:
    "Figures are rebuilt from the NAV and dividend history in our data files. Every fund page shows its source, its latest NAV date and exactly how each number was built.",
  links: {
    linkedin: "https://www.linkedin.com/company/Profithisab",
    facebook: "https://www.facebook.com/Profithisab",
    instagram: "https://www.instagram.com/Profithisab",
    youtube: "https://www.youtube.com/@Profithisab",
  },
  contactEmail: "data@profithisab.com",
} as const;

export type SiteConfig = typeof site;
