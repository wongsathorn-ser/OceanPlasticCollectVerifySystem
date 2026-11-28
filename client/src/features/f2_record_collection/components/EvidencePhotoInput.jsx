import { useEffect, useRef, useState } from 'react'
import { useF2Language } from '../i18n.js'
import { preparePhoto } from '../offline/photo.js'
import { captureLocation } from '../offline/location.js'
import { checkLocation } from '../offline/landingSite.js'
import { F2Notice } from './F2Page.jsx'

export default function EvidencePhotoInput({ kind, value, config, disabled, onChange, onBusy }) {
  const { t, translateServerMessage } = useF2Language()
  const image = useRef(null)
  const request = useRef(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => { request.current += 1 }, [])
  useEffect(() => {
    if (!value || !image.current) return undefined
    const url = URL.createObjectURL(value.blob)
    image.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [value])
  const result = checkLocation(config, value?.gps)
  async function select(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const token = ++request.current
    setBusy(true); onBusy(true); setError(''); onChange(null)
    const capturedAt = new Date().toISOString()
    try {
      const [blob, gps] = await Promise.all([preparePhoto(file), captureLocation()])
      if (token === request.current) onChange({ blob, gps, captured_at: capturedAt })
    } catch (failure) {
      if (token === request.current) setError(`${translateServerMessage(failure.message)} ${t('f2.evidence.retake_gps')}`)
    } finally {
      if (token === request.current) { setBusy(false); onBusy(false) }
    }
  }
  const title = t(kind === 'PLASTIC' ? 'chg004_evidence.photo_plastic' : 'chg004_evidence.photo_scale')
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{kind === 'PLASTIC' ? '1' : '2'}. {title} *</h2>
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#f5f8f9] p-4 text-center">
        {value ? <img ref={image} alt={title} className="max-h-52 w-full rounded-lg object-contain" /> : <p className="max-w-sm text-sm text-slate-600">{t(kind === 'PLASTIC' ? 'chg004_evidence.photo_plastic_hint' : 'record.scale_photo_hint')}</p>}
        <label className={`mt-4 inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold ${disabled || busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          {t(busy ? 'f2.evidence.capturing' : value ? 'record.retake_photo' : 'record.take_photo')}
          <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label={title} onChange={select} disabled={disabled || busy} />
        </label>
        {value && <div className="mt-3 space-y-1 text-xs text-slate-600">
          <p>{t('f2.image_size', { size: Math.max(1, Math.round(value.blob.size / 1024)) })}</p>
          <p>{value.gps.latitude.toFixed(6)}, {value.gps.longitude.toFixed(6)}</p>
          <p>{t('f2.accuracy', { meters: Math.round(value.gps.gps_accuracy_m) })}</p>
          <p>{t('f2.capture_time', { time: new Date(value.gps.gps_captured_at).toLocaleTimeString() })}</p>
        </div>}
      </div>
      {error && <F2Notice tone="error" className="mt-2" role="alert">{error}</F2Notice>}
      {result && <F2Notice tone={result.allowed ? 'success' : 'error'} className="mt-2" role="status">
        {result.site ? t('f2.evidence.distance', { site: result.site.name, meters: Math.ceil(result.distance), radius: result.radius }) : t('f2.evidence.no_sites')}
        <span className="block">{t(result.allowed ? 'f2.evidence.location_ok' : 'f2.evidence.location_blocked')}</span>
      </F2Notice>}
    </section>
  )
}
