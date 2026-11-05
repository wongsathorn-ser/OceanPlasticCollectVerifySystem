import { useState } from 'react'

const reasons = [
  'Scale reading is not clear',
  'Wrong boat selected',
  'Weight does not match evidence',
  'Other',
]

export default function RejectDialog({ open, onClose, onSubmit, submitting = false }) {
  const [selectedReason, setSelectedReason] = useState('')
  const [note, setNote] = useState('')

 

  if (!open) return null

  const canSubmit = selectedReason !== '' && note.trim().length > 0 && !submitting

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return

    onSubmit(`${selectedReason}: ${note.trim()}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#062a31]/80 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-dialog-title"
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0c6e80]">
            Decision required
          </p>
          <h2 id="reject-dialog-title" className="mt-1 text-xl font-bold text-[#123b44]">
            Reject this record?
          </h2>
          <p className="mt-2 text-sm text-[#61777d]">
            Select a reason and add a note explaining the decision. This decision is final.
          </p>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold text-[#294a52]">
              Quick reason
            </legend>
            <div className="flex flex-wrap gap-2">
              {reasons.map((reason) => {
                const selected = selectedReason === reason
                return (
                  <button
                    key={reason}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedReason(reason)}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      selected
                        ? 'border-[#0c6e80] bg-[#e3f3f5] font-semibold text-[#0c5967]'
                        : 'border-[#d5e0e3] text-[#42616a] hover:bg-[#f5f8f9]'
                    }`}
                  >
                    {reason}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label
            htmlFor="reject-note"
            className="mt-5 block text-sm font-semibold text-[#294a52]"
          >
            Review note <span className="text-red-700">(required)</span>
          </label>
          <textarea
            id="reject-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            maxLength={500}
            required
            placeholder="Explain what needs to be corrected or why the evidence does not match."
            className="mt-2 w-full resize-y rounded-lg border border-[#cbd9dd] p-3 text-sm text-[#123b44] outline-none focus:border-[#0c6e80] focus:ring-2 focus:ring-[#b9dce1]"
          />
          <p className="mt-1 text-right text-xs text-[#71858b]">
            {note.length}/500
          </p>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-[#cbd9dd] px-4 py-2 text-sm font-semibold text-[#42616a] hover:bg-[#f5f8f9] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-[#b23a32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#922f29] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Rejecting…' : 'Reject record'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}