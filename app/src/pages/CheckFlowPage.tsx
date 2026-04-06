import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, X, Minus, Camera, Loader2,
  MapPin, ClipboardCheck, PenTool, Send, AlertTriangle, Search,
} from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import { SignatureCanvas } from '@/components/SignatureCanvas'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

/* ───────────────────── Types ───────────────────── */

interface Asset {
  id: string
  name: string
  type: string
  registration: string | null
  weightClass: string | null
  siteId: string | null
  qrCode: string | null
}

interface Site { id: string; name: string }
interface Team { id: string; name: string }

interface Template {
  id: string
  name: string
  slug: string
  assetType: string
  checkFrequency: string
}

interface TemplateItem {
  id: string
  section: string | null
  label: string
  sortOrder: number
  appliesWhen: string | null
}

interface ItemResult {
  templateItemId: string
  result: 'pass' | 'fail' | 'na'
  notes: string
}

type Step = 'select' | 'template' | 'checklist' | 'summary' | 'sign' | 'submitting' | 'done'

/* ───────────────────── GPS helper ───────────────────── */

function captureGps(): Promise<{ lat: number; lng: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}

/* ───────────────────── Component ───────────────────── */

export function CheckFlowPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, token } = useAuth()

  // Data
  const [assets, setAssets] = useState<Asset[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(true)

  // Flow state
  const [step, setStep] = useState<Step>('select')
  const [selectedAssetId, setSelectedAssetId] = useState(searchParams.get('assetId') || '')
  const [selectedTemplateId, setSelectedTemplateId] = useState(searchParams.get('templateId') || '')
  const taskId = searchParams.get('taskId')
  const [mileageStart, setMileageStart] = useState('')
  const [itemResults, setItemResults] = useState<Map<string, ItemResult>>(new Map())
  const [signatureData, setSignatureData] = useState('')
  const [startGps, setStartGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [assetSearch, setAssetSearch] = useState('')

  // Fetch base data
  const fetchData = useCallback(async () => {
    if (!user || !token) return
    try {
      const [a, s, t, tpl] = await Promise.all([
        api<Asset[]>(`/assets?companyId=${user.companyId}`, { token }),
        api<Site[]>(`/sites?companyId=${user.companyId}`, { token }),
        api<Team[]>(`/teams?companyId=${user.companyId}`, { token }),
        api<Template[]>(`/check-templates?companyId=${user.companyId}`, { token }),
      ])
      setAssets(a)
      setSites(s)
      setTeams(t)
      setTemplates(tpl)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchData() }, [fetchData])

  const selectedAsset = useMemo(() => assets.find((a) => a.id === selectedAssetId), [assets, selectedAssetId])
  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId])
  const siteName = useMemo(() => sites.find((s) => s.id === selectedAsset?.siteId)?.name, [sites, selectedAsset])

  // Filter templates that match the asset type
  const matchingTemplates = useMemo(() => {
    if (!selectedAsset) return templates
    return templates.filter((t) => t.assetType === selectedAsset.type)
  }, [templates, selectedAsset])

  // Filter template items based on asset properties (conditional display)
  const activeItems = useMemo(() => {
    return templateItems.filter((item) => {
      if (!item.appliesWhen) return true
      try {
        const cond = JSON.parse(item.appliesWhen)
        if (cond.weight_class && selectedAsset?.weightClass !== cond.weight_class) return false
      } catch { /* show it if parse fails */ }
      return true
    })
  }, [templateItems, selectedAsset])

  // Group items by section
  const sections = useMemo(() => {
    const map = new Map<string, TemplateItem[]>()
    for (const item of activeItems) {
      const key = item.section || 'General'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [activeItems])

  // Fetch template items when template selected
  useEffect(() => {
    if (!selectedTemplateId || !token) return
    api<{ items: TemplateItem[] }>(`/check-templates/${selectedTemplateId}`, { token })
      .then((t) => setTemplateItems(t.items || []))
      .catch(() => {})
  }, [selectedTemplateId, token])

  // Auto-select asset from URL param
  useEffect(() => {
    if (selectedAssetId && assets.length && step === 'select') {
      const asset = assets.find((a) => a.id === selectedAssetId)
      if (asset) {
        // If template is also pre-filled (from task assignment), skip to checklist
        if (selectedTemplateId && templates.length) {
          setStep('checklist')
        } else {
          setStep('template')
        }
      }
    }
  }, [selectedAssetId, assets, selectedTemplateId, templates]) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture GPS on template selection (start of check)
  useEffect(() => {
    if (step === 'checklist' && !startGps) {
      captureGps().then((gps) => { if (gps) setStartGps(gps) })
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Item result helpers ─── */
  const setResult = (itemId: string, result: 'pass' | 'fail' | 'na') => {
    setItemResults((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) || { templateItemId: itemId, result, notes: '' }
      next.set(itemId, { ...existing, result })
      return next
    })
  }

  const setNotes = (itemId: string, notes: string) => {
    setItemResults((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId) || { templateItemId: itemId, result: 'pass', notes: '' }
      next.set(itemId, { ...existing, notes })
      return next
    })
  }

  const failedItems = useMemo(() => {
    return activeItems.filter((item) => itemResults.get(item.id)?.result === 'fail')
  }, [activeItems, itemResults])

  const allItemsAnswered = activeItems.length > 0 && activeItems.every((item) => itemResults.has(item.id))
  const hasFails = failedItems.length > 0
  const overallResult = hasFails ? 'fail' : 'pass'

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!user || !token || !selectedAssetId || !selectedTemplateId) return
    setStep('submitting')
    try {
      const endGps = await captureGps()

      // 1. Create the check
      const check = await api<{ id: string }>('/checks', {
        token,
        method: 'POST',
        body: JSON.stringify({
          companyId: user.companyId,
          assetId: selectedAssetId,
          personId: user.sub,
          siteId: selectedAsset?.siteId || undefined,
          teamId: user.teamId || undefined,
          checkTemplateId: selectedTemplateId,
          mileageStart: mileageStart ? parseInt(mileageStart) : undefined,
          startLat: startGps?.lat?.toString(),
          startLng: startGps?.lng?.toString(),
          startAccuracy: startGps?.accuracy?.toString(),
        }),
      })

      // 2. Add all items
      const items = activeItems.map((item) => {
        const r = itemResults.get(item.id)
        return {
          templateItemId: item.id,
          result: r?.result || 'na',
          notes: r?.notes || undefined,
        }
      })
      await api(`/checks/${check.id}/items`, {
        token,
        method: 'POST',
        body: JSON.stringify({ items }),
      })

      // 3. Complete with signature + end GPS
      await api(`/checks/${check.id}/complete`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({
          overallResult,
          signatureUrl: signatureData || undefined,
          endLat: endGps?.lat?.toString(),
          endLng: endGps?.lng?.toString(),
          endAccuracy: endGps?.accuracy?.toString(),
          mileageEnd: undefined,
        }),
      })

      // 4. If this check was from a task assignment, mark it completed
      if (taskId) {
        try {
          await api(`/task-assignments/${taskId}`, {
            token,
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed', completedCheckId: check.id }),
          })
        } catch { /* non-critical */ }
      }

      setStep('done')
    } catch {
      setStep('sign') // go back to sign step on error
    }
  }

  /* ─── Filtered asset list ─── */
  const filteredAssets = useMemo(() => {
    if (!assetSearch) return assets.filter((a) => a.type !== 'archived')
    const q = assetSearch.toLowerCase()
    return assets.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.registration || '').toLowerCase().includes(q) ||
      (a.qrCode || '').toLowerCase().includes(q),
    )
  }, [assets, assetSearch])

  /* ─── Render ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4 max-w-2xl mx-auto">
      {/* Progress header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'select' || step === 'done') navigate('/checks')
            else if (step === 'template') setStep('select')
            else if (step === 'checklist') setStep('template')
            else if (step === 'summary') setStep('checklist')
            else if (step === 'sign') setStep('summary')
          }}
          className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-surface border border-chex-border flex items-center justify-center hover:border-chex-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">
            {step === 'select' && 'Select Asset'}
            {step === 'template' && 'Choose Check Type'}
            {step === 'checklist' && (selectedTemplate?.name || 'Checklist')}
            {step === 'summary' && 'Defect Summary'}
            {step === 'sign' && 'Sign Off'}
            {step === 'submitting' && 'Submitting...'}
            {step === 'done' && 'Check Complete'}
          </h1>
          {selectedAsset && step !== 'select' && (
            <p className="text-xs text-chex-muted">{selectedAsset.name}{siteName ? ` · ${siteName}` : ''}</p>
          )}
        </div>
        <StepIndicator current={step} />
      </div>

      {/* ─── STEP: Select Asset ─── */}
      {step === 'select' && (
        <div className="space-y-3">
          <Input
            placeholder="Search by name, registration, QR..."
            icon={<Search className="h-4 w-4" />}
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
          />
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className={`flex items-center gap-3 cursor-pointer transition-colors ${
                  selectedAssetId === asset.id
                    ? 'border-chex-yellow bg-chex-yellow/5'
                    : 'hover:border-chex-yellow/20'
                }`}
                onClick={() => { setSelectedAssetId(asset.id); setStep('template') }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 text-xs text-chex-muted mt-0.5">
                    <Badge variant={asset.type === 'vehicle' ? 'blue' : asset.type === 'plant' ? 'yellow' : 'amber'}>
                      {asset.type}
                    </Badge>
                    {asset.registration && <span>{asset.registration}</span>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-chex-faint" />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── STEP: Select Template ─── */}
      {step === 'template' && (
        <div className="space-y-3">
          {selectedAsset && selectedAsset.type === 'vehicle' && (
            <Input
              label="Starting Mileage (optional)"
              placeholder="e.g. 34200"
              type="number"
              value={mileageStart}
              onChange={(e) => setMileageStart(e.target.value)}
            />
          )}
          <p className="text-sm text-chex-muted">Select the check type:</p>
          <div className="space-y-2">
            {matchingTemplates.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:border-chex-yellow/20 transition-colors"
                onClick={() => {
                  setSelectedTemplateId(t.id)
                  setStep('checklist')
                }}
              >
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5 h-5 text-chex-yellow shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-chex-muted capitalize">{t.checkFrequency} · {t.assetType}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-chex-faint" />
                </div>
              </Card>
            ))}
          </div>
          {matchingTemplates.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-sm text-chex-muted">No templates available for this asset type.</p>
            </Card>
          )}
        </div>
      )}

      {/* ─── STEP: Checklist ─── */}
      {step === 'checklist' && (
        <div className="space-y-4">
          {startGps && (
            <div className="flex items-center gap-1.5 text-xs text-chex-faint">
              <MapPin className="w-3 h-3" />
              GPS captured: {startGps.lat.toFixed(4)}, {startGps.lng.toFixed(4)} (±{startGps.accuracy.toFixed(0)}m)
            </div>
          )}

          {Array.from(sections.entries()).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-chex-muted mb-2">{section}</h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const r = itemResults.get(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`rounded-[var(--radius-md)] border transition-colors ${
                        r?.result === 'fail'
                          ? 'border-red-500/30 bg-red-500/5'
                          : r?.result === 'pass'
                            ? 'border-green-500/20 bg-green-500/5'
                            : r?.result === 'na'
                              ? 'border-chex-border bg-chex-surface/50'
                              : 'border-chex-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 p-3">
                        <span className="text-sm flex-1">{item.label}</span>
                        <div className="flex gap-1">
                          <ResultButton
                            active={r?.result === 'pass'}
                            color="green"
                            onClick={() => setResult(item.id, 'pass')}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </ResultButton>
                          <ResultButton
                            active={r?.result === 'fail'}
                            color="red"
                            onClick={() => setResult(item.id, 'fail')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </ResultButton>
                          <ResultButton
                            active={r?.result === 'na'}
                            color="gray"
                            onClick={() => setResult(item.id, 'na')}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </ResultButton>
                        </div>
                      </div>
                      {/* Show notes field on fail */}
                      {r?.result === 'fail' && (
                        <div className="px-3 pb-3 space-y-2">
                          <textarea
                            placeholder="Describe the defect..."
                            value={r.notes}
                            onChange={(e) => setNotes(item.id, e.target.value)}
                            className="w-full h-16 bg-chex-bg border border-chex-border rounded-[var(--radius-sm)] text-sm text-chex-text p-2 resize-none focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <span className="text-xs text-chex-muted">
              {itemResults.size} / {activeItems.length} answered
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={!allItemsAnswered}
              onClick={() => setStep(hasFails ? 'summary' : 'sign')}
            >
              {hasFails ? 'View Defects' : 'Sign Off'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP: Defect Summary ─── */}
      {step === 'summary' && (
        <div className="space-y-4">
          <Card variant="red">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold">{failedItems.length} Defect{failedItems.length !== 1 ? 's' : ''} Found</h3>
            </div>
            <div className="space-y-3">
              {failedItems.map((item) => {
                const r = itemResults.get(item.id)
                return (
                  <div key={item.id} className="border-t border-red-500/20 pt-2">
                    <p className="text-sm font-medium text-chex-text">{item.label}</p>
                    {item.section && <p className="text-xs text-chex-muted">{item.section}</p>}
                    {r?.notes && <p className="text-sm text-chex-muted mt-1">{r.notes}</p>}
                  </div>
                )
              })}
            </div>
          </Card>

          <p className="text-xs text-chex-faint text-center">
            These defects will be logged automatically. Proceed to sign off.
          </p>

          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('checklist')}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Checklist
            </Button>
            <Button variant="primary" size="sm" onClick={() => setStep('sign')}>
              Sign Off
              <PenTool className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP: Signature ─── */}
      {step === 'sign' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-1">Check Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-chex-faint text-xs">Asset</span>
                <p className="font-medium">{selectedAsset?.name}</p>
              </div>
              <div>
                <span className="text-chex-faint text-xs">Template</span>
                <p className="font-medium">{selectedTemplate?.name}</p>
              </div>
              <div>
                <span className="text-chex-faint text-xs">Result</span>
                <Badge variant={overallResult === 'pass' ? 'green' : 'red'}>
                  {overallResult.toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-chex-faint text-xs">Items</span>
                <p className="font-medium">{activeItems.length} checked</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold mb-3">Digital Signature</h3>
            <SignatureCanvas onEnd={setSignatureData} />
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!signatureData}
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" />
            Submit Check
          </Button>
        </div>
      )}

      {/* ─── STEP: Submitting ─── */}
      {step === 'submitting' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-chex-yellow animate-spin" />
          <p className="text-sm text-chex-muted">Submitting check...</p>
        </div>
      )}

      {/* ─── STEP: Done ─── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-bold">Check Submitted</h2>
          <p className="text-sm text-chex-muted max-w-xs">
            {selectedAsset?.name} — {overallResult === 'pass' ? 'All items passed.' : `${failedItems.length} defect(s) logged.`}
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" onClick={() => navigate('/checks')}>
              View All Checks
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/scan')}>
              Scan Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Subcomponents ─── */

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['select', 'template', 'checklist', 'sign']
  const idx = steps.indexOf(current === 'summary' ? 'checklist' : current === 'submitting' || current === 'done' ? 'sign' : current)
  return (
    <div className="flex gap-1">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            i <= idx ? 'bg-chex-yellow' : 'bg-chex-border'
          }`}
        />
      ))}
    </div>
  )
}

function ResultButton({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean
  color: 'green' | 'red' | 'gray'
  onClick: () => void
  children: React.ReactNode
}) {
  const colors = {
    green: active ? 'bg-green-500 text-white border-green-500' : 'border-chex-border text-chex-muted hover:border-green-500/40 hover:text-green-400',
    red: active ? 'bg-red-500 text-white border-red-500' : 'border-chex-border text-chex-muted hover:border-red-500/40 hover:text-red-400',
    gray: active ? 'bg-chex-faint text-white border-chex-faint' : 'border-chex-border text-chex-muted hover:border-chex-muted',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-8 rounded-[var(--radius-sm)] border flex items-center justify-center transition-colors cursor-pointer ${colors[color]}`}
    >
      {children}
    </button>
  )
}
