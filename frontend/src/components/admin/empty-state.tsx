export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-14 text-center shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
        <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}
