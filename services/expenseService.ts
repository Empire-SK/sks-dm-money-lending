import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  ExpenseAccount,
  ExpenseCategory,
  SalaryRecord,
  ExpenseTransaction,
  MonthlyBudget,
} from '../types/expense';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  getInitializedDefaultAccounts,
  getInitializedDefaultCategories,
} from '../utils/defaultExpenseData';
import { roundCurrency } from '../utils/expenseCalculations';

const ACCOUNTS_COLLECTION = 'expense_accounts';
const CATEGORIES_COLLECTION = 'expense_categories';
const SALARY_COLLECTION = 'salary_records';
const TRANSACTIONS_COLLECTION = 'expense_transactions';
const BUDGETS_COLLECTION = 'expense_budgets';

/* ── Local Storage Helper for Offline / Fallback Resilience ── */
const getLocalData = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to write to localStorage:', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   1. ACCOUNTS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseAccounts = async (userId: string): Promise<ExpenseAccount[]> => {
  const safeUserId = userId || 'default';
  const localKey = `sks_expense_accounts_${safeUserId}`;
  const localAccounts = getLocalData<ExpenseAccount[]>(localKey, []);

  try {
    if (userId) {
      const q = query(
        collection(db, ACCOUNTS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      let accounts: ExpenseAccount[] = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as ExpenseAccount)
      );

      if (accounts.length === 0) {
        try {
          accounts = await seedDefaultAccounts(userId);
        } catch (seedErr) {
          console.warn('Could not seed accounts to Firestore, using defaults:', seedErr);
          accounts = getInitializedDefaultAccounts(userId);
        }
      }

      setLocalData(localKey, accounts);
      return accounts.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }
  } catch (err) {
    console.warn('Firestore getExpenseAccounts failed, falling back to local:', err);
  }

  // Fallback to local accounts or initial defaults
  if (localAccounts.length > 0) return localAccounts;
  const defaults = getInitializedDefaultAccounts(safeUserId);
  setLocalData(localKey, defaults);
  return defaults;
};

export const seedDefaultAccounts = async (userId: string): Promise<ExpenseAccount[]> => {
  const created: ExpenseAccount[] = [];
  const now = new Date().toISOString();
  for (const def of DEFAULT_ACCOUNTS) {
    const newDoc = {
      ...def,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const ref = await addDoc(collection(db, ACCOUNTS_COLLECTION), newDoc);
      created.push({ ...newDoc, id: ref.id });
    } catch {
      created.push({ ...newDoc, id: `acc_seed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` });
    }
  }
  return created;
};

export const addExpenseAccount = async (
  accountData: Omit<ExpenseAccount, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExpenseAccount> => {
  const now = new Date().toISOString();
  const safeUserId = accountData.userId || 'default';
  let createdId = `acc_${Date.now()}`;

  const newDoc = {
    ...accountData,
    openingBalance: roundCurrency(accountData.openingBalance || 0),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const ref = await addDoc(collection(db, ACCOUNTS_COLLECTION), newDoc);
    createdId = ref.id;
  } catch (err) {
    console.warn('Firestore addExpenseAccount failed, saving locally:', err);
  }

  const result: ExpenseAccount = { ...newDoc, id: createdId };
  const localKey = `sks_expense_accounts_${safeUserId}`;
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, [...localList, result]);
  return result;
};

