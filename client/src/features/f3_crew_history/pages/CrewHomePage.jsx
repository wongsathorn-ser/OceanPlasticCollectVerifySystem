// F3 · Crew home & history - owner: Kaung Khant Paing
// Figma: 03 Personal dashboard | Spec: FR-3.1, BR-2 | CHG-002: earnings (this month, to date, pending)
import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'
import { getMyEarnings, getMyRecords, getMySummary } from '../api.js'
import ApiErrorBanner from '../components/ApiErrorBanner.jsx'
import RecordCard from '../components/RecordCard.jsx'
import { DEFAULT_RECORDS } from '../mockData.js'
import { useF3User, useOfflineDrafts } from '../offlineQueue.js'

const EMPTY_SUMMARY = {
  today_verified_kg: 0,
  today_pending_kg: 0,
  month_verified_kg: 0,
  month_pending_kg: 0,
  pending_count: 0,
}

// Fallback summary (BR-2: verified and pending weight kept separate)
const DEFAULT_SUMMARY = {
  today_verified_kg: 0,
  today_pending_kg: 680,
  month_verified_kg: 540,
  month_pending_kg: 680,
  pending_count: 2,
}

// CHG-002: amounts in THB, at most 2 decimals
function formatThb(amount, language) {
  return Number(amount ?? 0).toLocaleString(language === 'en' ? 'en-US' : language, { maximumFractionDigits: 2 })
}

