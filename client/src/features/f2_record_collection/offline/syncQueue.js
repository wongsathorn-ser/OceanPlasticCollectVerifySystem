import { getMe } from '../../f1_accounts/api.js'
import { uploadRecord } from '../api.js'
import { confirmDraft, listDrafts, saveDraft } from './localDb.js'

let running
async function sendPending() {
  const results = []
  if (!navigator.onLine) return results
  // Check the actual cookie session, never a cached user or a posted crew_id.
  const user = await getMe()
  if (user.role !== 'CREW_MEMBER') return results
  const drafts = await listDrafts(user.id)
  for (const draft of drafts) {
    if (!navigator.onLine) break
    await saveDraft({ ...draft, local_status: 'SENDING', last_error: '' })
    try {
      const record = await uploadRecord(draft)
      await confirmDraft(draft, record)
      results.push({ client_id: draft.client_id, record })
    } catch (error) {
      // Restore the complete Blob on every failure, including session expiry.
      await saveDraft({ ...draft, local_status: 'SAVED_ON_PHONE', last_error: error.message })
      results.push({ client_id: draft.client_id, error: error.message })
      if (error.status === 401 || error.status === 403 || error.status === 409) break
    }
  }
  return results
}

export function syncQueue() {
  if (!running) {
    const work = () => sendPending()
    running = (navigator.locks
      ? navigator.locks.request('ocean-f2-sync', work)
      : work()).finally(() => { running = null })
  }
  return running
}
