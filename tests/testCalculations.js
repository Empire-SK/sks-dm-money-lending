// Unit & Integration Verification for SKS DM Expense Manager Calculations
import assert from 'node:assert';

// 1. Math precision & Currency Formatting
const roundCurrency = (amount) => {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const formatINR = (amount, showDecimals = false) => {
  const rounded = roundCurrency(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals && absVal % 1 !== 0 ? 2 : 0,
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
};

const getMonthYear = (dateStr) => dateStr ? dateStr.slice(0, 7) : '';

// 2. Account balance calculation
const calculateAccountBalances = (accounts, transactions, salaryRecords = []) => {
  const salaryLinkedTransactionIds = new Set(
    transactions.filter((t) => t.salaryRecordId).map((t) => t.salaryRecordId)
  );

  const accountMap = new Map();
  accounts.forEach((acc) => {
    accountMap.set(acc.id, {
      account: acc,
      currentBalance: roundCurrency(acc.openingBalance || 0),
      totalIncome: 0,
      totalExpenses: 0,
      totalRefunds: 0,
      transfersIn: 0,
      transfersOut: 0,
    });
  });

  transactions.forEach((tx) => {
    const amount = roundCurrency(tx.amount || 0);
    if (amount <= 0) return;

    if (tx.type === 'income') {
      const summary = accountMap.get(tx.accountId);
      if (summary) {
        summary.totalIncome = roundCurrency(summary.totalIncome + amount);
        summary.currentBalance = roundCurrency(summary.currentBalance + amount);
      }
    } else if (tx.type === 'expense') {
      const summary = accountMap.get(tx.accountId);
      if (summary) {
        summary.totalExpenses = roundCurrency(summary.totalExpenses + amount);
        summary.currentBalance = roundCurrency(summary.currentBalance - amount);
      }
    } else if (tx.type === 'refund') {
      const summary = accountMap.get(tx.accountId);
      if (summary) {
        summary.totalRefunds = roundCurrency(summary.totalRefunds + amount);
        summary.currentBalance = roundCurrency(summary.currentBalance + amount);
      }
    } else if (tx.type === 'transfer') {
      const fromSummary = accountMap.get(tx.accountId);
      const toSummary = tx.toAccountId ? accountMap.get(tx.toAccountId) : null;
      if (fromSummary) {
        fromSummary.transfersOut = roundCurrency(fromSummary.transfersOut + amount);
        fromSummary.currentBalance = roundCurrency(fromSummary.currentBalance - amount);
      }
      if (toSummary) {
        toSummary.transfersIn = roundCurrency(toSummary.transfersIn + amount);
        toSummary.currentBalance = roundCurrency(toSummary.currentBalance + amount);
      }
    }
  });

  salaryRecords.forEach((salary) => {
    if (!salaryLinkedTransactionIds.has(salary.id)) {
      const summary = accountMap.get(salary.accountId);
      const salaryTotal = roundCurrency(
        (salary.baseSalary || 0) +
        (salary.bonus || 0) +
        (salary.incentive || 0) +
        (salary.otherIncome || 0)
      );
      if (summary && salaryTotal > 0) {
        summary.totalIncome = roundCurrency(summary.totalIncome + salaryTotal);
        summary.currentBalance = roundCurrency(summary.currentBalance + salaryTotal);
      }
    }
  });

  const summaries = Array.from(accountMap.values());
  const totalAvailableBalance = roundCurrency(
    summaries.reduce((sum, item) => sum + item.currentBalance, 0)
  );
  return { summaries, totalAvailableBalance };
};

// 3. Monthly Financial Summary Calculation
const calculateMonthlySummary = (monthYear, transactions, salaryRecords = [], budget = null) => {
  const monthSalaries = salaryRecords.filter((s) => s.monthYear === monthYear);

  let salaryIncome = 0;
  let bonusIncome = 0;
  let incentiveIncome = 0;
  let salaryOtherIncome = 0;

  monthSalaries.forEach((s) => {
    salaryIncome = roundCurrency(salaryIncome + (s.baseSalary || 0));
    bonusIncome = roundCurrency(bonusIncome + (s.bonus || 0));
    incentiveIncome = roundCurrency(incentiveIncome + (s.incentive || 0));
    salaryOtherIncome = roundCurrency(salaryOtherIncome + (s.otherIncome || 0));
  });

  const monthTransactions = transactions.filter((tx) => getMonthYear(tx.date) === monthYear);

  let independentIncome = 0;
  let totalExpenses = 0;
  let totalRefunds = 0;
  const categorySpending = {};

  monthTransactions.forEach((tx) => {
    const amount = roundCurrency(tx.amount || 0);
    if (amount <= 0) return;

    if (tx.type === 'income') {
      if (!tx.salaryRecordId || !monthSalaries.some((s) => s.id === tx.salaryRecordId)) {
        independentIncome = roundCurrency(independentIncome + amount);
      }
    } else if (tx.type === 'expense') {
      totalExpenses = roundCurrency(totalExpenses + amount);
      const catId = tx.categoryId || 'uncategorized';
      categorySpending[catId] = roundCurrency((categorySpending[catId] || 0) + amount);
    } else if (tx.type === 'refund') {
      totalRefunds = roundCurrency(totalRefunds + amount);
      const catId = tx.categoryId || 'uncategorized';
      categorySpending[catId] = roundCurrency((categorySpending[catId] || 0) - amount);
    }
  });

  const otherIncome = roundCurrency(salaryOtherIncome + independentIncome);
  const totalIncome = roundCurrency(salaryIncome + bonusIncome + incentiveIncome + otherIncome);
  const netExpenses = roundCurrency(Math.max(0, totalExpenses - totalRefunds));
  const monthlySavings = roundCurrency(totalIncome - netExpenses);

  const savingsRate = totalIncome > 0 ? roundCurrency((monthlySavings / totalIncome) * 100) : 0;
  const expenseRate = totalIncome > 0 ? roundCurrency((netExpenses / totalIncome) * 100) : 0;

  const overallBudget = roundCurrency(budget?.overallBudget || 0);
  const budgetRemaining = roundCurrency(overallBudget - netExpenses);
  const budgetUtilization = overallBudget > 0 ? roundCurrency((netExpenses / overallBudget) * 100) : 0;

  return {
    monthYear,
    salaryIncome,
    bonusIncome,
    incentiveIncome,
    otherIncome,
    totalIncome,
    totalExpenses,
    totalRefunds,
    netExpenses,
    monthlySavings,
    savingsRate,
    expenseRate,
    overallBudget,
    budgetRemaining,
    budgetUtilization,
    categorySpending,
  };
};

const getBudgetAlertStatus = (spent, budget) => {
  if (!budget || budget <= 0) {
    return { status: 'normal', percentage: 0 };
  }
  const percentage = roundCurrency((spent / budget) * 100);
  if (percentage >= 100) return { status: 'exceeded', percentage };
  if (percentage >= 90) return { status: 'high_warning', percentage };
  if (percentage >= 75) return { status: 'warning', percentage };
  return { status: 'normal', percentage };
};

// ==========================================
// TEST SUITE EXECUTION
// ==========================================

console.log('--- STARTING FINANCIAL CALCULATION VERIFICATION ---');

// TEST 1: Salary calculation & Floating point precision
console.log('\n[Test 1] Salary and Income Calculations');
const salaryEntry = {
  id: 'sal-1',
  monthYear: '2026-01',
  baseSalary: 25000,
  bonus: 2000,
  incentive: 1000,
  otherIncome: 500,
  accountId: 'acc-upi',
};
const totalSalaryIncome = roundCurrency(
  salaryEntry.baseSalary + salaryEntry.bonus + salaryEntry.incentive + salaryEntry.otherIncome
);
assert.strictEqual(totalSalaryIncome, 28500, 'Salary calculation must equal ₹28,500');
console.log('✓ Salary Total Calculation passed: ₹28,500');

// TEST 2: Account balances with Cash & UPI
console.log('\n[Test 2] Accounts Balance Calculation (Cash & UPI)');
const testAccounts = [
  { id: 'acc-cash', name: 'Cash', type: 'cash', openingBalance: 5000 },
  { id: 'acc-upi', name: 'UPI', type: 'upi', openingBalance: 10000 },
];

const testSalary = [
  {
    id: 'sal-jan',
    monthYear: '2026-01',
    baseSalary: 25000,
    bonus: 0,
    incentive: 0,
    otherIncome: 0,
    accountId: 'acc-upi',
  },
];

const testTransactions = [
  // Linked salary transaction for Jan
  {
    id: 'tx-1',
    type: 'income',
    title: 'Jan Salary',
    amount: 25000,
    accountId: 'acc-upi',
    date: '2026-01-01',
    salaryRecordId: 'sal-jan',
  },
  // Expense from Cash: 1500
  {
    id: 'tx-2',
    type: 'expense',
    title: 'Groceries',
    amount: 1500,
    categoryId: 'food',
    accountId: 'acc-cash',
    date: '2026-01-05',
  },
  // Expense from UPI: 8500
  {
    id: 'tx-3',
    type: 'expense',
    title: 'Rent',
    amount: 8500,
    categoryId: 'rent',
    accountId: 'acc-upi',
    date: '2026-01-06',
  },
];

let balanceResult = calculateAccountBalances(testAccounts, testTransactions, testSalary);
let cashSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-cash');
let upiSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-upi');

assert.strictEqual(cashSummary.currentBalance, 3500, 'Cash should be 5000 - 1500 = 3500');
assert.strictEqual(upiSummary.currentBalance, 26500, 'UPI should be 10000 + 25000 - 8500 = 26500');
assert.strictEqual(balanceResult.totalAvailableBalance, 30000, 'Total available should be 30,000');
console.log('✓ Account balances with expenses and salary passed: Cash=3500, UPI=26500, Total=30000');

// TEST 3: Transfers (Cash to UPI)
console.log('\n[Test 3] Transfers (Cash to UPI)');
const transferTx = {
  id: 'tx-4',
  type: 'transfer',
  title: 'Deposit Cash to UPI',
  amount: 2000,
  accountId: 'acc-cash',
  toAccountId: 'acc-upi',
  date: '2026-01-10',
};

testTransactions.push(transferTx);
balanceResult = calculateAccountBalances(testAccounts, testTransactions, testSalary);
cashSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-cash');
upiSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-upi');

assert.strictEqual(cashSummary.currentBalance, 1500, 'Cash should decrease by 2000 -> 1500');
assert.strictEqual(upiSummary.currentBalance, 28500, 'UPI should increase by 2000 -> 28500');
assert.strictEqual(balanceResult.totalAvailableBalance, 30000, 'Total available balance should be completely unchanged by transfer');

// Check that monthly summary does NOT count transfer as expense or income
const janSummary = calculateMonthlySummary('2026-01', testTransactions, testSalary, { overallBudget: 15000 });
assert.strictEqual(janSummary.totalIncome, 25000, 'Transfer must not change total income');
assert.strictEqual(janSummary.netExpenses, 10000, 'Transfer must not change net expenses (1500 + 8500 = 10000)');
assert.strictEqual(janSummary.monthlySavings, 15000, 'Savings should be 25000 - 10000 = 15000');
console.log('✓ Transfer test passed: Cash decreased, UPI increased, Total unchanged, Monthly expenses unaffected.');

// TEST 4: Refunds (Purchase returned)
console.log('\n[Test 4] Refund Transactions');
const refundTx = {
  id: 'tx-5',
  type: 'refund',
  title: 'Groceries Partial Refund',
  amount: 500,
  categoryId: 'food',
  accountId: 'acc-cash',
  date: '2026-01-12',
};
testTransactions.push(refundTx);

balanceResult = calculateAccountBalances(testAccounts, testTransactions, testSalary);
cashSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-cash');
assert.strictEqual(cashSummary.currentBalance, 2000, 'Cash should increase by 500 refund -> 2000');

const janWithRefund = calculateMonthlySummary('2026-01', testTransactions, testSalary, { overallBudget: 15000 });
assert.strictEqual(janWithRefund.totalExpenses, 10000, 'Total gross expenses should be 10000');
assert.strictEqual(janWithRefund.totalRefunds, 500, 'Refunds should be 500');
assert.strictEqual(janWithRefund.netExpenses, 9500, 'Net expenses should decrease by refund to 9500');
assert.strictEqual(janWithRefund.categorySpending['food'], 1000, 'Food spending should be 1500 - 500 = 1000');
assert.strictEqual(janWithRefund.totalIncome, 25000, 'Refund must NOT be classified as income');
assert.strictEqual(janWithRefund.monthlySavings, 15500, 'Savings should increase to 25000 - 9500 = 15500');
console.log('✓ Refund test passed: Account credited, Net expenses reduced to 9500, Food net reduced to 1000, not counted as income.');

// TEST 5: Monthly Reset Behavior (Section 7)
console.log('\n[Test 5] Monthly Reset Behavior (Jan vs Feb)');
// In February: User receives salary 25,000 in UPI, spends 18,000
const febSalary = {
  id: 'sal-feb',
  monthYear: '2026-02',
  baseSalary: 25000,
  bonus: 0,
  incentive: 0,
  otherIncome: 0,
  accountId: 'acc-upi',
};
const febTx1 = {
  id: 'tx-feb-sal',
  type: 'income',
  title: 'Feb Salary',
  amount: 25000,
  accountId: 'acc-upi',
  date: '2026-02-01',
  salaryRecordId: 'sal-feb',
};
const febTx2 = {
  id: 'tx-feb-exp',
  type: 'expense',
  title: 'Feb Spending',
  amount: 18000,
  categoryId: 'food',
  accountId: 'acc-upi',
  date: '2026-02-15',
};

testSalary.push(febSalary);
testTransactions.push(febTx1, febTx2);

const febSummary = calculateMonthlySummary('2026-02', testTransactions, testSalary, { overallBudget: 20000 });
assert.strictEqual(febSummary.totalIncome, 25000, 'February income starts fresh at 25,000');
assert.strictEqual(febSummary.netExpenses, 18000, 'February expenses is 18,000');
assert.strictEqual(febSummary.monthlySavings, 7000, 'February savings is 7,000 (NOT containing Jan savings)');
assert.strictEqual(febSummary.savingsRate, 28, 'Savings rate = (7000/25000)*100 = 28%');

// But actual account balances reflect real money carried forward!
balanceResult = calculateAccountBalances(testAccounts, testTransactions, testSalary);
upiSummary = balanceResult.summaries.find((s) => s.account.id === 'acc-upi');
// UPI history: 10000 + 25000 (Jan) - 8500 (Jan) + 2000 (Transfer) + 25000 (Feb) - 18000 (Feb) = 35500
assert.strictEqual(upiSummary.currentBalance, 35500, 'Actual UPI balance reflects real cumulative money carried over');
console.log('✓ Monthly reset test passed: Feb savings is 7000 (isolated), while actual account balance carried over to 35,500.');

// TEST 6: Budget Alerts (Section 9)
console.log('\n[Test 6] Budget Alerts & Thresholds');
assert.strictEqual(getBudgetAlertStatus(500, 1000).status, 'normal');
assert.strictEqual(getBudgetAlertStatus(750, 1000).status, 'warning');
assert.strictEqual(getBudgetAlertStatus(920, 1000).status, 'high_warning');
assert.strictEqual(getBudgetAlertStatus(1050, 1000).status, 'exceeded');
console.log('✓ Budget alerts thresholds passed: normal <75%, warning 75-89%, high_warning 90-99%, exceeded >=100%');

const formatIndianNumber = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (!str) return '';

  const clean = str.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('').slice(0, 2) : '';

  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '') || '0';
  }

  if (!integerPart && !decimalPart) return '';
  if (!integerPart && decimalPart) return '0' + decimalPart;

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return formattedInteger + decimalPart;
};

const parseIndianNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const clean = String(value).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : roundCurrency(num);
};

const formatIndianWords = (num) => {
  if (!num || num <= 0) return '';
  if (num >= 10000000) {
    const cr = num / 10000000;
    const formatted = cr >= 100 ? Math.round(cr) : Number(cr.toFixed(2));
    return `${formatted} Crore${formatted > 1 ? 's' : ''}`;
  }
  if (num >= 100000) {
    const lakh = num / 100000;
    const formatted = lakh >= 100 ? Math.round(lakh) : Number(lakh.toFixed(2));
    return `${formatted} Lakh${formatted > 1 ? 's' : ''}`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    const formatted = k >= 100 ? Math.round(k) : Number(k.toFixed(2));
    return `${formatted} Thousand`;
  }
  return '';
};

// TEST 7: Zero Income Month
console.log('\n[Test 7] Zero-Income Month Handled Gracefully');
const zeroMonthSummary = calculateMonthlySummary('2026-03', testTransactions, testSalary, { overallBudget: 5000 });
assert.strictEqual(zeroMonthSummary.totalIncome, 0);
assert.strictEqual(zeroMonthSummary.savingsRate, 0);
assert.strictEqual(zeroMonthSummary.expenseRate, 0);
assert.strictEqual(isNaN(zeroMonthSummary.savingsRate), false);
console.log('✓ Zero-income month passed without NaN or division by zero errors.');

// TEST 8: Indian Number Comma Grouping & Words Preview
console.log('\n[Test 8] Indian Number Comma Grouping & Zero Clarity');
assert.strictEqual(formatIndianNumber('100000'), '1,00,000');
assert.strictEqual(formatIndianNumber('1500'), '1,500');
assert.strictEqual(formatIndianNumber('25000'), '25,000');
assert.strictEqual(formatIndianNumber('1000000'), '10,00,000');
assert.strictEqual(formatIndianNumber('10000000'), '1,00,00,000');
assert.strictEqual(formatIndianNumber('100000.50'), '1,00,000.50');
assert.strictEqual(parseIndianNumber('1,00,000'), 100000);
assert.strictEqual(parseIndianNumber('1,00,00,000.50'), 10000000.50);
assert.strictEqual(formatIndianWords(100000), '1 Lakh');
assert.strictEqual(formatIndianWords(1000000), '10 Lakhs');
assert.strictEqual(formatIndianWords(10000000), '1 Crore');
console.log('✓ Indian comma formatting (100000 -> 1,00,000) and words conversion passed.');

console.log('\n=========================================');
console.log('ALL FINANCIAL TESTS PASSED SUCCESSFULLY! ✓');
console.log('=========================================\n');
