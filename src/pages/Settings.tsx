import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回
      </Button>
      <h2 className="text-2xl font-semibold">设置</h2>
      <p className="text-neutral-muted">Coming soon</p>
    </div>
  )
}
