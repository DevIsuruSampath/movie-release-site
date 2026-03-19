import * as React from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium text-gray-300">{label}</label> : null}
      <textarea
        ref={ref}
        className={cn(
          'min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[#e50914] focus:outline-none focus:ring-2 focus:ring-[#e50914]/20',
          error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
