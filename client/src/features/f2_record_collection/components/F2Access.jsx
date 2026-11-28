import { useEffect } from 'react'
import { warmOfflineData } from '../offline/bootstrap.js'
import { syncQueue } from '../offline/syncQueue.js'
import { Link } from 'react-router'
import { useF2Language } from '../i18n.js'
import { useF2User } from '../hooks.js'
import { F2Card, F2Notice } from './F2Page.jsx'

export default function F2Access({ children }) {
  const { t } = useF2Language()
  const { user, checking } = useF2User()
  useEffect(() => {
    if (user?.role === 'CREW_MEMBER') {
      warmOfflineData().catch(() => {})
      syncQueue().catch(() => {})
    }
  }, [user?.id, user?.role])
  if (checking) return <F2Notice>{t('f2.checking')}</F2Notice>
  if (!user || user.role !== 'CREW_MEMBER') return (
    <F2Card>
      <F2Notice tone="warning">{t('f2.crew_required')}</F2Notice>
      <Link to="/signin" className="mt-4 inline-block font-semibold text-[#0c6e80] underline">{t('f2.signin')}</Link>
    </F2Card>
  )
  return children
}
