import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export default function TagInput({ value, onChange, placeholder = '回车添加标签' }: TagInputProps) {
  const [text, setText] = useState('')

  const addTag = () => {
    const tag = text.trim()
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setText('')
  }

  return (
    <div className="space-y-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="cream" className="gap-1">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
