import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-2xl border border-neutral-border bg-white px-3 py-2 text-sm text-neutral-text placeholder:text-neutral-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cream/60',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
