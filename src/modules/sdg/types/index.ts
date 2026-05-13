/** FR-SDG-001/002/003 — Cross-cutting indicator framework. */

export type SdgCode = 'SDG_1' | 'SDG_4' | 'SDG_8' | 'SDG_16';

export const SDG_LABELS: Record<SdgCode, string> = {
  SDG_1: 'SDG 1 — No Poverty',
  SDG_4: 'SDG 4 — Quality Education',
  SDG_8: 'SDG 8 — Decent Work & Growth',
  SDG_16: 'SDG 16 — Strong Institutions',
};

export type IndicatorKey =
  | 'BURSARY_RETENTION'        // SDG 4
  | 'INCOME_IMPROVEMENT'       // SDG 1
  | 'JOBS_CREATED'             // SDG 8
  | 'TRANSPARENCY_BENCHMARK';  // SDG 16

export interface SdgIndicatorDef {
  key: IndicatorKey;
  sdg: SdgCode;
  label: string;
  unit: string;
  /** Higher is better when true; if false, lower is better. */
  higherIsBetter: boolean;
}

export const SDG_INDICATORS: SdgIndicatorDef[] = [
  { key: 'BURSARY_RETENTION', sdg: 'SDG_4', label: '% Increase in retention via bursaries', unit: '%', higherIsBetter: true },
  { key: 'INCOME_IMPROVEMENT', sdg: 'SDG_1', label: '% Households reporting improved income', unit: '%', higherIsBetter: true },
  { key: 'JOBS_CREATED', sdg: 'SDG_8', label: 'Decent jobs created (sum)', unit: 'jobs', higherIsBetter: true },
  { key: 'TRANSPARENCY_BENCHMARK', sdg: 'SDG_16', label: '% Constituencies meeting transparency benchmarks', unit: '%', higherIsBetter: true },
];

export interface SdgTarget {
  id: string;
  fiscalYear: string;
  indicatorKey: IndicatorKey;
  baseline: number;
  target: number;
  /** % thresholds vs target where light flips (default 50/80). */
  amberThresholdPct: number;
  greenThresholdPct: number;
  setBy: string;
  setAt: string;
}

export interface SdgEvaluation {
  indicator: SdgIndicatorDef;
  fiscalYear: string;
  target: SdgTarget | null;
  current: number;
  /** progress / target × 100 */
  progressPct: number;
  light: 'RED' | 'AMBER' | 'GREEN' | 'UNSET';
}
