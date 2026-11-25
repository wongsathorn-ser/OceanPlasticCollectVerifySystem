// F3 adapter for the PM's translation file (CHG-001).
// Uses the same 'ocean-language' localStorage key and event as F2 so switching
// language stays in sync across crew screens until shared LanguageContext lands.
import { useCallback, useContext, useEffect, useState } from 'react'
import translations from '../../../translations.json'
import { AuthContext } from '../f1_accounts/authContext.js'

const KEY = 'ocean-language'
const COLUMNS = { en: 'eng_word', th: 'th_word', my: 'burmese_word' }

const MATERIAL_KEYS = {
  PET_BOTTLES: 'material.pet_bottles',
  HDPE_RIGID: 'material.hdpe_rigid',
  FISHING_NET_ROPE: 'material.fishing_net_rope',
  LDPE_FILM: 'material.ldpe_film',
  MIXED: 'material.mixed',
}

const STATUS_KEYS = {
  PENDING: 'status.pending',
  VERIFIED: 'status.verified',
  REJECTED: 'status.rejected',
  SAVED_ON_PHONE: 'status.saved_on_phone',
}

const SERVER_ERROR_KEYS = {
  'Incorrect username or password.': 'server_error.incorrect_login',
  'Your account is waiting for an administrator to approve it.': 'server_error.pending',
  'Your account request was not approved. Please contact the administrator.': 'server_error.rejected',
  'Your account is suspended. Please contact the administrator.': 'server_error.suspended',
  'Please sign in again.': 'server_error.sign_in_again',
  'That username is already taken. Please choose another one.': 'server_error.username_taken',
  'An account with this email address already exists.': 'server_error.email_taken',
  'You do not have permission to do this.': 'server_error.no_permission',
  'Unable to connect to server.': 'common.unable_to_connect',
  'Unable to fetch record from server.': 'record_detail.load_error',
}

function readLanguage() {
  try {
    const value = localStorage.getItem(KEY)
    return COLUMNS[value] ? value : 'en'
  } catch {
    return 'en'
  }
}

export function useF3Language() {
  const auth = useContext(AuthContext)
  const [language, updateLanguage] = useState(readLanguage)

  // CHG-001: Sponsor and admin screens stay in English.
  const isCrewView = auth?.user?.role !== 'SPONSOR_MANAGEMENT' && auth?.user?.role !== 'ADMIN'
  const effectiveLanguage = isCrewView ? language : 'en'

  useEffect(() => {
    const update = () => updateLanguage(readLanguage())
    window.addEventListener('ocean-language-change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('ocean-language-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  const t = useCallback(
    (key, values = {}) => {
      const entry = translations[key]
      const text = entry?.[COLUMNS[effectiveLanguage]] || entry?.eng_word || key
      return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match)
    },
    [effectiveLanguage],
  )

  const setLanguage = useCallback((value) => {
    if (!COLUMNS[value]) return
    updateLanguage(value)
    try {
      localStorage.setItem(KEY, value)
    } catch {
      // Language choice still applies for this visit.
    }
    window.dispatchEvent(new Event('ocean-language-change'))
  }, [])

  const tMaterial = useCallback(
    (material) => {
      const key = MATERIAL_KEYS[material]
      return key ? t(key) : material || t('material.mixed')
    },
    [t],
  )

  const tStatus = useCallback(
    (status) => {
      const key = STATUS_KEYS[(status || '').toUpperCase()]
      return key ? t(key) : status || t('status.unknown')
    },
    [t],
  )

  const tServerError = useCallback(
    (message) => {
      if (!message) return t('common.unable_to_connect')
      const key = SERVER_ERROR_KEYS[message]
      return key ? t(key) : message
    },
    [t],
  )

  return { language: effectiveLanguage, setLanguage, t, tMaterial, tStatus, tServerError, isCrewView }
}
