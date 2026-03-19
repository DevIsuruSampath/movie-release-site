export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent" />
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}
