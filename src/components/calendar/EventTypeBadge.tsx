import { Badge } from '../ui/badge'

const map: Record<string, 'cream' | 'mist' | 'rose' | 'sage' | 'ash'> = {
  投递: 'mist',
  笔试: 'cream',
  面试: 'rose',
  截止: 'ash',
}

export default function EventTypeBadge({ type }: { type: string }) {
  return <Badge variant={map[type] ?? 'sage'}>{type}</Badge>
}
