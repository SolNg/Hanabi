import type { WaiterPageConfig } from './types';

export const defaultWaiterPageConfig: WaiterPageConfig = {
  customer: {
    customerNamePool: ['Khách đã đặt lịch', 'Khách quen gần đây', 'Khách ở trọ', 'Khách lần đầu đến tiệm'],
    customerMinAge: 20,
    customerMaxAge: 55,
    defaultBudget: 500,
    randomBudgetRange: 260,
    returningCustomerChance: 0.24,
    nominationChance: 0.18,
  },
  income: {
    defaultDailySalary: 620,
    defaultStandardStoreRevenue: 300,
    defaultTip: 0,
    defaultExtraServiceIncome: 0,
    nominationShareRate: 1,
  },
};
