const accentStyles = {
  rose: 'from-[#ff5a5f]/22 to-transparent text-[#ff8a90]',
  emerald: 'from-emerald-400/20 to-transparent text-emerald-300',
  amber: 'from-amber-400/20 to-transparent text-amber-200',
  sky: 'from-sky-400/20 to-transparent text-sky-300',
  violet: 'from-violet-400/20 to-transparent text-violet-300',
  slate: 'from-white/10 to-transparent text-slate-200',
} as const

export function StatCard({
  label,
  value,
  accent = 'rose',
}: {
  label: string
  value: number
  accent?: keyof typeof accentStyles
}) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accentStyles[accent].split(' text-')[0]}`} />
      <div className="relative z-10">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
        <div className={`mt-4 text-3xl font-semibold ${accentStyles[accent].split(' ').slice(-1)[0]}`}>{value}</div>
      </div>
    </div>
  )
}
