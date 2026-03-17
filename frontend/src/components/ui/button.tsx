import * as React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e50914] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:pointer-events-none disabled:opacity-50 active:scale-95',
          {
            'default': 'bg-[#e50914] text-white hover:bg-[#b20710] shadow-lg shadow-red-900/20',
            'primary': 'bg-[#e50914] text-white hover:bg-[#b20710] shadow-lg shadow-red-900/20',
            'secondary': 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
            'destructive': 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/20',
            'ghost': 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
            'outline': 'bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-white/30',
          }[variant],
          {
            'sm': 'h-9 px-3.5 text-sm',
            'md': 'h-10.5 px-4.5 text-base',
            'lg': 'h-12 px-6 text-base',
          }[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, type ButtonProps }
