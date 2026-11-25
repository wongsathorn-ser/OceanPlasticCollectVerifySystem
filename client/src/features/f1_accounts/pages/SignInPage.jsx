// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 01 Sign in | Spec: FR-1.1, FR-1.2, FR-1.3, BR-8 | CHG-001: English / Thai / Burmese
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SHOW_DEMO_ACCOUNTS } from '../api.js'
import { AuthContext } from '../authContext.js'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import MockAccountsHint from '../components/MockAccountsHint.jsx'
import TextField from '../components/TextField.jsx'
import { ROLE_HOME } from '../constants.js'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'

function validate(form) {
  const errors = {}
  // translation keys (client/translations.json); translated when shown
  if (!form.username.trim()) errors.username = 'signin.error_username'
  if (!form.password) errors.password = 'signin.error_password'
  return errors
}

export default function SignInPage() {
  const { signIn } = useContext(AuthContext)
  const { t, translateServerMessage } = useContext(LanguageContext)
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const user = await signIn(form.username, form.password)
      navigate(ROLE_HOME[user.role], { replace: true })
    } catch (err) {
      // FR-1.1: the backend sends one generic message for a wrong username or password
      setFormError(err.detail || 'signin.error_generic')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-[#0c1d23]">{t('signin.title')}</h1>
      <p className="mt-2 text-sm text-[#46616b]">{t('signin.subtitle')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && <Alert>{formError.startsWith('signin.') ? t(formError) : translateServerMessage(formError)}</Alert>}
        <TextField
          id="username"
          name="username"
          label={t('signin.username')}
          autoComplete="username"
          autoCapitalize="none"
          value={form.username}
          onChange={handleChange}
          error={errors.username && t(errors.username)}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label={t('signin.password')}
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password && t(errors.password)}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? t('signin.submitting') : t('signin.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#46616b]">
        {t('signin.no_account')}{' '}
        <Link to="/register" className="font-semibold text-[#0c6e80] hover:underline">
          {t('signin.create_account')}
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-[#7d949c]">
        {t('signin.approval_note')}
      </p>

      {SHOW_DEMO_ACCOUNTS && <MockAccountsHint />}
    </AuthLayout>
  )
}
