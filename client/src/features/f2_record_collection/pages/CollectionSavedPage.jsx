import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { F2Card, F2Notice, F2Page } from '../components/F2Page.jsx'
import { getSubmission } from '../api.js'
import { useF2User } from '../hooks.js'
import { useF2Language } from '../i18n.js'
import { getDraft, getReceipt } from '../offline/localDb.js'
import { syncQueue } from '../offline/syncQueue.js'

export default function CollectionSavedPage() {
  const [params] = useSearchParams()
  const clientId = params.get('client_id')
  const { user } = useF2User()
  const { t, translateServerMessage } = useF2Language()
  const [record, setRecord] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!clientId || !user?.id) return undefined
    let active = true
    async function load() {
      try {
        const draft = await getDraft(clientId)
        const receipt = await getReceipt(user.id, clientId)
        if (!active) return
        if (receipt) { setRecord(receipt); setSent(true); setError('') }
        else if (draft?.owner_id === user.id) { setRecord(draft); setSent(false); setError(draft.last_error || '') }
        if (navigator.onLine && !draft) {
          const latest = await getSubmission(clientId)
          if (active) { setRecord(latest); setSent(true); setError('') }
        }
      } catch (failure) { if (active) setError(failure.message) }
      finally { if (active) setLoading(false) }
    }
    load()
    syncQueue().catch((failure) => { if (active) setError(failure.message) })
    window.addEventListener('f2-queue-change', load)
    window.addEventListener('online', load)
    return () => { active = false; window.removeEventListener('f2-queue-change', load); window.removeEventListener('online', load) }
  }, [clientId, user?.id])
  return (
    <F2Page title={t('record.saved_title')} description={t('record.saved_subtitle')} eyebrow={t('f2.title')} width="max-w-3xl">
      <F2Card>
        {loading && clientId && <p role="status">{t('f2.confirm_loading')}</p>}
        {error && <F2Notice tone="warning" className="mb-4" role="alert">{translateServerMessage(error)} <Link to="/send" className="underline">{t('f2.queue_link')}</Link></F2Notice>}
        {record ? <>
          <F2Notice tone={sent ? 'success' : 'info'} className="mb-5"><h2 className="font-semibold">{t(sent ? 'f2.db_saved' : 'f2.saved_phone')}</h2><p className="mt-1">{t(sent ? 'f2.sent_confirmed' : 'f2.pending_send')}</p></F2Notice>
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {[
              [t('f2.record_number'), record.record_number || '—'],
              [t('f2.boat'), `${record.boat_code} · ${record.boat_name}`],
              [t('record.weight_kg'), `${record.weight_kg} kg`],
              [t('record.material'), t(`material.${record.material.toLowerCase()}`)],
              [t('f2.status'), sent ? t(`status.${record.status.toLowerCase()}`) : t('status.saved_on_phone')],
              [t('f2.gps'), `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}`],
              [t('f2.recorded'), new Date(record.recorded_at).toLocaleString()],
              [t('chg004_evidence.landing_site'), record.landing_site_name || '—'],
            ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-3 px-4 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-semibold text-slate-900">{value}</dd></div>)}
          </dl>
          {sent && record.auto_verified && <F2Notice tone="success" className="mt-4"><strong>{t('chg003_auto_verify.auto_verified')}</strong><p>{t('chg003_auto_verify.rule_passed', { rule: record.verified_rule })}</p>{record.spot_check && <p>{t('chg003_auto_verify.spot_check')}</p>}</F2Notice>}
          {sent && record.flags?.length > 0 && <F2Notice tone="warning" className="mt-4"><strong>{t('f2.evidence.flags')}</strong><ul>{record.flags.map((flag, index) => <li key={index}>{flag.flag}: {flag.detail}</li>)}</ul></F2Notice>}
          {sent && <div className="mt-4 grid gap-4 sm:grid-cols-2">{(record.photos || [{ kind: 'SCALE', url: record.photo_url }]).map((photo) => <figure key={photo.kind}><figcaption className="mb-2 text-sm font-semibold">{t(photo.kind === 'PLASTIC' ? 'chg004_evidence.photo_plastic' : 'chg004_evidence.photo_scale')}</figcaption><img src={photo.url} alt={photo.kind} className="max-h-64 w-full rounded-lg object-contain" /></figure>)}</div>}
        </> : (!loading || !clientId) && <F2Notice tone="warning">{t('f2.not_found')}</F2Notice>}
        <div className="mt-6 flex flex-wrap justify-between gap-3"><Link to="/home" className="text-sm font-semibold text-slate-600 underline">{t('record.back_to_home')}</Link><Link to="/send" className="text-sm font-semibold text-[#0c6e80] underline">{t('f2.queue_link')}</Link><Link to="/record" className="text-sm font-semibold text-[#0c6e80] underline">{t('record.add_another')}</Link></div>
      </F2Card>
    </F2Page>
  )
}
