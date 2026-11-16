import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  ExpenseAccount,
  ExpenseCategory,
  SalaryRecord,
  ExpenseTransaction,
  MonthlyBudget,
  AccountBalanceSummary,
  MonthlyFinancialSummary,
} from '../types/expense';
import {
  getExpenseAccounts,
  addExpenseAccount,
  updateExpenseAccount,
  deleteExpenseAccount,
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getSalaryRecords,
  addSalaryRecord,
  updateSalaryRecord,
  deleteSalaryRecord,
  getExpenseTransactions,
  addExpenseTransaction,
  updateExpenseTransaction,
  deleteExpenseTransaction,
  getMonthlyBudgets,
  saveMonthlyBudget,
} from '../services/expenseService';
import {
  calculateAccountBalances,
  calculateMonthlySummary,
} from '../utils/expenseCalculations';
import {
  getInitializedDefaultAccounts,
  getInitializedDefaultCategories,
} from '../utils/defaultExpenseData';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ExpenseContextType {
  accounts: ExpenseAccount[];
  categories: ExpenseCategory[];
  salaryRecords: SalaryRecord[];
  transactions: ExpenseTransaction[];
  budgets: MonthlyBudget[];
  loading: boolean;
  selectedMonthYear: string;
  setSelectedMonthYear: (my: string) => void;
  // Calculations
  accountSummaries: AccountBalanceSummary[];
  totalAvailableBalance: number;
  monthlySummary: MonthlyFinancialSummary;
  // Account Actions
  handleAddAccount: (acc: Omit<ExpenseAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  handleEditAccount: (acc: ExpenseAccount) => Promise<void>;
  handleDeleteAccount: (id: string) => Promise<void>;
  // Category Actions
  handleAddCategory: (cat: Omit<ExpenseCategory, 'id' | 'createdAt'>) => Promise<void>;
  handleEditCategory: (cat: ExpenseCategory) => Promise<void>;
  handleDeleteCategory: (id: string) => Promise<void>;
  // Salary Actions
  handleAddSalary: (sal: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>) => Promise<void>;
  handleEditSalary: (sal: SalaryRecord) => Promise<void>;
  handleDeleteSalary: (id: string) => Promise<void>;
  // Transaction Actions
  handleAddTransaction: (tx: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  handleEditTransaction: (tx: ExpenseTransaction) => Promise<void>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleDuplicateTransaction: (tx: ExpenseTransaction) => Promise<void>;
  // Budget Actions
  handleSaveBudget: (monthYear: string, overallBudget: number, categoryBudgets: Record<string, number>) => Promise<void>;
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Refresh
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// Helper to get current YYYY-MM
const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid || 'default';

  // Always pre-populate accounts and categories so dropdowns are NEVER empty!
  const [accounts, setAccounts] = useState<ExpenseAccount[]>(() => getInitializedDefaultAccounts(userId));
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => getInitializedDefaultCategories(userId));
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(getCurrentMonthYear());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all user expense data with resilient individual handling
  const refreshData = useCallback(async () => {
    const activeUid = userId || 'default';

    try {
      setLoading(true);

      const [accsRes, catsRes, salsRes, txsRes, bdgsRes] = await Promise.allSettled([
        getExpenseAccounts(activeUid),
        getExpenseCategories(activeUid),
        getSalaryRecords(activeUid),
        getExpenseTransactions(activeUid),
        getMonthlyBudgets(activeUid),
      ]);

      if (accsRes.status === 'fulfilled' && accsRes.value.length > 0) {
        setAccounts(accsRes.value);
      } else {
        setAccounts((prev) => (prev.length > 0 ? prev : getInitializedDefaultAccounts(activeUid)));
      }

      if (catsRes.status === 'fulfilled' && catsRes.value.length > 0) {
        setCategories(catsRes.value);
      } else {
        setCategories((prev) => (prev.length > 0 ? prev : getInitializedDefaultCategories(activeUid)));
      }

      if (salsRes.status === 'fulfilled') {
        setSalaryRecords(salsRes.value);
      }

      if (txsRes.status === 'fulfilled') {
        setTransactions(txsRes.value);
      }

      if (bdgsRes.status === 'fulfilled') {
        setBudgets(bdgsRes.value);
      }
    } catch (err: any) {
      console.warn('Failed to load expense data, preserving defaults:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived Account Balances (across all history)
  const { summaries: accountSummaries, totalAvailableBalance } = useMemo(() => {
    return calculateAccountBalances(accounts, transactions, salaryRecords);
  }, [accounts, transactions, salaryRecords]);

  // Derived Active Budget for selected month
  const activeBudget = useMemo(() => {
    return budgets.find((b) => b.monthYear === selectedMonthYear) || null;
  }, [budgets, selectedMonthYear]);

  // Derived Monthly Financial Summary for selected month
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(selectedMonthYear, transactions, salaryRecords, activeBudget);
  }, [selectedMonthYear, transactions, salaryRecords, activeBudget]);

  /* ── Account Handlers ── */
  const handleAddAccount = async (accData: Omit<ExpenseAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await addExpenseAccount(accData);
      setAccounts((prev) => [...prev, created]);
      showToast(`Account "${created.name}" created successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to create account.', 'error');
      throw err;
    }
  };

  const handleEditAccount = async (acc: ExpenseAccount) => {
    try {
      await updateExpenseAccount(acc);
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
      showToast(`Account "${acc.name}" updated successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update account.', 'error');
      throw err;
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const hasTx = transactions.some((t) => t.accountId === id || t.toAccountId === id);
    if (hasTx) {
      showToast('Cannot delete account with existing transactions.', 'error');
      return;
    }
    try {
      await deleteExpenseAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      showToast('Account removed.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete account.', 'error');
    }
  };

  /* ── Category Handlers ── */
  const handleAddCategory = async (catData: Omit<ExpenseCategory, 'id' | 'createdAt'>) => {
    try {
      const created = await addExpenseCategory(catData);
      setCategories((prev) => [...prev, created]);
      showToast(`Category "${created.name}" added.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to create category.', 'error');
      throw err;
    }
  };

  const handleEditCategory = async (cat: ExpenseCategory) => {
    try {
      await updateExpenseCategory(cat);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
      showToast(`Category "${cat.name}" updated.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update category.', 'error');
      throw err;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const hasTx = transactions.some((t) => t.categoryId === id);
    if (hasTx) {
      showToast('Cannot delete category with associated transactions.', 'error');
      return;
    }
    try {
      await deleteExpenseCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Category deleted.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete category.', 'error');
    }
  };

  /* ── Salary Handlers ── */
  const handleAddSalary = async (
    salData: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>
  ) => {
    const existing = salaryRecords.find((s) => s.monthYear === salData.monthYear);
    if (existing) {
      showToast(`A salary entry for ${salData.monthYear} already exists. Please edit it instead.`, 'error');
      throw new Error(`Duplicate salary record for ${salData.monthYear}`);
    }

    try {
      const created = await addSalaryRecord(salData);
      setSalaryRecords((prev) => [created, ...prev]);
      const updatedTxs = await getExpenseTransactions(userId);
      setTransactions(updatedTxs);
      showToast(`Salary for ${salData.monthYear} recorded successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save salary record.', 'error');
      throw err;
    }
  };

  const handleEditSalary = async (sal: SalaryRecord) => {
    try {
      await updateSalaryRecord(sal);
      setSalaryRecords((prev) => prev.map((s) => (s.id === sal.id ? sal : s)));
      const updatedTxs = await getExpenseTransactions(userId);
      setTransactions(updatedTxs);
      showToast(`Salary for ${sal.monthYear} updated.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update salary.', 'error');
      throw err;
    }
  };

  const handleDeleteSalary = async (id: string) => {
    try {
      await deleteSalaryRecord(id);
      setSalaryRecords((prev) => prev.filter((s) => s.id !== id));
      setTransactions((prev) => prev.filter((t) => t.salaryRecordId !== id));
      showToast('Salary record deleted.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete salary record.', 'error');
    }
  };

  /* ── Transaction Handlers ── */
  const handleAddTransaction = async (
    txData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const created = await addExpenseTransaction(txData);
      setTransactions((prev) => [created, ...prev]);
      showToast(`Transaction "${created.title}" added.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to record transaction.', 'error');
      throw err;
    }
  };

  const handleEditTransaction = async (tx: ExpenseTransaction) => {
    try {
      await updateExpenseTransaction(tx);
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
      showToast(`Transaction "${tx.title}" updated.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update transaction.', 'error');
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteExpenseTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Transaction removed.');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete transaction.', 'error');
    }
  };

  const handleDuplicateTransaction = async (tx: ExpenseTransaction) => {
    try {
      const { id, createdAt, updatedAt, salaryRecordId, ...rest } = tx;
      const duplicated = await addExpenseTransaction({
        ...rest,
        title: `${tx.title} (Copy)`,
        date: new Date().toISOString().slice(0, 10),
      });
      setTransactions((prev) => [duplicated, ...prev]);
      showToast(`Duplicated "${tx.title}".`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to duplicate transaction.', 'error');
    }
  };

  /* ── Budget Handlers ── */
  const handleSaveBudget = async (
    monthYear: string,
    overallBudget: number,
    categoryBudgets: Record<string, number>
  ) => {
    try {
      const saved = await saveMonthlyBudget(userId, monthYear, overallBudget, categoryBudgets);
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.monthYear === monthYear);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      showToast(`Budget for ${monthYear} saved.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save budget.', 'error');
      throw err;
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        accounts,
        categories,
        salaryRecords,
        transactions,
        budgets,
        loading,
        selectedMonthYear,
        setSelectedMonthYear,
        accountSummaries,
        totalAvailableBalance,
        monthlySummary,
        handleAddAccount,
        handleEditAccount,
        handleDeleteAccount,
        handleAddCategory,
        handleEditCategory,
        handleDeleteCategory,
        handleAddSalary,
        handleEditSalary,
        handleDeleteSalary,
        handleAddTransaction,
        handleEditTransaction,
        handleDeleteTransaction,
        handleDuplicateTransaction,
        handleSaveBudget,
        toasts,
        showToast,
        removeToast,
        refreshData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
