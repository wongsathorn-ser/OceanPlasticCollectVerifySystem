// F1 · Accounts & access - white title bar at the top of a signed-in page (Figma).
// The negative margins cancel the padding of the shared AppLayout <main>
// (p-4 md:p-8) so the bar spans the full width - adjust them if that padding changes.
export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="-mx-4 -mt-4 mb-6 flex flex-col gap-3 border-b border-[#dbe5e8] bg-white px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:-mx-8 md:-mt-8 md:mb-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0c1d23]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-[#7d949c]">{subtitle}</p>}
      </div>
      {children}
    </header>
  )
}
