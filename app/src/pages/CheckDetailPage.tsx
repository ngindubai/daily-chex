import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Check, X, Minus, MapPin, Calendar, User,
  Loader2, Truck, ClipboardCheck, AlertTriangle,
} from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface CheckData {
  id: string
  assetId: string
  personId: string
  checkTemplateId: string
  status: string
  overallResult: string | null
  mileageStart: number | null
  mileageEnd: number | null
  signatureUrl: string | null
  startLat: string | null
  startLng: string | null
  endLat: string | null
  endLng: string | null
  completedAt: string | null
  createdAt: string
  items: CheckItem[]
}

interface CheckItem {
  id: string
  templateItemId: string
  result: string | null
  notes: string | null
}

interface Asset { id: string; name: string; type: string; registration: string | null }
interface Person { id: string; name: string; role: string }

interface Template {
  id: string
  name: string
  items: TemplateItem[]
}

interface TemplateItem {
  id: string
  section: string | null
  label: string
  sortOrder: number
}

const resultIcon: Record<string, React.ReactNode> = {
  pass: <Check className="w-3.5 h-3.5 text-green-400" />,
  fail: <X className="w-3.5 h-3.5 text-red-400" />,
  na: <Minus className="w-3.5 h-3.5 text-chex-faint" />,
}

export function CheckDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [check, setCheck] = useState<CheckData | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [person, setPerson] = useState<Person | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!id || !token) return
    try {
      const c = await api<CheckData>(`/checks/${id}`, { token })
      setCheck(c)
      const [a, p, t] = await Promise.all([
        api<Asset>(`/assets/${c.assetId}`, { token }),
        api<Person>(`/people/${c.personId}`, { token }),
        api<Template>(`/check-templates/${c.checkTemplateId}`, { token }),
      ])
      setAsset(a)
      setPerson(p)
      setTemplate(t)
    } catch {
      navigate('/checks', { replace: true })
    }
    setLoading(false)
  }, [id, token, navigate])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Map template item ids to their labels
  const itemMap = useMemo(() => {
    if (!template) return new Map<string, TemplateItem>()
    return new Map(template.items.map((i) => [i.id, i]))
  }, [template])

  // Group check items by section
  const sections = useMemo(() => {
    if (!check) return new Map<string, Array<CheckItem & { label: string; section: string }>>()
    const map = new Map<string, Array<CheckItem & { label: string; section: string }>>()
    for (const ci of check.items) {
      const ti = itemMap.get(ci.templateItemId)
      const section = ti?.section || 'General'
      const label = ti?.label || 'Unknown'
      if (!map.has(section)) map.set(section, [])
      map.get(section)!.push({ ...ci, label, section })
    }
    return map
  }, [check, itemMap])

  const failCount = check?.items.filter((i) => i.result === 'fail').length || 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  if (!check) return null

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/checks')}
          className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-surface border border-chex-border flex items-center justify-center hover:border-chex-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">{asset?.name || 'Check'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={check.status === 'completed' ? 'green' : check.status === 'in_progress' ? 'amber' : 'default'}>
              {check.status}
            </Badge>
            {check.overallResult && (
              <Badge variant={check.overallResult === 'pass' ? 'green' : 'red'}>
                {check.overallResult.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Summary card */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {template && (
            <Detail icon={<ClipboardCheck className="w-3.5 h-3.5" />} label="Template" value={template.name} />
          )}
          {person && (
            <Detail icon={<User className="w-3.5 h-3.5" />} label="Operator" value={person.name} />
          )}
          {asset?.registration && (
            <Detail icon={<Truck className="w-3.5 h-3.5" />} label="Registration" value={asset.registration} />
          )}
          {check.completedAt && (
            <Detail
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Completed"
              value={new Date(check.completedAt).toLocaleString()}
            />
          )}
          {check.startLat && check.startLng && (
            <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="GPS Start" value={`${parseFloat(check.startLat).toFixed(4)}, ${parseFloat(check.startLng).toFixed(4)}`} />
          )}
          {check.mileageStart != null && (
            <Detail icon={<Truck className="w-3.5 h-3.5" />} label="Mileage" value={`${check.mileageStart}${check.mileageEnd ? ` → ${check.mileageEnd}` : ''}`} />
          )}
        </div>
      </Card>

      {/* Fail summary */}
      {failCount > 0 && (
        <Card variant="red">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">{failCount} item{failCount !== 1 ? 's' : ''} failed</span>
          </div>
        </Card>
      )}

      {/* Check items by section */}
      {Array.from(sections.entries()).map(([section, items]) => (
        <Card key={section}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-chex-muted mb-2">{section}</h3>
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-2 p-2 rounded-[var(--radius-sm)] ${
                  item.result === 'fail' ? 'bg-red-500/5' : ''
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {resultIcon[item.result || 'na'] || resultIcon.na}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.label}</p>
                  {item.notes && <p className="text-xs text-chex-muted mt-0.5">{item.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Signature */}
      {check.signatureUrl && (
        <Card>
          <h3 className="text-sm font-semibold mb-2">Signature</h3>
          <img
            src={check.signatureUrl}
            alt="Operator signature"
            className="max-w-[200px] h-auto rounded-[var(--radius-sm)] border border-chex-border"
          />
        </Card>
      )}
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-chex-faint mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-chex-faint">{label}</p>
        <p className="text-chex-text font-medium">{value}</p>
      </div>
    </div>
  )
}
