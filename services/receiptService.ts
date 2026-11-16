import { app } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

// Fallback IndexedDB setup for receipts
const DB_NAME = 'SKS_EXPENSE_RECEIPTS_DB';
const STORE_NAME = 'receipts';

const openReceiptDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToIndexedDB = async (id: string, fileData: string): Promise<string> => {
  const db = await openReceiptDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(fileData, id);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
};

export const getReceiptFromIndexedDB = async (id: string): Promise<string | null> => {
  try {
    const db = await openReceiptDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return null;
  }
};

const deleteFromIndexedDB = async (id: string): Promise<void> => {
  try {
    const db = await openReceiptDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error deleting from IndexedDB:', err);
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads a receipt file (image or pdf).
 * First attempts Firebase Storage; if that fails or isn't enabled, stores in client IndexedDB.
 */
export const uploadReceiptFile = async (
  userId: string,
  file: File
): Promise<{ url: string; fileName: string; storageType: 'firebase' | 'idb' }> => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds 5MB limit. Please choose a smaller image.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, PDF.');
  }

  const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // Try Firebase Storage if storageBucket is set
  try {
    const storage = getStorage(app);
    if (storage.app.options.storageBucket) {
      const storageRef = ref(storage, `users/${userId}/receipts/${cleanFileName}`);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return {
        url: downloadUrl,
        fileName: file.name,
        storageType: 'firebase',
      };
    }
  } catch (firebaseErr) {
    console.warn('Firebase Storage upload failed, falling back to secure local store:', firebaseErr);
  }

  // Fallback to IndexedDB (keeps data private and reliable without blocking the user)
  const base64Data = await fileToBase64(file);
  const idbKey = `receipt_${userId}_${cleanFileName}`;
  await saveToIndexedDB(idbKey, base64Data);

  return {
    url: base64Data, // Data URL works directly in <img src> and download
    fileName: file.name,
    storageType: 'idb',
  };
};

/**
 * Deletes a receipt attachment
 */
export const deleteReceiptFile = async (url: string): Promise<void> => {
  if (!url) return;
  try {
    if (url.startsWith('https://firebasestorage.googleapis.com')) {
      const storage = getStorage(app);
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    }
  } catch (err) {
    console.warn('Could not delete from Firebase Storage (may be already deleted or forbidden):', err);
  }
};
