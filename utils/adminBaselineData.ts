import { ExpenseAccount, SalaryRecord, ExpenseTransaction } from '../types/expense';

export const ADMIN_BASELINE_ACCOUNTS: ExpenseAccount[] = [
  {
    id: 'acc_admin_cash',
    userId: 'admin',
    name: 'Cash',
    type: 'cash',
    isSavings: false,
    openingBalance: 0,
    color: '#10B981',
    icon: 'Banknote',
    notes: 'Physical cash in hand',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'acc_admin_canara',
    userId: 'admin',
    name: 'Canara Bank',
    type: 'bank',
    isSavings: false,
    openingBalance: 0,
    color: '#0EA5E9',
    icon: 'Landmark',
    notes: 'Primary salary and spending account',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'acc_admin_federal',
    userId: 'admin',
    name: 'Federal bank',
    type: 'bank',
    isSavings: true,
    openingBalance: 0,
    color: '#8B5CF6',
    icon: 'PiggyBank',
    notes: 'Dedicated savings & emergency vault',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'acc_admin_sbi',
    userId: 'admin',
    name: 'SBI',
    type: 'bank',
    isSavings: false,
    openingBalance: 0,
    color: '#EC4899',
    icon: 'Landmark',
    notes: 'Secondary bank account',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const ADMIN_BASELINE_SALARY: SalaryRecord[] = [
  {
    id: 'sal_admin_nov2026',
    userId: 'admin',
    monthYear: '2026-11',
    baseSalary: 0,
    bonus: 0,
    incentive: 0,
    otherIncome: 10000,
    totalIncome: 10000,
    accountId: 'acc_admin_canara',
    receivedDate: '2026-11-01',
    note: 'Monthly Salary received',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const ADMIN_BASELINE_TRANSACTIONS: ExpenseTransaction[] = [
  {
    id: 'tx_admin_sip',
    userId: 'admin',
    type: 'expense',
    title: 'SIP',
    amount: 1500,
    categoryId: 'cat_sip',
    accountId: 'acc_admin_canara',
    date: '2026-11-16',
    createdAt: '2026-11-16T10:00:00.000Z',
    updatedAt: '2026-11-16T10:00:00.000Z',
  },
  {
    id: 'tx_admin_savings',
    userId: 'admin',
    type: 'transfer',
    title: 'Savings',
    amount: 4000,
    categoryId: 'transfer',
    transferCategory: 'savings',
    isDedicatedSavings: true,
    accountId: 'acc_admin_canara',
    toAccountId: 'acc_admin_federal',
    date: '2026-11-14',
    description: 'Federal bank',
    createdAt: '2026-11-14T12:00:00.000Z',
    updatedAt: '2026-11-14T12:00:00.000Z',
  },
  {
    id: 'tx_admin_popcorn',
    userId: 'admin',
    type: 'expense',
    title: 'Popcorn',
    amount: 200,
    categoryId: 'cat_default_1',
    subcategory: 'Snacks',
    accountId: 'acc_admin_canara',
    date: '2026-11-14',
    createdAt: '2026-11-14T18:00:00.000Z',
    updatedAt: '2026-11-14T18:00:00.000Z',
  },
  {
    id: 'tx_admin_mov1',
    userId: 'admin',
    type: 'expense',
    title: 'Movie- ramayana',
    amount: 180,
    categoryId: 'cat_default_8',
    subcategory: 'Movies',
    accountId: 'acc_admin_canara',
    date: '2026-11-13',
    createdAt: '2026-11-13T19:00:00.000Z',
    updatedAt: '2026-11-13T19:00:00.000Z',
  },
  {
    id: 'tx_admin_baji',
    userId: 'admin',
    type: 'expense',
    title: 'Bajikada',
    amount: 59,
    categoryId: 'cat_default_1',
    subcategory: 'Snacks',
    accountId: 'acc_admin_canara',
    date: '2026-11-12',
    createdAt: '2026-11-12T17:00:00.000Z',
    updatedAt: '2026-11-12T17:00:00.000Z',
  },
  {
    id: 'tx_admin_mov2',
    userId: 'admin',
    type: 'expense',
    title: 'Movie - scene',
    amount: 165,
    categoryId: 'cat_default_8',
    subcategory: 'Movies',
    accountId: 'acc_admin_canara',
    date: '2026-11-11',
    createdAt: '2026-11-11T20:00:00.000Z',
    updatedAt: '2026-11-11T20:00:00.000Z',
  },
  {
    id: 'tx_admin_turf',
    userId: 'admin',
    type: 'expense',
    title: 'turf',
    amount: 81,
    categoryId: 'cat_default_8',
    subcategory: 'Games',
    accountId: 'acc_admin_canara',
    date: '2026-11-11',
    createdAt: '2026-11-11T21:00:00.000Z',
    updatedAt: '2026-11-11T21:00:00.000Z',
  },
  {
    id: 'tx_admin_dosa',
    userId: 'admin',
    type: 'expense',
    title: 'masaladosa',
    amount: 98,
    categoryId: 'cat_default_1',
    subcategory: 'Lunch',
    accountId: 'acc_admin_canara',
    date: '2026-11-10',
    createdAt: '2026-11-10T13:00:00.000Z',
    updatedAt: '2026-11-10T13:00:00.000Z',
  },
  {
    id: 'tx_admin_petrol',
    userId: 'admin',
    type: 'expense',
    title: 'Petrol',
    amount: 250,
    categoryId: 'cat_default_2',
    subcategory: 'Fuel',
    accountId: 'acc_admin_canara',
    date: '2026-11-08',
    createdAt: '2026-11-08T09:00:00.000Z',
    updatedAt: '2026-11-08T09:00:00.000Z',
  },
  {
    id: 'tx_admin_dinner',
    userId: 'admin',
    type: 'expense',
    title: 'Dinner',
    amount: 320,
    categoryId: 'cat_default_1',
    subcategory: 'Dinner',
    accountId: 'acc_admin_canara',
    date: '2026-11-06',
    createdAt: '2026-11-06T20:30:00.000Z',
    updatedAt: '2026-11-06T20:30:00.000Z',
  },
  {
    id: 'tx_admin_groc',
    userId: 'admin',
    type: 'expense',
    title: 'Groceries',
    amount: 447,
    categoryId: 'cat_default_1',
    accountId: 'acc_admin_canara',
    date: '2026-11-05',
    createdAt: '2026-11-05T16:00:00.000Z',
    updatedAt: '2026-11-05T16:00:00.000Z',
  },
  {
    id: 'tx_admin_bus',
    userId: 'admin',
    type: 'expense',
    title: 'Bus ticket',
    amount: 50,
    categoryId: 'cat_default_2',
    subcategory: 'Bus',
    accountId: 'acc_admin_canara',
    date: '2026-11-03',
    createdAt: '2026-11-03T08:00:00.000Z',
    updatedAt: '2026-11-03T08:00:00.000Z',
  },
  {
    id: 'tx_admin_coffee',
    userId: 'admin',
    type: 'expense',
    title: 'Coffee',
    amount: 60,
    categoryId: 'cat_default_1',
    subcategory: 'Cafe',
    accountId: 'acc_admin_canara',
    date: '2026-11-02',
    createdAt: '2026-11-02T16:00:00.000Z',
    updatedAt: '2026-11-02T16:00:00.000Z',
  },
  {
    id: 'tx_admin_snacks',
    userId: 'admin',
    type: 'expense',
    title: 'Snacks',
    amount: 40,
    categoryId: 'cat_default_1',
    subcategory: 'Snacks',
    accountId: 'acc_admin_canara',
    date: '2026-11-01',
    createdAt: '2026-11-01T17:00:00.000Z',
    updatedAt: '2026-11-01T17:00:00.000Z',
  },
  {
    id: 'tx_admin_salary_income',
    userId: 'admin',
    type: 'income',
    title: 'Monthly Salary (November 2026)',
    amount: 10000,
    categoryId: 'salary',
    accountId: 'acc_admin_canara',
    salaryRecordId: 'sal_admin_nov2026',
    date: '2026-11-01',
    description: 'Salary, bonus & incentives for November 2026',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

/**
 * Returns user-scoped baseline accounts with IDs and ownership mapped to the specific user.
 */
export const getBaselineAccountsForUser = (userId: string = 'admin'): ExpenseAccount[] => {
  const uid = userId && userId !== 'default' && userId !== 'unauthenticated' ? userId : 'admin';
  return ADMIN_BASELINE_ACCOUNTS.map((acc) => ({
    ...acc,
    id: acc.id.replace('acc_admin_', `acc_${uid}_`),
    userId: uid,
  }));
};

/**
 * Returns user-scoped baseline salary record for November 2026.
 * Automatically binds to user's Canara Bank account.
 */
export const getBaselineSalaryForUser = (
  userId: string = 'admin',
  existingAccounts?: ExpenseAccount[]
): SalaryRecord[] => {
  const uid = userId && userId !== 'default' && userId !== 'unauthenticated' ? userId : 'admin';
  const canaraAcc = existingAccounts?.find((a) => a.name.toLowerCase().includes('canara'));
  const canaraId = canaraAcc?.id || `acc_${uid}_canara`;

  return ADMIN_BASELINE_SALARY.map((sal) => ({
    ...sal,
    id: sal.id.replace('sal_admin_', `sal_${uid}_`),
    userId: uid,
    accountId: canaraId,
  }));
};

/**
 * Returns user-scoped baseline transactions (15 items) totaling ₹3,450 net expenses + ₹4,000 vault savings.
 * Automatically binds to user's Canara Bank, Federal Bank, and November 2026 salary record.
 */
export const getBaselineTransactionsForUser = (
  userId: string = 'admin',
  existingAccounts?: ExpenseAccount[]
): ExpenseTransaction[] => {
  const uid = userId && userId !== 'default' && userId !== 'unauthenticated' ? userId : 'admin';
  const canaraAcc = existingAccounts?.find((a) => a.name.toLowerCase().includes('canara'));
  const federalAcc = existingAccounts?.find((a) => a.name.toLowerCase().includes('federal'));

  const canaraId = canaraAcc?.id || `acc_${uid}_canara`;
  const federalId = federalAcc?.id || `acc_${uid}_federal`;
  const salaryId = `sal_${uid}_nov2026`;

  return ADMIN_BASELINE_TRANSACTIONS.map((tx) => ({
    ...tx,
    id: tx.id.replace('tx_admin_', `tx_${uid}_`),
    userId: uid,
    accountId:
      tx.accountId === 'acc_admin_canara'
        ? canaraId
        : tx.accountId.replace('acc_admin_', `acc_${uid}_`),
    toAccountId:
      tx.toAccountId === 'acc_admin_federal'
        ? federalId
        : tx.toAccountId
        ? tx.toAccountId.replace('acc_admin_', `acc_${uid}_`)
        : undefined,
    salaryRecordId: tx.salaryRecordId ? salaryId : undefined,
  }));
};

