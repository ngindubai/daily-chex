import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Plus, Search, Loader2, Clock, User, Truck,
  Calendar, AlertTriangle, CheckCircle, X,
} from 'lucide-react'
import { Card, Badge, Button, Input, StatusDot } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface TaskAssignment {
  id: string
  companyId: string
  assetId: string
  checkTemplateId: string
  assignedTo: string | null
  assignedTeam: string | null
  siteId: string | null
  createdBy: string
  status: string
  priority: string
  dueDate: string | null
  notes: string | null
  completedCheckId: string | null
  completedAt: string | null
  createdAt: string
}

interface Asset { id: string; name: string; type: string }
interface Person { id: string; name: string; role: string; teamId: string | null }
interface Team { id: string; name: string; siteId: string | null }
interface Template { id: string; name: string; assetType: string }

const priorityVariant: Record<string, 'red' | 'amber' | 'default'> = {
  urgent: 'red',
  high: 'amber',
  normal: 'default',
  low: 'default',
}

const statusInfo: Record<string, { status: 'fail' | 'pending' | 'pass'; label: string }> = {
  pending: { status: 'pending', label: 'Pending' },
  in_progress: { status: 'pending', label: 'In Progress' },
  completed: { status: 'pass', label: 'Completed' },
  overdue: { status: 'fail', label: 'Overdue' },
  cancelled: { status: 'fail', label: 'Cancelled' },
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(ms / 3600000)
  if (hrs < 1) return `${Math.floor(ms / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function TasksPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskAssignment[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formAsset, setFormAsset] = useState('')
  const [formTemplate, setFormTemplate] = useState('')
  const [formAssignTo, setFormAssignTo] = useState('')
  const [formAssignTeam, setFormAssignTeam] = useState('')
  const [formPriority, setFormPriority] = useState('normal')
  const [formDue, setFormDue] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user || !token) return
    try {
      const cid = user.companyId
      const [t, a, p, tm, tpl] = await Promise.all([
        api<TaskAssignment[]>(`/task-assignments?companyId=${cid}`, { token }),
        api<Asset[]>(`/assets?companyId=${cid}`, { token }),
        api<Person[]>(`/people?companyId=${cid}`, { token }),
        api<Team[]>(`/teams?companyId=${cid}`, { token }),
        api<Template[]>(`/check-templates?companyId=${cid}`, { token }),
      ])
      setTasks(t)
      setAssets(a)
      setPeople(p)
      setTeams(tm)
      setTemplates(tpl)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates])

  const pendingCount = useMemo(() => tasks.filter((t) => t.status === 'pending' || t.status === 'overdue').length, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const asset = assetMap.get(t.assetId)
        const person = t.assignedTo ? personMap.get(t.assignedTo) : null
        return (
          (asset?.name || '').toLowerCase().includes(q) ||
          (person?.name || '').toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tasks, search, statusFilter, assetMap, personMap])

  // Filter templates to match selected asset type
  const filteredTemplates = useMemo(() => {
    if (!formAsset) return templates
    const asset = assetMap.get(formAsset)
    if (!asset) return templates
    return templates.filter((t) => t.assetType === asset.type)
  }, [formAsset, templates, assetMap])

  const operators = useMemo(() => people.filter((p) => p.role === 'operator' || p.role === 'supervisor'), [people])

  async function handleSubmit() {
    if (!user || !token || !formAsset || !formTemplate) return
    if (!formAssignTo && !formAssignTeam) return
    setSubmitting(true)
    try {
      await api('/task-assignments', {
        method: 'POST',
        token,
        body: JSON.stringify({
          companyId: user.companyId,
          assetId: formAsset,
          checkTemplateId: formTemplate,
          assignedTo: formAssignTo || undefined,
          assignedTeam: formAssignTeam || undefined,
          createdBy: user.id,
          priority: formPriority,
          dueDate: formDue || undefined,
          notes: formNotes || undefined,
        }),
      })
      setShowForm(false)
      setFormAsset('')
      setFormTemplate('')
      setFormAssignTo('')
      setFormAssignTeam('')
      setFormPriority('normal')
      setFormDue('')
      setFormNotes('')
      fetchAll()
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  async function cancelTask(id: string) {
    if (!token) return
    try {
      await api(`/task-assignments/${id}`, { method: 'PATCH', token, body: JSON.stringify({ status: 'cancelled' }) })
      fetchAll()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  const isManager = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'supervisor'

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <Badge variant="amber">{pendingCount} pending</Badge>}
          {isManager && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" />
              Assign Task
            </Button>
          )}
        </div>
      </div>

      {/* Create task form */}
      {showForm && isManager && (
        <Card variant="yellow" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-chex-text">Create Task Assignment</h2>
            <button onClick={() => setShowForm(false)} className="text-chex-muted hover:text-chex-text">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-chex-muted block mb-1">Asset *</label>
              <select
                value={formAsset}
                onChange={(e) => { setFormAsset(e.target.value); setFormTemplate('') }}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              >
                <option value="">Select asset...</option>
                {assets.filter((a) => a.type).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-chex-muted block mb-1">Check Template *</label>
              <select
                value={formTemplate}
                onChange={(e) => setFormTemplate(e.target.value)}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              >
                <option value="">Select template...</option>
                {filteredTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-chex-muted block mb-1">Assign to Person</label>
              <select
                value={formAssignTo}
                onChange={(e) => setFormAssignTo(e.target.value)}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              >
                <option value="">Select person...</option>
                {operators.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-chex-muted block mb-1">Or Assign to Team</label>
              <select
                value={formAssignTeam}
                onChange={(e) => setFormAssignTeam(e.target.value)}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              >
                <option value="">Select team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-chex-muted block mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-chex-muted block mb-1">Due Date</label>
              <input
                type="date"
                value={formDue}
                onChange={(e) => setFormDue(e.target.value)}
                className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-chex-muted block mb-1">Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={2}
              className="w-full bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 py-2 placeholder:text-chex-faint focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !formAsset || !formTemplate || (!formAssignTo && !formAssignTeam)}>
            {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Create Task
          </Button>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tasks..."
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
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">
            {tasks.length === 0 ? 'No tasks assigned yet.' : 'No tasks match your filters.'}
          </p>
          {isManager && tasks.length === 0 && (
            <p className="text-xs text-chex-faint mt-1">Tap "Assign Task" to create a check assignment for an operative.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const asset = assetMap.get(task.assetId)
            const person = task.assignedTo ? personMap.get(task.assignedTo) : null
            const team = task.assignedTeam ? teamMap.get(task.assignedTeam) : null
            const template = templateMap.get(task.checkTemplateId)
            const creator = personMap.get(task.createdBy)
            const st = statusInfo[task.status] || { status: 'pending' as const, label: task.status }
            const isOverdue = task.dueDate && task.status === 'pending' && new Date(task.dueDate) < new Date()

            return (
              <Card
                key={task.id}
                variant={isOverdue || task.status === 'overdue' ? 'red' : task.priority === 'urgent' ? 'red' : 'default'}
                className="hover:border-chex-yellow/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-yellow-bg flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList className="h-5 w-5 text-chex-yellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-chex-text truncate">
                        {template?.name || 'Check'} — {asset?.name || 'Unknown asset'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-chex-muted">
                      {person && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{person.name}</span>}
                      {team && !person && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{team.name} (team)</span>}
                      <span>·</span>
                      <span>by {creator?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant={priorityVariant[task.priority] || 'default'}>
                        {task.priority}
                      </Badge>
                      <StatusDot status={st.status} label={st.label} />
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-chex-red font-medium' : 'text-chex-faint'}`}>
                          <Calendar className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span className="text-xs text-chex-faint flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(task.createdAt)}
                      </span>
                    </div>
                    {task.notes && <p className="text-xs text-chex-faint mt-1.5 italic">{task.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams({ assetId: task.assetId, templateId: task.checkTemplateId, taskId: task.id })
                          navigate(`/checks/new?${params}`)
                        }}
                      >
                        Start
                      </Button>
                    )}
                    {task.status === 'completed' && task.completedCheckId && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/checks/${task.completedCheckId}`)}>
                        View
                      </Button>
                    )}
                    {(task.status === 'pending' || task.status === 'overdue') && isManager && (
                      <Button size="sm" variant="outline" onClick={() => cancelTask(task.id)}>
                        Cancel
                      </Button>
                    )}
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
