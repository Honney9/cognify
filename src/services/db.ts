import { openDB } from 'idb';

const DB_NAME = 'CognifyOffline';
const STORE_NAME = 'files';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('category', 'category', { unique: false });
      }
    },
  });
};

export const saveFileOffline = async (file: File, category: string) => {
  const db = await initDB();
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const entry = {
    name: file.name,
    category,
    date,
    size: (file.size / 1024).toFixed(1) + ' KB',
    type: file.type,
    blob: file, 
    snippet: `Offline stored ${category.toLowerCase()} file.`
  };
  
  return db.add(STORE_NAME, entry);
};

export const getFilesByCategory = async (category: string) => {
  const db = await initDB();
  if (category === "All") return db.getAll(STORE_NAME);
  return db.getAllFromIndex(STORE_NAME, 'category', category);
};

// --- NEW: Added Delete Function ---
export const deleteFileById = async (id: number) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};