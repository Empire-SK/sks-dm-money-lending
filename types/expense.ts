export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund';

export type AccountType = 'cash' | 'upi' | 'bank' | 'card' | 'other';

export interface ExpenseAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
  isDefault?: boolean;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  userId: string;
  monthYear: string; // 'YYYY-MM'
  baseSalary: number;
  bonus: number;
  incentive: number;
  otherIncome: number;
  totalIncome: number;
  accountId: string; // Destination account
  receivedDate: string; // 'YYYY-MM-DD'
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  amount: number;
  categoryId: string; // Category ID or 'salary' / 'transfer'
  subcategory?: string;
  accountId: string; // Primary/source account
  toAccountId?: string; // For transfers: destination account
  originalTransactionId?: string; // For refunds: reference to original transaction
  date: string; // 'YYYY-MM-DD' or ISO string
  description?: string;
  receiptUrl?: string;
  receiptName?: string;
  notes?: string;
  salaryRecordId?: string; // If auto-created or linked to salary
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  monthYear: string; // 'YYYY-MM'
  overallBudget: number;
  categoryBudgets: Record<string, number>; // { [categoryId]: budgetAmount }
  createdAt: string;
  updatedAt?: string;
}

export interface AccountBalanceSummary {
  account: ExpenseAccount;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalRefunds: number;
  transfersIn: number;
  transfersOut: number;
}

export interface MonthlyFinancialSummary {
  monthYear: string;
  salaryIncome: number;
  bonusIncome: number;
  incentiveIncome: number;
  otherIncome: number;
  totalIncome: number;
  totalExpenses: number;
  totalRefunds: number;
  netExpenses: number;
  monthlySavings: number;
  savingsRate: number; // percentage (0 - 100)
  expenseRate: number; // percentage (0 - 100)
  overallBudget: number;
  budgetRemaining: number;
  budgetUtilization: number; // percentage (0 - 100+)
  categorySpending: Record<string, number>; // categoryId -> net spending
}
