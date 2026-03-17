import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'search-input flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-[#e50914] focus-visible:ring-2 focus-visible:ring-[#e50914]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, type InputProps }
