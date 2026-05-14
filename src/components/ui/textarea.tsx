import * as React from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[90px] w-full rounded-xl border border-neutral-border bg-white px-3 py-2 text-sm text-neutral-text placeholder:text-neutral-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cream/60',
        className,
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'
