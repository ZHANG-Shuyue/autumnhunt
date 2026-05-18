interface GreetingHeaderProps {
  name?: string | null
  dateText: string
  encouragement: string
}

export default function GreetingHeader({ name, dateText, encouragement }: GreetingHeaderProps) {
  const hour = new Date().getHours()
  const greet = hour >= 5 && hour < 10
    ? `早上好${name ? `,${name}` : ''}`
    : hour >= 10 && hour < 13
      ? `上午好${name ? `,${name}` : ''}`
      : hour >= 13 && hour < 18
        ? `下午好${name ? `,${name}` : ''}`
        : hour >= 18 && hour < 22
          ? `晚上好${name ? `,${name}` : ''}`
          : '夜深了,早点休息'

  return (
    <div className="rounded-2xl border border-neutral-border bg-white/80 p-6 shadow-soft">
      <h1 className="text-[24px] font-semibold text-neutral-text">{greet}</h1>
      <p className="mt-1 text-sm text-neutral-muted">{dateText}</p>
      <p className="mt-2 text-sm text-[#B08A63]">{encouragement}</p>
    </div>
  )
}
