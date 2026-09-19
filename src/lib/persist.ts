const DB_NAME = "data-tool-persist"
const DB_VERSION = 1
const FILE_STORE = "files"
const TABS_KEY = "data-tool-tabs"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(FILE_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface StoredFile {
  name: string
  type: string
  buffer: ArrayBuffer
}

export interface StoredTab {
  name: string
  query: string
}

export async function saveFile(name: string, type: string, buffer: ArrayBuffer): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite")
    tx.objectStore(FILE_STORE).put({ name, type, buffer } satisfies StoredFile, name)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteFile(name: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite")
    tx.objectStore(FILE_STORE).delete(name)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function loadFiles(): Promise<StoredFile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly")
    const req = tx.objectStore(FILE_STORE).getAll()
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export async function clearFiles(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite")
    tx.objectStore(FILE_STORE).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export function saveTabs(tabs: StoredTab[], activeTabId: string): void {
  localStorage.setItem(TABS_KEY, JSON.stringify({ tabs, activeTabId }))
}

export function loadTabs(): { tabs: StoredTab[]; activeTabId: string } | null {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
