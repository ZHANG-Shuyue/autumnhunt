import { Plus, Search } from 'lucide-react'
import CompanyCard from '../components/common/CompanyCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { mockCompanies } from '../mock/companies'

export default function Companies() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-muted" />
            <Input placeholder="搜索公司 / 岗位..." className="pl-9" />
          </div>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="internet">互联网</TabsTrigger>
              <TabsTrigger value="finance">金融</TabsTrigger>
              <TabsTrigger value="manufacture">制造</TabsTrigger>
              <TabsTrigger value="others">其他</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 添加公司
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {mockCompanies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  )
}
