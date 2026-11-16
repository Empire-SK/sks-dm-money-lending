import {
  ExpenseAccount,
  ExpenseTransaction,
  SalaryRecord,
  MonthlyBudget,
  AccountBalanceSummary,
  MonthlyFinancialSummary,
} from '../types/expense';

/**
 * Rounds a number to 2 decimal places to avoid IEEE 754 floating point inaccuracies.
 */
export const roundCurrency = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

/**
 * Formats a numeric amount into Indian Rupee (INR) representation: ₹1,23,456
 */
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  const rounded = roundCurrency(amount);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);

  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals && absVal % 1 !== 0 ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
};

/**
 * Formats a raw number or input string with Indian comma grouping:
 * 1000 -> 1,000
 * 100000 -> 1,00,000
 * 1000000 -> 10,00,000
 * 10000000 -> 1,00,00,000
 * Preserves decimal points and up to 2 decimal places.
 */
export const formatIndianNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (!str) return '';

  // Keep only digits and decimal point
  const clean = str.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('').slice(0, 2) : '';

  // Strip leading zeros unless it is just "0"
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '') || '0';
  }

  if (!integerPart && !decimalPart) return '';
  if (!integerPart && decimalPart) return '0' + decimalPart;

  // Indian numbering grouping: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return formattedInteger + decimalPart;
};

/**
 * Parses an Indian formatted string (e.g. "1,00,000.50") back into a numeric float: 100000.5
 */
export const parseIndianNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const clean = String(value).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : roundCurrency(num);
};

/**
 * Returns human-readable Indian currency denomination for live zero-clarity preview:
 * e.g. 100000 -> "1 Lakh"
 * 1000000 -> "10 Lakhs"
 * 10000000 -> "1 Crore"
 * 25000 -> "25 Thousand"
 */
