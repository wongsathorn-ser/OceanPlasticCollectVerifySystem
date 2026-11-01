// F1 · Accounts & access - change password dialog opened from Profile (FR-1.8).
// Not drawn in Figma yet; follows the same style as the other F1 forms.
import { useEffect, useRef, useState } from 'react'
import { changePassword } from '../api.js'
import { MIN_PASSWORD_LENGTH } from '../constants.js'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import TextField from './TextField.jsx'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

function validate(form) {
  const errors = {}
  if (!form.currentPassword) errors.currentPassword = 'Enter your current password.'
  if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword = 'Choose a password that is different from the current one.'
  }
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = 'The passwords do not match.'
  return errors
}

export default function ChangePasswordDialog({ onClose, onChanged }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      onChanged()
    } catch (err) {
      setFormError(err.detail || 'Could not change the password. Please try again.')
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      // Escape key: let the parent remove the dialog (the cleanup above closes it).
      // Using onCancel instead of onClose keeps it working with StrictMode's double effects.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-labelledby="password-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-[#0c1d23] shadow-xl backdrop:bg-[#0c1d23]/50"
    >
      <h2 id="password-dialog-title" className="text-lg font-bold">
        Change password
      </h2>
      <p className="mt-1 text-sm text-[#46616b]">Enter your current password, then choose a new one.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <TextField
          id="current-password"
          name="currentPassword"
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
        />
        <TextField
          id="new-password"
          name="newPassword"
          type="password"
          label="New password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
        />
        <TextField
          id="confirm-password"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save password'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
