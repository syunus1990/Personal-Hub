/**
 * Personal Hub IndexedDB Storage Layer
 * Provides robust offline-first persistence for Wishlists, Transactions, Loans, Diagnostics, Notes, and Accounts.
 */

const DB_NAME = 'PersonalHubDB';
const DB_VERSION = 2;

export const STORES = {
  WISHLIST: 'wishlist',
  TRANSACTIONS: 'transactions',
  LOANS: 'loans',
  DIAGNOSTICS: 'diagnostics',
  NOTES: 'notes',
  ACCOUNTS: 'accounts',
} as const;

export interface IDBWishlistItem {
  id: string;
  itemName: string;
  estimatedPrice: number;
  currency: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  isPurchased: boolean;
  category?: string;
  savedAmountSAR?: number;
}

let dbInstance: IDBDatabase | null = null;

export function openPersonalHubDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }

    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. Wishlist Store
      if (!db.objectStoreNames.contains(STORES.WISHLIST)) {
        const wishlistStore = db.createObjectStore(STORES.WISHLIST, { keyPath: 'id' });
        wishlistStore.createIndex('itemName', 'itemName', { unique: false });
        wishlistStore.createIndex('isPurchased', 'isPurchased', { unique: false });
        wishlistStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Transactions Store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      // 3. Loans Store
      if (!db.objectStoreNames.contains(STORES.LOANS)) {
        const loanStore = db.createObjectStore(STORES.LOANS, { keyPath: 'id' });
        loanStore.createIndex('type', 'type', { unique: false });
        loanStore.createIndex('person', 'person', { unique: false });
      }

      // 4. Diagnostics & Tasks Store
      if (!db.objectStoreNames.contains(STORES.DIAGNOSTICS)) {
        const diagStore = db.createObjectStore(STORES.DIAGNOSTICS, { keyPath: 'id' });
        diagStore.createIndex('target', 'target', { unique: false });
      }

      // 5. Notes Store
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
      }

      // 6. Accounts Store
      if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
        db.createObjectStore(STORES.ACCOUNTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Generic Put helper for IndexedDB store
 */
export async function idbPut<T>(storeName: string, item: T): Promise<void> {
  try {
    const db = await openPersonalHubDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB put failed for ${storeName}:`, err);
  }
}

/**
 * Generic GetAll helper for IndexedDB store
 */
export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openPersonalHubDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getAll failed for ${storeName}:`, err);
    return [];
  }
}

/**
 * Generic Delete helper for IndexedDB store
 */
export async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const db = await openPersonalHubDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`IndexedDB delete failed for ${storeName}:`, err);
  }
}

/**
 * Save wishlist item into IndexedDB
 */
export async function saveWishlistToIDB(item: IDBWishlistItem): Promise<void> {
  return idbPut(STORES.WISHLIST, item);
}

/**
 * Get all wishlist items from IndexedDB
 */
export async function getAllWishlistsFromIDB(): Promise<IDBWishlistItem[]> {
  return idbGetAll<IDBWishlistItem>(STORES.WISHLIST);
}
