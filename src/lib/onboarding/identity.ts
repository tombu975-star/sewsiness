// Reference lists for the light identity & compliance step collected at
// signup (src/app/signup/SignupForm.tsx). Kept separate from the fuller
// in-app assessment (./sections.ts) since these are set once and rarely
// change, vs. the assessment which is re-taken periodically.

// Ghana Registrar-General's Department entity categories — the closest
// local equivalent of an ISO 20275 "Entity Legal Form" list. If Sewiness
// ever expands beyond Ghana, swap this for the full ISO 20275 ELF code
// list and key organizations.legal_entity_type off the ELF code instead
// of the label.
export const LEGAL_ENTITY_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company",
  "Registered Cooperative",
  "Informal / Unregistered",
] as const;

export type LegalEntityType = (typeof LEGAL_ENTITY_TYPES)[number];

export const BUSINESS_CATEGORIES = [
  "Bespoke Tailoring",
  "Ready-to-Wear",
  "Alterations & Repairs",
  "Fabric & Textile Retail",
  "Textile Manufacturing",
  "Fashion Design",
  "Embroidery / Beading",
  "Other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

// ISO 3166-1 alpha-2. Only Ghana is offered today (Sewiness is a
// single-country product) — the column and validation already accept any
// alpha-2 code so this list can grow without a schema change.
export const SUPPORTED_COUNTRIES = [{ code: "GH", label: "Ghana" }] as const;

// Ghana Revenue Authority TIN format: GHA + 9 digits + 1 check digit,
// e.g. GHA-123456789-0 (mirrors the Ghana Card pattern already validated
// in src/app/signup/actions.ts). Optional field — many micro/informal
// businesses won't have one yet, which is itself a compliance signal.
export const TIN_PATTERN = /^GHA-\d{9}-\d$/i;

// E.164 international phone format (+233241234567). Loose but real.
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
