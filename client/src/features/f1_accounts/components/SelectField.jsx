// F1 · Accounts & access - labelled <select> with the Figma caret.
//   <SelectField id="role" label="Role" value={role} onChange={...}>
//     <option value="CREW_MEMBER">Crew member</option>
//   </SelectField>
import { CaretDownIcon } from './icons.jsx'

export default function SelectField({ id, label, showRequired = false, error, className = '', children, ...selectProps }) {
  const messageId = `${id}-message`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#46616b]">
        {label}
        {showRequired && <span className="text-[#a5342b]"> *</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className={`h-12 w-full appearance-none rounded-xl border bg-white pl-4 pr-10 text-base text-[#0c1d23] focus:outline-2 focus:outline-[#0c6e80] disabled:cursor-not-allowed disabled:bg-[#f4f7f9] ${
            error ? 'border-[#a5342b]' : 'border-[#dbe5e8]'
          }`}
          {...selectProps}
        >
          {children}
        </select>
        <CaretDownIcon className="pointer-events-none absolute right-4 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-[#46616b]" />
      </div>
      {error && (
        <p id={messageId} className="mt-1.5 text-sm text-[#a5342b]">
          {error}
        </p>
      )}
    </div>
  )
}
