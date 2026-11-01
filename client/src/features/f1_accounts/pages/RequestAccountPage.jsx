// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 02 Request an account ("Create an account") | Spec: FR-1.4, BR-9
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ROLE_LABELS } from '../../../shared/layout/navConfig.js'
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
  if (!form.name.trim()) errors.name = 'Enter your full name.'
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!USERNAME_PATTERN.test(form.username.trim())) {
    errors.username = 'Use 3-30 letters, numbers, dots, dashes or underscores.'
  }
  if (form.password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  if (!REGISTRATION_ROLES.includes(form.role)) errors.role = 'Choose what you do.'
  return errors
}

export default function RequestAccountPage() {
  const navigate = useNavigate()
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
      setFormError(err.detail || 'Could not send your request. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout wide>
      <h1 className="text-3xl font-bold tracking-tight text-[#0c1d23]">Create an account</h1>
      <p className="mt-2 text-sm text-[#46616b]">Tell us who you are and what you do.</p>

      <InfoBanner icon={ShieldIcon} className="mt-6">
        An administrator checks every new account. You can sign in once it has been approved.
      </InfoBanner>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {formError && <Alert>{formError}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="name"
            name="name"
            label="Full name"
            showRequired
            autoComplete="name"
            placeholder="Elena Vasquez"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
          <TextField
            id="email"
            name="email"
            type="email"
            label="Email"
            showRequired
            autoComplete="email"
            placeholder="e.vasquez@opr.org"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <TextField
            id="username"
            name="username"
            label="Username"
            showRequired
            autoComplete="username"
            autoCapitalize="none"
            placeholder="evasquez"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
          />
          <TextField
            id="password"
            name="password"
            type="password"
            label="Password"
            showRequired
            autoComplete="new-password"
            hint={`Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
        </div>

        <SelectField id="role" name="role" label="I am a" showRequired value={form.role} onChange={handleChange} error={errors.role}>
          {REGISTRATION_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Sending request…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#46616b]">
        Already have one?{' '}
        <Link to="/signin" className="font-semibold text-[#0c6e80] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
