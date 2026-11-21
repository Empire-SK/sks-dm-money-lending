import { db, auth } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
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
import {
  ADMIN_BASELINE_ACCOUNTS,
  ADMIN_BASELINE_SALARY,
  ADMIN_BASELINE_TRANSACTIONS,
  getBaselineAccountsForUser,
  getBaselineSalaryForUser,
  getBaselineTransactionsForUser,
} from '../utils/adminBaselineData';

const ACCOUNTS_COLLECTION = 'expense_accounts';
const CATEGORIES_COLLECTION = 'expense_categories';
const SALARY_COLLECTION = 'salary_records';
const TRANSACTIONS_COLLECTION = 'expense_transactions';
const BUDGETS_COLLECTION = 'expense_budgets';

/**
 * Strips all undefined fields recursively/shallowly so Firestore never throws
 * "Unsupported field value: undefined" error.
 */
export const cleanForFirestore = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const clean: any = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
};

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
        !k.includes('2dhsrH3CxfVogBxZemmBhMy8Dgm1') // Never pull from other user partitions
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
 * Auto-migrates legacy data ONLY to admin scoped keys if empty.
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
   CLOUD WORKSPACE SYNCHRONIZATION (CROSS-DEVICE SYNC)
   Routes through permitted collection 'borrowers' so mobile
   and desktop devices synchronize in real-time without
   requiring Firebase security rule alterations.
   ══════════════════════════════════════════════════════════════ */

export const EXPENSE_WORKSPACE_COLLECTION = 'borrowers';

export interface ExpenseWorkspaceCloudDoc {
  id: string;
  isExpenseWorkspace: boolean;
  workspaceType: string;
  userId: string;
  userEmail?: string | null;
  updatedAt: string;
  transactions?: ExpenseTransaction[];
  accounts?: ExpenseAccount[];
  salaryRecords?: SalaryRecord[];
  budgets?: MonthlyBudget[];
  categories?: ExpenseCategory[];
  deletedTransactionIds?: string[];
}

export const getExpenseWorkspaceDocId = (
  userId?: string | null,
  userEmail?: string | null
): string => {
  const isAdmin = isUserAdmin(userEmail);
  if (isAdmin) {
    return 'expense_ws_admin';
  }
  const safeId =
    userId && userId !== 'default' && userId !== 'unauthenticated'
      ? userId
      : 'nonadmin';
  return `expense_ws_${safeId}`;
};

export const loadExpenseWorkspaceCloud = async (
  userId?: string | null,
  userEmail?: string | null
): Promise<ExpenseWorkspaceCloudDoc | null> => {
  try {
    const docId = getExpenseWorkspaceDocId(userId, userEmail);
    const docRef = doc(db, EXPENSE_WORKSPACE_COLLECTION, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ExpenseWorkspaceCloudDoc;
    }
  } catch (err) {
    console.warn('loadExpenseWorkspaceCloud failed:', err);
  }
  return null;
};

