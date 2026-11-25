import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { F2Button, F2Card, F2Notice, F2Page, inputClassName } from '../components/F2Page.jsx'
import { useBoats } from '../hooks.js'
import { useF2Language } from '../i18n.js'

export default function ChooseBoatPage() {
  const navigate = useNavigate()
  const { t } = useF2Language()
  const { boats, loading, error, cached, retry } = useBoats()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('choose')
  const filteredBoats = useMemo(() => boats.filter((boat) => `${boat.code} ${boat.name}`.toLowerCase().includes(search.trim().toLowerCase())), [boats, search])
  const selectedBoat = boats.find((boat) => boat.id === selectedId)
  return (
    <F2Page title={t('record.which_boat')} description={t('record.which_boat_hint')} eyebrow={t('f2.title')} actions={<Link to="/send" className="text-sm font-semibold text-[#0c6e80] underline">{t('f2.queue_link')}</Link>}>
      <F2Card className="mx-auto max-w-3xl">
        <div className="mb-5 flex gap-2 border-b border-slate-200 pb-4" role="tablist" aria-label={t('record.boat_method')}>
          {['choose', 'type'].map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${mode === value ? 'bg-[#0c6e80] text-white' : 'bg-slate-100 text-slate-700'}`}>{t(`record.method_${value}`)}</button>)}
        </div>
        <label htmlFor="boat-search" className="mb-2 block text-sm font-semibold text-slate-800">{t(mode === 'choose' ? 'record.search_boat' : 'record.type_boat')}</label>
        <input id="boat-search" className={inputClassName} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('record.type_boat_example')} autoComplete="off" />
        {cached && <F2Notice tone="warning" className="mt-4">{t('f2.cached_boats')}</F2Notice>}
        {error && !cached && <F2Notice tone="error" className="mt-4">{error} <button type="button" onClick={retry} className="underline">{t('common.retry')}</button></F2Notice>}
        <div className="mt-4 space-y-2" aria-live="polite">
          {loading ? <p>{t('common.loading')}</p> : filteredBoats.map((boat) => (
            <button key={boat.id} type="button" onClick={() => setSelectedId(boat.id)} aria-pressed={selectedId === boat.id} className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left ${selectedId === boat.id ? 'border-[#0c6e80] bg-[#eff8f9] ring-1 ring-[#0c6e80]' : 'border-slate-200 hover:bg-slate-50'}`}>
              <span><span className="block text-sm font-semibold text-slate-900">{boat.code} · {boat.name}</span><span className="text-xs text-slate-500">{t('f2.capacity', { kg: boat.capacity_kg.toLocaleString() })}</span></span>
              <span className="text-sm text-[#0c6e80]">{t(selectedId === boat.id ? 'record.selected' : 'record.method_choose')}</span>
            </button>
          ))}
          {!loading && !filteredBoats.length && <F2Notice tone="calm">{t(boats.length ? 'record.no_boat_match' : 'f2.no_boats')}</F2Notice>}
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
          <Link to="/home" className="inline-flex min-h-12 items-center text-sm font-semibold text-slate-600">{t('common.cancel')}</Link>
          <F2Button type="button" disabled={!selectedBoat || loading} onClick={() => navigate('/record/details', { state: { boat: selectedBoat } })}>{t('common.continue')}</F2Button>
        </div>
      </F2Card>
    </F2Page>
  )
}
