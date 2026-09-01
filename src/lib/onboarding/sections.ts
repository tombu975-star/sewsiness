// The full Business Health Assessment, completed in-app after signup
// (src/app/(app)/business-health/assessment). Identity & basic compliance
// facts are captured once at signup (see ./identity.ts); this module
// covers the parts of the business that change over time and genuinely
// need periodic re-assessment.
//
// Design choice: rather than asking an owner to self-rate a dimension
// "0-100" (unreliable, not comparable across businesses), every question
// is a concrete, answerable multiple-choice item with a documented score
// per option. A dimension's score is the average of its questions'
// scores. This keeps the health score auditable — see ./scoring.ts.
//
// `apprentices` and `freelancers` are workforce-development sections:
// they feed recommendations but are deliberately NOT part of the 0-100
// weighted score (a business with no apprentices isn't "unhealthy" for
// it) — matching the original module's design.

export type QuestionOption = { value: string; label: string; score: number };
export type Question = {
  key: string;
  label: string;
  helpText?: string;
  options: QuestionOption[];
};

export type Dimension = {
  key: string;
  title: string;
  description: string;
  weight: number; // percent, weighted dimensions sum to 100
  scored: boolean;
  questions: Question[];
};

const yesNo = (yesLabel = "Yes", noLabel = "No"): QuestionOption[] => [
  { value: "yes", label: yesLabel, score: 100 },
  { value: "partial", label: "Partially / in progress", score: 50 },
  { value: "no", label: noLabel, score: 0 },
];