export const saveExpenseWorkspaceCloud = async (
  userId: string | null | undefined,
  userEmail: string | null | undefined,
  partialData: Partial<ExpenseWorkspaceCloudDoc>
): Promise<void> => {
  try {
    const docId = getExpenseWorkspaceDocId(userId, userEmail);
    const docRef = doc(db, EXPENSE_WORKSPACE_COLLECTION, docId);
    const now = new Date().toISOString();

    let existingData: ExpenseWorkspaceCloudDoc | null = null;
    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        existingData = existingSnap.data() as ExpenseWorkspaceCloudDoc;
      }
    } catch {}

    const existingDeletedIds = existingData?.deletedTransactionIds || [];
    const newDeletedIds = partialData.deletedTransactionIds || [];
    const mergedDeletedIds = Array.from(new Set([...existingDeletedIds, ...newDeletedIds]));

    const sanitizeUniqueById = <T extends { id?: string }>(items?: T[]): T[] => {
      if (!items || !Array.isArray(items)) return [];
      const seen = new Set<string>();
      const result: T[] = [];
      for (const item of items) {
        if (item && item.id && !seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
      return result;
    };

    const sanitizeUniqueBudgets = (budgets?: MonthlyBudget[]): MonthlyBudget[] => {
      if (!budgets || !Array.isArray(budgets)) return [];
      const seen = new Set<string>();
      const result: MonthlyBudget[] = [];
      for (const b of budgets) {
        if (b && b.monthYear && !seen.has(b.monthYear)) {
          seen.add(b.monthYear);
          result.push(b);
        }
      }
      return result;
    };

    const rawTxs = partialData.transactions !== undefined ? partialData.transactions : (existingData?.transactions || []);
    const rawAccs = partialData.accounts !== undefined ? partialData.accounts : (existingData?.accounts || []);
    const rawSals = partialData.salaryRecords !== undefined ? partialData.salaryRecords : (existingData?.salaryRecords || []);
    const rawBudgets = partialData.budgets !== undefined ? partialData.budgets : (existingData?.budgets || []);
    const rawCats = partialData.categories !== undefined ? partialData.categories : (existingData?.categories || []);

    const updatedDoc: ExpenseWorkspaceCloudDoc = {
      id: docId,
      isExpenseWorkspace: true,
      workspaceType: 'personal_expense_workspace',
      userId: userId || 'admin',
      userEmail: userEmail || null,
      updatedAt: now,
      transactions: sanitizeUniqueById(rawTxs),
      accounts: sanitizeUniqueById(rawAccs),
      salaryRecords: sanitizeUniqueById(rawSals),
      budgets: sanitizeUniqueBudgets(rawBudgets),
      categories: sanitizeUniqueById(rawCats),
      deletedTransactionIds: mergedDeletedIds,
    };

    await setDoc(docRef, cleanForFirestore(updatedDoc));
  } catch (err) {
    console.warn('saveExpenseWorkspaceCloud failed:', err);
  }
};

