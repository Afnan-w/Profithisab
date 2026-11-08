import type { Guide } from "@/components/content/blocks";

/**
 * Guide registry. `kind: "blocks"` renders from Block data below;
 * `kind: "custom"` pages (best-funds, sanchayapatra-vs-mutual-funds)
 * build their numbers from the live dataset at render time.
 */
export const GUIDES: Guide[] = [
  {
    slug: "how-to-invest-in-mutual-funds-in-bangladesh",
    title: "How to invest in mutual funds in Bangladesh",
    description:
      "The practical, no-drama route: BO account vs AMC account, KYC paperwork, buying open-end fund units, setting up a SIP and getting your money out. Bangladesh specifics, real steps.",
    published: "2026-10-12",
    updated: "2026-11-01",
    keywords: ["how to invest in mutual funds bangladesh", "open end mutual fund investment BD", "mutual fund KYC Bangladesh", "SIP setup Bangladesh"],
    kind: "blocks",
    faqs: [
      {
        q: "Do I need a BO account to buy open-end mutual fund units in Bangladesh?",
        a: "No. A BO ( beneficiary owner ) account through a stockbroker or custodian is for market-held instruments. For most open-end mutual funds you apply directly to the asset manager (or its authorised agent) — the AMC registers you as a unit holder. A BO account matters only if a fund lists or trades its units or you buy through a broker-platform product.",
      },
      {
        q: "What documents do mutual fund KYC in Bangladesh require?",
        a: "Typically: filled application form, NID copy, a passport-size photograph, bank account details (a cancelled cheque is common), and where applicable nominee details with photo. First-time investors may also be asked for income or source-of-funds information — consistent with BSEC's AML expectations.",
      },
      {
        q: "What is the minimum amount to start investing in a Bangladeshi mutual fund?",
        a: "Most open-end funds accept a first application from ৳5,000 onward; check each fund page for its stated minimum. A monthly SIP from the same amount is the friendliest start for most people.",
      },
      {
        q: "How do I get my money out of a mutual fund in Bangladesh?",
        a: "Submit a redemption request to the AMC (paper or online, depending on the manager). Redemptions are processed at NAV — usually the business day NAV after your acceptance — and funds are credited to the registered bank account. Early exits can carry exit loads per the prospectus.",
      },
    ],
    related: [
      { href: "/guides/mutual-funds-explained-simply", label: "Mutual funds explained simply" },
      { href: "/guides/mutual-fund-tax-bangladesh", label: "Tax on mutual fund returns" },
    ],
    blocks: [
      { t: "h2", text: "First, know which of two doors you're walking into" },
      { t: "p", md: "Bangladesh has two very different mutual fund worlds. *Closed-end* funds trade on the stock exchanges — you buy and sell listed units like shares, at a market price that can drift far from actual value. *Open-end* funds are bought at NAV straight from the asset manager, like a bank branch for investing. Profithisab only rates the second kind — the open-end funds — because their published NAV permits honest scorekeeping." },
      { t: "p", md: "This guide covers the open-end route. It is less complicated than people fear: paperwork, a bank account, and patience." },
      { t: "h2", text: "Step 1 — Pick the fund before the paperwork" },
      { t: "ul", items: [
        "Check the fund's *3-year total return* on Profithisab and its *worst fall* — the ride matters as much as the prize.",
        "Skim the *prospectus* for fee, dividend policy and exit rules. The fee the prospectus charges is yours to pay every year.",
        "Decide your filter: growth (equity), balanced, income (fixed income), or *Shariah-compliant only*.",
        "A fund with a small asset base is not automatically bad — but very small books can behave erratically.",
      ] },
      { t: "cta", href: "/funds", label: "Browse all tracked funds →" },
      { t: "h2", text: "Step 2 — Open a unit-holder account with the AMC" },
      { t: "p", md: "Contrary to popular belief you *do not* need a stockbroker for most open-end funds. Contact the asset manager directly — visit, call, or use their website/agent network. You will open a unit-holder account in your name." },
      { t: "dl", rows: [
        ["Application form", "Basic personal details + fund name + amount. Most AMCs keep forms downloadable online."],
        ["NID", "Copy of your National ID. The name must match your bank account — mismatched names are the classic rejection reason."],
        ["Photograph", "One passport-size photo, sometimes two."],
        ["Bank details", "Account number + a cancelled cheque or bank statement. Redemption money goes here, nowhere else."],
        ["Nominee", "Photo and, later, their ID when needed. Skip this at your family's peril."],
      ] },
      { t: "callout", title: "BO account — when you actually need one", md: "If you buy *listed* (closed-end) units through the exchanges, or use a broker's investment platform, you need a BO account from a DPS/stockbroker with CDBL. For plain open-end purchases from an AMC, you don't.", tone: "slate" },
      { t: "h2", text: "Step 3 — Pay in and get units" },
      { t: "p", md: "Deposit the amount into the fund-designated bank account (or pay digitally where the AMC supports it) and submit the form. Units are allotted at the applicable NAV — typically the NAV of the day your payment and valid form are received. Keep the fee receipt / confirmation; it's your record." },
      { t: "h2", text: "Step 4 — Set up a monthly SIP (highly worth it)" },
      { t: "p", md: "A SIP is just a standing deposit: each month you buy units at that month's NAV, which automatically buys more when markets are cheap and less when they're dear — taka-cost averaging, whether you meant to or not. Mechanics:" },
      { t: "ol", items: [
        "Ask the AMC for SIP mandate — many now support standing instructions from your bank account.",
        "Choose amount (৳5,000 is a sane start) and date.",
        "Log SIP receipts; your per-unit cost averages out over the window automatically.",
      ] },
      { t: "callout", title: "Why SIP beats spreadsheet-optimised timing for most humans", md: "You are unlikely to time the bottom perfectly, ever. A SIP turns that weakness into a strength: you are *forced* to accumulate during downturns (historically where Bangladeshi equity returns are minted), and you spend what you actually have — not what you'll wish you'd saved in 2027.", tone: "brand" },
      { t: "h2", text: "Step 5 — Getting out: redemption" },
      { t: "p", md: "Submit a redemption request to the AMC. Units are encashed at the applicable NAV (usually the next business-day NAV after acceptance) and paid into your *registered bank account*. Watch for:" },
      { t: "ul", items: [
        "*Exit loads* — some funds reduce fees if you hold longer; read the prospectus.",
        "*Settlement time* — bank credit typically within a few working days; ask the AMC's timeline.",
        "*Dividend choice* — some funds let you elect reinvestment (units again) or cash payout.",
      ] },
      { t: "h2", text: "Step 6 — Do a yearly 15-minute audit" },
      { t: "ol", items: [
        "Compare your fund's *3-year return* vs Sanchayapatra and inflation — the two rivals that quietly claim your money's yield.",
        "Check fees haven't crept and policy hasn't shifted.",
        "Rebalance: if equity funds ballooned past your comfort, trim towards balanced or income.",
        "Review nominee details — life moves.",
      ] },
      { t: "cta", href: "/compare", label: "Compare your shortlist now →" },
      { t: "h2", text: "Common traps worth one paragraph each" },
      { t: "ul", items: [
        "*NAV-1,000 thinking* — a ৳9 NAV vs ৳13 NAV says nothing about quality. NAV level is not share price cheapness; growth per year is the game.",
        "*Last-year hero* — funds that topped a single year often demonstrated chance, not skill. Judge the 3-year window, not the fireworks.",
        "*Fee blindness* — 2.5%/yr vs 0.7%/yr over a decade is a jaw-dropping difference. There is no quality that reliably covers it.",
        "*Ignoring dividends* — for income funds, total return (NAV + dividends) is the only truthful measure. Anything else understates reality.",
      ] },
      { t: "h2", text: "Frequently asked, quickly answered" },
    ],
  },

  {
    slug: "shariah-compliant-mutual-funds-bangladesh",
    title: "Shariah-compliant mutual funds in Bangladesh — what “Halal certified” really means",
    description:
      "How Shariah screening actually works for Bangladeshi mutual funds: eligible businesses, debt ratios, dividend purification, who issues certificates, and how Profithisab tags the 8 Shariah funds it tracks.",
    published: "2026-10-14",
    keywords: ["shariah mutual fund bangladesh", "halal mutual fund BD", "Islamic SIP Bangladesh", "shariah compliant fund list"],
    kind: "blocks",
    faqs: [
      {
        q: "What makes a Bangladeshi mutual fund Shariah-compliant?",
        a: "Two layers: the fund invests only in Shariah-screened assets (no interest-based businesses beyond thresholds, no haram industries), and returns are purified — any non-compliant income that slips through is donated. Compliance is typically certified by a Shariah board or advisor for the fund.",
      },
      {
        q: "Which open-end funds in Bangladesh are Shariah-compliant?",
        a: "Profithisab currently tracks 8 open-end funds tagged Shariah — see the Shariah section of the funds directory. Each is also shown in its own growth/balanced/income category, with the same 3-year window.",
      },
      {
        q: "Are Shariah funds automatically good investments?",
        a: "No. Compliance is a filter, not a performance halo. On Profithisab's fixed 3-year window several Shariah funds have trailed their conventional peers — and one or two led. Judge them by the same numbers as everyone else, plus your faith constraint.",
      },
    ],
    related: [
      { href: "/funds", label: "See the Shariah fund list" },
      { href: "/guides/mutual-funds-explained-simply", label: "Mutual funds explained simply" },
    ],
    blocks: [
      { t: "p", md: "Every fund page on Profithisab that says *Shariah* carries three promises: screened holdings, purified income, and a real certifying authority. Here's what that means at the ground level in Bangladesh." },
      { t: "h2", text: "The two-part test" },
      { t: "ol", items: [
        "*Business screen* — the underlying companies must operate in halal industries. No conventional banking interest-dependence, no alcohol, gambling, or speculation-heavy businesses.",
        "*Quantitative screen* — companies must keep interest-bearing debt and impure income below set thresholds; asset composition is checked against benchmarks." ,
      ] },
      { t: "p", md: "Funds additionally apply a *purification* rule: any residual non-compliant income (a dividend that fails, stray interest) is calculated and donated to charity, so it never reaches your unit value." },
      { t: "h2", text: "Who certifies in Bangladesh?" },
      { t: "p", md: "Funds state their Shariah supervisory arrangements in their prospectus — a Shariah board, advisor or committee that issues opinions and periodic compliance reports. Profithisab reads those documents and tags the fund; we never tag on hearsay, and where a claim can't be sourced to the fund's own documents, we don't badge it." },
      { t: "h2", text: "What changes in the numbers" },
      { t: "ul", items: [
        "Sector tilt: Islamic funds lean harder on compliant banks, telecom, pharma and industrials — that tilt is *the strategy*.",
        "Cash-rich portfolios: when compliant opportunities thin out, Shariah funds often carry higher cash reserves — expensive in a bull run, protective in a crash.",
        "No leverage games: screened funds don't ride debt-fuelled balance sheets, which changes drawdown behaviour in ways worst-fall stats make visible.",
      ] },
      { t: "rank", source: "g3", n: 8, title: "All 8 Shariah-tagged funds, fixed 3-year window (dividends reinvested)" },
      { t: "callout", title: "The honest summary", md: "Halal ≠ guaranteed growth. Use the tag as your *screen*, then rank by the same maths as everything else — 3-year total return, worst fall, fee. Faith selects the shelf; the numbers pick the tin.", tone: "amber" },
      { t: "h2", text: "Islamic alternatives beyond funds" },
      { t: "p", md: "Bangladesh savers typically also hold Islamic-bank deposits and Sanchayapatra-family certificates. For a full honest comparison including those instruments, see our benchmark guide." },
      { t: "cta", href: "/compare", label: "Compare Shariah funds directly →" },
    ],
  },

  {
    slug: "mutual-funds-explained-simply",
    title: "Mutual funds explained simply — a Bangladeshi guide",
    description:
      "What a mutual fund actually is, from NAV to units to fees, explained like a smart friend who checked the numbers — plus a plain-language glossary of Bangladesh terms.",
    published: "2026-10-16",
    keywords: ["mutual fund meaning bangladesh", "NAV meaning bangla", "unit fund explained", "SIP meaning"],
    kind: "blocks",
    faqs: [
      {
        q: "What is a mutual fund in one sentence?",
        a: "A pot of money collected from many investors and managed by professionals who buy securities with it; your slice of the pot is your units, and your slice's value moves with the pot.",
      },
      {
        q: "What is NAV?",
        a: "Net Asset Value per unit — the fund's total assets minus liabilities, divided by units outstanding. It is the price at which you effectively buy or sell open-end units, and the number funds publish daily.",
      },
      {
        q: "Growth fund vs balanced vs income — what's the difference?",
        a: "Growth funds are equity-heavy (market risk, market reward). Balanced funds mix equity with fixed income to smooth the ride. Income funds hold bonds/loans/deposits for steadier but smaller returns.",
      },
    ],
    related: [
      { href: "/guides/how-to-invest-in-mutual-funds-in-bangladesh", label: "How to invest — step by step" },
      { href: "/guides/best-mutual-funds-bangladesh", label: "Best funds by data" },
    ],
    blocks: [
      { t: "h2", text: "The pot, the cook and your bowl" },
      { t: "p", md: "A mutual fund is *a pot of money* from thousands of investors. An asset manager (the cook) invests it in shares, bonds or deposits. You don't own the securities — you own *units* of the pot. The price of one unit is the NAV. When the pot's contents grow, your units grow; it's that mechanical, and that powerful when done well." },
      { t: "h2", text: "NAV in one breath" },
      { t: "p", md: "NAV = (what the fund owns − what it owes) ÷ number of units. Published per unit daily. A fund at ৳9.6 isn't 'cheaper' than one at ৳13 — NAV is a level, not a price tag on quality. What matters is how fast the level climbs, minus the fees and the falls." },
      { t: "h2", text: "The three Bengali-cuisine flavours" },
      { t: "ul", items: [
        "*Growth (equity) funds* — most money in listed companies. Seats at the market's table: highest ceiling, deepest dips.",
        "*Balanced funds* — part equity, part fixed income. The compromise flavour; smoother lines, smaller fireworks.",
        "*Income funds* — bonds, loans and deposits. The kettle-warmers: steady cups, no adrenaline.",
      ] },
      { t: "h2", text: "Fees — the silent chef taking a cut" },
      { t: "p", md: "Your fund pays a management fee and other recurring costs out of the pot *before* your NAV grows. In Bangladesh open-end funds this commonly runs 0.7%–2.5% a year. Two funds with identical bets but a 1.8% fee difference diverge like slow trains over a decade. Profithisab prints fees next to every return for exactly this reason." },
      { t: "h2", text: "Dividends vs growth — two ways to eat the same cake" },
      { t: "p", md: "When a fund declares a dividend, it pays cash per unit and the NAV drops by (almost) that amount — it's your own money changing pockets unless you reinvest. Profithisab's default maths reinvests dividends automatically (total return); you can think of 'growth' as the always-reinvested setting." },
      { t: "h2", text: "The glossary — plain, Bangladesh-flavoured" },
      { t: "dl", rows: [
        ["NAV (u)", "Price of one unit of the fund; published per day for open-end funds."],
        ["SIP", "Systematic Investment Plan — fixed monthly buying, taka-cost averaging by accident."],
        ["Total return", "NAV change + all dividends reinvested. The only honest long-run number."],
        ["CAGR", "Compound annual growth rate — what '+9.8%/yr' means: the year rate a lump sum needs to match the same pot."],
        ["Worst fall", "Biggest peak-to-trough NAV drop — the metric for sleep quality."],
        ["Exit load", "A fee for leaving a fund too early, set by the prospectus."],
        ["AUM", "Assets under management — the size of the pot, in crore taka."],
        ["AMC", "Asset Management Company — the licensed firm running the fund."],
        ["BO account", "Brokerage account holding market instruments; needed for listed (closed-end) units, not usually for open-end."],
        ["Sanchayapatra", "Government savings certificate — the fixed-rate household benchmark every fund must beat before being worth its fee."],
      ] },
      { t: "cta", href: "/guides/how-to-invest-in-mutual-funds-in-bangladesh", label: "Now the practical steps →" },
    ],
  },

  {
    slug: "mutual-fund-tax-bangladesh",
    title: "Tax on mutual funds in Bangladesh — dividends, gains and the certificate cut",
    description: "How Bangladesh taxes mutual fund dividends and capital gains, the 10% source tax widely zero-rated for listed instruments, and why Sanchayapatra interest isn't tax-free. Plain rules, no wishful thinking.",
    published: "2026-10-20",
    keywords: ["mutual fund tax bangladesh", "dividend tax BD", "capital gains tax share bangladesh", "Sanchayapatra tax"],
    kind: "blocks",
    faqs: [
      {
        q: "Is mutual fund dividend taxed at source in Bangladesh?",
        a: "Mutual fund dividends for listed instruments are generally treated like share dividends for source-tax purposes — largely zero-rated at present, but rates change by Finance Act. Confirm the current year's rule before assuming zero.",
      },
      {
        q: "Do I pay capital gains tax when I redeem mutual fund units?",
        a: "Individual retail investors currently pay no capital gains tax on listed-share disposals in Bangladesh, and redemption of units follows broadly that regime. This can change by budget legislation; check the year's Finance Act.",
      },
      {
        q: "Is Sanchayapatra interest tax-free?",
        a: "No. Certificate interest carries source tax (10% commonly for general investors; lower for differently-abled investors and those buying with assessed income bands). Net-of-tax comparison matters in Profithisab's context tables.",
      },
    ],
    related: [
      { href: "/guides/sanchayapatra-vs-mutual-funds", label: "Sanchayapatra vs mutual funds" },
      { href: "/guides/how-to-invest-in-mutual-funds-in-bangladesh", label: "How to invest" },
    ],
    blocks: [
      { t: "callout", title: "Standing disclaimer", md: "Tax rates are legislated annually and can change with each Finance Act. This guide reflects the commonly applicable position for individual investors in recent budgets — verify against the current Finance Act or a tax professional before relying on it. Profithisab is a research tool, not a tax advisor.", tone: "amber" },
      { t: "h2", text: "The three tax events in a fund investor's year" },
      { t: "dl", rows: [
        ["Dividend received", "Source tax applies by the year's rule; listed instruments have commonly been zero-rated for individual small holders. AMCs/RTAs deduct where applicable and provide the certificate."],
        ["NAV growth (unrealized)", "No tax — growth inside the fund isn't taxed until you realise it."],
        ["Redemption / sale of units", "Follows the same regime as disposing of listed securities: currently no capital-gains tax for ordinary individual investors. Institutional and corporate holders differ."],
      ] },
      { t: "h2", text: "The benchmark instruments also pay taxes — quietly" },
      { t: "p", md: "The 11%-ish certificate in the drawer is not the clean number people quote. Interest on Sanchayapatra carries source tax (commonly 10% for general buyers; categories like TIN-less buyers or differently-abled investors face different rates), and bank FDR interest similarly. Meanwhile mutual fund total returns for individual retail investors have typically realised *without* a capital-gains haircut at redemption. That asymmetry is real, though less dramatic than salespeople imply — and it's why Profithisab's comparison tables say *gross, pre-personal-tax* unless a note says otherwise." },
      { t: "h2", text: "Documentation that saves you pain" },
      { t: "ul", items: [
        "Keep every *dividend warrant / credit advice* — source-tax certificates are issued at year end by the AMC.",
        "Keep *redemption confirmations* — cost-basis records if any future regime begins taxing gains.",
        "If you file a return, declare certificate interest and (where applicable) tax-exempt income as the return form directs.",
      ] },
      { t: "h2", text: "Rule-of-thumb summary" },
      { t: "table", head: ["Event", "Typical treatment for individual retail investors", "Watch out"], rows: [
        ["Mutual fund dividend", "Generally zero-rated at source in recent years (listed instruments); AMCs deduct if rules change", "Confirm current Finance Act"],
        ["Redemption of units", "No capital-gains tax at present for individuals", "Threshold regimes for corporates differ"],
        ["Sanchayapatra interest", "Source tax commonly 10% for general investors", "Net yield is the honest yield"],
        ["Bank FDR interest", "Source tax by category (TIN status)", "Ask the bank for the net number"],
      ] },
      { t: "cta", href: "/compare", label: "See funds vs the net-yield benchmarks →" },
    ],
  },
];
