# Onboarding & Business Health Alignment

What changed, and why, aligning Sewiness with the "Fashion Business
Onboarding & Health" reference module you uploaded.

## What was built

**1. Light identity/compliance step at signup** (`/signup`)
A new "Business Profile" step between *Business & Owner* and *Ghana
Card*: legal entity type (Registrar-General's Department categories),
optional registration number, optional Tax ID/TIN (validated against
GRA's `GHA-XXXXXXXXX-X` format), business category (multi-select chips),
and years in operation. Saved straight onto `organizations` — no new
table needed for something that's set once per business.

**2. Full in-app Business Health Assessment** (`/business-health/assessment`)
A tabbed, autosaving questionnaire across 7 scored dimensions —
Compliance, Operations, Sales & Marketing, Finance, Human Capital,
Digital Maturity, ESG — plus 2 informational-only sections (Apprentices,
Freelancers) that feed recommendations without affecting the score.
Every question is multiple-choice with a documented point value per
option (see `src/lib/onboarding/sections.ts`), not a free-text self-rating
— so the score is auditable and comparable across businesses, which
matters if you ever want to benchmark or export it.

**3. Weighted 0–100 Business Health Score + recommendations**
`src/lib/onboarding/scoring.ts` computes each dimension's score, a
weighted overall score, a band (`Strong` / `Growing` / `Needs Support` /
`High Priority Support`), and prioritised recommendations. Visible to the
business owner (and Manager) on `/business-health`, alongside the
existing transaction-derived score that page already had — the two are
complementary: one reads live orders/payments, the other reads what the
owner tells you about the business itself.

**4. Database** — new migration `017_business_onboarding_health.sql`:
   - `organizations`: `legal_entity_type`, `registration_number`,
     `tax_id`, `business_categories`, `business_age_years`,
     `contact_phone`, `contact_country` (ISO 3166-1 alpha-2).
   - `onboarding_assessments`: one row per assessment version, RLS-scoped
     the same way as every other table (`current_org_id()` /
     `current_role_name()`), with a partial unique index so a business
     only ever has one open draft at a time.

## International-standards choices worth knowing about

- **Legal entity types** use the Registrar-General's Department
  categories — the closest Ghana-specific equivalent of ISO 20275
  ("Entity Legal Form"). If Sewiness ever goes multi-country, swap this
  list for the full ISO 20275 codes and the column keeps working.
- **`contact_country`** is ISO 3166-1 alpha-2 (`GH` today), so the schema
  doesn't need to change to support a second country later.
- **TIN validation** matches GRA's real format, same pattern as the
  existing Ghana Card check.
- **Currency** stays GHS (ISO 4217) throughout, matching the existing
  `numeric(12,2)` convention.
- **Data-privacy question in the assessment** explicitly references the
  Ghana Data Protection Act, 2012 (Act 843).
- Forms use `<fieldset>`/`<legend>`, associated `<label>`s, and
  `aria-pressed` on the category chips for basic accessibility.

## What I deliberately left out (for now)

- Super Admin's `/admin/new` (manual enroll) form still doesn't collect
  the identity/compliance fields — only self-signup does. Businesses
  Super Admin enrolls directly can fill their profile in via the
  assessment once they log in. Say the word if you want it added there
  too for consistency.
- No column-level restriction on Super Admin's read of
  `onboarding_assessments` (Postgres RLS is row-level, not column-level)
  — the UI layer is what keeps Super Admin's view to status/score only,
  matching the existing pattern for `get_business_directory()`. If you
  want a harder guarantee, that needs a `security definer` view/function
  exposing only the safe columns.
- `zod` was added to `package.json` (it wasn't a dependency yet) — run
  `npm install` before your next deploy.

## To deploy

1. Run `supabase/migrations/017_business_onboarding_health.sql` in the
   Supabase SQL editor (additive, safe on the live database).
2. `npm install` (picks up `zod`).
3. Regenerate `src/lib/database.types.ts` against the updated schema:
   `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
4. Deploy as usual.

Full TypeScript project (`npx tsc --noEmit`) passes clean with these
changes. `next build` itself couldn't be verified in this sandbox (no
network access to Google Fonts here), so do a normal `npm run build`
before pushing to Render.