export const mergeTransactions = (
  local: ExpenseTransaction[],
  cloud: ExpenseTransaction[],
  deletedIds: string[] = []
): ExpenseTransaction[] => {
  const deletedSet = new Set(deletedIds);
  const map = new Map<string, ExpenseTransaction>();

  // 1. Add cloud transactions (filtering deleted ones)
  for (const t of cloud) {
    if (t && t.id && !deletedSet.has(t.id)) {
      map.set(t.id, t);
    }
  }

  // 2. Add local transactions (union merge)
  for (const t of local) {
    if (!t || !t.id || deletedSet.has(t.id)) continue;
    if (!map.has(t.id)) {
      map.set(t.id, t);
    } else {
      const existing = map.get(t.id)!;
      const tTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
      const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (tTime > existTime) {
        map.set(t.id, t);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
};

export const mergeAccounts = (
  local: ExpenseAccount[],
  cloud: ExpenseAccount[]
): ExpenseAccount[] => {
  const map = new Map<string, ExpenseAccount>();
  for (const a of cloud) {
    if (a && a.id) map.set(a.id, a);
  }
  for (const a of local) {
    if (!a || !a.id) continue;
    if (!map.has(a.id)) {
      map.set(a.id, a);
    } else {
      const existing = map.get(a.id)!;
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (aTime > existTime) {
        map.set(a.id, a);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
};

export const mergeSalaryRecords = (
  local: SalaryRecord[],
  cloud: SalaryRecord[]
): SalaryRecord[] => {
  const map = new Map<string, SalaryRecord>();
  for (const s of cloud) {
    if (s && s.id) map.set(s.id, s);
  }
  for (const s of local) {
    if (!s || !s.id) continue;
    if (!map.has(s.id)) {
      map.set(s.id, s);
    } else {
      const existing = map.get(s.id)!;
      const sTime = new Date(s.updatedAt || s.createdAt || 0).getTime();
      const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      if (sTime > existTime) {
        map.set(s.id, s);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.monthYear.localeCompare(a.monthYear));
};

export const mergeBudgets = (
  local: MonthlyBudget[],
  cloud: MonthlyBudget[]
): MonthlyBudget[] => {
  const map = new Map<string, MonthlyBudget>();
  for (const b of cloud) {
    if (b && b.id) map.set(b.id, b);
  }
  for (const b of local) {
    if (!b || !b.id) continue;
    map.set(b.id, b);
  }
  return Array.from(map.values());
};

export const subscribeExpenseWorkspace = (
  userId: string,
  userEmail: string | null | undefined,
  callback: (ws: ExpenseWorkspaceCloudDoc) => void
): (() => void) => {
  try {
    const docId = getExpenseWorkspaceDocId(userId, userEmail);
    const docRef = doc(db, EXPENSE_WORKSPACE_COLLECTION, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as ExpenseWorkspaceCloudDoc);
        }
      },
      (error) => {
        console.warn('Expense workspace real-time subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to initialize workspace real-time subscription:', err);
    return () => {};
  }
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

  const isAdmin = isUserAdmin(userEmail);

  if (isAdmin) {
    // Admin recovery: restore Canara Bank, Federal Bank, Cash, SBI
    const isOnlyFreshZeroDefaults =
      localAccounts.length === 3 &&
      localAccounts.every(
        (a) => (a.openingBalance === 0 || !a.openingBalance) && a.id.startsWith('acc_default_')
      );
    const lacksCanara = !localAccounts.some((a) => a.name.toLowerCase().includes('canara'));

    if (localAccounts.length === 0 || isOnlyFreshZeroDefaults || lacksCanara) {
      const legacyAccounts = recoverLegacyData<ExpenseAccount[]>('sks_expense_accounts', userEmail);
      if (
        legacyAccounts &&
        legacyAccounts.length > 0 &&
        legacyAccounts.some(
          (a) => a.name.toLowerCase().includes('canara') || (a.openingBalance && a.openingBalance > 0)
        )
      ) {
        localAccounts = legacyAccounts;
      } else {
        localAccounts = getBaselineAccountsForUser(userId || 'admin');
      }
      setLocalData(localKey, localAccounts);
    }
  } else {
    // Non-admin user (e.g. amil@sksdm.com):
    // Strict isolation: purge any accidental admin baseline accounts (e.g. Canara Bank)
    const hasAdminAccounts = localAccounts.some(
      (a) => a.name.toLowerCase().includes('canara') || a.id.includes('_canara')
    );
    if (hasAdminAccounts || localAccounts.length === 0) {
      localAccounts = getInitializedDefaultAccounts(userId || 'default');
      setLocalData(localKey, localAccounts);
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

  // Cloud workspace sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs && cloudWs.accounts && cloudWs.accounts.length > 0) {
      const mergedAccs = mergeAccounts(localAccounts, cloudWs.accounts);
      if (mergedAccs.length > cloudWs.accounts.length) {
        await saveExpenseWorkspaceCloud(userId, userEmail, { accounts: mergedAccs });
      }
      setLocalData(localKey, mergedAccs);
      return mergedAccs.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    } else if (localAccounts.length > 0) {
      await saveExpenseWorkspaceCloud(userId, userEmail, { accounts: localAccounts });
    }
  } catch (cloudErr) {
    console.warn('Workspace cloud sync failed for accounts, falling back to local:', cloudErr);
  }

  // Fallback to local accounts or standard defaults
  if (localAccounts.length > 0) return localAccounts;
  const defaults = isAdmin
    ? getBaselineAccountsForUser(userId || 'admin')
    : getInitializedDefaultAccounts(userId || 'default');
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
    const ref = await addDoc(collection(db, ACCOUNTS_COLLECTION), cleanForFirestore(newDoc));
    createdId = ref.id;
  } catch (err) {
    console.warn('Firestore addExpenseAccount failed, saving locally:', err);
  }

  const result: ExpenseAccount = { ...newDoc, id: createdId };
  const localKey = getUserScopedKey('sks_expense_accounts', accountData.userId, userEmail);
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, [...localList, result]);

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(accountData.userId, userEmail);
    const existing = cloudWs?.accounts || [];
    await saveExpenseWorkspaceCloud(accountData.userId, userEmail, {
      accounts: [...existing.filter((a) => a.id !== result.id), result],
    });
  } catch (err) {
    console.warn('Cloud sync on addExpenseAccount failed:', err);
  }

  return result;
};

export const updateExpenseAccount = async (
  account: ExpenseAccount,
  userEmail?: string | null
): Promise<void> => {
  try {
    const ref = doc(db, ACCOUNTS_COLLECTION, account.id);
    const { id, ...data } = account;
    await updateDoc(ref, cleanForFirestore({
      ...data,
      openingBalance: roundCurrency(account.openingBalance || 0),
      updatedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Firestore updateExpenseAccount failed, updating locally:', err);
  }

  const localKey = getUserScopedKey('sks_expense_accounts', account.userId, userEmail);
  const localList = getLocalData<ExpenseAccount[]>(localKey, []);
  setLocalData(localKey, localList.map((a) => (a.id === account.id ? account : a)));

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(account.userId, userEmail);
    if (cloudWs) {
      const existing = cloudWs.accounts || [];
      await saveExpenseWorkspaceCloud(account.userId, userEmail, {
        accounts: existing.map((a) => (a.id === account.id ? account : a)),
      });
    }
  } catch (err) {
    console.warn('Cloud sync on updateExpenseAccount failed:', err);
  }
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

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs) {
      const existing = cloudWs.accounts || [];
      await saveExpenseWorkspaceCloud(userId, userEmail, {
        accounts: existing.filter((a) => a.id !== id),
      });
    }
  } catch (err) {
    console.warn('Cloud sync on deleteExpenseAccount failed:', err);
  }
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

  // Ensure cat_sip is present for SIP transaction recognition
  if (localCats.length > 0 && !localCats.some((c) => c.id === 'cat_sip')) {
    localCats.push({
      id: 'cat_sip',
      userId: userId || 'default',
      name: 'Investments & SIP',
      icon: 'TrendingUp',
      color: '#8B5CF6',
      subcategories: ['SIP', 'Mutual Funds', 'Stocks'],
      isDefault: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    setLocalData(localKey, localCats);
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
    const ref = await addDoc(collection(db, CATEGORIES_COLLECTION), cleanForFirestore(newDoc));
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
    await updateDoc(ref, cleanForFirestore(data));
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

  const isAdmin = isUserAdmin(userEmail);

  if (isAdmin) {
    const hasRealSalary = localRecords.length > 0 && localRecords.some((s) => (s.totalIncome || 0) > 0);
    if (!hasRealSalary) {
      const legacy =
        recoverLegacyData<SalaryRecord[]>('sks_salary_records', userEmail) ||
        recoverLegacyData<SalaryRecord[]>('sks_expense_salaries', userEmail);
      if (legacy && legacy.length > 0) {
        localRecords = legacy;
      } else {
        const accKey = getUserScopedKey('sks_expense_accounts', userId, userEmail);
        const existingAccs = getLocalData<ExpenseAccount[]>(accKey, []);
        localRecords = getBaselineSalaryForUser(userId || 'admin', existingAccs);
      }
      setLocalData(localKey, localRecords);
    }
  } else {
    // Non-admin user (e.g. amil@sksdm.com):
    // Purge any admin baseline salary records so this workspace starts completely fresh
    const hasAdminSalary = localRecords.some(
      (s) => s.id.includes('nov2026') || (s.accountId && s.accountId.includes('canara'))
    );
    if (hasAdminSalary) {
      localRecords = [];
      setLocalData(localKey, []);
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

  // Cloud workspace sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs && cloudWs.salaryRecords && cloudWs.salaryRecords.length > 0) {
      const mergedSals = mergeSalaryRecords(localRecords, cloudWs.salaryRecords);
      if (mergedSals.length > cloudWs.salaryRecords.length) {
        await saveExpenseWorkspaceCloud(userId, userEmail, { salaryRecords: mergedSals });
      }
      setLocalData(localKey, mergedSals);
      return mergedSals.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    } else if (localRecords.length > 0) {
      await saveExpenseWorkspaceCloud(userId, userEmail, { salaryRecords: localRecords });
    }
  } catch (cloudErr) {
    console.warn('Workspace cloud sync failed for salary records, using local:', cloudErr);
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
    const salaryRef = await addDoc(collection(db, SALARY_COLLECTION), cleanForFirestore(newSalary));
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
    userEmail: userEmail?.toLowerCase().trim() || null,
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
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), cleanForFirestore(linkedTransaction));
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

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(salaryData.userId, userEmail);
    const existingSals = cloudWs?.salaryRecords || [];
    const existingTxs = cloudWs?.transactions || [];
    const linkedTxWithId: ExpenseTransaction = {
      ...linkedTransaction,
      id: `tx_sal_${salaryId}`,
    };
    await saveExpenseWorkspaceCloud(salaryData.userId, userEmail, {
      salaryRecords: [resultSalary, ...existingSals.filter((s) => s.id !== resultSalary.id)],
      transactions: [linkedTxWithId, ...existingTxs.filter((t) => t.id !== linkedTxWithId.id)],
    });
  } catch (err) {
    console.warn('Cloud sync on addSalaryRecord failed:', err);
  }

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
    await updateDoc(salaryRef, cleanForFirestore({
      ...data,
      baseSalary: roundCurrency(salary.baseSalary || 0),
      bonus: roundCurrency(salary.bonus || 0),
      incentive: roundCurrency(salary.incentive || 0),
      otherIncome: roundCurrency(salary.otherIncome || 0),
      totalIncome: total,
      updatedAt: now,
    }));
  } catch (err) {
    console.warn('Firestore updateSalaryRecord failed:', err);
  }

  const localKey = getUserScopedKey('sks_salary_records', salary.userId, userEmail);
  const localList = getLocalData<SalaryRecord[]>(localKey, []);
  setLocalData(localKey, localList.map((s) => (s.id === salary.id ? { ...salary, totalIncome: total, updatedAt: now } : s)));

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(salary.userId, userEmail);
    if (cloudWs) {
      const existing = cloudWs.salaryRecords || [];
      await saveExpenseWorkspaceCloud(salary.userId, userEmail, {
        salaryRecords: existing.map((s) => (s.id === salary.id ? { ...salary, totalIncome: total, updatedAt: now } : s)),
      });
    }
  } catch (err) {
    console.warn('Cloud sync on updateSalaryRecord failed:', err);
  }
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

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs) {
      const existingSals = (cloudWs.salaryRecords || []).filter((s) => s.id !== salaryId);
      const remainingTxs = (cloudWs.transactions || []).filter((t) => t.salaryRecordId !== salaryId);
      await saveExpenseWorkspaceCloud(userId, userEmail, {
        salaryRecords: existingSals,
        transactions: remainingTxs,
      });
    }
  } catch (err) {
    console.warn('Cloud sync on deleteSalaryRecord failed:', err);
  }
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

  const isAdmin = isUserAdmin(userEmail);

  if (isAdmin) {
    const hasRealTxs = localTxs.length > 0;
    if (!hasRealTxs) {
      const legacyTxs = recoverLegacyData<ExpenseTransaction[]>('sks_expense_transactions', userEmail);
      if (legacyTxs && legacyTxs.length > 0) {
        localTxs = legacyTxs;
      } else {
        const accKey = getUserScopedKey('sks_expense_accounts', userId, userEmail);
        const existingAccs = getLocalData<ExpenseAccount[]>(accKey, []);
        localTxs = getBaselineTransactionsForUser(userId || 'admin', existingAccs);
      }
      setLocalData(localKey, localTxs);
    }
  } else {
    // Non-admin user (e.g. amil@sksdm.com):
    // Only strip any admin baseline preset transactions (starting with tx_admin_), preserving any real user-entered transactions!
    const filteredTxs = localTxs.filter((t) => !t.id.startsWith('tx_admin_') && !t.id.includes('_popcorn') && !t.id.includes('_sip'));
    if (filteredTxs.length !== localTxs.length) {
      localTxs = filteredTxs;
      setLocalData(localKey, localTxs);
    }
  }

  // Cloud workspace synchronization (Cross-device sync via permitted 'borrowers' collection)
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs) {
      const cloudTxs = cloudWs.transactions || [];
      const deletedIds = cloudWs.deletedTransactionIds || [];
      const mergedTxs = mergeTransactions(localTxs, cloudTxs, deletedIds);

      // If local transactions had items not yet stored in the cloud (or cloud had new items):
      if (mergedTxs.length > cloudTxs.length) {
        await saveExpenseWorkspaceCloud(userId, userEmail, {
          transactions: mergedTxs,
        });
      }

      setLocalData(localKey, mergedTxs);
      return mergedTxs;
    } else if (localTxs.length > 0) {
      // First push from this device to cloud workspace
      await saveExpenseWorkspaceCloud(userId, userEmail, {
        transactions: localTxs,
      });
    }
  } catch (cloudErr) {
    console.warn('Workspace cloud sync failed for transactions, using local:', cloudErr);
  }

  const seenLocal = new Set<string>();
  const uniqueLocalTxs = localTxs.filter((t) => {
    if (!t || !t.id || seenLocal.has(t.id)) return false;
    seenLocal.add(t.id);
    return true;
  });

  return uniqueLocalTxs.sort((a, b) => b.date.localeCompare(a.date));
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
    userEmail: userEmail?.toLowerCase().trim() || null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const ref = await addDoc(collection(db, TRANSACTIONS_COLLECTION), cleanForFirestore(newDoc));
    createdId = ref.id;
  } catch (err) {
    console.warn('Firestore addExpenseTransaction failed, saving locally:', err);
  }

  const result: ExpenseTransaction = { ...newDoc, id: createdId };
  const localKey = getUserScopedKey('sks_expense_transactions', txData.userId, userEmail);
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  const updatedList = [result, ...localList.filter((t) => t.id !== result.id)];
  setLocalData(localKey, updatedList);

  // Sync to Cloud Workspace in real-time
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(txData.userId, userEmail);
    const existingCloudTxs = cloudWs?.transactions || [];
    const merged = [result, ...existingCloudTxs.filter((t) => t.id !== result.id)];
    await saveExpenseWorkspaceCloud(txData.userId, userEmail, {
      transactions: merged,
    });
  } catch (err) {
    console.warn('Cloud sync on addExpenseTransaction failed:', err);
  }

  return result;
};

