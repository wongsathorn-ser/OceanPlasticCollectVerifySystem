import { useState } from 'react'
import { Link } from 'react-router'
import { F2Button, F2Card, F2Notice, F2Page } from '../components/F2Page.jsx'
import { useF2User, useQueue } from '../hooks.js'
import { useF2Language } from '../i18n.js'
import { syncQueue } from '../offline/syncQueue.js'

export default function SendPage() {
  const { user } = useF2User()
  const { drafts, error: storageError } = useQueue(user?.id)
  const { t, translateServerMessage } = useF2Language()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  async function sendAll() {
    setBusy(true); setError('')
    try { setResults(await syncQueue()) }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return (
    <F2Page title={t('record.send_title')} description={t('f2.queue_hint')} eyebrow={t('f2.title')} actions={<F2Button type="button" onClick={sendAll} disabled={busy || !drafts.length}>{t(busy ? 'f2.sending' : 'f2.send_all')}</F2Button>}>
      <F2Card>
        <p role="status" className="mb-4 font-semibold">{t('common.records_count', { count: drafts.length })}</p>
        {(error || storageError) && <F2Notice tone="error" className="mb-4" role="alert">{translateServerMessage(error || storageError)} <Link to="/signin" className="underline">{t('f2.signin')}</Link></F2Notice>}
        {results.some((result) => result.record) && <F2Notice tone="success" className="mb-4">{t('f2.sent_count', { count: results.filter((result) => result.record).length })}</F2Notice>}
        {drafts.length === 0 && <F2Notice tone="success">{t('f2.queue_empty')}</F2Notice>}
        <ul className="space-y-3">{drafts.map((draft) => <li key={draft.client_id} className="rounded-lg border border-slate-200 p-4"><p className="font-semibold">{draft.boat_code} · {draft.weight_kg} kg · {t(`material.${draft.material.toLowerCase()}`)}</p><p className="mt-1 text-xs text-slate-500">{new Date(draft.recorded_at).toLocaleString()} · {draft.local_status === 'SENDING' ? t('f2.sending') : t('f2.saved_phone')}</p>{!draft.plastic_photo && <p className="mt-2 text-sm text-amber-800">{t('f2.evidence.legacy')}</p>}{draft.last_error && <p className="mt-2 text-sm text-red-700">{translateServerMessage(draft.last_error)}</p>}<Link to={`/record/saved?client_id=${draft.client_id}`} className="mt-2 inline-block text-sm text-[#0c6e80] underline">{t('f2.review')}</Link></li>)}</ul>
        <ul className="mt-4 space-y-2">{results.filter((result) => result.record).map((result) => <li key={result.client_id} className="text-sm text-emerald-800">{result.record.record_number} · {t('f2.sent')}</li>)}</ul>
        <Link to="/record" className="mt-6 inline-block text-sm font-semibold text-[#0c6e80] underline">{t('record.back_to_recording')}</Link>
      </F2Card>
    </F2Page>
  )
}