export const updateExpenseAccount = async (account: ExpenseAccount): Promise<void> => {
  const safeUserId = account.userId || 'default';
  try {
    const ref = doc(db, ACCOUNTS_COLLECTION, account.id);
    const { id, ...data } = account;
    await updateDoc(ref, {
      ...data,
      openingBalance: roundCurrency(account.openingBalance || 0),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateExpenseAccount failed, updating locally:', err);
  }

  const localKey = `sks_expense_accounts_${safeUserId}`;
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, localList.map((a) => (a.id === account.id ? account : a)));
};

export const deleteExpenseAccount = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseAccount failed:', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   2. CATEGORIES SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseCategories = async (userId: string): Promise<ExpenseCategory[]> => {
  const safeUserId = userId || 'default';
  const localKey = `sks_expense_categories_${safeUserId}`;
  const localCats = getLocalData<ExpenseCategory[]>(localKey, []);

  try {
    if (userId) {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      let categories: ExpenseCategory[] = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as ExpenseCategory)
      );

      if (categories.length === 0) {
        try {
          categories = await seedDefaultCategories(userId);
        } catch (seedErr) {
          console.warn('Could not seed categories to Firestore, using defaults:', seedErr);
          categories = getInitializedDefaultCategories(userId);
        }
      }

      setLocalData(localKey, categories);
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (err) {
    console.warn('Firestore getExpenseCategories failed, falling back to local/defaults:', err);
  }

  // Fallback to local categories or initial defaults
  if (localCats.length > 0) return localCats;
  const defaults = getInitializedDefaultCategories(safeUserId);
  setLocalData(localKey, defaults);
  return defaults;
};

export const seedDefaultCategories = async (userId: string): Promise<ExpenseCategory[]> => {
  const created: ExpenseCategory[] = [];
  const now = new Date().toISOString();
  for (const def of DEFAULT_CATEGORIES) {
    const newDoc = {
      ...def,
      userId,
      createdAt: now,
    };
    try {
      const ref = await addDoc(collection(db, CATEGORIES_COLLECTION), newDoc);
      created.push({ ...newDoc, id: ref.id });
    } catch {
      created.push({ ...newDoc, id: `cat_seed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` });
    }
  }
  return created;
};

export const addExpenseCategory = async (
  categoryData: Omit<ExpenseCategory, 'id' | 'createdAt'>
): Promise<ExpenseCategory> => {
  const now = new Date().toISOString();
  const safeUserId = categoryData.userId || 'default';
  let createdId = `cat_${Date.now()}`;

  const newDoc = {
    ...categoryData,
    createdAt: now,
  };

  try {
    const ref = await addDoc(collection(db, CATEGORIES_COLLECTION), newDoc);
    createdId = ref.id;
  } catch (err) {
    console.warn('Firestore addExpenseCategory failed, saving locally:', err);
  }

  const result: ExpenseCategory = { ...newDoc, id: createdId };
  const localKey = `sks_expense_categories_${safeUserId}`;
  const localList = getLocalData<ExpenseCategory[]>(localKey, []);
  setLocalData(localKey, [...localList, result]);
  return result;
};

export const updateExpenseCategory = async (category: ExpenseCategory): Promise<void> => {
  const safeUserId = category.userId || 'default';
  try {
    const ref = doc(db, CATEGORIES_COLLECTION, category.id);
    const { id, ...data } = category;
    await updateDoc(ref, data);
  } catch (err) {
    console.warn('Firestore updateExpenseCategory failed:', err);
  }

  const localKey = `sks_expense_categories_${safeUserId}`;
  const localList = getLocalData<ExpenseCategory[]>(localKey, []);
  setLocalData(localKey, localList.map((c) => (c.id === category.id ? category : c)));
};

export const deleteExpenseCategory = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseCategory failed:', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   3. SALARY RECORDS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getSalaryRecords = async (userId: string): Promise<SalaryRecord[]> => {
  const safeUserId = userId || 'default';
  const localKey = `sks_salary_records_${safeUserId}`;
  const localRecords = getLocalData<SalaryRecord[]>(localKey, []);

  try {
    if (userId) {
      const q = query(
        collection(db, SALARY_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as SalaryRecord));
      setLocalData(localKey, records);
      return records.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    }
  } catch (err) {
    console.warn('Firestore getSalaryRecords failed, using local:', err);
  }

  return localRecords.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
};