export const DIMENSIONS: Dimension[] = [
  {
    key: "compliance",
    title: "Legal, KYC & Compliance",
    description: "Registration, tax standing, permits and data-handling practice.",
    weight: 15,
    scored: true,
    questions: [
      {
        key: "registration_status",
        label: "Is the business formally registered with the Registrar-General's Department?",
        options: yesNo("Yes, fully registered", "Not yet registered"),
      },
      {
        key: "tax_filing_status",
        label: "Are tax filings (GRA) up to date?",
        options: yesNo("Up to date", "Overdue / not filing"),
      },
      {
        key: "industry_permits",
        label: "Does the business hold any required local permits (e.g. AMA/MMDA operating permit)?",
        options: yesNo("Yes, current", "None / expired"),
      },
      {
        key: "data_privacy_practice",
        label: "Are customer records (measurements, contacts, payments) kept securely and access-restricted?",
        helpText: "Ghana Data Protection Act, 2012 (Act 843) applies to any business holding customer personal data.",
        options: yesNo("Yes, restricted access", "Anyone can access them"),
      },
    ],
  },
  {
    key: "operations",
    title: "Operations Health",
    description: "Production, inventory, quality control and supplier resilience.",
    weight: 20,
    scored: true,
    questions: [
      {
        key: "production_model",
        label: "How is production planned?",
        options: [
          { value: "scheduled", label: "Scheduled/queued with capacity limits", score: 100 },
          { value: "adhoc_tracked", label: "Ad-hoc but tracked per order", score: 60 },
          { value: "adhoc_untracked", label: "Ad-hoc, no formal tracking", score: 20 },
        ],
      },
      {
        key: "lead_time",
        label: "Average production lead time is consistently met?",
        options: yesNo("Consistently met", "Frequently missed"),
      },
      {
        key: "inventory_method",
        label: "How is fabric/materials inventory managed?",
        options: [
          { value: "software", label: "Digital inventory system", score: 100 },
          { value: "manual_log", label: "Manual log/spreadsheet", score: 60 },
          { value: "none", label: "No formal tracking", score: 10 },
        ],
      },
      {
        key: "quality_control",
        label: "Is there a defined quality-control step before delivery?",
        options: yesNo(),
      },
      {
        key: "supplier_concentration",
        label: "Does the business depend on a single supplier for key fabric/materials?",
        options: [
          { value: "diversified", label: "Multiple suppliers", score: 100 },
          { value: "one_backup", label: "One main supplier, backups identified", score: 60 },
          { value: "single", label: "Single supplier, no backup", score: 20 },
        ],
      },
      {
        key: "equipment_maintenance",
        label: "Is equipment (machines, irons, etc.) on a maintenance schedule?",
        options: yesNo("Scheduled maintenance", "Fixed only when it breaks"),
      },
    ],
  },
  {
    key: "sales_marketing",
    title: "Sales & Marketing Health",
    description: "Sales channels, customer retention and marketing measurement.",
    weight: 15,
    scored: true,
    questions: [
      {
        key: "sales_channels",
        label: "How many active sales channels does the business use?",
        options: [
          { value: "multi", label: "3 or more (shop, social, marketplace, referral)", score: 100 },
          { value: "two", label: "Two channels", score: 60 },
          { value: "one", label: "One channel only", score: 25 },
        ],
      },
      {
        key: "customer_retention_tracking",
        label: "Is repeat/returning customer rate tracked in any form?",
        options: yesNo(),
      },
      {
        key: "marketing_measurement",
        label: "Is marketing spend or activity linked to results (orders, sales)?",
        options: yesNo("Yes, measured", "No, not tracked"),
      },
      {
        key: "pricing_documented",
        label: "Is pricing documented and consistent across staff/channels?",
        options: yesNo(),
      },
    ],
  },
  {
    key: "finance",
    title: "Financial Health",
    description: "Record-keeping, cash flow, receivables and access to finance.",
    weight: 20,
    scored: true,
    questions: [
      {
        key: "formal_records",
        label: "Are financial records kept in a structured, reviewable format (ledger, spreadsheet, accounting software)?",
        options: yesNo("Yes, structured records", "No formal records"),
      },
      {
        key: "cash_flow_monitoring",
        label: "Is cash flow reviewed on a regular schedule (weekly/monthly)?",
        options: yesNo("Regularly reviewed", "Not reviewed"),
      },
      {
        key: "receivables_tracking",
        label: "Are outstanding customer balances (deposits/balances owed) tracked?",
        options: yesNo(),
      },
      {
        key: "access_to_finance",
        label: "Does the business have access to formal credit or financing when needed?",
        options: [
          { value: "yes", label: "Yes, established access", score: 100 },
          { value: "informal", label: "Informal sources only (susu, family)", score: 40 },
          { value: "none", label: "No access", score: 0 },
        ],
      },
    ],
  },
  {
    key: "human_capital",
    title: "Human Capital",
    description: "Staff roles, contracts, training and workforce stability.",
    weight: 10,
    scored: true,
    questions: [
      {
        key: "documented_roles",
        label: "Are staff roles and responsibilities documented?",
        options: yesNo(),
      },
      {
        key: "written_contracts",
        label: "Do staff have written employment terms?",
        options: yesNo(),
      },
      {
        key: "training_provided",
        label: "Is ongoing skills training provided to staff?",
        options: yesNo("Regularly", "Never"),
      },
      {
        key: "turnover_tracked",
        label: "Is staff turnover tracked or reviewed periodically?",
        options: yesNo(),
      },
    ],
  },
  {
    key: "digital",
    title: "Digital Maturity",
    description: "Point of sale, inventory, accounting tools and data backup.",
    weight: 10,
    scored: true,
    questions: [
      {
        key: "pos_system",
        label: "Does the business use a digital point-of-sale / order system?",
        options: yesNo(),
      },
      {
        key: "inventory_software",
        label: "Is inventory tracked with software (vs. paper/memory)?",
        options: yesNo(),
      },
      {
        key: "accounting_software",
        label: "Is accounting/bookkeeping done with software?",
        options: yesNo(),
      },
      {
        key: "data_backup",
        label: "Is business data (orders, customers, financials) backed up off-device?",
        options: yesNo("Yes, cloud/off-site backup", "No backup"),
      },
    ],
  },
  {
    key: "esg",
    title: "Sustainability & ESG",
    description: "Waste, sourcing, worker welfare and resource efficiency.",
    weight: 10,
    scored: true,
    questions: [
      {
        key: "waste_management",
        label: "Is fabric offcut / waste managed responsibly (reuse, recycle, donate)?",
        options: yesNo(),
      },
      {
        key: "responsible_sourcing",
        label: "Are materials sourced with any consideration for supplier labour practices?",
        options: yesNo("Yes, considered", "Not considered"),
      },
      {
        key: "worker_welfare",
        label: "Are basic worker welfare provisions in place (rest breaks, safe workspace)?",
        options: yesNo(),
      },
      {
        key: "energy_water_efficiency",
        label: "Are there any practices to reduce energy/water use in production?",
        options: yesNo("Yes, active practices", "No practices"),
      },
    ],
  },
  {
    key: "apprentices",
    title: "Apprentices & Skills Development",
    description: "Not scored — informs workforce-development recommendations only.",
    weight: 0,
    scored: false,
    questions: [
      {
        key: "active_apprentices",
        label: "Does the business currently train apprentices?",
        options: [
          { value: "yes", label: "Yes", score: 0 },
          { value: "no", label: "No", score: 0 },
        ],
      },
      {
        key: "training_structure",
        label: "Is there a defined training curriculum and duration?",
        options: yesNo(),
      },
      {
        key: "progress_tracking",
        label: "Is apprentice progress tracked against milestones?",
        options: yesNo(),
      },
      {
        key: "compensation_model",
        label: "Is there a documented compensation/incentive model for apprentices?",
        options: yesNo(),
      },
    ],
  },
  {
    key: "freelancers",
    title: "Freelancers & Contractors",
    description: "Not scored — informs workforce-flexibility recommendations only.",
    weight: 0,
    scored: false,
    questions: [
      {
        key: "active_freelancers",
        label: "Does the business currently engage freelancers/contractors?",
        options: [
          { value: "yes", label: "Yes", score: 0 },
          { value: "no", label: "No", score: 0 },
        ],
      },
      {
        key: "contract_terms",
        label: "Do freelancers work under agreed written terms?",
        options: yesNo(),
      },
      {
        key: "payment_terms_standard",
        label: "Are freelancer payment terms standardised (rate, timing)?",
        options: yesNo(),
      },
    ],
  },
];

export const SCORED_DIMENSIONS = DIMENSIONS.filter((d) => d.scored);
export const INFORMATIONAL_DIMENSIONS = DIMENSIONS.filter((d) => !d.scored);

// Sanity check kept close to the data it guards: scored dimension weights
// must sum to 100 or the overall score silently stops meaning "out of 100".
const WEIGHT_SUM = SCORED_DIMENSIONS.reduce((s, d) => s + d.weight, 0);
if (WEIGHT_SUM !== 100 && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn(`[onboarding/sections] scored dimension weights sum to ${WEIGHT_SUM}, expected 100.`);
}
