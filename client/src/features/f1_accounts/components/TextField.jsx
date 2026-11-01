// F1 · Accounts & access - labelled text input with hint / error message.
//   <TextField id="username" label="Username" value={...} onChange={...} error={errors.username} />
// Extra props (type, name, autoComplete, placeholder, ...) go straight to the <input>.
export default function TextField({ id, label, showRequired = false, hint, error, className = '', ...inputProps }) {
  const messageId = `${id}-message`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#46616b]">
        {label}
        {showRequired && <span className="text-[#a5342b]"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={`h-12 w-full rounded-xl border bg-white px-4 text-base text-[#0c1d23] placeholder:text-[#9fb2b8] focus:outline-2 focus:outline-[#0c6e80] ${
          error ? 'border-[#a5342b]' : 'border-[#dbe5e8]'
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={messageId} className="mt-1.5 text-sm text-[#a5342b]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-1.5 text-xs text-[#7d949c]">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
