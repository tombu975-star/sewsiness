import { z } from "zod";
import { LEGAL_ENTITY_TYPES, TIN_PATTERN } from "./identity";

// Light identity/compliance step, collected at signup. Registration
// number and Tax ID are intentionally optional — many micro/informal
// businesses genuinely don't have them yet, and forcing the field would
// just produce fake data. Their absence is itself a compliance signal
// picked up later by the in-app assessment.
export const businessProfileSchema = z.object({
  legalEntityType: z.enum(LEGAL_ENTITY_TYPES, {
    errorMap: () => ({ message: "Please select a business type." }),
  }),
  registrationNumber: z.string().trim().max(60).optional().or(z.literal("")),
  taxId: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || TIN_PATTERN.test(v), {
      message: "Tax ID (TIN) should look like GHA-123456789-0, or leave it blank.",
    }),
  categories: z.array(z.string()).min(1, "Select at least one business category."),
  businessAgeYears: z
    .number({ invalid_type_error: "Enter a number of years." })
    .min(0, "Business age can't be negative.")
    .max(150, "That doesn't look right — check the number of years."),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

// A single assessment answer set: { [dimensionKey]: { [questionKey]: optionValue } }.
// Validated loosely here (shape only) — the option values themselves are
// checked against the live question bank in scoring.ts, so this schema
// doesn't need to duplicate that source of truth and go stale.
export const assessmentAnswersSchema = z.record(z.record(z.string()));
