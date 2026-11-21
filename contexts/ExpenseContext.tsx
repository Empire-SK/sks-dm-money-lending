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
  subscribeExpenseWorkspace,
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
  liquidSpendableBalance: number;
  dedicatedSavingsBalance: number;
  totalNetWorth: number;
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
  const userId = currentUser?.uid || '';
  const userEmail = currentUser?.email || '';

  const [accounts, setAccounts] = useState<ExpenseAccount[]>(() =>
    userId ? getInitializedDefaultAccounts(userId) : []
  );
  const [categories, setCategories] = useState<ExpenseCategory[]>(() =>
    userId ? getInitializedDefaultCategories(userId) : []
  );
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

  // Fetch all user expense data with isolated multi-tenant handling
  const refreshData = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setCategories([]);
      setSalaryRecords([]);
      setTransactions([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [accsRes, catsRes, salsRes, txsRes, bdgsRes] = await Promise.allSettled([
        getExpenseAccounts(userId, userEmail),
        getExpenseCategories(userId, userEmail),
        getSalaryRecords(userId, userEmail),
        getExpenseTransactions(userId, userEmail),
        getMonthlyBudgets(userId, userEmail),
      ]);

      if (accsRes.status === 'fulfilled' && accsRes.value.length > 0) {
        setAccounts(accsRes.value);
      } else {
        setAccounts(getInitializedDefaultAccounts(userId));
      }

      if (catsRes.status === 'fulfilled' && catsRes.value.length > 0) {
        setCategories(catsRes.value);
      } else {
        setCategories(getInitializedDefaultCategories(userId));
      }

      if (salsRes.status === 'fulfilled') {
        setSalaryRecords(salsRes.value);
      } else {
        setSalaryRecords([]);
      }

      if (txsRes.status === 'fulfilled') {
        const seen = new Set<string>();
        const uniqueTxs = txsRes.value.filter((t) => {
          if (!t || !t.id || seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
        setTransactions(uniqueTxs);
      } else {
        setTransactions([]);
      }

      if (bdgsRes.status === 'fulfilled') {
        setBudgets(bdgsRes.value);
      } else {
        setBudgets([]);
      }
    } catch (err: any) {
      console.warn('Failed to load expense data, preserving defaults:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time synchronization subscription for mobile <-> desktop cross-device sync
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeExpenseWorkspace(userId, userEmail, (cloudWs) => {
      if (!cloudWs || !cloudWs.isExpenseWorkspace) return;

      if (cloudWs.transactions && Array.isArray(cloudWs.transactions)) {
        const deletedSet = new Set(cloudWs.deletedTransactionIds || []);
        const seenIds = new Set<string>();
        const validTxs: ExpenseTransaction[] = [];

        for (const t of cloudWs.transactions) {
          if (t && t.id && !deletedSet.has(t.id) && !seenIds.has(t.id)) {
            seenIds.add(t.id);
            validTxs.push(t);
          }
        }
        validTxs.sort((a, b) => b.date.localeCompare(a.date));

        setTransactions((prev) => {
          if (
            prev.length === validTxs.length &&
            prev.every((t, i) => t.id === validTxs[i]?.id && t.updatedAt === validTxs[i]?.updatedAt)
          ) {
            return prev;
          }
          return validTxs;
        });
      }

      if (cloudWs.accounts && Array.isArray(cloudWs.accounts) && cloudWs.accounts.length > 0) {
        const seenAccIds = new Set<string>();
        const validAccs = cloudWs.accounts.filter((a) => {
          if (!a || !a.id || seenAccIds.has(a.id)) return false;
          seenAccIds.add(a.id);
          return true;
        });
        setAccounts((prev) => {
          if (
            prev.length === validAccs.length &&
            prev.every((a, i) => a.id === validAccs[i]?.id && a.updatedAt === validAccs[i]?.updatedAt)
          ) {
            return prev;
          }
          return validAccs;
        });
      }

      if (cloudWs.salaryRecords && Array.isArray(cloudWs.salaryRecords)) {
        const seenSalIds = new Set<string>();
        const validSals = cloudWs.salaryRecords.filter((s) => {
          if (!s || !s.id || seenSalIds.has(s.id)) return false;
          seenSalIds.add(s.id);
          return true;
        });
        setSalaryRecords((prev) => {
          if (
            prev.length === validSals.length &&
            prev.every((s, i) => s.id === validSals[i]?.id && s.updatedAt === validSals[i]?.updatedAt)
          ) {
            return prev;
          }
          return validSals;
        });
      }

      if (cloudWs.budgets && Array.isArray(cloudWs.budgets)) {
        const seenMonthYears = new Set<string>();
        const validBudgets = cloudWs.budgets.filter((b) => {
          if (!b || !b.monthYear || seenMonthYears.has(b.monthYear)) return false;
          seenMonthYears.add(b.monthYear);
          return true;
        });
        setBudgets((prev) => {
          if (
            prev.length === validBudgets.length &&
            prev.every((b, i) => b.id === validBudgets[i]?.id && b.monthYear === validBudgets[i]?.monthYear)
          ) {
            return prev;
          }
          return validBudgets;
        });
      }
    });

    return () => unsubscribe();
  }, [userId, userEmail]);

  // Window focus & tab visibility listener to automatically refresh when switching back to tab
  useEffect(() => {
    const handleSync = () => {
      refreshData();
    };
    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleSync);
    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleSync);
    };
  }, [refreshData]);

  // Derived Account Balances (across all history)
  const {
    summaries: accountSummaries,
    totalAvailableBalance,
    liquidSpendableBalance,
    dedicatedSavingsBalance,
    totalNetWorth,
  } = useMemo(() => {
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
      const created = await addExpenseAccount({ ...accData, userId }, userEmail);
      setAccounts((prev) => [...prev.filter((a) => a.id !== created.id), created]);
      showToast(`Account "${created.name}" created successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to create account.', 'error');
      throw err;
    }
  };

  const handleEditAccount = async (acc: ExpenseAccount) => {
    try {
      await updateExpenseAccount(acc, userEmail);
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
      await deleteExpenseAccount(id, userId, userEmail);
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
      const created = await addExpenseCategory({ ...catData, userId }, userEmail);
      setCategories((prev) => [...prev.filter((c) => c.id !== created.id), created]);
      showToast(`Category "${created.name}" added.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to create category.', 'error');
      throw err;
    }
  };

  const handleEditCategory = async (cat: ExpenseCategory) => {
    try {
      await updateExpenseCategory(cat, userEmail);
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
      await deleteExpenseCategory(id, userId, userEmail);
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
      const created = await addSalaryRecord({ ...salData, userId }, userEmail);
      setSalaryRecords((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      const updatedTxs = await getExpenseTransactions(userId, userEmail);
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
      await updateSalaryRecord(sal, userEmail);
      setSalaryRecords((prev) => prev.map((s) => (s.id === sal.id ? sal : s)));
      const updatedTxs = await getExpenseTransactions(userId, userEmail);
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
      await deleteSalaryRecord(id, userId, userEmail);
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
      const created = await addExpenseTransaction({ ...txData, userId }, userEmail);
      setTransactions((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      showToast(`Transaction "${created.title}" added.`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to record transaction.', 'error');
      throw err;
    }
  };

  const handleEditTransaction = async (tx: ExpenseTransaction) => {
    try {
      await updateExpenseTransaction(tx, userEmail);
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
      await deleteExpenseTransaction(id, userId, userEmail);
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
        userId,
        title: `${tx.title} (Copy)`,
        date: new Date().toISOString().slice(0, 10),
      }, userEmail);
      setTransactions((prev) => [duplicated, ...prev.filter((t) => t.id !== duplicated.id)]);
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
      const saved = await saveMonthlyBudget(userId, monthYear, overallBudget, categoryBudgets, userEmail);
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
        liquidSpendableBalance,
        dedicatedSavingsBalance,
        totalNetWorth,
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
