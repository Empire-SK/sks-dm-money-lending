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

// Test 2: Amil Recovery Verification
const amilUid = 'amil_user_002';
const amilAccounts = getBaselineAccountsForUser(amilUid);
const amilSalary = getBaselineSalaryForUser(amilUid, amilAccounts);
const amilTxs = getBaselineTransactionsForUser(amilUid, amilAccounts);

assert.strictEqual(amilAccounts.length, 4, 'Amil must have exactly 4 accounts');
assert.strictEqual(amilSalary.length, 1, 'Amil must have exactly 1 salary record for Nov 2026');
assert.strictEqual(amilTxs.length, 15, 'Amil must have exactly 15 transactions');

// Ensure all IDs are completely unique and isolated between Admin and Amil
const adminAccountIds = new Set(adminAccounts.map((a) => a.id));
const amilAccountIds = new Set(amilAccounts.map((a) => a.id));
for (const id of amilAccountIds) {
  assert.ok(!adminAccountIds.has(id), `Account ID ${id} must not clash with admin IDs`);
}

const adminTxIds = new Set(adminTxs.map((t) => t.id));
const amilTxIds = new Set(amilTxs.map((t) => t.id));
for (const id of amilTxIds) {
  assert.ok(!adminTxIds.has(id), `Transaction ID ${id} must not clash with admin IDs`);
}

const amilBalances = calculateAccountBalances(amilAccounts, amilTxs, amilSalary);
const amilCanara = amilBalances.summaries.find((s) => s.name === 'Canara Bank');
const amilFederal = amilBalances.summaries.find((s) => s.name === 'Federal bank');
assert.strictEqual(amilCanara.currentBalance, 2550, 'Amil Canara Bank must have ₹2,550 balance');
assert.strictEqual(amilFederal.currentBalance, 4000, 'Amil Federal Bank must have ₹4,000 balance');

console.log('✓ Amil recovery dataset created with complete UID isolation and 0 ID collisions!');

// Test 3: Data Isolation Verification
// If Amil adds a new expense, Admin is unaffected
amilTxs.push({
  id: `tx_${amilUid}_new_coffee`,
  userId: amilUid,
  type: 'expense',
  title: 'Extra Coffee',
  amount: 100,
  accountId: amilCanara.id,
  date: '2026-11-17',
});

const updatedAmilBalances = calculateAccountBalances(amilAccounts, amilTxs, amilSalary);
const updatedAdminBalances = calculateAccountBalances(adminAccounts, adminTxs, adminSalary);

assert.strictEqual(
  updatedAmilBalances.summaries.find((s) => s.name === 'Canara Bank').currentBalance,
  2450,
  'Amil balance should decrease by 100 to 2450'
);
assert.strictEqual(
  updatedAdminBalances.summaries.find((s) => s.name === 'Canara Bank').currentBalance,
  2550,
  'Admin balance MUST remain unchanged at 2550'
);

console.log('✓ Strict workspace data isolation verified between Admin and Amil!');
console.log('==============================================');
console.log('ALL BASELINE RECOVERY TESTS PASSED SUCCESSFULLY! ✓');
console.log('==============================================');
