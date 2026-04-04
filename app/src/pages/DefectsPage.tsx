import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search, Loader2, Clock } from 'lucide-react'
import { Card, Badge, Button, Input, StatusDot } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Defect {
  id: string
  companyId: string
  checkId: string | null
  assetId: string
  reportedBy: string
  description: string
  severity: string
  status: string
  actionTaken: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
}

interface Asset { id: string; name: string }
interface Person { id: string; name: string }

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const severityVariant: Record<string, 'red' | 'amber' | 'default'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'default',
}
const statusLabel: Record<string, { status: 'fail' | 'pending' | 'pass'; label: string }> = {
  open: { status: 'fail', label: 'Open' },
  in_progress: { status: 'pending', label: 'In Progress' },
  resolved: { status: 'pass', label: 'Resolved' },
  accepted: { status: 'pass', label: 'Accepted' },
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(ms / 3600000)
  if (hrs < 1) return `${Math.floor(ms / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function overdueClass(dateStr: string, status: string): string {
  if (status === 'resolved' || status === 'accepted') return ''
  const hrs = (Date.now() - new Date(dateStr).getTime()) / 3600000
  if (hrs > 72) return 'ring-2 ring-red-500/30'
  if (hrs > 24) return 'ring-2 ring-amber-500/20'
  return ''
}

export function DefectsPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [defects, setDefects] = useState<Defect[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchAll = useCallback(async () => {
    if (!user || !token) return
    try {
      const [d, a, p] = await Promise.all([
        api<Defect[]>(`/defects?companyId=${user.companyId}`, { token }),
        api<Asset[]>(`/assets?companyId=${user.companyId}`, { token }),
        api<Person[]>(`/people?companyId=${user.companyId}`, { token }),
      ])
      setDefects(d)
      setAssets(a)
      setPeople(p)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a.name])), [assets])
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people])

  const openCount = useMemo(() => defects.filter((d) => d.status === 'open').length, [defects])

  const filtered = useMemo(() => {
    return defects
      .filter((d) => {
        if (severityFilter && d.severity !== severityFilter) return false
        if (statusFilter && d.status !== statusFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            d.description.toLowerCase().includes(q) ||
            (assetMap.get(d.assetId) || '').toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
  }, [defects, search, severityFilter, statusFilter, assetMap])

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
        <h1 className="text-xl font-bold tracking-tight">Defects</h1>
        {openCount > 0 && <Badge variant="red" pulse>{openCount} open</Badge>}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search defects..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="accepted">Accepted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">
            {defects.length === 0 ? 'No defects recorded.' : 'No defects match your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((defect) => {
            const st = statusLabel[defect.status] || { status: 'fail' as const, label: defect.status }
            const overdue = overdueClass(defect.createdAt, defect.status)
            return (
              <Card
                key={defect.id}
                variant={defect.severity === 'critical' ? 'red' : 'default'}
                glow={defect.severity === 'critical' && defect.status === 'open'}
                className={`cursor-pointer hover:border-chex-yellow/20 transition-colors ${overdue}`}
                onClick={() => navigate(`/defects/${defect.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-red/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-chex-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-chex-text truncate">{defect.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-chex-muted">
                      <span>{assetMap.get(defect.assetId) || 'Unknown asset'}</span>
                      <span>·</span>
                      <span>{personMap.get(defect.reportedBy) || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant={severityVariant[defect.severity] || 'default'} pulse={defect.severity === 'critical' && defect.status === 'open'}>
                        {defect.severity}
                      </Badge>
                      <StatusDot status={st.status} label={st.label} />
                      <span className="text-xs text-chex-faint flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(defect.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
