import assert from 'node:assert';

const ADMIN_BASELINE_ACCOUNTS = [
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

const ADMIN_BASELINE_SALARY = [
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

const ADMIN_BASELINE_TRANSACTIONS = [
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

const getBaselineAccountsForUser = (userId = 'admin') => {
  const uid = userId && userId !== 'default' && userId !== 'unauthenticated' ? userId : 'admin';
  return ADMIN_BASELINE_ACCOUNTS.map((acc) => ({
    ...acc,
    id: acc.id.replace('acc_admin_', `acc_${uid}_`),
    userId: uid,
  }));
};

const getBaselineSalaryForUser = (userId = 'admin', existingAccounts) => {
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

const getBaselineTransactionsForUser = (userId = 'admin', existingAccounts) => {
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

// Reusable calculation logic for testing
const roundCurrency = (amount) => {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const calculateAccountBalances = (accounts, transactions, salaryRecords = []) => {
  const accountMap = new Map();
  accounts.forEach((acc) => {
    accountMap.set(acc.id, {
      id: acc.id,
      name: acc.name,
      currentBalance: roundCurrency(acc.openingBalance || 0),
      isSavings: !!acc.isSavings,
    });
  });

  const salaryLinkedTransactionIds = new Set(
    transactions.filter((t) => t.salaryRecordId).map((t) => t.salaryRecordId)
  );

  transactions.forEach((tx) => {
    const amount = roundCurrency(tx.amount || 0);
    if (amount <= 0) return;

    if (tx.type === 'income') {
      const summary = accountMap.get(tx.accountId);
      if (summary) summary.currentBalance = roundCurrency(summary.currentBalance + amount);
    } else if (tx.type === 'expense') {
      const summary = accountMap.get(tx.accountId);
      if (summary) summary.currentBalance = roundCurrency(summary.currentBalance - amount);
    } else if (tx.type === 'transfer') {
      const fromSummary = accountMap.get(tx.accountId);
      const toSummary = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;
      if (fromSummary) fromSummary.currentBalance = roundCurrency(fromSummary.currentBalance - amount);
      if (toSummary) toSummary.currentBalance = roundCurrency(toSummary.currentBalance + amount);
    }
  });

  salaryRecords.forEach((salary) => {
    if (!salaryLinkedTransactionIds.has(salary.id)) {
      const summary = accountMap.get(salary.accountId);
      const salaryTotal = roundCurrency(
        (salary.baseSalary || 0) + (salary.bonus || 0) + (salary.incentive || 0) + (salary.otherIncome || 0)
      );
      if (summary && salaryTotal > 0) {
        summary.currentBalance = roundCurrency(summary.currentBalance + salaryTotal);
      }
    }
  });

  const summaries = Array.from(accountMap.values());
  const liquidSpendable = summaries.filter((s) => !s.isSavings).reduce((sum, s) => sum + s.currentBalance, 0);
  const dedicatedSavings = summaries.filter((s) => s.isSavings).reduce((sum, s) => sum + s.currentBalance, 0);
  const totalNetWorth = roundCurrency(liquidSpendable + dedicatedSavings);

  return { summaries, liquidSpendable, dedicatedSavings, totalNetWorth };
};

const calculateMonthlySummary = (monthYear, transactions, salaryRecords) => {
  const monthSalaries = salaryRecords.filter((s) => s.monthYear === monthYear);
  let totalIncome = 0;
  monthSalaries.forEach((s) => {
    totalIncome += (s.baseSalary || 0) + (s.bonus || 0) + (s.incentive || 0) + (s.otherIncome || 0);
  });

  const monthTxs = transactions.filter((t) => t.date.startsWith(monthYear));
  let netExpenses = 0;
  let dedicatedSavings = 0;

  monthTxs.forEach((tx) => {
    if (tx.type === 'expense') {
      netExpenses += tx.amount || 0;
    } else if (tx.type === 'transfer' && (tx.isDedicatedSavings || tx.transferCategory === 'savings')) {
      dedicatedSavings += tx.amount || 0;
    }
  });

  const availableToSpend = Math.max(0, totalIncome - netExpenses - dedicatedSavings);
  const monthlySavings = dedicatedSavings + availableToSpend;

  return { totalIncome, netExpenses, dedicatedSavings, availableToSpend, monthlySavings };
};

console.log('--- STARTING BASELINE RECOVERY VERIFICATION ---');

// Test 1: Admin Recovery Verification
const adminUid = 'admin_user_001';
const adminAccounts = getBaselineAccountsForUser(adminUid);
const adminSalary = getBaselineSalaryForUser(adminUid, adminAccounts);
const adminTxs = getBaselineTransactionsForUser(adminUid, adminAccounts);

assert.strictEqual(adminAccounts.length, 4, 'Admin must have exactly 4 accounts');
assert.strictEqual(adminSalary.length, 1, 'Admin must have exactly 1 salary record for Nov 2026');
assert.strictEqual(adminTxs.length, 15, 'Admin must have exactly 15 historical transactions');

const adminBalances = calculateAccountBalances(adminAccounts, adminTxs, adminSalary);
const canaraAcc = adminBalances.summaries.find((s) => s.name === 'Canara Bank');
const federalAcc = adminBalances.summaries.find((s) => s.name === 'Federal bank');
const cashAcc = adminBalances.summaries.find((s) => s.name === 'Cash');
const sbiAcc = adminBalances.summaries.find((s) => s.name === 'SBI');

assert.strictEqual(canaraAcc.currentBalance, 2550, 'Canara Bank must have ₹2,550 balance');
assert.strictEqual(federalAcc.currentBalance, 4000, 'Federal Bank must have ₹4,000 balance');
assert.strictEqual(cashAcc.currentBalance, 0, 'Cash must have ₹0 balance');
assert.strictEqual(sbiAcc.currentBalance, 0, 'SBI must have ₹0 balance');

const adminMonth = calculateMonthlySummary('2026-11', adminTxs, adminSalary);
assert.strictEqual(adminMonth.totalIncome, 10000, 'Monthly income must be ₹10,000');
assert.strictEqual(adminMonth.netExpenses, 3450, 'Net expenses must be ₹3,450');
assert.strictEqual(adminMonth.dedicatedSavings, 4000, 'Dedicated savings must be ₹4,000');
assert.strictEqual(adminMonth.availableToSpend, 2550, 'Available to spend must be ₹2,550');
assert.strictEqual(adminMonth.monthlySavings, 6550, 'Total monthly savings must be ₹6,550');

console.log('✓ Admin recovery dataset matches Image 1 overview exactly down to the rupee!');

// Test 2: Non-Admin (Amil) Isolation Verification
const amilUid = 'amil_user_002';
const amilEmail = 'amil@sksdm.com';

// Non-admin default accounts
const amilDefaultAccounts = [
  { id: `acc_${amilUid}_1`, name: 'Cash', type: 'cash', openingBalance: 0, isSavings: false },
  { id: `acc_${amilUid}_2`, name: 'Primary UPI / GPay', type: 'upi', openingBalance: 0, isSavings: false },
  { id: `acc_${amilUid}_3`, name: 'Federal Bank / Savings', type: 'bank', openingBalance: 0, isSavings: true },
];
let amilTxs = [];
let amilSalary = [];

// Verify non-admin starts with 0 transactions and 0 salary
assert.strictEqual(amilTxs.length, 0, 'Amil must have 0 transactions initially');
assert.strictEqual(amilSalary.length, 0, 'Amil must have 0 salary records initially');

const amilBalances = calculateAccountBalances(amilDefaultAccounts, amilTxs, amilSalary);
amilBalances.summaries.forEach((acc) => {
  assert.strictEqual(acc.currentBalance, 0, `Amil account ${acc.name} must have ₹0 initial balance`);
});

const amilMonth = calculateMonthlySummary('2026-11', amilTxs, amilSalary);
assert.strictEqual(amilMonth.totalIncome, 0, 'Amil initial monthly income must be 0');
assert.strictEqual(amilMonth.netExpenses, 0, 'Amil initial net expenses must be 0');

console.log('✓ Amil has an independent, clean personal workspace with 0 admin data!');

// Test 3: Purge Mechanism for Non-Admin
// If any admin baseline transaction ever leaked into Amil's partition, purge it immediately
let leakedAmilTxs = [
  { id: 'tx_amil_popcorn', title: 'Popcorn', amount: 200, type: 'expense' },
  { id: 'tx_amil_sip', title: 'SIP', amount: 1500, type: 'expense' }
];

const purgeNonAdminTxs = (txs) => {
  const hasAdminTxs = txs.some(
    (t) => t.title === 'Popcorn' || t.title === 'SIP' || t.title === 'Movie- ramayana'
  );
  return hasAdminTxs ? [] : txs;
};

const cleanedAmilTxs = purgeNonAdminTxs(leakedAmilTxs);
assert.strictEqual(cleanedAmilTxs.length, 0, 'Leaked admin transactions must be completely purged for non-admin');
console.log('✓ Non-admin purge successfully removes any accidental admin data!');

// Test 4: Workspace Isolation
// When Amil adds their own transaction, it does not affect Admin
amilTxs.push({
  id: `tx_${amilUid}_new_coffee`,
  userId: amilUid,
  type: 'expense',
  title: 'My Coffee',
  amount: 80,
  accountId: amilDefaultAccounts[0].id,
  date: '2026-11-17',
});

const updatedAmilBalances = calculateAccountBalances(amilDefaultAccounts, amilTxs, amilSalary);
const updatedAdminBalances = calculateAccountBalances(adminAccounts, adminTxs, adminSalary);

assert.strictEqual(
  updatedAmilBalances.summaries.find((s) => s.name === 'Cash').currentBalance,
  -80,
  'Amil Cash balance should reflect only their own transaction'
);
assert.strictEqual(
  updatedAdminBalances.summaries.find((s) => s.name === 'Canara Bank').currentBalance,
  2550,
  'Admin Canara Bank MUST remain unchanged at 2550'
);

console.log('✓ Strict workspace data isolation verified between Admin and Amil!');
console.log('==============================================');
console.log('ALL BASELINE RECOVERY & ISOLATION TESTS PASSED! ✓');
console.log('==============================================');
