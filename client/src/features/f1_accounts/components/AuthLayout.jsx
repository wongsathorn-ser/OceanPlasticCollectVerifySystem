// F1 · Accounts & access - split layout of the public screens (Sign in, Create an
// account, Request sent): dark brand panel on the left, form on the right.
// On phones the brand panel becomes a slim bar on top (NFR-13).
import BrandMark from './BrandMark.jsx'
import { CheckIcon } from './icons.jsx'

const POINTS = [
  'Crew log every load with a photo of the scale',
  'Sponsors check each record before it counts',
  'Only verified weight reaches the fleet total',
]

export default function AuthLayout({ children, wide = false }) {
  return (
    <div className="min-h-screen bg-[#edf2f4] md:flex">
      <aside className="bg-[#0e4a56] px-5 py-4 text-white md:flex md:w-5/12 md:flex-col md:justify-between md:p-10 lg:p-12">
        <BrandMark />

        <div className="hidden md:block">
          <p className="max-w-md text-4xl font-bold leading-tight">Record what you recover. Prove it with a photo.</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-[#dceef1]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#0c6e80]">
                  <CheckIcon className="size-3.5 text-white" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-[#a9d5dd] md:block">© 2026 Ocean Plastic Recovery</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10 md:px-10">
        <div className={`w-full ${wide ? 'max-w-[520px]' : 'max-w-[440px]'}`}>{children}</div>
      </main>
    </div>
  )
}
