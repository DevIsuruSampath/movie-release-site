import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, hint, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', caretColor: '#ffffff' }}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-white/10 bg-[#11151d] px-4 py-3 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all placeholder:text-slate-500 focus:border-[#ff676f]/70 focus:outline-none focus:ring-4 focus:ring-[#e50914]/15 disabled:cursor-not-allowed disabled:opacity-50',
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
Input.displayName = 'Input'

export { Input, type InputProps }
