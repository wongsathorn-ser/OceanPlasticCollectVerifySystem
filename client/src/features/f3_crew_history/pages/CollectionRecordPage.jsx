// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 Collection record | Spec: FR-3.3
import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LanguageContext, translate } from '../../../shared/i18n/languageContext.js'
import { getRecordById } from '../api.js'
import ApiErrorBanner from '../components/ApiErrorBanner.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { DEFAULT_RECORDS } from '../mockData.js'
import { findOfflineDraft, useF3User } from '../offlineQueue.js'

const MATERIAL_KEYS = {
  PET_BOTTLES: 'material.pet_bottles',
  HDPE_RIGID: 'material.hdpe_rigid',
  FISHING_NET_ROPE: 'material.fishing_net_rope',
  LDPE_FILM: 'material.ldpe_film',
  MIXED: 'material.mixed',
}

function formatDetailDate(dateInput) {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const day = date.getDate()
  const month = date.toLocaleString('en', { month: 'short' })
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} ${year}, ${hours}:${minutes}`
}

export default function CollectionRecordPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const { user } = useF3User()
  const { t: ctxT } = useContext(LanguageContext)
  const isCrew = user?.role !== 'SPONSOR_MANAGEMENT' && user?.role !== 'ADMIN'
  const t = (key, values) => (isCrew ? ctxT(key, values) : translate('en', key, values))

  // Match existing mock record if available (without falling back to arbitrary record)
  const matchedMock = DEFAULT_RECORDS.find(
    (r) =>
      r.record_number?.toLowerCase() === (recordId || '').toLowerCase() ||
      String(r.id).toLowerCase() === (recordId || '').toLowerCase(),
  )

  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${recordId || ''}:${reloadKey}`
  const [fetchState, setFetchState] = useState(() =>
    matchedMock ? { key: requestKey, record: matchedMock, notFound: false, apiError: null } : null,
  )
  const [failedPhotoUrl, setFailedPhotoUrl] = useState(null)
  const blobImgRef = useRef(null)

  const isCurrent = fetchState?.key === requestKey
  const record = isCurrent ? fetchState.record : matchedMock || null
  const loading = !isCurrent && !matchedMock
  const notFound = isCurrent ? fetchState.notFound : false
  const apiError = isCurrent ? fetchState.apiError : null

  const hasPhotoBlob = typeof Blob !== 'undefined' && record?.photo instanceof Blob

  useEffect(() => {
    if (!hasPhotoBlob || !blobImgRef.current) return undefined
    const url = URL.createObjectURL(record.photo)
    blobImgRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [hasPhotoBlob, record?.photo])

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      if (!recordId) {
        if (!ignore) setFetchState({ key: requestKey, record: null, notFound: true, apiError: null })
        return
      }

      // 1. Check F2 IndexedDB offline drafts for the signed-in crew member
      const found = await findOfflineDraft(recordId, user?.id)
      if (found && !ignore) {
        setFetchState({ key: requestKey, record: found, notFound: false, apiError: null })
        return
      }

      // 2. Fetch from backend API
      try {
        const data = await getRecordById(recordId)
        if (ignore) return
        if (data) {
          setFetchState({ key: requestKey, record: data, notFound: false, apiError: null })
        } else {
          setFetchState({ key: requestKey, record: matchedMock || null, notFound: !matchedMock, apiError: null })
        }
      } catch (err) {
        if (ignore) return
        if (err.status === 404) {
          setFetchState({ key: requestKey, record: null, notFound: true, apiError: null })
        } else {
          setFetchState({
            key: requestKey,
            record: matchedMock || null,
            notFound: false,
            apiError: {
              status: err.status,
              message: err.detail || err.message || 'Unable to fetch record from server.',
            },
          })
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [recordId, requestKey, matchedMock, user?.id])

  // Item 1: Render clear not-found state when URL has invalid record ID
  if (notFound || (!loading && !record && !apiError)) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{t('record_detail.not_found_title')}</h1>
        <p className="text-sm text-slate-500 mt-2">
          {t('record_detail.not_found_body', { id: recordId })}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  if (apiError && !record) {
    return (
      <div className="max-w-xl mx-auto my-12 space-y-4">
        <ApiErrorBanner
          error={apiError}
          showingDemo={false}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  if (loading && !record) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-400">
        <p className="text-sm">{t('record_detail.loading')}</p>
      </div>
    )
  }

  const recordNumber = record.record_number || `REC-${record.id}`
  const boatCode = record.boat_code || record.boat?.code || '—'
  const boatName = record.boat_name || record.boat?.name || ''
  const isRejected = (record.status || '').toUpperCase() === 'REJECTED'
  const reviewerName = record.reviewed_by_name || record.reviewed_by || ''
  const rejectReason = record.reason || t('f3.reject_reason_unclear_reading')
  const repeatAdvice = t('f3.record_load_again')
  const hasRepeatAdvice =
    rejectReason.toLowerCase().includes(repeatAdvice.toLowerCase())
  const hasGps = record.latitude !== null && record.latitude !== undefined && record.longitude !== null && record.longitude !== undefined
  const mapUrl = hasGps
    ? `https://www.openstreetmap.org/?mlat=${record.latitude}&mlon=${record.longitude}#map=15/${record.latitude}/${record.longitude}`
    : null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* API Error Banner if request failed (Item 3) */}
      <ApiErrorBanner
        error={apiError}
        onRetry={() => setReloadKey((k) => k + 1)}
      />

      {/* 1. Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 transition-colors text-slate-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('record_detail.title')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">{recordNumber}</p>
        </div>
      </div>

      {/* 2. Rejection Banner (shown only when REJECTED) */}
      {isRejected && (
        <div className="flex items-start sm:items-center gap-3 rounded-2xl bg-[#fee2e2]/70 border border-rose-100 p-4 text-[#991b1b]">
          <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-rose-950">
              {reviewerName ? `${t('record_detail.reviewed_by', { name: reviewerName })} · ` : ''}
              {t('record_detail.rejection_reason')}:
            </span>{' '}
            <span className="text-rose-900">
              {rejectReason}
              {!hasRepeatAdvice && ` ${repeatAdvice}.`}
            </span>
          </p>
        </div>
      )}

      {/* 3. Main Content: Evidence (Left) + Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Evidence */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">{t('record_detail.evidence')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('record_detail.evidence_caption')}</p>
          </div>

          {/* Scale Display Terminal (matches Figma) or Photo */}
          {hasPhotoBlob ? (
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200">
              <img
                ref={blobImgRef}
                alt={t('record_detail.scale_photo')}
                className="w-full h-full object-contain"
              />
            </div>
          ) : record.photo_url && failedPhotoUrl !== record.photo_url ? (
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200">
              <img
                src={record.photo_url}
                alt={t('record_detail.scale_photo')}
                onError={() => setFailedPhotoUrl(record.photo_url)}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-80 sm:h-96 bg-[#0c2227] rounded-2xl flex flex-col items-center justify-center p-6 select-none">
              <div className="border-2 border-[#16424b] rounded-2xl bg-[#061518] px-12 sm:px-16 py-8 sm:py-10 flex flex-col items-center justify-center shadow-2xl min-w-[260px] sm:min-w-[320px]">
                <span className="font-mono text-5xl sm:text-6xl font-bold text-[#2dd4bf] tracking-wider">
                  {record.weight_kg ?? 0}
                </span>
                <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[#155e69] mt-2">
                  {t('record_detail.kg_net')}
                </span>
              </div>
              <div className="w-32 sm:w-40 h-2.5 bg-[#154149] rounded-full mt-4" />
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-5">{t('record_detail.details')}</h2>

          <div className="space-y-4 text-sm divide-y divide-slate-100/80">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.record_number')}</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{recordNumber}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.boat')}</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {boatCode} · {boatName}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.weight')}</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {record.weight_kg ?? 0} {t('common.kg')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.material')}</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {MATERIAL_KEYS[record.material] ? t(MATERIAL_KEYS[record.material]) : record.material || t('material.mixed')}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.recorded')}</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {formatDetailDate(record.display_time || record.recorded_at)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.reviewed')}</span>
              <span className="text-slate-800 font-medium text-xs sm:text-sm">
                {formatDetailDate(record.reviewed_at)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">{t('record_detail.status')}</span>
              <StatusBadge status={record.status} />
            </div>

            <div className="flex items-start justify-between gap-3 pt-3">
              <span className="text-slate-400 text-xs sm:text-sm">GPS</span>
              {hasGps ? (
                <div className="text-right text-xs sm:text-sm">
                  <p className="font-mono text-slate-800">
                    {Number(record.latitude).toFixed(5)}, {Number(record.longitude).toFixed(5)}
                  </p>
                  {record.gps_accuracy_m !== null && record.gps_accuracy_m !== undefined && (
                    <p className="text-xs text-slate-400">±{record.gps_accuracy_m} m</p>
                  )}
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {t('f3.view_on_map')}
                  </a>
                </div>
              ) : (
                <span className="text-slate-800 font-medium text-xs sm:text-sm">—</span>
              )}
            </div>

            {record.note && (
              <div className="flex flex-col pt-3">
                <span className="text-slate-400 text-xs mb-1">{t('record_detail.note')}</span>
                <span className="text-slate-800 text-xs italic">{record.note}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
