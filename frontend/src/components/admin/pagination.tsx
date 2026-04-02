'use client'

import { Button } from '@/components/ui/button'

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number
  pages: number
  onChange: (page: number) => void
}) {
  if (pages <= 1) return null

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pages || nextPage === page) {
      return
    }
    onChange(nextPage)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-400">
        Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" className="h-11 rounded-2xl px-4" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          Previous
        </Button>
        <Button variant="ghost" className="h-11 rounded-2xl px-4" disabled={page >= pages} onClick={() => goToPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
