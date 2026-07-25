import { defaultEvaluationConfig } from './evaluationConfig';
import type {
  CustomerEvaluationInput,
  CustomerPreferenceStats,
  EmployeeEvaluationStats,
  EmployeeJobType,
  EmployeeSystemEffect,
  EmployeeSystemResult,
  EmployeeSystemState,
  EvaluationConfig,
  ServiceProjectEvaluationStats,
  StoreEvaluationStats,
} from './types';

function cloneState(state: EmployeeSystemState): EmployeeSystemState {
  return structuredClone(state);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function createStoreEvaluationStats(): StoreEvaluationStats {
  return {
    reviewCount: 0,
    totalScore: 0,
    averageScore: 0,
    trafficMultiplier: 1,
  };
}

function createProjectEvaluationStats(job: EmployeeJobType): ServiceProjectEvaluationStats {
  return {
    job,
    reviewCount: 0,
    totalScore: 0,
    averageScore: 0,
    trafficMultiplier: 1,
  };
}

function createEmployeeEvaluationStats(employeeId: string, marketGrade: EmployeeEvaluationStats['marketGrade']): EmployeeEvaluationStats {
  return {
    employeeId,
    reviewCount: 0,
    totalScore: 0,
    averageScore: 0,
    nominationCount: 0,
    nominationRate: 0,
    marketGrade,
    lastGradeChangedReviewCount: 0,
  };
}

function createCustomerPreferenceStats(customerName: string): CustomerPreferenceStats {
  return {
    customerName,
    visitCount: 0,
    nominatedEmployeeCounts: {},
    projectCounts: {},
  };
}

function calculateTrafficMultiplier(
  averageScore: number,
  rules: Array<{ minAverageScore: number; trafficMultiplier: number }>,
): number {
  const matched = rules.find(rule => averageScore >= rule.minAverageScore);
  return matched?.trafficMultiplier ?? 1;
}

export function calculateStoreTrafficMultiplier(averageScore: number, config: EvaluationConfig = defaultEvaluationConfig): number {
  return calculateTrafficMultiplier(averageScore, config.storeTrafficRules);
}

export function calculateProjectTrafficMultiplier(
  averageScore: number,
  config: EvaluationConfig = defaultEvaluationConfig,
): number {
  return calculateTrafficMultiplier(averageScore, config.projectTrafficRules);
}

export function calculateEmployeeMarketGrade(
  stats: EmployeeEvaluationStats,
  config: EvaluationConfig = defaultEvaluationConfig,
): EmployeeEvaluationStats['marketGrade'] {
  const matched = config.employeeGradeRules.find(rule => {
    return (
      stats.averageScore >= rule.minAverageScore &&
      stats.reviewCount >= rule.minReviewCount &&
      stats.nominationRate >= rule.minNominationRate
    );
  });
  return matched?.grade ?? 'D';
}

export function getTotalCustomerTrafficMultiplier(state: EmployeeSystemState): number {
  return state.storeEvaluation.trafficMultiplier;
}

export function getProjectCustomerTrafficMultiplier(state: EmployeeSystemState, job: EmployeeJobType): number {
  return state.projectEvaluations[job]?.trafficMultiplier ?? 1;
}

export function getCombinedCustomerTrafficMultiplier(state: EmployeeSystemState, job: EmployeeJobType): number {
  return getTotalCustomerTrafficMultiplier(state) * getProjectCustomerTrafficMultiplier(state, job);
}

export function getEmployeeNominationRate(state: EmployeeSystemState, employeeId: string): number {
  return state.employeeEvaluations[employeeId]?.nominationRate ?? 0;
}

export function getCustomerEmployeePreferenceMultiplier(
  state: EmployeeSystemState,
  customerName: string,
  employeeId: string,
  config: EvaluationConfig = defaultEvaluationConfig,
): number {
  const nominationCount = state.customerPreferences[customerName]?.nominatedEmployeeCounts[employeeId] ?? 0;
  const bonus = Math.min(nominationCount * config.repeatedNominationPreferenceStep, config.repeatedNominationPreferenceCap);
  return 1 + bonus;
}

export function recordCustomerEvaluation(
  state: EmployeeSystemState,
  input: CustomerEvaluationInput,
  config: EvaluationConfig = defaultEvaluationConfig,
): EmployeeSystemResult {
  const next = cloneState(state);
  const effects: EmployeeSystemEffect[] = [];

  const storeStats = next.storeEvaluation ?? createStoreEvaluationStats();
  storeStats.reviewCount += 1;
  storeStats.totalScore += clampScore(input.storeScore);
  storeStats.averageScore = storeStats.totalScore / storeStats.reviewCount;
  storeStats.trafficMultiplier = calculateStoreTrafficMultiplier(storeStats.averageScore, config);
  next.storeEvaluation = storeStats;

  const customerPreference = next.customerPreferences[input.customerName] ?? createCustomerPreferenceStats(input.customerName);
  customerPreference.visitCount += 1;
  customerPreference.lastVisitedAt = input.businessDate;

  for (const projectEvaluation of input.projectEvaluations) {
    const projectStats =
      next.projectEvaluations[projectEvaluation.job] ?? createProjectEvaluationStats(projectEvaluation.job);
    projectStats.reviewCount += 1;
    projectStats.totalScore += clampScore(projectEvaluation.score);
    projectStats.averageScore = projectStats.totalScore / projectStats.reviewCount;
    projectStats.trafficMultiplier = calculateProjectTrafficMultiplier(projectStats.averageScore, config);
    next.projectEvaluations[projectEvaluation.job] = projectStats;

    customerPreference.projectCounts[projectEvaluation.job] = (customerPreference.projectCounts[projectEvaluation.job] ?? 0) + 1;
  }

  for (const evaluation of input.employeeEvaluations) {
    const employee = next.employees[evaluation.employeeId];
    if (!employee) {
      effects.push({
        type: 'note',
        message: `Bỏ qua ghi nhận đánh giá do nhân viên không xác định: ${evaluation.employeeId}`,
      });
      continue;
    }

    const employeeStats =
      next.employeeEvaluations[evaluation.employeeId] ??
      createEmployeeEvaluationStats(evaluation.employeeId, employee.profile.marketGrade);

    employeeStats.reviewCount += 1;
    employeeStats.totalScore += clampScore(evaluation.score);
    employeeStats.averageScore = employeeStats.totalScore / employeeStats.reviewCount;
    employeeStats.nominationCount += evaluation.nominated ? 1 : 0;
    employeeStats.nominationRate = employeeStats.nominationCount / employeeStats.reviewCount;

    const nextGrade = calculateEmployeeMarketGrade(employeeStats, config);
    const canChangeGrade =
      nextGrade === employeeStats.marketGrade ||
      employeeStats.reviewCount - employeeStats.lastGradeChangedReviewCount >= config.employeeGradeChangeCooldownReviews;

    if (canChangeGrade && nextGrade !== employeeStats.marketGrade) {
      employeeStats.marketGrade = nextGrade;
      employeeStats.lastGradeChangedReviewCount = employeeStats.reviewCount;
      employeeStats.lastGradeChangedAt = input.businessDate;
      employee.profile.marketGrade = nextGrade;
    }

    next.employeeEvaluations[evaluation.employeeId] = employeeStats;

    if (evaluation.nominated) {
      customerPreference.nominatedEmployeeCounts[evaluation.employeeId] =
        (customerPreference.nominatedEmployeeCounts[evaluation.employeeId] ?? 0) + 1;
    }

    effects.push({
      type: 'note',
      message: `Đã cập nhật đánh giá nhân viên: ${employee.profile.name} / điểm TB tổng ${employeeStats.averageScore.toFixed(1)} / tỷ lệ chỉ định ${(
        employeeStats.nominationRate * 100
      ).toFixed(1)}% / đánh giá trong tiệm ${employeeStats.marketGrade}`,
    });
  }

  next.customerPreferences[input.customerName] = customerPreference;

  effects.push({
    type: 'note',
    message: `Đã cập nhật đánh giá tổng của tiệm: điểm TB tổng ${storeStats.averageScore.toFixed(1)} / hệ số tỷ lệ vào khách ${storeStats.trafficMultiplier}`,
  });

  return { state: next, effects };
}