export default function CrewHomePage() {
  const { user, offline } = useF3User()
  const navigate = useNavigate()
  const { t, language } = useContext(LanguageContext)

  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [earnings, setEarnings] = useState(null) // CHG-002; null = not loaded (offline or error)
  const [remoteRecords, setRemoteRecords] = useState([])
  const [apiError, setApiError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const offlineRecords = useOfflineDrafts(user?.id)
  const crewName = user?.name || ''
  const firstName = crewName.split(' ')[0] || t('role.crew_member')

  // Refresh server totals/records when online again or when F2 finishes syncing online
  useEffect(() => {
    const onQueueChange = () => {
      if (navigator.onLine) setReloadKey((k) => k + 1)
    }
    const onOnline = () => setReloadKey((k) => k + 1)
    window.addEventListener('f2-queue-change', onQueueChange)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('f2-queue-change', onQueueChange)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function fetchData() {
      if (offline) {
        if (!ignore) setApiError(null)
        return
      }

      let loadError = null

      // 1. Fetch summary stats from API
      try {
        const summaryData = await getMySummary()
        if (!ignore && summaryData) {
          setSummary(summaryData)
        }
      } catch (err) {
        if (!ignore) {
          setSummary(DEFAULT_SUMMARY)
          loadError = {
            status: err.status,
            message: err.detail || err.message || 'Unable to connect to server.',
          }
        }
      }

      // 1b. CHG-002 earnings (only shown when the server answers)
      try {
        const earningsData = await getMyEarnings()
        if (!ignore) setEarnings(earningsData)
      } catch {
        if (!ignore) setEarnings(null)
      }

      // 2. Fetch recent records from API
      try {
        const recordsData = await getMyRecords()
        if (!ignore && Array.isArray(recordsData)) {
          setRemoteRecords(recordsData.slice(0, 4))
        }
      } catch (err) {
        if (!ignore) {
          setRemoteRecords(DEFAULT_RECORDS.slice(0, 4))
          if (!loadError) {
            loadError = {
              status: err.status,
              message: err.detail || err.message || 'Unable to connect to server.',
            }
          }
        }
      }

      if (!ignore) {
        setApiError(loadError)
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [reloadKey, offline])

  const recentRecords = useMemo(() => {
    const remoteClientIds = new Set(remoteRecords.map((r) => r.client_id).filter(Boolean))
    const unsynced = offlineRecords.filter((d) => !d.client_id || !remoteClientIds.has(d.client_id))
    return [...unsynced, ...remoteRecords].slice(0, 4)
  }, [offlineRecords, remoteRecords])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* API Error Banner if request failed (Item 3) */}
      <ApiErrorBanner error={apiError} onRetry={() => setReloadKey((k) => k + 1)} />

      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {t('home.welcome', { name: firstName })}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Action: Add a collection */}
        <Link
          to="/record"
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('home.add_collection')}
        </Link>
      </div>

      {/* 2. Offline Records Alert (if any records are saved on phone) */}
      {offlineRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900">
          <div>
            <p className="text-sm font-bold text-amber-950">
              {t('home.saved_on_phone_count', { count: offlineRecords.length })}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {t('home.saved_offline')}
            </p>
          </div>
          <button
            onClick={() => navigate('/send')}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors shrink-0"
          >
            {t('home.review_and_send')}
          </button>
        </div>
      )}

      {/* 3. Metrics Cards (FR-3.1, BR-2: verified vs pending kept separate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('home.today')}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.today_verified_kg ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">{t('home.kg_verified')}</span>
          </div>
          <p className="text-xs font-medium text-amber-700 mt-1">
            {t('home.kg_pending_review', { kg: summary.today_pending_kg ?? 0 })}
          </p>
        </div>

        {/* This Month's Total */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('home.this_month')}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.month_verified_kg ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">{t('home.kg_verified')}</span>
          </div>
          <p className="text-xs font-medium text-amber-700 mt-1">
            {t('home.kg_pending_review', { kg: summary.month_pending_kg ?? 0 })}
          </p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('home.pending_review')}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {summary.pending_count ?? 0}
            </span>
            <span className="text-sm font-bold text-slate-500">
              {(summary.pending_count ?? 0) === 1 ? t('common.record_one') : t('common.record_many')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('home.awaiting_verification')}</p>
        </div>

        {/* On This Phone */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('home.on_this_phone')}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {offlineRecords.length}
            </span>
            <span className="text-sm font-bold text-slate-500">
              {offlineRecords.length === 1 ? t('common.record_one') : t('common.record_many')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {offlineRecords.length > 0 ? t('home.waiting_to_upload') : t('home.all_synced')}
          </p>
        </div>
      </div>

      {/* 3b. CHG-002 Earnings: only VERIFIED records are paid; pending is not paid yet */}
      {earnings && (
        <section aria-labelledby="earnings-title" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <h2 id="earnings-title" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('chg002_rewards.earnings_this_month')}
              </h2>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {t('chg002_rewards.amount_thb', { amount: formatThb(earnings.this_month, language) })}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('chg002_rewards.earnings_to_date')}
              </h3>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t('chg002_rewards.amount_thb', { amount: formatThb(earnings.to_date, language) })}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('chg002_rewards.pending_amount')}
              </h3>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-700">
                {t('chg002_rewards.amount_thb', { amount: formatThb(earnings.pending, language) })}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{t('chg002_rewards.no_reward_rejected')}</p>
        </section>
      )}

      {/* 4. Action Banner */}
      <div className="rounded-2xl bg-teal-900 p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{t('home.ready_title')}</h2>
          <p className="text-xs sm:text-sm text-teal-200 mt-0.5">
            {t('home.ready_body')}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            to="/record"
            className="rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-teal-900 hover:bg-teal-50 transition-colors"
          >
            {t('home.start_collection')}
          </Link>
          <Link
            to="/history"
            className="rounded-xl bg-teal-800 px-4 py-2 text-xs sm:text-sm font-medium text-teal-100 hover:bg-teal-700 transition-colors"
          >
            {t('home.view_history')}
          </Link>
        </div>
      </div>

      {/* 5. Recent Records Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('home.recent_title')}</h2>
            <p className="text-xs text-slate-500">{t('home.recent_subtitle')}</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            {t('home.view_all_history')}
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">
            {t('history.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRecords.map((record) => (
              <RecordCard key={record.id || record.record_number} record={record} />
            ))}
          </div>
        )}
      </div>

      {/* 6. BR-2 Note */}
      <p className="text-xs text-slate-400">
        {t('home.verified_note')}
      </p>
    </div>
  )
}
