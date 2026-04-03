import * as React from 'react'

import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2.5">
        {label ? (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-200">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[140px] w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-4 py-3 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all placeholder:text-slate-500 focus:border-[#ff676f]/70 focus:outline-none focus:ring-4 focus:ring-[#e50914]/15',
            error && 'border-red-500/45 focus:border-red-400 focus:ring-red-500/15',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {!error && hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
