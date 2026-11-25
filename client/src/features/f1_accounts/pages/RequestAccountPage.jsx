// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 02 Request an account ("Create an account") | Spec: FR-1.4, BR-9
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ROLE_KEYS } from '../../../shared/layout/navConfig.js'
import { LanguageContext } from '../../../shared/i18n/languageContext.js'
import { register } from '../api.js'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import { ShieldIcon } from '../components/icons.jsx'
import InfoBanner from '../components/InfoBanner.jsx'
import SelectField from '../components/SelectField.jsx'
import TextField from '../components/TextField.jsx'
import { MIN_PASSWORD_LENGTH, REGISTRATION_ROLES } from '../constants.js'

const EMPTY_FORM = { name: '', email: '', username: '', password: '', role: 'CREW_MEMBER' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/

function validate(form) {
  const errors = {}
  // translation keys (client/translations.json); translated when shown
  if (!form.name.trim()) errors.name = 'register.error_name'
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'register.error_email'
  if (!USERNAME_PATTERN.test(form.username.trim())) errors.username = 'register.error_username'
  if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = 'register.error_password'
  if (!REGISTRATION_ROLES.includes(form.role)) errors.role = 'register.error_role'
  return errors
}

export default function RequestAccountPage() {
  const navigate = useNavigate()
  const { t, translateServerMessage } = useContext(LanguageContext)
  const errorText = (key) => key && t(key, { count: MIN_PASSWORD_LENGTH })
  const [form, setForm] = useState(EMPTY_FORM)
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
      const request = await register(form)
      // Pass the name and role to the confirmation screen (React Router location state)
      navigate('/register/submitted', { state: { name: request.name, role: request.role } })
    } catch (err) {
      // e.g. 409 "That username is already taken" (FR-1.4: clear error message)
      setFormError(err.detail || 'register.error_generic')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout wide>
      <h1 className="text-3xl font-bold tracking-tight text-[#0c1d23]">{t('register.title')}</h1>
      <p className="mt-2 text-sm text-[#46616b]">{t('register.subtitle')}</p>

      <InfoBanner icon={ShieldIcon} className="mt-6">
        {t('register.approval_note')}
      </InfoBanner>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {formError && <Alert>{formError.startsWith('register.') ? t(formError) : translateServerMessage(formError)}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="name"
            name="name"
            label={t('register.full_name')}
            showRequired
            autoComplete="name"
            placeholder="Elena Vasquez"
            value={form.name}
            onChange={handleChange}
            error={errorText(errors.name)}
          />
          <TextField
            id="email"
            name="email"
            type="email"
            label={t('register.email')}
            showRequired
            autoComplete="email"
            placeholder="e.vasquez@opr.org"
            value={form.email}
            onChange={handleChange}
            error={errorText(errors.email)}
          />
          <TextField
            id="username"
            name="username"
            label={t('register.username')}
            showRequired
            autoComplete="username"
            autoCapitalize="none"
            placeholder="evasquez"
            value={form.username}
            onChange={handleChange}
            error={errorText(errors.username)}
          />
          <TextField
            id="password"
            name="password"
            type="password"
            label={t('register.password')}
            showRequired
            autoComplete="new-password"
            hint={t('register.error_password', { count: MIN_PASSWORD_LENGTH })}
            value={form.password}
            onChange={handleChange}
            error={errorText(errors.password)}
          />
        </div>

        <SelectField id="role" name="role" label={t('register.i_am_a')} showRequired value={form.role} onChange={handleChange} error={errorText(errors.role)}>
          {REGISTRATION_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(ROLE_KEYS[role])}
            </option>
          ))}
        </SelectField>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#46616b]">
        {t('register.have_account')}{' '}
        <Link to="/signin" className="font-semibold text-[#0c6e80] hover:underline">
          {t('register.sign_in')}
        </Link>
      </p>
    </AuthLayout>
  )
}
