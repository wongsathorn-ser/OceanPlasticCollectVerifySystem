// F1 · Accounts & access - owner: Wongsathorn Sereephap
// Figma: 01 Sign in | Spec: FR-1.1, FR-1.2, FR-1.3, BR-8
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { USING_MOCK_DATA } from '../api.js'
import { AuthContext } from '../authContext.js'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import MockAccountsHint from '../components/MockAccountsHint.jsx'
import TextField from '../components/TextField.jsx'
import { ROLE_HOME } from '../constants.js'

function validate(form) {
  const errors = {}
  if (!form.username.trim()) errors.username = 'Enter your username.'
  if (!form.password) errors.password = 'Enter your password.'
  return errors
}

export default function SignInPage() {
  const { signIn } = useContext(AuthContext)
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
      setFormError(err.detail || 'Could not sign in. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold tracking-tight text-[#0c1d23]">Sign in</h1>
      <p className="mt-2 text-sm text-[#46616b]">Record what you recover and follow its verification.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && <Alert>{formError}</Alert>}
        <TextField
          id="username"
          name="username"
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#46616b]">
        New here?{' '}
        <Link to="/register" className="font-semibold text-[#0c6e80] hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-[#7d949c]">
        New accounts can sign in once an administrator has approved them.
      </p>

      {USING_MOCK_DATA && <MockAccountsHint />}
    </AuthLayout>
  )
}
