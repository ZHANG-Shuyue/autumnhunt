import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回
      </Button>
      <Card>
        <h2 className="text-2xl font-semibold">设置</h2>
        <p className="mt-2 text-neutral-muted">GitHub 连接、数据导出与主题设置将在后续版本开放。Coming soon</p>
      </Card>
    </div>
  )
}
