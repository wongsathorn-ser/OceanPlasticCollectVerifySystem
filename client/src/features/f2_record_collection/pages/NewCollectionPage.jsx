import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { F2Button, F2Card, F2Notice, F2Page, inputClassName } from '../components/F2Page.jsx'
import { useBoats, useF2User } from '../hooks.js'
import { useF2Language } from '../i18n.js'
import { MATERIALS } from '../constants.js'
import { captureLocation } from '../offline/location.js'
import { preparePhoto } from '../offline/photo.js'
import { saveDraft } from '../offline/localDb.js'
import { syncQueue } from '../offline/syncQueue.js'

export default function NewCollectionPage() {
  const navigate = useNavigate()
  const initialBoat = useLocation().state?.boat
  const { user } = useF2User()
  const { t } = useF2Language()
  const { boats } = useBoats()
  const [boatId, setBoatId] = useState(initialBoat?.id || '')
  const [weight, setWeight] = useState('')
  const [material, setMaterial] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const photoImage = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [gps, setGps] = useState(null)
  const [gpsBusy, setGpsBusy] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)
  const savingRef = useRef(false)
  const availableBoats = boats.length ? boats : initialBoat ? [initialBoat] : []

  async function getGps() {
    const current = ++requestId.current
    setGps(null); setGpsError(''); setGpsBusy(true)
    try {
      const fix = await captureLocation()
      if (current === requestId.current) setGps(fix)
    } catch (failure) { if (current === requestId.current) setGpsError(failure.message) }
    finally { if (current === requestId.current) setGpsBusy(false) }
  }
  useEffect(() => {
    if (!initialBoat) navigate('/record', { replace: true })
    // A fresh geolocation request synchronizes the browser location on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getGps()
    return () => { requestId.current += 1 }
  }, [initialBoat, navigate])
  useEffect(() => {
    if (!photo || !photoImage.current) return undefined
    const url = URL.createObjectURL(photo)
    photoImage.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [photo])

  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(''); setPhoto(null); setPhotoBusy(true)
    // Bind the GPS fix to this evidence capture, not to a later upload.
    getGps()
    try { setPhoto(await preparePhoto(file)) }
    catch (failure) { setError(failure.message) }
    finally { setPhotoBusy(false) }
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (savingRef.current) return
    setError('')
    const boat = availableBoats.find((row) => String(row.id) === String(boatId))
    if (!boat) return setError(t('record.error_boat'))
    if (!Number.isFinite(Number(weight)) || Number(weight) <= 0) return setError(t('record.error_weight'))
    if (!material) return setError(t('record.error_material'))
    if (!photo) return setError(t('record.error_photo'))
    if (!gps || gpsBusy) return setError(t('f2.gps_wait'))
    if (!user) return setError(t('f2.crew_required'))
    savingRef.current = true
    setSaving(true)
    const draft = {
      client_id: crypto.randomUUID(), owner_id: user.id,
      boat_id: boat.id, boat_code: boat.code, boat_name: boat.name,
      weight_kg: Number(weight), material, note: note.trim(), photo,
      ...gps, recorded_at: new Date().toISOString(), local_status: 'SAVED_ON_PHONE', last_error: '',
    }
    try {
      await saveDraft(draft)
      // A failing network call cannot undo the completed IndexedDB transaction.
      syncQueue().catch(() => {})
      navigate(`/record/saved?client_id=${draft.client_id}`)
    } catch (failure) {
      setError(`${t('f2.storage_error')} ${failure.message}`)
      savingRef.current = false; setSaving(false)
    }
  }

  if (!initialBoat) return null
  return (
    <F2Page title={t('record.new_title')} description={t('record.new_subtitle')} eyebrow={t('f2.title')} width="max-w-6xl" actions={<Link to="/record" className="text-sm font-semibold text-slate-600">{t('common.cancel')}</Link>}>
      <form onSubmit={onSubmit}>
        <F2Card>
          {error && <F2Notice tone="error" className="mb-5" role="alert">{error}</F2Notice>}
          <div className="grid gap-7 lg:grid-cols-2">
            <div className="space-y-5">
              <div><label htmlFor="collection-boat" className="mb-2 block text-sm font-semibold">{t('record.step_boat')}</label><select id="collection-boat" className={inputClassName} value={boatId} onChange={(event) => setBoatId(event.target.value)} disabled={saving}>{availableBoats.map((boat) => <option key={boat.id} value={boat.id}>{boat.code} · {boat.name}</option>)}</select></div>
              <div><label htmlFor="weight-kg" className="mb-2 block text-sm font-semibold">{t('record.weight_kg')} *</label><input id="weight-kg" type="number" min="0.001" step="any" inputMode="decimal" required className={inputClassName} placeholder={t('record.weight_hint')} value={weight} onChange={(event) => setWeight(event.target.value)} disabled={saving} /></div>
              <fieldset disabled={saving}><legend className="mb-2 text-sm font-semibold">{t('record.material')} *</legend><div className="flex flex-wrap gap-2">{MATERIALS.map((value) => <button key={value} type="button" aria-pressed={material === value} onClick={() => setMaterial(value)} className={`min-h-12 rounded-full border px-4 py-2 text-sm font-semibold ${material === value ? 'border-[#0c6e80] bg-[#0c6e80] text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{t(`material.${value.toLowerCase()}`)}</button>)}</div></fieldset>
              <div><label htmlFor="collection-note" className="mb-2 block text-sm font-semibold">{t('record.note')} {t('common.optional')}</label><textarea id="collection-note" maxLength={500} rows={3} className={inputClassName} placeholder={t('record.note_hint')} value={note} onChange={(event) => setNote(event.target.value)} disabled={saving} /><p className="mt-1 text-xs text-slate-500">{note.length}/500</p></div>
              <section aria-label={t('f2.gps')} className="space-y-3 rounded-xl border border-slate-200 p-4">
                <h2 className="text-sm font-semibold">{t('f2.gps')} *</h2>
                {gpsBusy && <p role="status" className="text-sm">{t('record.gps_getting')}</p>}
                {gpsError && <F2Notice tone="error" role="alert">{gpsError}</F2Notice>}
                {gps && <div className="text-sm text-slate-600"><p>{gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</p><p>{t('f2.accuracy', { meters: Math.round(gps.gps_accuracy_m) })}</p><p>{t('f2.capture_time', { time: new Date(gps.gps_captured_at).toLocaleTimeString() })}</p></div>}
                <F2Button type="button" variant="secondary" disabled={gpsBusy || saving} onClick={getGps}>{t('f2.gps_retry')}</F2Button>
              </section>
            </div>
            <section>
              <h2 className="mb-2 text-sm font-semibold">{t('record.scale_photo')} *</h2>
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#f5f8f9] p-4 text-center">
                {photo ? <img ref={photoImage} alt={t('record.photo_preview')} className="max-h-72 w-full rounded-lg object-contain" /> : <div><p className="font-semibold">{t('record.scale_photo_hint')}</p><p className="mt-2 text-sm text-slate-500">{t('record.scale_photo_rule')}</p></div>}
                <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">{t(photoBusy ? 'f2.processing' : photo ? 'record.retake_photo' : 'record.take_photo')}<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={choosePhoto} disabled={photoBusy || saving} /></label>
                {photo && <p className="mt-2 text-xs text-slate-500">{t('f2.image_size', { size: Math.max(1, Math.round(photo.size / 1024)) })}</p>}
              </div>
            </section>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5"><p className="max-w-lg text-xs text-slate-500">{t('f2.save_hint')}</p><F2Button type="submit" disabled={saving || photoBusy || gpsBusy}>{t(saving ? 'record.saving' : 'record.save')}</F2Button></div>
        </F2Card>
      </form>
    </F2Page>
  )
}