export const addSalaryRecord = async (
  salaryData: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>
): Promise<SalaryRecord> => {
  const total = roundCurrency(
    (salaryData.baseSalary || 0) +
    (salaryData.bonus || 0) +
    (salaryData.incentive || 0) +
    (salaryData.otherIncome || 0)
  );

  const now = new Date().toISOString();
  const safeUserId = salaryData.userId || 'default';
  let salaryId = `sal_${Date.now()}`;

  const newSalary: Omit<SalaryRecord, 'id'> = {
    ...salaryData,
    baseSalary: roundCurrency(salaryData.baseSalary || 0),
    bonus: roundCurrency(salaryData.bonus || 0),
    incentive: roundCurrency(salaryData.incentive || 0),
    otherIncome: roundCurrency(salaryData.otherIncome || 0),
    totalIncome: total,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const salaryRef = await addDoc(collection(db, SALARY_COLLECTION), newSalary);
    salaryId = salaryRef.id;
  } catch (err) {
    console.warn('Firestore addSalaryRecord failed, using local id:', err);
  }

  const resultSalary: SalaryRecord = { ...newSalary, id: salaryId };

  // Create linked income transaction
  const [year, month] = salaryData.monthYear.split('-');
  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const monthName = dateObj.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const linkedTransaction: Omit<ExpenseTransaction, 'id'> = {
    userId: salaryData.userId,
    type: 'income',
    title: `Monthly Salary (${monthName})`,
    amount: total,
    categoryId: 'salary',
    accountId: salaryData.accountId,
    date: salaryData.receivedDate || `${salaryData.monthYear}-01`,
    description: salaryData.note || `Salary, bonus & incentives for ${monthName}`,
    salaryRecordId: salaryId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), linkedTransaction);
  } catch (err) {
    console.warn('Firestore linked transaction add failed:', err);
  }

  // Update local storage
  const localKey = `sks_salary_records_${safeUserId}`;
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, [resultSalary, ...localList]);

  const txKey = `sks_expense_transactions_${safeUserId}`;
  const txList = getLocalData<ExpenseTransaction[]>(txKey, []);
  setLocalData(txKey, [{ ...linkedTransaction, id: `tx_sal_${salaryId}` }, ...txList]);

  return resultSalary;
};

