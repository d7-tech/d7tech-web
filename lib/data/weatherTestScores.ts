/**
 * How the pre-trained LightGBM models scored before going live: skill (% lower error than "No change")
 * on the last 6 months (2026-01-27 .. 2026-07-27) of 12-13 nearby Weather Underground stations,
 * which neither model saw in training. Rain chance uses the Brier score, the others mean absolute error.
 * Source: test_scores in single_lgbm_regional.json and hybrid_lgbm_regional.json (LakeLink Colab notebooks).
 */
export const TEST_SCORES: Record<'wind_ms' | 'gust_ms' | 'rain_prob' | 'rain_mm', Record<1 | 6 | 24, { 'single-lgbm': number; 'hybrid-lgbm': number; nwp: number }>> = {
  wind_ms: { 1: { 'single-lgbm': -5.7, 'hybrid-lgbm': -3.8, nwp: -341.3 }, 6: { 'single-lgbm': 27.9, 'hybrid-lgbm': 46.9, nwp: -66.1 }, 24: { 'single-lgbm': 11.3, 'hybrid-lgbm': 39.5, nwp: -70.7 } },
  gust_ms: { 1: { 'single-lgbm': -1.8, 'hybrid-lgbm': 0.6, nwp: -154.8 }, 6: { 'single-lgbm': 30.6, 'hybrid-lgbm': 51.0, nwp: 0.6 }, 24: { 'single-lgbm': 14.3, 'hybrid-lgbm': 45.1, nwp: -1.3 } },
  rain_prob: { 1: { 'single-lgbm': 26.3, 'hybrid-lgbm': 25.8, nwp: -95.9 }, 6: { 'single-lgbm': 35.4, 'hybrid-lgbm': 51.9, nwp: -10.4 }, 24: { 'single-lgbm': 41.6, 'hybrid-lgbm': 57.5, nwp: 10.4 } },
  rain_mm: { 1: { 'single-lgbm': -15.6, 'hybrid-lgbm': -8.4, nwp: -3.1 }, 6: { 'single-lgbm': 7.3, 'hybrid-lgbm': 25.6, nwp: 33.6 }, 24: { 'single-lgbm': 17.1, 'hybrid-lgbm': 32.0, nwp: 39.0 } },
};
