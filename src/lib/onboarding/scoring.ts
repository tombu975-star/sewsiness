import { DIMENSIONS, SCORED_DIMENSIONS, type Dimension } from "./sections";

export type Answers = Record<string, Record<string, string>>; // { [dimensionKey]: { [questionKey]: optionValue } }
export type DimensionScores = Record<string, number>; // 0-100 per dimension key (scored dimensions only)

export function scoreDimension(dimension: Dimension, answers: Answers[string] | undefined): number | null {
  if (!answers) return null;
  const points: number[] = [];
  for (const q of dimension.questions) {
    const chosen = answers[q.key];
    const opt = q.options.find((o) => o.value === chosen);
    if (opt) points.push(opt.score);
  }
  if (points.length === 0) return null;
  return Math.round(points.reduce((a, b) => a + b, 0) / points.length);
}

export function scoreAllDimensions(answers: Answers): DimensionScores {
  const scores: DimensionScores = {};
  for (const dim of SCORED_DIMENSIONS) {
    const s = scoreDimension(dim, answers[dim.key]);
    if (s !== null) scores[dim.key] = s;
  }
  return scores;
}

// Weighted overall score. Dimensions with no answers yet are excluded
// from both the numerator and the weight base, so a partially-completed
// assessment still yields a meaningful (if provisional) score rather than
// being dragged down by unanswered sections defaulting to 0.
export function weightedHealthScore(scores: DimensionScores): number {
  let weightedSum = 0;
  let weightBase = 0;
  for (const dim of SCORED_DIMENSIONS) {
    const s = scores[dim.key];
    if (typeof s === "number") {
      weightedSum += Math.max(0, Math.min(100, s)) * dim.weight;
      weightBase += dim.weight;
    }
  }
  if (weightBase === 0) return 0;
  return Math.round(weightedSum / weightBase);
}

export function healthBand(score: number): { label: string; level: "green" | "amber" | "red" } {
  if (score >= 80) return { label: "Strong", level: "green" };
  if (score >= 65) return { label: "Growing", level: "green" };
  if (score >= 50) return { label: "Needs Support", level: "amber" };
  return { label: "High Priority Support", level: "red" };
}

export type Recommendation = { dimension: string; dimensionTitle: string; priority: "high" | "medium"; action: string };

const DIMENSION_ACTIONS: Record<string, string> = {
  compliance: "Complete business registration, bring tax filings up to date, and secure required local permits.",
  finance: "Introduce formal financial record-keeping and a regular cash-flow review routine.",
  operations: "Formalise production scheduling, inventory tracking and a pre-delivery quality-control step.",
  sales_marketing: "Diversify sales channels and start tracking customer retention and marketing results.",
  human_capital: "Document staff roles, put employment terms in writing, and plan regular skills training.",
  digital: "Adopt digital point-of-sale, inventory and accounting tools, with off-device data backup.",
  esg: "Establish waste-reduction, responsible-sourcing and worker-welfare practices.",
};

export function recommendations(scores: DimensionScores): Recommendation[] {
  const items: Recommendation[] = [];
  for (const dim of SCORED_DIMENSIONS) {
    const score = scores[dim.key];
    if (typeof score !== "number") continue;
    if (score < 50) {
      items.push({ dimension: dim.key, dimensionTitle: dim.title, priority: "high", action: DIMENSION_ACTIONS[dim.key] });
    } else if (score < 65) {
      items.push({ dimension: dim.key, dimensionTitle: dim.title, priority: "medium", action: DIMENSION_ACTIONS[dim.key] });
    }
  }
  // High-priority gaps first, so the owner sees what matters most at a glance.
  return items.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));
}

export function completionPercent(answers: Answers): number {
  let answered = 0;
  let total = 0;
  for (const dim of DIMENSIONS) {
    for (const q of dim.questions) {
      total += 1;
      if (answers[dim.key]?.[q.key]) answered += 1;
    }
  }
  return total === 0 ? 0 : Math.round((answered / total) * 100);
}
