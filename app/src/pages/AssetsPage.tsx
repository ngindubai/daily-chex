import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, Plus, X, Loader2, Truck, Wrench, Container, MapPin, QrCode } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Asset {
  id: string
  name: string
  type: 'vehicle' | 'trailer' | 'plant'
  status: string
  registration: string | null
  plantId: string | null
  supplier: string | null
  category: string | null
  weightClass: string | null
  siteId: string | null
  qrCode: string | null
  nextService: string | null
  calibrationDue: string | null
}

interface Site {
  id: string
  name: string
}

const typeIcon: Record<string, typeof Package> = {
  vehicle: Truck,
  trailer: Container,
  plant: Wrench,
}
const typeBadgeVariant: Record<string, 'blue' | 'amber' | 'yellow'> = {
  vehicle: 'blue',
  trailer: 'amber',
  plant: 'yellow',
}
const statusVariant: Record<string, 'green' | 'red' | 'default' | 'amber'> = {
  active: 'green',
  defective: 'red',
  off_hire: 'amber',
  archived: 'default',
}

export function AssetsPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [assets, setAssets] = useState<Asset[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    type: 'vehicle' as string,
    name: '',
    registration: '',
    plantId: '',
    supplier: '',
    category: '',
    weightClass: 'standard',
    siteId: '',
    nextService: '',
    calibrationDue: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(() => {
    if (!user || !token) return
    Promise.all([
      api<Asset[]>(`/assets?companyId=${user.companyId}`, { token }),
      api<Site[]>(`/sites?companyId=${user.companyId}`, { token }),
    ])
      .then(([a, s]) => { setAssets(a); setSites(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const siteMap = useMemo(() => new Map(sites.map((s) => [s.id, s.name])), [sites])

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter && a.type !== typeFilter) return false
      if (siteFilter && a.siteId !== siteFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          a.name.toLowerCase().includes(q) ||
          (a.registration || '').toLowerCase().includes(q) ||
          (a.plantId || '').toLowerCase().includes(q) ||
          (a.qrCode || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [assets, search, typeFilter, siteFilter])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name || !user || !token) return
    setSaving(true)
    try {
      await api('/assets', {
        token,
        method: 'POST',
        body: JSON.stringify({
          companyId: user.companyId,
          type: addForm.type,
          name: addForm.name,
          registration: addForm.registration || undefined,
          plantId: addForm.plantId || undefined,
          supplier: addForm.supplier || undefined,
          category: addForm.category || undefined,
          weightClass: addForm.type === 'vehicle' ? addForm.weightClass : undefined,
          siteId: addForm.siteId || undefined,
          nextService: addForm.nextService || undefined,
          calibrationDue: addForm.calibrationDue || undefined,
        }),
      })
      setShowAdd(false)
      setAddForm({ type: 'vehicle', name: '', registration: '', plantId: '', supplier: '', category: '', weightClass: 'standard', siteId: '', nextService: '', calibrationDue: '' })
      fetchAll()
    } catch { /* toast later */ }
    setSaving(false)
  }

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
        <h1 className="text-xl font-bold tracking-tight">Assets</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Asset
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search name, reg, plant ID, QR..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All types</option>
          <option value="vehicle">Vehicle</option>
          <option value="trailer">Trailer</option>
          <option value="plant">Plant</option>
        </select>
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Add asset form */}
      {showAdd && (
        <Card variant="yellow" className="relative">
          <button onClick={() => setShowAdd(false)} className="absolute top-3 right-3 p-1 text-chex-muted hover:text-chex-text cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold mb-3">New Asset</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">Type</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
                >
                  <option value="vehicle">Vehicle</option>
                  <option value="trailer">Trailer</option>
                  <option value="plant">Plant</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">Site</label>
                <select
                  value={addForm.siteId}
                  onChange={(e) => setAddForm((f) => ({ ...f, siteId: e.target.value }))}
                  className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
                >
                  <option value="">None</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Name"
              placeholder="e.g. Ford Transit Custom #1"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              {(addForm.type === 'vehicle' || addForm.type === 'trailer') && (
                <Input
                  label="Registration"
                  placeholder="YN73 XKR"
                  value={addForm.registration}
                  onChange={(e) => setAddForm((f) => ({ ...f, registration: e.target.value }))}
                />
              )}
              {addForm.type === 'plant' && (
                <>
                  <Input
                    label="Plant ID"
                    placeholder="GAP-29847"
                    value={addForm.plantId}
                    onChange={(e) => setAddForm((f) => ({ ...f, plantId: e.target.value }))}
                  />
                  <Input
                    label="Supplier"
                    placeholder="GAP Group"
                    value={addForm.supplier}
                    onChange={(e) => setAddForm((f) => ({ ...f, supplier: e.target.value }))}
                  />
                </>
              )}
              {addForm.type === 'vehicle' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">Weight class</label>
                  <select
                    value={addForm.weightClass}
                    onChange={(e) => setAddForm((f) => ({ ...f, weightClass: e.target.value }))}
                    className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
                  >
                    <option value="standard">Standard</option>
                    <option value="over_7_5t">Over 7.5t</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving || !addForm.name}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Create Asset
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Asset list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">
            {assets.length === 0 ? 'No assets yet. Add your first asset.' : 'No results matching your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset) => {
            const Icon = typeIcon[asset.type] || Package
            return (
              <Card
                key={asset.id}
                className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-raised flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-chex-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-chex-text truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={typeBadgeVariant[asset.type] || 'default'}>{asset.type}</Badge>
                    {asset.siteId && siteMap.has(asset.siteId) && (
                      <span className="text-xs text-chex-muted flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />{siteMap.get(asset.siteId)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <Badge variant={statusVariant[asset.status] || 'default'}>{asset.status}</Badge>
                  {asset.qrCode && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-chex-faint">
                      <QrCode className="w-3 h-3" />{asset.qrCode}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
