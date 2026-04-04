import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, ClipboardCheck, AlertTriangle, MapPin } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface RecentCheck {
  id: string
  assetId: string
  personId: string
  status: string
  overallResult: string | null
  startLat: string | null
  startLng: string | null
  completedAt: string | null
  createdAt: string
}

interface Asset { id: string; name: string; type: string }
interface Person { id: string; name: string }

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 5) return 'Live'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function makeIcon(color: string, pulse: boolean): L.DivIcon {
  const pulseRing = pulse
    ? `<span style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};animation:pulse 2s infinite;opacity:0.6"></span>`
    : ''
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
    html: `<span style="position:relative;display:block;width:20px;height:20px">
      ${pulseRing}
      <span style="display:block;width:14px;height:14px;margin:3px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 6px ${color}80"></span>
    </span>`,
  })
}

const passIcon = makeIcon('#22c55e', false)
const failIcon = makeIcon('#ef4444', false)
const livePassIcon = makeIcon('#facc15', true)
const liveFailIcon = makeIcon('#ef4444', true)

// Component to auto-fit bounds when markers change
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [positions, map])
  return null
}

export function MapPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [checks, setChecks] = useState<RecentCheck[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user || !token) return
    try {
      const cid = user.companyId
      const [c, a, p] = await Promise.all([
        api<RecentCheck[]>(`/dashboard/recent-checks?companyId=${cid}`, { token }),
        api<Asset[]>(`/assets?companyId=${cid}`, { token }),
        api<Person[]>(`/people?companyId=${cid}`, { token }),
      ])
      setChecks(c)
      setAssets(a)
      setPeople(p)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a.name])), [assets])
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people])

  // Filter checks that have GPS data
  const gpsChecks = useMemo(
    () => checks.filter((c) => c.startLat && c.startLng),
    [checks],
  )

  const positions: [number, number][] = useMemo(
    () => gpsChecks.map((c) => [parseFloat(c.startLat!), parseFloat(c.startLng!)]),
    [gpsChecks],
  )

  const passCount = gpsChecks.filter((c) => c.overallResult === 'pass').length
  const failCount = gpsChecks.filter((c) => c.overallResult === 'fail').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  // Default center: UK (Manchester)
  const defaultCenter: [number, number] = positions.length > 0
    ? [positions.reduce((s, p) => s + p[0], 0) / positions.length, positions.reduce((s, p) => s + p[1], 0) / positions.length]
    : [53.48, -2.24]

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Live Map</h1>
        <div className="flex items-center gap-3 text-xs text-chex-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chex-green" />{passCount} pass</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chex-red" />{failCount} fail</span>
          <Badge variant="default">{gpsChecks.length} total</Badge>
        </div>
      </div>

      {gpsChecks.length === 0 ? (
        <Card className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-chex-yellow-bg border border-chex-yellow/20 flex items-center justify-center mx-auto">
              <MapPin className="h-8 w-8 text-chex-yellow" />
            </div>
            <div>
              <p className="text-lg font-semibold text-chex-text">No GPS data yet</p>
              <p className="text-sm text-chex-muted max-w-xs mx-auto">
                Complete a check with location services enabled to see markers here.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="rounded-[var(--radius-lg)] overflow-hidden border border-chex-border" style={{ height: 'calc(100vh - 12rem)' }}>
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <FitBounds positions={positions} />
            {gpsChecks.map((check) => {
              const lat = parseFloat(check.startLat!)
              const lng = parseFloat(check.startLng!)
              const fiveMinAgo = Date.now() - 5 * 60 * 1000
              const isLive = new Date(check.createdAt).getTime() > fiveMinAgo
              const isFail = check.overallResult === 'fail'

              const icon = isLive
                ? (isFail ? liveFailIcon : livePassIcon)
                : (isFail ? failIcon : passIcon)

              return (
                <Marker key={check.id} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <div style={{ minWidth: 180, color: '#e4e4e7', background: '#111113', margin: -10, padding: 12, borderRadius: 8, fontSize: 13 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{assetMap.get(check.assetId) || 'Unknown'}</p>
                      <p style={{ fontSize: 11, color: '#71717a' }}>{personMap.get(check.personId) || 'Unknown'} · {timeAgo(check.createdAt)}</p>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: isFail ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                          color: isFail ? '#ef4444' : '#22c55e',
                        }}>
                          {check.overallResult || check.status}
                        </span>
                        <button
                          onClick={() => navigate(`/checks/${check.id}`)}
                          style={{ fontSize: 11, color: '#facc15', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          View check →
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
