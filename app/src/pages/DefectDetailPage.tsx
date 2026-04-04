import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, Truck, User, Calendar, Clock,
  Loader2, ClipboardCheck, FileText, CheckCircle, Wrench,
} from 'lucide-react'
import { Card, Badge, Button, StatusDot } from '@/components/ui'
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
  updatedAt: string
}

interface Asset { id: string; name: string; type: string }
interface Person { id: string; name: string; role: string }

const severityVariant: Record<string, 'red' | 'amber' | 'default'> = {
  critical: 'red',
  high: 'red',
  medium: 'amber',
  low: 'default',
}
const statusInfo: Record<string, { status: 'fail' | 'pending' | 'pass'; label: string }> = {
  open: { status: 'fail', label: 'Open' },
  in_progress: { status: 'pending', label: 'In Progress' },
  resolved: { status: 'pass', label: 'Resolved' },
  accepted: { status: 'pass', label: 'Accepted' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function DefectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [defect, setDefect] = useState<Defect | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [reporter, setReporter] = useState<Person | null>(null)
  const [resolver, setResolver] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [actionText, setActionText] = useState('')

  const fetchAll = useCallback(async () => {
    if (!id || !token) return
    try {
      const d = await api<Defect>(`/defects/${id}`, { token })
      setDefect(d)
      setActionText(d.actionTaken || '')
      const fetches: Promise<unknown>[] = [
        api<Asset>(`/assets/${d.assetId}`, { token }).then(setAsset),
        api<Person>(`/people/${d.reportedBy}`, { token }).then(setReporter),
      ]
      if (d.resolvedBy) {
        fetches.push(api<Person>(`/people/${d.resolvedBy}`, { token }).then(setResolver))
      }
      await Promise.all(fetches)
    } catch {
      navigate('/defects', { replace: true })
    }
    setLoading(false)
  }, [id, token, navigate])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function updateDefect(updates: Record<string, unknown>) {
    if (!defect || !token || !user) return
    setUpdating(true)
    try {
      const updated = await api<Defect>(`/defects/${defect.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(updates),
      })
      setDefect(updated)
      setActionText(updated.actionTaken || '')
      if (updated.resolvedBy && !resolver) {
        try {
          const r = await api<Person>(`/people/${updated.resolvedBy}`, { token })
          setResolver(r)
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setUpdating(false)
  }

  if (loading || !defect) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  const st = statusInfo[defect.status] || { status: 'fail' as const, label: defect.status }
  const canProgress = defect.status === 'open' || defect.status === 'in_progress'
  const nextStatus = defect.status === 'open' ? 'in_progress' : defect.status === 'in_progress' ? 'resolved' : null
  const nextLabel = defect.status === 'open' ? 'Start Work' : defect.status === 'in_progress' ? 'Mark Resolved' : null

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <button onClick={() => navigate('/defects')} className="flex items-center gap-1.5 text-sm text-chex-muted hover:text-chex-yellow transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Defects
      </button>

      {/* Header */}
      <Card variant={defect.severity === 'critical' ? 'red' : 'default'} glow={defect.severity === 'critical' && defect.status === 'open'}>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-[var(--radius-md)] bg-chex-red/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-chex-red" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-chex-text mb-2">{defect.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={severityVariant[defect.severity] || 'default'} pulse={defect.severity === 'critical' && defect.status === 'open'}>
                {defect.severity}
              </Badge>
              <StatusDot status={st.status} label={st.label} />
            </div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card>
        <h2 className="text-sm font-semibold text-chex-text mb-3">Details</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-chex-muted shrink-0" />
            <span className="text-chex-muted">Asset:</span>
            {asset ? (
              <button onClick={() => navigate(`/assets/${asset.id}`)} className="text-chex-yellow hover:underline">
                {asset.name}
              </button>
            ) : (
              <span className="text-chex-faint">Unknown</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-chex-muted shrink-0" />
            <span className="text-chex-muted">Reported by:</span>
            <span className="text-chex-text">{reporter?.name || 'Unknown'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-chex-muted shrink-0" />
            <span className="text-chex-muted">Reported:</span>
            <span className="text-chex-text">{formatDate(defect.createdAt)}</span>
          </div>

          {defect.checkId && (
            <div className="flex items-center gap-2 text-sm">
              <ClipboardCheck className="w-4 h-4 text-chex-muted shrink-0" />
              <span className="text-chex-muted">From check:</span>
              <button onClick={() => navigate(`/checks/${defect.checkId}`)} className="text-chex-yellow hover:underline">
                View check
              </button>
            </div>
          )}

          {defect.resolvedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-chex-muted">Resolved:</span>
              <span className="text-chex-text">{formatDate(defect.resolvedAt)}</span>
              {resolver && <span className="text-chex-muted">by {resolver.name}</span>}
            </div>
          )}
        </div>
      </Card>

      {/* Action Taken / Notes */}
      <Card>
        <h2 className="text-sm font-semibold text-chex-text mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-chex-muted" />
          Action Taken
        </h2>
        <textarea
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          placeholder="Describe the corrective action taken..."
          rows={3}
          disabled={defect.status === 'resolved' || defect.status === 'accepted'}
          className="w-full bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 py-2 placeholder:text-chex-faint focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors disabled:opacity-50 resize-none"
        />
        {canProgress && actionText !== (defect.actionTaken || '') && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => updateDefect({ actionTaken: actionText })}
            disabled={updating}
          >
            Save Notes
          </Button>
        )}
      </Card>

      {/* Actions */}
      {canProgress && (
        <Card>
          <h2 className="text-sm font-semibold text-chex-text mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-chex-muted" />
            Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {nextStatus && nextLabel && (
              <Button
                onClick={() => {
                  const updates: Record<string, unknown> = {
                    status: nextStatus,
                    actionTaken: actionText || undefined,
                  }
                  if (nextStatus === 'resolved' && user) {
                    updates.resolvedBy = user.id
                  }
                  updateDefect(updates)
                }}
                disabled={updating}
              >
                {nextStatus === 'resolved' ? <CheckCircle className="w-4 h-4 mr-1.5" /> : <Clock className="w-4 h-4 mr-1.5" />}
                {nextLabel}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Accept (for resolved defects) */}
      {defect.status === 'resolved' && (
        <Card>
          <h2 className="text-sm font-semibold text-chex-text mb-3">Supervisor Sign-Off</h2>
          <p className="text-xs text-chex-muted mb-3">Confirm this defect has been properly resolved.</p>
          <Button onClick={() => updateDefect({ status: 'accepted' })} disabled={updating}>
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Accept Resolution
          </Button>
        </Card>
      )}
    </div>
  )
}
