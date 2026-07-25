import type { BusinessOperationConfig } from '../员工系统/types';

export const defaultBusinessOperationConfig: BusinessOperationConfig = {
  traffic: {
    baseCustomerCount: 4,
    randomCustomerCount: 4,
    maxCustomerCount: 14,
    customerMinAge: 20,
    customerMaxAge: 55,
    returningCustomerChance: 0.28,
    nominationChance: 0.32,
    trafficMultiplierWeight: 1,
    defaultPatienceMinutes: 60,
    defaultExpectedBudget: 500,
  },
  serviceProjects: {
    服务项目占位: {
      job: '服务项目占位',
      displayName: 'Dự án dịch vụ (placeholder)',
      enabled: true,
      baseDemandWeight: 1,
      defaultSceneKey: '场景占位',
      baseDurationMinutes: 60,
      baseSatisfaction: 72,
      defaultConsumableExpense: 0,
      allowsStoryScene: true,
    },
  },
  scenePriceAdjustment: {
    场景占位: 0,
  },
  customerNamePool: [
    'Khách A',
    'Khách B',
    'Khách C',
    'Khách quen số 1',
    'Khách quen số 2',
    'Lữ khách số 1',
    'Lữ khách số 2',
    'Cư dân gần đó',
  ],
  order: {
    requireActiveEmployeeForService: true,
    autoAssignNominatedEmployeeFirst: true,
  },
  evaluation: {
    baseStoreScore: 72,
    satisfactionScoreWeight: 0.75,
    nominatedEmployeeBonus: 4,
    randomScoreSwing: 6,
  },
};
