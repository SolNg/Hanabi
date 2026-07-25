import type { CustomerPageConfig } from './types';

export const defaultCustomerPageConfig: CustomerPageConfig = {
  work: {
    defaultDailyIncome: 300,
    randomIncomeRange: 120,
    minDailyIncome: 120,
    maxDailyIncome: 800,
  },
  payment: {
    allowSavingsFallback: true,
  },
  contact: {
    acceptScoreThreshold: 100,
    nominationScore: 28,
    tipScorePerCurrency: 0.08,
    spendingScorePerCurrency: 0.03,
    ratingScoreWeight: 0.45,
    repeatedRequestPenalty: 18,
  },
  promotions: [],
};
