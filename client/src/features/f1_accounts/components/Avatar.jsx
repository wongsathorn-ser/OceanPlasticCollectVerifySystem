// F1 · Accounts & access - round avatar with the person's initials ("Marco Reyes" -> MR).
import { initials } from '../utils.js'

const SIZES = {
  sm: 'size-9 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

export default function Avatar({ name, size = 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-[#dceef1] font-bold text-[#0e4a56] ${SIZES[size]}`}
    >
      {initials(name)}
    </span>
  )
}
