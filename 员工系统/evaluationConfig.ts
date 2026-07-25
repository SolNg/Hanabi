import type { EvaluationConfig } from './types';

export const defaultEvaluationConfig: EvaluationConfig = {
  storeTrafficRules: [
    { minAverageScore: 95, trafficMultiplier: 1.35 },
    { minAverageScore: 90, trafficMultiplier: 1.22 },
    { minAverageScore: 80, trafficMultiplier: 1.1 },
    { minAverageScore: 70, trafficMultiplier: 1 },
    { minAverageScore: 60, trafficMultiplier: 0.88 },
    { minAverageScore: 0, trafficMultiplier: 0.72 },
  ],
  projectTrafficRules: [
    { minAverageScore: 95, trafficMultiplier: 1.3 },
    { minAverageScore: 90, trafficMultiplier: 1.18 },
    { minAverageScore: 80, trafficMultiplier: 1.08 },
    { minAverageScore: 70, trafficMultiplier: 1 },
    { minAverageScore: 60, trafficMultiplier: 0.9 },
    { minAverageScore: 0, trafficMultiplier: 0.78 },
  ],
  employeeGradeRules: [
    { grade: 'SSS', minAverageScore: 97, minReviewCount: 40, minNominationRate: 0.72 },
    { grade: 'SS', minAverageScore: 94, minReviewCount: 28, minNominationRate: 0.62 },
    { grade: 'S', minAverageScore: 90, minReviewCount: 18, minNominationRate: 0.5 },
    { grade: 'A', minAverageScore: 84, minReviewCount: 10, minNominationRate: 0.36 },
    { grade: 'B', minAverageScore: 76, minReviewCount: 6, minNominationRate: 0.22 },
    { grade: 'C', minAverageScore: 66, minReviewCount: 3, minNominationRate: 0.08 },
    { grade: 'D', minAverageScore: 0, minReviewCount: 0, minNominationRate: 0 },
  ],
  employeeGradeChangeCooldownReviews: 5,
  repeatedNominationPreferenceStep: 0.08,
  repeatedNominationPreferenceCap: 0.4,
};
