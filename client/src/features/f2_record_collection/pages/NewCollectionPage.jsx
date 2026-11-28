import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { F2Button, F2Card, F2Notice, F2Page, inputClassName } from '../components/F2Page.jsx'
import EvidencePhotoInput from '../components/EvidencePhotoInput.jsx'
import { useBoats, useF2User, useLandingSites } from '../hooks.js'
import { useF2Language } from '../i18n.js'
import { MATERIALS } from '../constants.js'
import { checkLocation } from '../offline/landingSite.js'
import { saveDraft } from '../offline/localDb.js'
import { syncQueue } from '../offline/syncQueue.js'

export default function NewCollectionPage() {
  const navigate = useNavigate()
  const initialBoat = useLocation().state?.boat
  const { user } = useF2User()
  const { t, translateServerMessage } = useF2Language()
  const { boats } = useBoats()
  const sites = useLandingSites()
  const [boatId, setBoatId] = useState(initialBoat?.id || '')
  const [weight, setWeight] = useState('')
  const [material, setMaterial] = useState('')
  const [note, setNote] = useState('')
  const [plastic, setPlastic] = useState(null)
  const [scale, setScale] = useState(null)
  const [plasticBusy, setPlasticBusy] = useState(false)
  const [scaleBusy, setScaleBusy] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const availableBoats = boats.length ? boats : initialBoat ? [initialBoat] : []
  const plasticCheck = checkLocation(sites.config, plastic?.gps)
  const scaleCheck = checkLocation(sites.config, scale?.gps)
  const busy = plasticBusy || scaleBusy
  useEffect(() => { if (!initialBoat) navigate('/record', { replace: true }) }, [initialBoat, navigate])

  function changePlastic(value) {
    setPlastic(value)
    // The load photo must come before the scale photo, including after a retake.
    setScale(null)
  }
  async function onSubmit(event) {
    event.preventDefault()
    if (savingRef.current || busy) return
    setError('')
    const boat = availableBoats.find((row) => String(row.id) === String(boatId))
    if (!boat) return setError(t('record.error_boat'))
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0) return setError(t('record.error_weight'))
    if (!material) return setError(t('record.error_material'))
    if (!plastic || !scale) return setError(t('chg004_evidence.two_photos_required'))
    if (!sites.config?.sites.length) return setError(t('f2.evidence.no_sites'))
    if (!plasticCheck?.allowed || !scaleCheck?.allowed) return setError(t('f2.evidence.location_blocked'))
    if (!user) return setError(t('f2.crew_required'))
    savingRef.current = true
    setSaving(true)
    const draft = {
      client_id: crypto.randomUUID(), owner_id: user.id,
      boat_id: boat.id, boat_code: boat.code, boat_name: boat.name,
      weight_kg: Number(weight), material, note: note.trim(),
      plastic_photo: plastic.blob, scale_photo: scale.blob,
      photo: scale.blob, // F3's offline thumbnail contract remains compatible.
      ...scale.gps,
      photo_locations: { PLASTIC: plastic.gps, SCALE: scale.gps },
      photo_captured_at: { PLASTIC: plastic.captured_at, SCALE: scale.captured_at },
      recorded_at: new Date().toISOString(), local_status: 'SAVED_ON_PHONE', last_error: '',
    }
    try {
      await saveDraft(draft)
      syncQueue().catch(() => {})
      navigate(`/record/saved?client_id=${draft.client_id}`)
    } catch (failure) {
      setError(`${t('f2.storage_error')} ${translateServerMessage(failure.message)}`)
      savingRef.current = false; setSaving(false)
    }
  }
  if (!initialBoat) return null
  return (
    <F2Page title={t('record.new_title')} description={t('f2.evidence.subtitle')} eyebrow={t('f2.title')} width="max-w-6xl" actions={<Link to="/record" className="text-sm font-semibold text-slate-600">{t('common.cancel')}</Link>}>
      <form onSubmit={onSubmit}>
        <F2Card>
          {error && <F2Notice tone="error" className="mb-5" role="alert">{error}</F2Notice>}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <p>{sites.loading ? t('common.loading') : sites.cached ? t('f2.evidence.cached_sites') : t('f2.evidence.site_rule', { radius: sites.config?.radius_m ?? '—' })}</p>
            <button type="button" onClick={sites.retry} className="min-h-10 font-semibold text-[#0c6e80] underline">{t('common.retry')}</button>
          </div>
          {sites.error && !sites.cached && <F2Notice tone="error" className="mb-4">{translateServerMessage(sites.error)}</F2Notice>}
          {!sites.loading && !sites.config?.sites.length && <F2Notice tone="warning" className="mb-4">{t('f2.evidence.no_sites')}</F2Notice>}
          <div className="grid gap-7 lg:grid-cols-2">
            <div className="space-y-5">
              <div><label htmlFor="collection-boat" className="mb-2 block text-sm font-semibold">{t('record.step_boat')}</label><select id="collection-boat" className={inputClassName} value={boatId} onChange={(event) => setBoatId(event.target.value)} disabled={saving}>{availableBoats.map((boat) => <option key={boat.id} value={boat.id}>{boat.code} · {boat.name}</option>)}</select></div>
              <div><label htmlFor="weight-kg" className="mb-2 block text-sm font-semibold">{t('record.weight_kg')} *</label><input id="weight-kg" type="number" min="0.001" step="any" inputMode="decimal" required className={inputClassName} placeholder={t('record.weight_hint')} value={weight} onChange={(event) => setWeight(event.target.value)} disabled={saving} /></div>
              <fieldset disabled={saving}><legend className="mb-2 text-sm font-semibold">{t('record.material')} *</legend><div className="flex flex-wrap gap-2">{MATERIALS.map((value) => <button key={value} type="button" aria-pressed={material === value} onClick={() => setMaterial(value)} className={`min-h-12 rounded-full border px-4 py-2 text-sm font-semibold ${material === value ? 'border-[#0c6e80] bg-[#0c6e80] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{t(`material.${value.toLowerCase()}`)}</button>)}</div></fieldset>
              <div><label htmlFor="collection-note" className="mb-2 block text-sm font-semibold">{t('record.note')} {t('common.optional')}</label><textarea id="collection-note" maxLength={500} rows={3} className={inputClassName} placeholder={t('record.note_hint')} value={note} onChange={(event) => setNote(event.target.value)} disabled={saving} /><p className="mt-1 text-xs text-slate-500">{note.length}/500</p></div>
              <F2Notice tone="info">{t('f2.evidence.capture_rule')}</F2Notice>
            </div>
            <div className="space-y-6">
              <EvidencePhotoInput kind="PLASTIC" value={plastic} config={sites.config} disabled={saving || busy || !sites.config} onChange={changePlastic} onBusy={setPlasticBusy} />
              <EvidencePhotoInput kind="SCALE" value={scale} config={sites.config} disabled={saving || busy || !plasticCheck?.allowed} onChange={setScale} onBusy={setScaleBusy} />
              {!plasticCheck?.allowed && <p className="text-xs text-slate-500">{t('f2.evidence.plastic_first')}</p>}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5"><p className="max-w-lg text-xs text-slate-500">{t('f2.evidence.save_hint')}</p><F2Button type="submit" disabled={saving || busy}>{t(saving ? 'record.saving' : 'record.save')}</F2Button></div>
        </F2Card>
      </form>
    </F2Page>
  )
}
