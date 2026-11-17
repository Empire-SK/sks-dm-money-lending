import { db, auth } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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

/**
 * Check if the user is a primary system administrator.
 */
export const isUserAdmin = (userEmail?: string | null): boolean => {
  const email = (userEmail || auth?.currentUser?.email || '').toLowerCase().trim();
  return (
    email === 'admin@sksdm.com' ||
    email === 'sabinksanthosh6@gmail.com' ||
    email === 'aaryanthampi00@gmail.com' ||
    email === 'admin@sks.com' ||
    email.startsWith('admin@')
  );
};

/**
 * Recovers legacy data across candidate storage keys.
 * Exclusively active for admin accounts to ensure 0 data loss during multi-tenant migration.
 */
export const recoverLegacyData = <T>(
  prefix: string,
  userEmail?: string | null
): T | null => {
  if (typeof window === 'undefined') return null;
  if (!isUserAdmin(userEmail)) return null;

  const candidateKeys = [
    `${prefix}_default`,
    `${prefix}_admin`,
    prefix,
    `${prefix}_undefined`,
    `${prefix}_null`,
  ];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k.startsWith(prefix) &&
        !candidateKeys.includes(k) &&
        !k.includes('2dhsrH3CxfVogBxZemmBhMy8Dgm1') // Never pull from amil's clean partition
      ) {
        candidateKeys.push(k);
      }
    }
  } catch (e) {
    console.warn('Error reading localStorage candidate keys:', e);
  }

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as T;
        }
      }
    } catch {}
  }

  return null;
};

/**
 * Multi-tenant storage key resolver:
 * Ensures complete separation of user workspaces.
 * If user is admin (admin@sksdm.com, etc.), it automatically restores legacy data to their scoped storage.
 * For ANY other user (e.g. amil@sksdm.com), they have an independent storage space based on their UID
 * and NEVER touch '_default' or see any other user's records.
 */
export const getUserScopedKey = (
  prefix: string,
  userId?: string | null,
  userEmail?: string | null
): string => {
  const authUser = auth?.currentUser;
  const effectiveUid =
    userId && userId !== 'default' && userId !== 'unauthenticated'
      ? userId
      : authUser?.uid || null;

  const isAdmin = isUserAdmin(userEmail || authUser?.email);

  // If no user is authenticated, use unauthenticated partition
  const safeId = effectiveUid ? effectiveUid : isAdmin ? 'admin' : 'unauthenticated';
  const scopedKey = `${prefix}_${safeId}`;

  // Auto-migrate legacy data ONLY for admin users if scopedKey is currently empty
  if (typeof window !== 'undefined' && isAdmin && safeId !== 'unauthenticated') {
    try {
      const existing = localStorage.getItem(scopedKey);
      if (!existing || existing === '[]' || existing === '{}') {
        const legacy = recoverLegacyData<any[]>(prefix, userEmail);
        if (legacy && Array.isArray(legacy) && legacy.length > 0) {
          localStorage.setItem(scopedKey, JSON.stringify(legacy));
        }
      }
    } catch (e) {
      console.warn('Migration to admin scoped key warning:', e);
    }
  }

  return scopedKey;
};

