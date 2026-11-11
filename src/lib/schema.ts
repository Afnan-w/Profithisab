import { z } from "zod";

/**
 * Zod schemas for everything in /data.
 *
 * These are the contract: the site refuses to build if any committed data file
 * breaks them. Scripts (`data:check`, `data:import`) use the same schemas.
 */

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date in YYYY-MM-DD form")
  .refine((v) => {
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }, "is not a real calendar date");

const httpUrl = z
  .string()
  .refine((v) => /^https?:\/\/\S+$/i.test(v), "must start with http:// or https://");

export const sourceSchema = z.object({
  name: z.string().min(1),
  url: httpUrl.nullable().optional().default(null),
  asOf: isoDateString.nullable().optional().default(null),
  kind: z.enum(["export", "demo", "manual", "public-disclosure"]).default("manual"),
});

export const fundTypeSchema = z.enum(["growth", "balanced", "income"]);
export const completenessSchema = z.enum(["complete", "partial", "missing"]);

export const fundSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase-with-hyphens"),
  name: z.string().min(2),
  acronym: z.string().min(1).max(24),
  amcId: z.string().min(1),
  type: fundTypeSchema,
  shariah: z.boolean(),
  launchDate: isoDateString.nullable(),
  fee: z.number().min(0).max(10).nullable(),
  fundSize: z.number().min(0).nullable(),
  minInvestment: z.number().min(0).nullable().optional().default(5000),
  source: sourceSchema,
  notes: z.string().optional(),
});

export type FundRecord = z.infer<typeof fundSchema>;

export const fundsFileSchema = z
  .object({
    schemaVersion: z.literal(1).default(1),
    funds: z.array(fundSchema),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const f of file.funds) {
      if (ids.has(f.id)) ctx.addIssue({ code: "custom", message: `duplicate fund id: ${f.id}` });
      if (slugs.has(f.slug)) ctx.addIssue({ code: "custom", message: `duplicate fund slug: ${f.slug}` });
      ids.add(f.id);
      slugs.add(f.slug);
    }
  });

export const amcSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  website: httpUrl.nullable().optional().default(null),
});

export const amcsFileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  amcs: z.array(amcSchema),
});

export type AmcRecord = z.infer<typeof amcSchema>;

export const navRowSchema = z.object({
  date: isoDateString,
  nav: z.number().positive("NAV must be greater than zero"),
});

export type NavRow = z.infer<typeof navRowSchema>;

export const dividendRowSchema = z.object({
  recordDate: isoDateString,
  amount: z.number().positive("dividend amount must be greater than zero"),
  /** NAV used to reinvest, when the export states it explicitly. */
  navAtRecordDate: z.number().positive().nullable().optional(),
});

export type DividendRow = z.infer<typeof dividendRowSchema>;

export const dividendsFileSchema = z
  .object({
    fundId: z.string().min(1).optional(),
    dividends: z.array(dividendRowSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const d of file.dividends) {
      if (seen.has(d.recordDate)) {
        ctx.addIssue({ code: "custom", message: `duplicate dividend record date: ${d.recordDate}` });
      }
      seen.add(d.recordDate);
    }
  });

export const benchmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "must be a hex colour"),
  /** Flat annual rate in percent (11.28 = 11.28%/yr). */
  annualRate: z.number().finite().nullable(),
  status: z.enum(["verified", "approximate", "unavailable"]),
  source: z.object({
    name: z.string().min(1),
    url: httpUrl.nullable().optional().default(null),
    asOf: isoDateString.nullable().optional().default(null),
  }),
  note: z.string().min(1),
  /** Optional dated level series for instruments that move (gold, DSEX). */
  series: z
    .array(z.object({ date: isoDateString, value: z.number().positive() }))
    .nullable()
    .optional()
    .default(null),
});

export const benchmarksFileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  benchmarks: z.array(benchmarkSchema),
});

export type BenchmarkRecord = z.infer<typeof benchmarkSchema>;

export const licenseSchema = z.object({
  sourceName: z.string().default(""),
  sourceUrl: httpUrl.nullable().optional().default(null),
  contact: z.string().default(""),
  permissionDate: z.string().default(""),
  permitted: z.array(z.string()).default([]),
  attributionText: z.string().default(""),
  attributionUrl: httpUrl.nullable().optional().default(null),
  automatedFetching: z.boolean().default(false),
  displayVerification: z.boolean().default(false),
  notes: z.string().default(""),
});

export type LicenseRecord = z.infer<typeof licenseSchema>;

export const verificationEntrySchema = z.object({
  fundId: z.string().min(1),
  verifiedBy: z.string().min(1),
  verifiedAt: isoDateString,
  scope: z.string().min(1),
  sourceUrl: httpUrl.nullable().optional().default(null),
});

export const verificationFileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  verification: z.array(verificationEntrySchema),
});

export type VerificationEntry = z.infer<typeof verificationEntrySchema>;

export const metaSchema = z.object({
  generatedAt: z.string().min(1),
  lastUpdated: z.string().min(1),
  latestNavDate: isoDateString.nullable(),
  isDemo: z.boolean(),
  sourceName: z.string().min(1),
  counts: z.object({
    funds: z.number().int().min(0),
    amcs: z.number().int().min(0),
    withNav: z.number().int().min(0),
    complete: z.number().int().min(0),
    partial: z.number().int().min(0),
    missing: z.number().int().min(0),
    stale: z.number().int().min(0),
    verified: z.number().int().min(0),
  }),
  perFund: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      latestNavDate: isoDateString.nullable(),
      completeness: completenessSchema,
      rows: z.number().int().min(0),
      stale: z.boolean(),
      source: z.string(),
    })
  ),
});

export type MetaRecord = z.infer<typeof metaSchema>;

export const reviewItemSchema = z.object({
  file: z.string(),
  row: z.number().int().min(0),
  reason: z.string().min(1),
  raw: z.record(z.string(), z.unknown()).optional(),
});

export const reviewFileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  updatedAt: z.string(),
  items: z.array(reviewItemSchema),
});

export type ReviewItem = z.infer<typeof reviewItemSchema>;

/**
 * Jumps larger than 15% that the owner has explicitly approved after checking
 * the source. Required before such a row can be published.
 */
export const approvedDeviationSchema = z.object({
  fundId: z.string().min(1),
  date: isoDateString,
  nav: z.number().positive(),
  reason: z.string().min(1),
  approvedAt: isoDateString,
});

export const approvedFileSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  approved: z.array(approvedDeviationSchema),
});

export type ApprovedDeviation = z.infer<typeof approvedDeviationSchema>;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** Readable one-line-per-issue Zod error, used by scripts. */
export function formatZodError(error: z.ZodError, label: string): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    return `  • ${path}: ${issue.message}`;
  });
  return `${label} is invalid:\n${lines.join("\n")}`;
}

/** Parse with a readable error; throws so builds and scripts stop loudly. */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(formatZodError(result.error, label));
  return result.data;
}
