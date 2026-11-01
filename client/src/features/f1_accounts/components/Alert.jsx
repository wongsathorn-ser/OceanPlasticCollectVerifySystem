// F1 · Accounts & access - error or success message box.
//   <Alert>Incorrect username or password.</Alert>
//   <Alert variant="success">Password changed.</Alert>
const STYLES = {
  error: 'border-[#efc9c5] bg-[#fbeeed] text-[#8c2b23]',
  success: 'border-[#bfe0cf] bg-[#e9f6ef] text-[#1b6e4a]',
}

export default function Alert({ variant = 'error', className = '', children }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${STYLES[variant]} ${className}`}
    >
      {children}
    </div>
  )
}
