import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, X, Loader2, Zap, ArrowLeft, ChevronRight,
  Truck, Container, Wrench, Package,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Asset {
  id: string
  name: string
  type: string
  registration: string | null
  category: string | null
  siteId: string | null
  teamId?: string | null
  assignedToId: string | null
  status: string
  photoUrl: string | null
}

interface Template {
  id: string
  name: string
  assetType: string
  assetCategory: string | null
  checkFrequency: string
  items: Array<{ id: string; label: string; section: string | null; sortOrder: number }>
}

type QuickResult = 'pass' | 'fail' | null

const typeIcon: Record<string, typeof Package> = {
  vehicle: Truck,
  trailer: Container,
  plant: Wrench,
  machinery: Wrench,
}

const typeBadge: Record<string, 'blue' | 'amber' | 'yellow' | 'green'> = {
  vehicle: 'blue',
  trailer: 'amber',
  plant: 'yellow',
  machinery: 'green',
}

export function QuickCheckPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [assets, setAssets] = useState<Asset[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<Map<string, QuickResult>>(new Map())

  const fetchData = useCallback(async () => {
    if (!user || !token) return
    try {
      const [allAssets, tplList] = await Promise.all([
        api<Asset[]>(`/assets?companyId=${user.companyId}`, { token }),
        api<Template[]>(`/check-templates?companyId=${user.companyId}`, { token }),
      ])

      // Fetch full template data (with items) for each daily template
      const dailyTpls = tplList.filter((t) => t.checkFrequency === 'daily')
      const fullTpls = await Promise.all(
        dailyTpls.map((t) => api<Template>(`/check-templates/${t.id}`, { token }))
      )
      setTemplates(fullTpls)

      // Show every active asset assigned to me — regardless of template availability
      const myAssets = allAssets.filter(
        (a) => a.status === 'active' && a.assignedToId === user.id
      )
      setAssets(myAssets.length > 0 ? myAssets : allAssets.filter((a) => a.status === 'active'))
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchData() }, [fetchData])

  // Match each asset to the most specific daily template available.
  // Priority: 1) assetType + assetCategory match, 2) assetType match.
  const assetTemplateMap = useMemo(() => {
    const map = new Map<string, Template>()
    for (const a of assets) {
      const exact = templates.find(
        (t) => t.assetType === a.type && t.assetCategory && t.assetCategory === a.category,
      )
      const general = templates.find((t) => t.assetType === a.type && !t.assetCategory)
      const tpl = exact || general
      if (tpl && tpl.items && tpl.items.length > 0) map.set(a.id, tpl)
    }
    return map
  }, [assets, templates])

  // Show ALL assigned assets — even those without a template (they show as "no daily check defined")
  const checkableAssets = useMemo(() => assets, [assets])

  const setResult = (assetId: string, r: QuickResult) => {
    setResults((prev) => {
      const next = new Map(prev)
      next.set(assetId, r)
      return next
    })
  }

  const markedCount = Array.from(results.values()).filter(Boolean).length

  const handleSubmit = async () => {
    if (!user || !token || markedCount === 0) return
    setSubmitting(true)

    const entries = checkableAssets
      .filter((a) => results.get(a.id) && assetTemplateMap.has(a.id))
      .map((a) => {
        const tpl = assetTemplateMap.get(a.id)!
        const firstItem = tpl.items[0]
        const r = results.get(a.id) as 'pass' | 'fail'
        return {
          assetId: a.id,
          checkTemplateId: tpl.id,
          templateItemId: firstItem.id,
          siteId: a.siteId || undefined,
          result: r,
          overallResult: r,
        }
      })

    if (entries.length === 0) {
      setSubmitting(false)
      return
    }

    try {
      await api('/checks/quick-batch', {
        token,
        method: 'POST',
        body: JSON.stringify({
          companyId: user.companyId,
          personId: user.id,
          entries,
        }),
      })
      setDone(true)
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
        <Card className="text-center py-10">
          <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-base font-semibold mb-1">{markedCount} check{markedCount !== 1 ? 's' : ''} submitted</h2>
          <p className="text-sm text-chex-muted mb-4">All results recorded successfully.</p>
          <div className="flex justify-center gap-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/checks')}>
              View Checks
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setDone(false); setResults(new Map()) }}>
              Check Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-surface border border-chex-border flex items-center justify-center hover:border-chex-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">Quick Daily Check</h1>
          <p className="text-xs text-chex-muted">Mark each asset pass or fail in one go</p>
        </div>
        {markedCount > 0 && (
          <span className="text-xs font-medium text-chex-yellow">{markedCount}/{checkableAssets.length}</span>
        )}
      </div>

      {checkableAssets.length === 0 ? (
        <Card className="text-center py-10">
          <Zap className="w-8 h-8 text-chex-faint mx-auto mb-2" />
          <p className="text-sm text-chex-muted">No assets assigned to you.</p>
          <p className="text-xs text-chex-faint mt-1">Ask your manager to assign you some kit.</p>
        </Card>
      ) : (
        <>
          {/* Mark all pass shortcut */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                const next = new Map<string, QuickResult>()
                checkableAssets.forEach((a) => {
                  if (assetTemplateMap.has(a.id)) next.set(a.id, 'pass')
                })
                setResults(next)
              }}
              className="text-xs text-chex-yellow hover:text-chex-yellow/80 font-medium cursor-pointer"
            >
              Mark all pass
            </button>
          </div>

          {/* Asset rows */}
          <div className="space-y-2">
            {checkableAssets.map((asset) => {
              const r = results.get(asset.id)
              const Icon = typeIcon[asset.type] || Package
              const tpl = assetTemplateMap.get(asset.id)
              const hasTpl = !!tpl

              return (
                <div
                  key={asset.id}
                  className={`rounded-[var(--radius-lg)] border transition-colors ${
                    r === 'fail'
                      ? 'border-red-500/30 bg-red-500/5'
                      : r === 'pass'
                        ? 'border-green-500/20 bg-green-500/5'
                        : 'border-chex-border bg-chex-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 rounded-[var(--radius-md)] bg-chex-raised border border-chex-border flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-chex-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={typeBadge[asset.type] || 'default'}>{asset.type}</Badge>
                        {asset.registration && (
                          <span className="text-xs text-chex-faint">{asset.registration}</span>
                        )}
                        {tpl ? (
                          <span className="text-xs text-chex-faint truncate hidden sm:block">· {tpl.name}</span>
                        ) : (
                          <span className="text-xs text-amber-400/80 truncate">· no daily template</span>
                        )}
                      </div>
                    </div>

                    {/* Pass / Fail / Clear buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => hasTpl && setResult(asset.id, r === 'pass' ? null : 'pass')}
                        disabled={!hasTpl}
                        className={`h-8 w-8 rounded-[var(--radius-md)] border flex items-center justify-center transition-colors ${
                          !hasTpl
                            ? 'bg-chex-surface border-chex-border text-chex-faint opacity-40 cursor-not-allowed'
                            : r === 'pass'
                              ? 'bg-green-500/20 border-green-500/40 text-green-400 cursor-pointer'
                              : 'bg-chex-surface border-chex-border text-chex-muted hover:border-green-500/30 hover:text-green-400 cursor-pointer'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => hasTpl && setResult(asset.id, r === 'fail' ? null : 'fail')}
                        disabled={!hasTpl}
                        className={`h-8 w-8 rounded-[var(--radius-md)] border flex items-center justify-center transition-colors ${
                          !hasTpl
                            ? 'bg-chex-surface border-chex-border text-chex-faint opacity-40 cursor-not-allowed'
                            : r === 'fail'
                              ? 'bg-red-500/20 border-red-500/40 text-red-400 cursor-pointer'
                              : 'bg-chex-surface border-chex-border text-chex-muted hover:border-red-500/30 hover:text-red-400 cursor-pointer'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/assets/${asset.id}`)}
                        className="h-8 w-8 rounded-[var(--radius-md)] border border-chex-border bg-chex-surface text-chex-muted hover:text-chex-text flex items-center justify-center transition-colors cursor-pointer"
                        title="Open asset"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-chex-muted">
              {markedCount} of {checkableAssets.length} marked
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={markedCount === 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                : `Submit ${markedCount} check${markedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
