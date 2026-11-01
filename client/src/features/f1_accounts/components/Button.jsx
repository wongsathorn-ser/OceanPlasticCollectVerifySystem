// F1 · Accounts & access - button in the Figma style (48 px tall = large touch target, NFR-13).
//   <Button>Approve</Button>   <Button variant="secondary">Reject</Button>
//   <Button variant="danger">Log out</Button>   <Button size="lg" type="submit">Sign in</Button>
const VARIANTS = {
  primary: 'bg-[#0c6e80] text-white hover:bg-[#0a5c6b] focus-visible:outline-[#0c6e80]',
  secondary: 'border border-[#dbe5e8] bg-white text-[#0c1d23] hover:bg-[#edf2f4] focus-visible:outline-[#0c6e80]',
  danger: 'bg-[#a5342b] text-white hover:bg-[#8c2b23] focus-visible:outline-[#a5342b]',
}

const SIZES = {
  md: 'h-12 px-4 text-sm',
  lg: 'h-14 px-6 text-base',
}

export default function Button({ variant = 'primary', size = 'md', type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
