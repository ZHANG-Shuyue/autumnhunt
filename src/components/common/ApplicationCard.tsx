import { Card } from '../ui/card'

interface ApplicationCardProps {
  companyName: string
  position: string
  appliedAt: string
}

export default function ApplicationCard({ companyName, position, appliedAt }: ApplicationCardProps) {
  return (
    <Card className="p-3">
      <p className="font-medium text-neutral-text">{companyName}</p>
      <p className="mt-1 text-sm text-neutral-muted">{position}</p>
      <p className="mt-2 text-xs text-neutral-muted">投递于 {appliedAt}</p>
    </Card>
  )
}
