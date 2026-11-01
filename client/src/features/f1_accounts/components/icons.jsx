// F1 · Accounts & access - simple line icons drawn as inline SVG (no icon library).
// Size and colour come from Tailwind classes, e.g. <LockIcon className="size-4 text-[#0e4a56]" />

function Svg({ className = 'size-5', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function BoatIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M3 15h18l-2.5 4.5h-13z" />
      <path d="M12 3.5v11.5" />
      <path d="M12 5l5.5 7.5H12" />
    </Svg>
  )
}

export function CheckIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function ChevronRightIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function CaretDownIcon({ className }) {
  return (
    <svg viewBox="0 0 10 6" className={className} aria-hidden="true">
      <path d="M0 0h10L5 6z" fill="currentColor" />
    </svg>
  )
}

export function ShieldIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  )
}

export function LockIcon({ className }) {
  return (
    <Svg className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  )
}

export function MailIcon({ className }) {
  return (
    <Svg className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </Svg>
  )
}

export function InfoIcon({ className }) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Svg>
  )
}

export function LogOutIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </Svg>
  )
}

export function SearchIcon({ className }) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  )
}

export function UsersIcon({ className }) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </Svg>
  )
}

export function XIcon({ className }) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  )
}
