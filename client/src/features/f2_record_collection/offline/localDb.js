// FR-2.4: commit the photo Blob and metadata locally BEFORE any upload.
const DB_NAME = 'ocean-f2-records'
let database
export const changed = () => window.dispatchEvent(new Event('f2-queue-change'))

function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('drafts', { keyPath: 'client_id' }).createIndex('owner_id', 'owner_id')
      db.createObjectStore('meta')
    }
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = null }
      resolve(request.result)
    }
    request.onerror = () => { database = null; reject(request.error) }
    request.onblocked = () => { database = null; reject(new Error('Close other app tabs and try again.')) }
  })
  return database
}

async function transaction(store, mode, operation) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    let result
    const request = operation(tx.objectStore(store))
    request.onsuccess = () => { result = request.result }
    tx.oncomplete = () => resolve(result)
    tx.onabort = () => reject(tx.error || new Error('Local storage was not saved.'))
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveDraft(draft) {
  await transaction('drafts', 'readwrite', (store) => store.put(draft))
  changed()
}
export const getDraft = (id) => transaction('drafts', 'readonly', (store) => store.get(id))
export const listDrafts = (ownerId) => transaction('drafts', 'readonly', (store) => store.index('owner_id').getAll(ownerId))
export const getMeta = (key) => transaction('meta', 'readonly', (store) => store.get(key))
export const setMeta = (key, value) => transaction('meta', 'readwrite', (store) => store.put(value, key))
export const getReceipt = (ownerId, clientId) => getMeta(`receipt:${ownerId}:${clientId}`)

export async function confirmDraft(draft, record) {
  if (!record?.id || !record.record_number || record.client_id !== draft.client_id || record.crew_id !== draft.owner_id) {
    throw new Error('The server did not confirm this record. It remains on this phone.')
  }
  const db = await openDatabase()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(['drafts', 'meta'], 'readwrite')
    tx.objectStore('meta').put(record, `receipt:${draft.owner_id}:${draft.client_id}`)
    tx.objectStore('drafts').delete(draft.client_id)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error || new Error('Could not store the server confirmation.'))
  })
  changed()
}