/* ══════════════════════════════════════════════════════════════
   1. ACCOUNTS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseAccounts = async (
  userId: string,
  userEmail?: string | null
): Promise<ExpenseAccount[]> => {
  const localKey = getUserScopedKey('sks_expense_accounts', userId, userEmail);
  let localAccounts = getLocalData<ExpenseAccount[]>(localKey, []);

  // For admin: if current local accounts is empty or only has 3 fresh zeroed defaults,
  // restore real legacy accounts (Canara Bank, Federal Bank, etc.) if available
  if (isUserAdmin(userEmail)) {
    const isOnlyFreshZeroDefaults =
      localAccounts.length === 3 &&
      localAccounts.every(
        (a) => (a.openingBalance === 0 || !a.openingBalance) && a.id.startsWith('acc_default_')
      );

    if (localAccounts.length === 0 || isOnlyFreshZeroDefaults) {
      const legacyAccounts = recoverLegacyData<ExpenseAccount[]>('sks_expense_accounts', userEmail);
      if (legacyAccounts && legacyAccounts.length > 0) {
        const hasRealAccounts = legacyAccounts.some(
          (a) => (a.openingBalance && a.openingBalance > 0) || !a.id.startsWith('acc_default_')
        );
        if (hasRealAccounts) {
          localAccounts = legacyAccounts;
          setLocalData(localKey, localAccounts);
        }
      }
    }
  }

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, ACCOUNTS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      let accounts: ExpenseAccount[] = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as ExpenseAccount)
      );

      if (accounts.length > 0) {
        setLocalData(localKey, accounts);
        return accounts.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      }
    }
  } catch (err) {
    console.warn('Firestore getExpenseAccounts failed, falling back to local:', err);
  }

  // Fallback to local accounts or initial defaults
  if (localAccounts.length > 0) return localAccounts;
  const defaults = getInitializedDefaultAccounts(userId || 'default');
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
  accountData: Omit<ExpenseAccount, 'id' | 'createdAt' | 'updatedAt'>,
  userEmail?: string | null
): Promise<ExpenseAccount> => {
  const now = new Date().toISOString();
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
  const localKey = getUserScopedKey('sks_expense_accounts', accountData.userId, userEmail);
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, [...localList, result]);
  return result;
};

export const updateExpenseAccount = async (
  account: ExpenseAccount,
  userEmail?: string | null
): Promise<void> => {
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

  const localKey = getUserScopedKey('sks_expense_accounts', account.userId, userEmail);
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, localList.map((a) => (a.id === account.id ? account : a)));
};

export const deleteExpenseAccount = async (
  id: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<void> => {
  try {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseAccount failed:', err);
  }

  const localKey = getUserScopedKey('sks_expense_accounts', userId, userEmail);
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, localList.filter((a) => a.id !== id));
};

/* ══════════════════════════════════════════════════════════════
   2. CATEGORIES SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseCategories = async (
  userId: string,
  userEmail?: string | null
): Promise<ExpenseCategory[]> => {
  const localKey = getUserScopedKey('sks_expense_categories', userId, userEmail);
  let localCats = getLocalData<ExpenseCategory[]>(localKey, []);

  if (isUserAdmin(userEmail) && localCats.length === 0) {
    const legacy = recoverLegacyData<ExpenseCategory[]>('sks_expense_categories', userEmail);
    if (legacy && legacy.length > 0) {
      localCats = legacy;
      setLocalData(localKey, localCats);
    }
  }

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      let categories: ExpenseCategory[] = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as ExpenseCategory)
      );

      if (categories.length > 0) {
        setLocalData(localKey, categories);
        return categories.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  } catch (err) {
    console.warn('Firestore getExpenseCategories failed, falling back to local/defaults:', err);
  }

  // Fallback to local categories or initial defaults
  if (localCats.length > 0) return localCats;
  const defaults = getInitializedDefaultCategories(userId || 'default');
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
  categoryData: Omit<ExpenseCategory, 'id' | 'createdAt'>,
  userEmail?: string | null
): Promise<ExpenseCategory> => {
  const now = new Date().toISOString();
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
  const localKey = getUserScopedKey('sks_expense_categories', categoryData.userId, userEmail);
  const localList = getLocalData<ExpenseCategory[]>(localKey, []);
  setLocalData(localKey, [...localList, result]);
  return result;
};

export const updateExpenseCategory = async (
  category: ExpenseCategory,
  userEmail?: string | null
): Promise<void> => {
  try {
    const ref = doc(db, CATEGORIES_COLLECTION, category.id);
    const { id, ...data } = category;
    await updateDoc(ref, data);
  } catch (err) {
    console.warn('Firestore updateExpenseCategory failed:', err);
  }

  const localKey = getUserScopedKey('sks_expense_categories', category.userId, userEmail);
  const localList = getLocalData<ExpenseCategory[]>(localKey, []);
  setLocalData(localKey, localList.map((c) => (c.id === category.id ? category : c)));
};

export const deleteExpenseCategory = async (
  id: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<void> => {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseCategory failed:', err);
  }

  const localKey = getUserScopedKey('sks_expense_categories', userId, userEmail);
  const localList = getLocalData<ExpenseCategory[]>(localKey, []);
  setLocalData(localKey, localList.filter((c) => c.id !== id));
};

/* ══════════════════════════════════════════════════════════════
   3. SALARY RECORDS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getSalaryRecords = async (
  userId: string,
  userEmail?: string | null
): Promise<SalaryRecord[]> => {
  const localKey = getUserScopedKey('sks_salary_records', userId, userEmail);
  let localRecords = getLocalData<SalaryRecord[]>(localKey, []);

  if (isUserAdmin(userEmail) && localRecords.length === 0) {
    const legacy =
      recoverLegacyData<SalaryRecord[]>('sks_salary_records', userEmail) ||
      recoverLegacyData<SalaryRecord[]>('sks_expense_salaries', userEmail);
    if (legacy && legacy.length > 0) {
      localRecords = legacy;
      setLocalData(localKey, localRecords);
    }
  }

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, SALARY_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const records = snap.docs.map((d) => ({ ...d.data(), id: d.id } as SalaryRecord));
        setLocalData(localKey, records);
        return records.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
      }
    }
  } catch (err) {
    console.warn('Firestore getSalaryRecords failed, using local:', err);
  }

  return localRecords.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
};

export const addSalaryRecord = async (
  salaryData: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt' | 'totalIncome'>,
  userEmail?: string | null
): Promise<SalaryRecord> => {
  const total = roundCurrency(
    (salaryData.baseSalary || 0) +
    (salaryData.bonus || 0) +
    (salaryData.incentive || 0) +
    (salaryData.otherIncome || 0)
  );

  const now = new Date().toISOString();
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
  const localKey = getUserScopedKey('sks_salary_records', salaryData.userId, userEmail);
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, [resultSalary, ...localList]);

  const txKey = getUserScopedKey('sks_expense_transactions', salaryData.userId, userEmail);
  const txList = getLocalData<ExpenseTransaction[]>(txKey, []);
  setLocalData(txKey, [{ ...linkedTransaction, id: `tx_sal_${salaryId}` }, ...txList]);

  return resultSalary;
};

export const updateSalaryRecord = async (
  salary: SalaryRecord,
  userEmail?: string | null
): Promise<void> => {
  const total = roundCurrency(
    (salary.baseSalary || 0) +
    (salary.bonus || 0) +
    (salary.incentive || 0) +
    (salary.otherIncome || 0)
  );

  const now = new Date().toISOString();

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

  const localKey = getUserScopedKey('sks_salary_records', salary.userId, userEmail);
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, localList.map((s) => (s.id === salary.id ? { ...salary, totalIncome: total, updatedAt: now } : s)));
};

export const deleteSalaryRecord = async (
  salaryId: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<void> => {
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

  const localKey = getUserScopedKey('sks_salary_records', userId, userEmail);
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, localList.filter((s) => s.id !== salaryId));

  const txKey = getUserScopedKey('sks_expense_transactions', userId, userEmail);
  const txList = getLocalData<ExpenseTransaction[]>(txKey, []);
  setLocalData(txKey, txList.filter((t) => t.salaryRecordId !== salaryId));
};

/* ══════════════════════════════════════════════════════════════
   4. TRANSACTIONS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getExpenseTransactions = async (
  userId: string,
  userEmail?: string | null
): Promise<ExpenseTransaction[]> => {
  const localKey = getUserScopedKey('sks_expense_transactions', userId, userEmail);
  let localTxs = getLocalData<ExpenseTransaction[]>(localKey, []);

  if (isUserAdmin(userEmail) && localTxs.length === 0) {
    const legacyTxs = recoverLegacyData<ExpenseTransaction[]>('sks_expense_transactions', userEmail);
    if (legacyTxs && legacyTxs.length > 0) {
      localTxs = legacyTxs;
      setLocalData(localKey, localTxs);
    }
  }

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const transactions = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id } as ExpenseTransaction)
        );
        setLocalData(localKey, transactions);
        return transactions.sort((a, b) => b.date.localeCompare(a.date));
      }
    }
  } catch (err) {
    console.warn('Firestore getExpenseTransactions failed, using local:', err);
  }

  return localTxs.sort((a, b) => b.date.localeCompare(a.date));
};

export const addExpenseTransaction = async (
  txData: Omit<ExpenseTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  userEmail?: string | null
): Promise<ExpenseTransaction> => {
  const now = new Date().toISOString();
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
  const localKey = getUserScopedKey('sks_expense_transactions', txData.userId, userEmail);
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, [result, ...localList]);
  return result;
};

export const updateExpenseTransaction = async (
  tx: ExpenseTransaction,
  userEmail?: string | null
): Promise<void> => {
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

  const localKey = getUserScopedKey('sks_expense_transactions', tx.userId, userEmail);
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, localList.map((t) => (t.id === tx.id ? tx : t)));
};

export const deleteExpenseTransaction = async (
  id: string,
  userId?: string | null,
  userEmail?: string | null
): Promise<void> => {
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
  } catch (err) {
    console.warn('Firestore deleteExpenseTransaction failed:', err);
  }

  const localKey = getUserScopedKey('sks_expense_transactions', userId, userEmail);
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, localList.filter((t) => t.id !== id));
};

/* ══════════════════════════════════════════════════════════════
   5. BUDGETS SERVICE
   ══════════════════════════════════════════════════════════════ */

