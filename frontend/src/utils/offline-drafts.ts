import { openDB } from 'idb';

const DB_NAME = 'posyandu-kms-drafts';
const STORE_NAME = 'checkup-drafts';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

export const saveCheckupDraft = async (toddlerId: string | number, data: unknown) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, data, `toddler-${toddlerId}`);
};

export const getCheckupDraft = async <T>(toddlerId: string | number) => {
  const db = await dbPromise;
  return (await db.get(STORE_NAME, `toddler-${toddlerId}`)) as T | undefined;
};

export const clearCheckupDraft = async (toddlerId: string | number) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, `toddler-${toddlerId}`);
};

