export function F2Page({ title, description, eyebrow = 'RECORD COLLECTION', children, actions, width = 'max-w-5xl' }) {
  return (
    <div className={`mx-auto w-full ${width}`}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#0c6e80]">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      </header>
      {children}
    </div>
  )
}

export function F2Card({ children, className = '' }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>
}

export function F2Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-[#0c6e80] text-white hover:bg-[#095d6c] focus-visible:ring-[#0c6e80]',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-[#0c6e80]',
    quiet: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-[#0c6e80]',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700',
  }
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function F2Notice({ children, tone = 'info', className = '', ...props }) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    calm: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]} ${className}`} {...props}>{children}</div>
}

export const inputClassName =
  'min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0c6e80] focus:ring-2 focus:ring-[#0c6e80]/20'
