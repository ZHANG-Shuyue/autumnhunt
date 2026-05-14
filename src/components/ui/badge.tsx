import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', {
  variants: {
    variant: {
      cream: 'bg-primary-cream/45 text-neutral-text',
      mist: 'bg-primary-mist/40 text-neutral-text',
      rose: 'bg-primary-rose/45 text-neutral-text',
      sage: 'bg-primary-sage/40 text-neutral-text',
      ash: 'bg-primary-ash/45 text-neutral-text',
      outline: 'border border-neutral-border text-neutral-muted',
    },
  },
  defaultVariants: {
    variant: 'outline',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