export const updateSalaryRecord = async (salary: SalaryRecord): Promise<void> => {
  const total = roundCurrency(
    (salary.baseSalary || 0) +
    (salary.bonus || 0) +
    (salary.incentive || 0) +
    (salary.otherIncome || 0)
  );

  const now = new Date().toISOString();
  const safeUserId = salary.userId || 'default';

  try {
    const salaryRef = doc(db, SALARY_COLLECTION, salary.id);
    const { id, ...data } = salary;
    await updateDoc(salaryRef, {
      ...data,
      baseSalary: roundCurrency(salary.baseSalary || 0),
      bonus: roundCurrency(salary.bonus || 0),
      incentive: roundCurrency(salary.incentive || 0),
      otherIncome: roundCurrency(salary.otherIncome || 0),
      totalIncome: total,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore updateSalaryRecord failed:', err);
  }

  const localKey = `sks_salary_records_${safeUserId}`;
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, localList.map((s) => (s.id === salary.id ? { ...salary, totalIncome: total, updatedAt: now } : s)));
};

export const deleteSalaryRecord = async (salaryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SALARY_COLLECTION, salaryId));
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('salaryRecordId', '==', salaryId)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, d.id));
    }
  } catch (err) {
    console.warn('Firestore deleteSalaryRecord failed:', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   4. TRANSACTIONS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseTransactions = async (userId: string): Promise<ExpenseTransaction[]> => {
  const safeUserId = userId || 'default';
  const localKey = `sks_expense_transactions_${safeUserId}`;
  const localTxs = getLocalData<ExpenseTransaction[]>(localKey, []);

  try {
    if (userId) {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const transactions = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as ExpenseTransaction)
      );
      setLocalData(localKey, transactions);
      return transactions.sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch (err) {
    console.warn('Firestore getExpenseTransactions failed, using local:', err);
  }

  return localTxs.sort((a, b) => b.date.localeCompare(a.date));
};

export const addExpenseTransaction = async (
  txData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExpenseTransaction> => {
  const now = new Date().toISOString();
  const safeUserId = txData.userId || 'default';
  let createdId = `tx_${Date.now()}`;

  const newDoc = {
    ...txData,
    amount: roundCurrency(txData.amount || 0),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const ref = await addDoc(collection(db, TRANSACTIONS_COLLECTION), newDoc);
    createdId = ref.id;
  } catch (err) {
    console.warn('Firestore addExpenseTransaction failed, saving locally:', err);
  }

  const result: ExpenseTransaction = { ...newDoc, id: createdId };
  const localKey = `sks_expense_transactions_${safeUserId}`;
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, [result, ...localList]);
  return result;
};

export const updateExpenseTransaction = async (tx: ExpenseTransaction): Promise<void> => {
  const safeUserId = tx.userId || 'default';
  try {
    const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
    const { id, ...data } = tx;
    await updateDoc(ref, {
      ...data,
      amount: roundCurrency(tx.amount || 0),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore updateExpenseTransaction failed:', err);
  }

  const localKey = `sks_expense_transactions_${safeUserId}`;
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, localList.map((t) => (t.id === tx.id ? tx : t)));
};

export const deleteExpenseTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseTransaction failed:', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   5. BUDGETS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getMonthlyBudgets = async (userId: string): Promise<MonthlyBudget[]> => {
  const safeUserId = userId || 'default';
  const localKey = `sks_expense_budgets_${safeUserId}`;
  const localBudgets = getLocalData<MonthlyBudget[]>(localKey, []);

  try {
    if (userId) {
      const q = query(
        collection(db, BUDGETS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const budgets = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MonthlyBudget));
      setLocalData(localKey, budgets);
      return budgets.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    }
  } catch (err) {
    console.warn('Firestore getMonthlyBudgets failed, using local:', err);
  }

  return localBudgets.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
};

export const saveMonthlyBudget = async (
  userId: string,
  monthYear: string,
  overallBudget: number,
  categoryBudgets: Record<string, number>
): Promise<MonthlyBudget> => {
  const safeUserId = userId || 'default';
  const now = new Date().toISOString();

  const cleanedCategoryBudgets: Record<string, number> = {};
  Object.entries(categoryBudgets).forEach(([catId, val]) => {
    cleanedCategoryBudgets[catId] = roundCurrency(val || 0);
  });

  const roundedOverall = roundCurrency(overallBudget || 0);

  const newDoc = {
    userId: safeUserId,
    monthYear,
    overallBudget: roundedOverall,
    categoryBudgets: cleanedCategoryBudgets,
    createdAt: now,
    updatedAt: now,
  };

  let budgetId = `bdg_${monthYear}`;

  try {
    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('userId', '==', safeUserId),
      where('monthYear', '==', monthYear)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const existingDoc = snap.docs[0];
      budgetId = existingDoc.id;
      await updateDoc(doc(db, BUDGETS_COLLECTION, budgetId), {
        overallBudget: roundedOverall,
        categoryBudgets: cleanedCategoryBudgets,
        updatedAt: now,
      });
    } else {
      const ref = await addDoc(collection(db, BUDGETS_COLLECTION), newDoc);
      budgetId = ref.id;
    }
  } catch (err) {
    console.warn('Firestore saveMonthlyBudget failed, saving locally:', err);
  }

  const result: MonthlyBudget = { ...newDoc, id: budgetId };
  const localKey = `sks_expense_budgets_${safeUserId}`;
  const localList = getLocalData<MonthlyBudget[]>(localKey, []);
  const idx = localList.findIndex((b) => b.monthYear === monthYear);
  if (idx >= 0) {
    localList[idx] = result;
    setLocalData(localKey, localList);
  } else {
    setLocalData(localKey, [result, ...localList]);
  }

  return result;
};