export const getMonthlyBudgets = async (
  userId: string,
  userEmail?: string | null
): Promise<MonthlyBudget[]> => {
  const localKey = getUserScopedKey('sks_expense_budgets', userId, userEmail);
  let localBudgets = getLocalData<MonthlyBudget[]>(localKey, []);

  if (isUserAdmin(userEmail) && localBudgets.length === 0) {
    const legacy = recoverLegacyData<MonthlyBudget[]>('sks_expense_budgets', userEmail);
    if (legacy && legacy.length > 0) {
      localBudgets = legacy;
      setLocalData(localKey, localBudgets);
    }
  }

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, BUDGETS_COLLECTION),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const budgets = snap.docs.map((d) => ({ ...d.data(), id: d.id } as MonthlyBudget));
        setLocalData(localKey, budgets);
        return budgets.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
      }
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
  categoryBudgets: Record<string, number>,
  userEmail?: string | null
): Promise<MonthlyBudget> => {
  const now = new Date().toISOString();

  const cleanedCategoryBudgets: Record<string, number> = {};
  Object.entries(categoryBudgets).forEach(([catId, val]) => {
    cleanedCategoryBudgets[catId] = roundCurrency(val || 0);
  });

  const roundedOverall = roundCurrency(overallBudget || 0);

  const newDoc = {
    userId: userId || 'unauthenticated',
    monthYear,
    overallBudget: roundedOverall,
    categoryBudgets: cleanedCategoryBudgets,
    createdAt: now,
    updatedAt: now,
  };

  let budgetId = `bdg_${monthYear}`;

  try {
    if (userId && userId !== 'default' && userId !== 'unauthenticated') {
      const q = query(
        collection(db, BUDGETS_COLLECTION),
        where('userId', '==', userId),
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
    }
  } catch (err) {
    console.warn('Firestore saveMonthlyBudget failed, saving locally:', err);
  }

  const result: MonthlyBudget = { ...newDoc, id: budgetId };
  const localKey = getUserScopedKey('sks_expense_budgets', userId, userEmail);
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