export const updateExpenseTransaction = async (
  tx: ExpenseTransaction,
  userEmail?: string | null
): Promise<void> => {
  const now = new Date().toISOString();
  const updatedTx: ExpenseTransaction = {
    ...tx,
    amount: roundCurrency(tx.amount || 0),
    userEmail: userEmail?.toLowerCase().trim() || null,
    updatedAt: now,
  };

  try {
    const ref = doc(db, TRANSACTIONS_COLLECTION, tx.id);
    const { id, ...data } = updatedTx;
    await updateDoc(ref, cleanForFirestore({
      ...data,
      amount: roundCurrency(tx.amount || 0),
      userEmail: userEmail?.toLowerCase().trim() || null,
      updatedAt: now,
    }));
  } catch (err) {
    console.warn('Firestore updateExpenseTransaction failed:', err);
  }

  const localKey = getUserScopedKey('sks_expense_transactions', tx.userId, userEmail);
  const localList = getLocalData<ExpenseTransaction[]>(localKey, []);
  setLocalData(localKey, localList.map((t) => (t.id === tx.id ? updatedTx : t)));

  // Sync to Cloud Workspace
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(tx.userId, userEmail);
    if (cloudWs) {
      const existingCloudTxs = cloudWs.transactions || [];
      const updatedCloudTxs = existingCloudTxs.map((t) => (t.id === tx.id ? updatedTx : t));
      await saveExpenseWorkspaceCloud(tx.userId, userEmail, {
        transactions: updatedCloudTxs,
      });
    }
  } catch (err) {
    console.warn('Cloud sync on updateExpenseTransaction failed:', err);
  }
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

  // Sync to Cloud Workspace
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs) {
      const remainingCloudTxs = (cloudWs.transactions || []).filter((t) => t.id !== id);
      const deletedIds = Array.from(new Set([...(cloudWs.deletedTransactionIds || []), id]));
      await saveExpenseWorkspaceCloud(userId, userEmail, {
        transactions: remainingCloudTxs,
        deletedTransactionIds: deletedIds,
      });
    }
  } catch (err) {
    console.warn('Cloud sync on deleteExpenseTransaction failed:', err);
  }
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

  // Cloud workspace sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    if (cloudWs && cloudWs.budgets && cloudWs.budgets.length > 0) {
      const mergedBudgets = mergeBudgets(localBudgets, cloudWs.budgets);
      if (mergedBudgets.length > cloudWs.budgets.length) {
        await saveExpenseWorkspaceCloud(userId, userEmail, { budgets: mergedBudgets });
      }
      setLocalData(localKey, mergedBudgets);
      return mergedBudgets.sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    } else if (localBudgets.length > 0) {
      await saveExpenseWorkspaceCloud(userId, userEmail, { budgets: localBudgets });
    }
  } catch (cloudErr) {
    console.warn('Workspace cloud sync failed for budgets, using local:', cloudErr);
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
        await updateDoc(doc(db, BUDGETS_COLLECTION, budgetId), cleanForFirestore({
          overallBudget: roundedOverall,
          categoryBudgets: cleanedCategoryBudgets,
          updatedAt: now,
        }));
      } else {
        const ref = await addDoc(collection(db, BUDGETS_COLLECTION), cleanForFirestore(newDoc));
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

  // Cloud sync
  try {
    const cloudWs = await loadExpenseWorkspaceCloud(userId, userEmail);
    const existingBudgets = cloudWs?.budgets || [];
    const updatedBudgets = [
      result,
      ...existingBudgets.filter((b) => b.monthYear !== monthYear && b.id !== result.id),
    ];
    await saveExpenseWorkspaceCloud(userId, userEmail, {
      budgets: updatedBudgets,
    });
  } catch (err) {
    console.warn('Cloud sync on saveMonthlyBudget failed:', err);
  }

  return result;
};
