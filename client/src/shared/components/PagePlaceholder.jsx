// SHARED FILE - temporary stand-in used by every page in the template.
// Each owner replaces <PagePlaceholder /> in their own page with the real screen.
export default function PagePlaceholder({ title, feature, owner, figma, spec }) {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-dashed border-teal-300 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{feature}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-[8rem_1fr]">
        <dt className="font-medium text-slate-500">Owner</dt>
        <dd>{owner}</dd>
        <dt className="font-medium text-slate-500">Figma screen</dt>
        <dd>{figma}</dd>
        <dt className="font-medium text-slate-500">Requirements</dt>
        <dd>{spec}</dd>
      </dl>
      <p className="mt-4 text-sm text-slate-500">Template placeholder - replace with the real screen.</p>
    </section>
  )
}
