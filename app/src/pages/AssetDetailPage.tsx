import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Truck, Container, Wrench, Package, MapPin, QrCode,
  Calendar, Weight, Hash, Building, Loader2, ArrowRightLeft, CheckCircle, AlertTriangle, ClipboardCheck,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Card, Badge, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Asset {
  id: string
  companyId: string
  name: string
  type: 'vehicle' | 'trailer' | 'plant'
  status: string
  registration: string | null
  plantId: string | null
  serialNumber: string | null
  supplier: string | null
  category: string | null
  weightClass: string | null
  siteId: string | null
  qrCode: string | null
  photoUrl: string | null
  nextService: string | null
  calibrationDue: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
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
const typeBadge: Record<string, 'blue' | 'amber' | 'yellow'> = {
  vehicle: 'blue',
  trailer: 'amber',
  plant: 'yellow',
}
const statusVariant: Record<string, 'green' | 'red' | 'amber' | 'default'> = {
  active: 'green',
  defective: 'red',
  off_hire: 'amber',
  archived: 'default',
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferSiteId, setTransferSiteId] = useState('')
  const [transferring, setTransferring] = useState(false)

  const fetchAsset = useCallback(async () => {
    if (!id || !token || !user) return
    try {
      const [a, s] = await Promise.all([
        api<Asset>(`/assets/${id}`, { token }),
        api<Site[]>(`/sites?companyId=${user.companyId}`, { token }),
      ])
      setAsset(a)
      setSites(s)
      if (a.qrCode) {
        const url = await QRCode.toDataURL(a.qrCode, {
          width: 200,
          margin: 1,
          color: { dark: '#facc15', light: '#0a0a0a' },
        })
        setQrDataUrl(url)
      }
    } catch {
      navigate('/assets', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, token, user, navigate])

  useEffect(() => { fetchAsset() }, [fetchAsset])

  const handleTransfer = async () => {
    if (!transferSiteId || !token || !id) return
    setTransferring(true)
    try {
      await api(`/assets/${id}/transfer`, {
        token,
        method: 'POST',
        body: JSON.stringify({ siteId: transferSiteId }),
      })
      setShowTransfer(false)
      setTransferSiteId('')
      fetchAsset()
    } catch { /* ignore */ }
    setTransferring(false)
  }

  const handleStatusChange = async (status: string) => {
    if (!token || !id) return
    try {
      await api(`/assets/${id}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      fetchAsset()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  if (!asset) return null

  const Icon = typeIcon[asset.type] || Package
  const siteName = sites.find((s) => s.id === asset.siteId)?.name

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/assets')}
          className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-surface border border-chex-border flex items-center justify-center hover:border-chex-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">{asset.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={typeBadge[asset.type] || 'default'}>{asset.type}</Badge>
            <Badge variant={statusVariant[asset.status] || 'default'}>{asset.status}</Badge>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {qrDataUrl && (
        <Card className="flex items-center gap-4">
          <img src={qrDataUrl} alt="QR code" className="w-20 h-20 rounded-[var(--radius-sm)]" />
          <div>
            <p className="text-xs text-chex-muted uppercase tracking-wider font-medium">QR Code</p>
            <p className="text-lg font-mono font-semibold text-chex-yellow mt-0.5">{asset.qrCode}</p>
            <p className="text-xs text-chex-faint mt-1">Scan this code to look up the asset</p>
          </div>
        </Card>
      )}

      {/* Details */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">Details</h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          {asset.registration && (
            <Detail icon={<Hash className="w-3.5 h-3.5" />} label="Registration" value={asset.registration} />
          )}
          {asset.plantId && (
            <Detail icon={<Hash className="w-3.5 h-3.5" />} label="Plant ID" value={asset.plantId} />
          )}
          {asset.serialNumber && (
            <Detail icon={<Hash className="w-3.5 h-3.5" />} label="Serial" value={asset.serialNumber} />
          )}
          {asset.supplier && (
            <Detail icon={<Building className="w-3.5 h-3.5" />} label="Supplier" value={asset.supplier} />
          )}
          {asset.category && (
            <Detail icon={<Package className="w-3.5 h-3.5" />} label="Category" value={asset.category} />
          )}
          {asset.weightClass && (
            <Detail icon={<Weight className="w-3.5 h-3.5" />} label="Weight" value={asset.weightClass === 'over_7_5t' ? 'Over 7.5t' : 'Standard'} />
          )}
          {siteName && (
            <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Site" value={siteName} />
          )}
          {asset.nextService && (
            <Detail icon={<Calendar className="w-3.5 h-3.5" />} label="Next service" value={new Date(asset.nextService).toLocaleDateString()} />
          )}
          {asset.calibrationDue && (
            <Detail icon={<Calendar className="w-3.5 h-3.5" />} label="Cal. due" value={new Date(asset.calibrationDue).toLocaleDateString()} />
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <h3 className="text-sm font-semibold mb-3">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => navigate(`/checks/new?assetId=${asset.id}`)}>
            <ClipboardCheck className="w-3.5 h-3.5" />
            Start Check
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowTransfer(!showTransfer)}>
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer Site
          </Button>
          {asset.status !== 'active' && (
            <Button variant="primary" size="sm" onClick={() => handleStatusChange('active')}>
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Active
            </Button>
          )}
          {asset.status !== 'defective' && (
            <Button variant="danger" size="sm" onClick={() => handleStatusChange('defective')}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Mark Defective
            </Button>
          )}
          {asset.status !== 'off_hire' && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange('off_hire')}>
              Off-Hire
            </Button>
          )}
        </div>

        {showTransfer && (
          <div className="mt-3 flex items-center gap-2">
            <select
              value={transferSiteId}
              onChange={(e) => setTransferSiteId(e.target.value)}
              className="flex-1 h-9 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
            >
              <option value="">Select site...</option>
              {sites.filter((s) => s.id !== asset.siteId).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <Button variant="primary" size="sm" disabled={!transferSiteId || transferring} onClick={handleTransfer}>
              {transferring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Transfer'}
            </Button>
          </div>
        )}
      </Card>

      {/* Notes */}
      {asset.notes && (
        <Card>
          <h3 className="text-sm font-semibold mb-2">Notes</h3>
          <p className="text-sm text-chex-muted whitespace-pre-wrap">{asset.notes}</p>
        </Card>
      )}

      {/* Check history */}
      <CheckHistory assetId={asset.id} token={token!} navigate={navigate} />
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

interface HistoryCheck {
  id: string
  status: string
  overallResult: string | null
  completedAt: string | null
  createdAt: string
}

function CheckHistory({ assetId, token, navigate }: { assetId: string; token: string; navigate: (path: string) => void }) {
  const [checks, setChecks] = useState<HistoryCheck[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api<HistoryCheck[]>(`/checks?assetId=${assetId}`, { token })
      .then(setChecks)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [assetId, token])

  if (!loaded) return null

  if (checks.length === 0) {
    return (
      <Card className="text-center py-8">
        <ClipboardCheck className="w-8 h-8 text-chex-faint mx-auto mb-2" />
        <p className="text-sm text-chex-muted">No checks recorded yet</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Check History</h3>
      <div className="space-y-2">
        {checks.slice(0, 10).map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] hover:bg-chex-surface/50 cursor-pointer transition-colors"
            onClick={() => navigate(`/checks/${c.id}`)}
          >
            <ClipboardCheck className="w-4 h-4 text-chex-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{c.status === 'completed' ? 'Completed' : c.status}</p>
              <p className="text-xs text-chex-faint">
                {new Date(c.completedAt || c.createdAt).toLocaleDateString()}
              </p>
            </div>
            {c.overallResult && (
              <Badge variant={c.overallResult === 'pass' ? 'green' : 'red'}>
                {c.overallResult}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
