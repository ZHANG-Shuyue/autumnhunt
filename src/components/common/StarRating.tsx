import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const current = index + 1
        return (
          <button key={current} type="button" onClick={() => onChange?.(current)} disabled={!onChange}>
            <Star className={`h-4 w-4 ${current <= value ? 'fill-primary-cream text-primary-cream' : 'text-neutral-border'}`} />
          </button>
        )
      })}
    </div>
  )
}
