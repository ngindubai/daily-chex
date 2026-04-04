import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Search, Plus, Loader2, Calendar, User, Truck } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Check {
  id: string
  assetId: string
  personId: string
  checkTemplateId: string
  status: string
  overallResult: string | null
  completedAt: string | null
  createdAt: string
}

interface Asset {
  id: string
  name: string
  type: string
}

interface Person {
  id: string
  name: string
}

interface Template {
  id: string
  name: string
  slug: string
  assetType: string
  checkFrequency: string
}

const statusBadge: Record<string, { variant: 'green' | 'red' | 'amber' | 'default'; label: string }> = {
  completed: { variant: 'green', label: 'Completed' },
  in_progress: { variant: 'amber', label: 'In Progress' },
  abandoned: { variant: 'default', label: 'Abandoned' },
}

const resultBadge: Record<string, { variant: 'green' | 'red'; label: string }> = {
  pass: { variant: 'green', label: 'Pass' },
  fail: { variant: 'red', label: 'Fail' },
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export function ChecksPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [checks, setChecks] = useState<Check[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchAll = useCallback(async () => {
    if (!user || !token) return
    try {
      const [c, a, p, t] = await Promise.all([
        api<Check[]>(`/checks?companyId=${user.companyId}`, { token }),
        api<Asset[]>(`/assets?companyId=${user.companyId}`, { token }),
        api<Person[]>(`/people?companyId=${user.companyId}`, { token }),
        api<Template[]>(`/check-templates?companyId=${user.companyId}`, { token }),
      ])
      setChecks(c)
      setAssets(a)
      setPeople(p)
      setTemplates(t)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people])
  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates])

  const filtered = useMemo(() => {
    return checks.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const asset = assetMap.get(c.assetId)
        const person = personMap.get(c.personId)
        const tpl = templateMap.get(c.checkTemplateId)
        return (
          (asset?.name || '').toLowerCase().includes(q) ||
          (person || '').toLowerCase().includes(q) ||
          (tpl?.name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [checks, search, statusFilter, assetMap, personMap, templateMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Checks</h1>
        <Button variant="primary" size="sm" onClick={() => navigate('/checks/new')}>
          <Plus className="h-3.5 w-3.5" />
          New Check
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search asset, operator, template..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardCheck className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">
            {checks.length === 0 ? 'No checks yet. Start your first check.' : 'No results match your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((check) => {
            const asset = assetMap.get(check.assetId)
            const person = personMap.get(check.personId)
            const tpl = templateMap.get(check.checkTemplateId)
            const st = statusBadge[check.status] || { variant: 'default' as const, label: check.status }
            const res = check.overallResult ? resultBadge[check.overallResult] : null

            return (
              <Card
                key={check.id}
                className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors"
                onClick={() => navigate(`/checks/${check.id}`)}
              >
                <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-raised flex items-center justify-center shrink-0">
                  <ClipboardCheck className="h-5 w-5 text-chex-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-chex-text truncate">
                    {asset?.name || 'Unknown asset'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-chex-muted">
                    {tpl && <span>{tpl.name}</span>}
                    {person && (
                      <span className="flex items-center gap-0.5">
                        <User className="w-3 h-3" />{person}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {res && <Badge variant={res.variant}>{res.label}</Badge>}
                  </div>
                  <p className="text-xs text-chex-faint">
                    {relativeTime(check.completedAt || check.createdAt)}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
