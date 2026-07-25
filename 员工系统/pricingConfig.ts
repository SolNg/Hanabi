import type { ServicePricingConfig } from './types';

export const defaultServicePricingConfig: ServicePricingConfig = {
  gradeNominationFee: {
    D: 30,
    C: 60,
    B: 120,
    A: 220,
    S: 420,
    SS: 800,
    SSS: 1500,
    隐藏: 0,
  },
  jobBasePrice: {
    服务项目占位: 0,
  },
  scenePriceAdjustment: {},
  salaryMotivationSatisfactionAdjustment: {
    低薪敷衍: -18,
    正常工作: 0,
    积极卖力: 8,
    高度投入: 14,
  },
  defaultConsumableExpense: 20,
  defaultTip: 0,
};