export const formatIndianWords = (num: number): string => {
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

/**
 * Extracts 'YYYY-MM' from an ISO date string or 'YYYY-MM-DD' string.
 */
export const getMonthYear = (dateStr: string): string => {
  if (!dateStr) return '';
  // Handles '2026-11-16' or ISO strings
  return dateStr.slice(0, 7);
};

/**
 * Returns human-readable label for Month-Year, e.g. "November 2026"
 */
export const formatMonthYear = (monthYearStr: string): string => {
  if (!monthYearStr || monthYearStr.length < 7) return '';
  const [yearStr, monthStr] = monthYearStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

/**
 * Checks whether an account is classified as a dedicated savings vault / emergency fund.
 */
export const isSavingsAccount = (acc?: ExpenseAccount | { name: string; isSavings?: boolean } | null): boolean => {
  if (!acc) return false;
  if (typeof acc.isSavings === 'boolean') return acc.isSavings;
  const name = acc.name?.toLowerCase() || '';
  return /saving|emergency|fixed[ -]?deposit|\bfd\b|\brd\b|\bppf\b|mutual[ -]?fund|vault|federal/i.test(name);
};

/**
 * Calculates current balances for all accounts across all transactions and salary records.
 * Formula:
 * Current Balance = Opening Balance
 *                 + Total Income into account
 *                 - Total Expenses from account
 *                 + Refunds into account
 *                 + Transfers into account
 *                 - Transfers out of account
 */
export const calculateAccountBalances = (
  accounts: ExpenseAccount[],
  transactions: ExpenseTransaction[],
  salaryRecords: SalaryRecord[] = []
): {
  summaries: AccountBalanceSummary[];
  totalAvailableBalance: number;
  liquidSpendableBalance: number;
  dedicatedSavingsBalance: number;
  totalNetWorth: number;
} => {
  // Check if salary records already have corresponding income transactions
  // To prevent double counting, if a transaction is marked with salaryRecordId or
  // if salary records are separate, we ensure income is attributed exactly once.
  const salaryLinkedTransactionIds = new Set(
    transactions
      .filter((t) => t.salaryRecordId)
      .map((t) => t.salaryRecordId as string)
  );

  const accountMap = new Map<string, AccountBalanceSummary>();

  accounts.forEach((acc) => {
    const isSav = isSavingsAccount(acc);
    accountMap.set(acc.id, {
      account: { ...acc, isSavings: isSav },
      currentBalance: roundCurrency(acc.openingBalance || 0),
      totalIncome: 0,
      totalExpenses: 0,
      totalRefunds: 0,
      transfersIn: 0,
      transfersOut: 0,
      isSavings: isSav,
    });
  });

  // 1. Process all standard transactions
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

  // 2. Process salary records that do NOT have a linked transaction
  // (In case a salary record was saved without an auto-created transaction)
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

  // Liquid Spendable Balance = Balances in non-savings (daily spending) accounts
  const liquidSpendableBalance = roundCurrency(
    summaries
      .filter((s) => !s.isSavings)
      .reduce((sum, item) => sum + item.currentBalance, 0)
  );

  // Dedicated Savings Balance = Balances in dedicated savings/vault accounts
  const dedicatedSavingsBalance = roundCurrency(
    summaries
      .filter((s) => s.isSavings)
      .reduce((sum, item) => sum + item.currentBalance, 0)
  );

  // Total Net Worth = Liquid + Dedicated Savings across all accounts
  const totalNetWorth = roundCurrency(
    summaries.reduce((sum, item) => sum + item.currentBalance, 0)
  );

  // Available Spendable Total: When user has dedicated savings accounts, available total is
  // their liquid spendable balance so savings are not confused with spendable cash!
  const totalAvailableBalance = dedicatedSavingsBalance > 0 ? liquidSpendableBalance : totalNetWorth;

  return {
    summaries,
    totalAvailableBalance,
    liquidSpendableBalance,
    dedicatedSavingsBalance,
    totalNetWorth,
  };
};

/**
 * Calculates monthly financial summary for a specific 'YYYY-MM'.
 * Each month starts fresh for monthly income, budget, and savings!
 * Prior savings are NOT added to next month's salary or spending budget.
 */
export const calculateMonthlySummary = (
  monthYear: string,
  transactions: ExpenseTransaction[],
  salaryRecords: SalaryRecord[] = [],
  budget?: MonthlyBudget | null
): MonthlyFinancialSummary => {
  // Filter salary records for this month
  const monthSalaries = salaryRecords.filter((s) => s.monthYear === monthYear);
  const salaryLinkedTransactionIds = new Set(
    transactions
      .filter((t) => t.salaryRecordId)
      .map((t) => t.salaryRecordId as string)
  );

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

  // Filter transactions for this month
  const monthTransactions = transactions.filter((tx) => getMonthYear(tx.date) === monthYear);

  let independentIncome = 0;
  let totalExpenses = 0;
  let totalRefunds = 0;
  let dedicatedSavings = 0;
  const categorySpending: Record<string, number> = {};

  monthTransactions.forEach((tx) => {
    const amount = roundCurrency(tx.amount || 0);
    if (amount <= 0) return;

    if (tx.type === 'income') {
      // If this transaction is not linked to an already aggregated salary record
      if (!tx.salaryRecordId || !monthSalaries.some((s) => s.id === tx.salaryRecordId)) {
        independentIncome = roundCurrency(independentIncome + amount);
      }
    } else if (tx.type === 'expense') {
      totalExpenses = roundCurrency(totalExpenses + amount);
      const catId = tx.categoryId || 'uncategorized';
      categorySpending[catId] = roundCurrency((categorySpending[catId] || 0) + amount);
    } else if (tx.type === 'refund') {
      totalRefunds = roundCurrency(totalRefunds + amount);
      // Refunds reduce net expense in that category
      const catId = tx.categoryId || 'uncategorized';
      categorySpending[catId] = roundCurrency((categorySpending[catId] || 0) - amount);
    } else if (tx.type === 'transfer') {
      // Check if this transfer is tagged as dedicated savings / emergency / investment
      const isExplicitGeneral = tx.transferCategory === 'general' || tx.isDedicatedSavings === false;
      const isSavingsTx =
        !isExplicitGeneral &&
        (tx.isDedicatedSavings === true ||
          tx.transferCategory === 'savings' ||
          tx.transferCategory === 'emergency' ||
          tx.transferCategory === 'investment' ||
          /saving|emergency|investment|mutual[ -]?fund|fixed[ -]?deposit|\bfd\b|\brd\b|\bppf\b/i.test(
            (tx.title || '') + ' ' + (tx.description || '') + ' ' + (tx.notes || '')
          ));
      if (isSavingsTx) {
        dedicatedSavings = roundCurrency(dedicatedSavings + amount);
      }
    }
  });

  const otherIncome = roundCurrency(salaryOtherIncome + independentIncome);
  const totalIncome = roundCurrency(salaryIncome + bonusIncome + incentiveIncome + otherIncome);

  const netExpenses = roundCurrency(Math.max(0, totalExpenses - totalRefunds));

  // Spendable liquid remaining from this month: income - net expenses - dedicated savings
  const spendableBalance = roundCurrency(Math.max(0, totalIncome - netExpenses - dedicatedSavings));

  // Total monthly savings: dedicated savings set aside + unspent spendable balance
  const monthlySavings = roundCurrency(dedicatedSavings + spendableBalance);

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
    dedicatedSavings,
    spendableBalance,
    monthlySavings,
    savingsRate,
    expenseRate,
    overallBudget,
    budgetRemaining,
    budgetUtilization,
    categorySpending,
  };
};

/**
 * Returns budget alert status based on utilization percentage:
 * - < 75%: normal (emerald)
 * - 75% - 89.9%: warning (amber)
 * - 90% - 99.9%: high_warning (orange)
 * - >= 100%: exceeded (rose/red)
 */
export const getBudgetAlertStatus = (
  spent: number,
  budget: number
): {
  status: 'normal' | 'warning' | 'high_warning' | 'exceeded';
  label: string;
  badgeClass: string;
  colorClass: string;
  percentage: number;
} => {
  if (!budget || budget <= 0) {
    return {
      status: 'normal',
      label: 'No Budget Set',
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      colorClass: 'text-zinc-400',
      percentage: 0,
    };
  }

  const percentage = roundCurrency((spent / budget) * 100);

  if (percentage >= 100) {
    return {
      status: 'exceeded',
      label: 'Budget Exceeded',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      colorClass: 'text-rose-400',
      percentage,
    };
  }
  if (percentage >= 90) {
    return {
      status: 'high_warning',
      label: 'High Alert (90%+)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      colorClass: 'text-amber-300',
      percentage,
    };
  }
  if (percentage >= 75) {
    return {
      status: 'warning',
      label: 'Warning (75%+)',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      colorClass: 'text-amber-400',
      percentage,
    };
  }

  return {
    status: 'normal',
    label: 'On Track',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    colorClass: 'text-emerald-400',
    percentage,
  };
};
