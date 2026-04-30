import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  Building,
  Loader2,
  QrCode,
  ChevronRight,
  Wrench,
  Truck,
  Container,
} from 'lucide-react'
import { Card, CardTitle, CardValue, CardDescription, Badge, StatusDot, ProgressBar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface DashboardStats {
  totalAssets: number
  checksToday: number
  openDefects: number
  criticalDefects: number
  activeSites: number
  activePeople: number
  defectiveAssets: number
  calibrationsDue: Array<{ id: string; name: string; calibrationDue: string }>
}

interface SiteStat {
  id: string
  name: string
  assets: number
  checksToday: number
  openDefects: number
  teams: number
}

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

interface DefectBreakdown {
  critical: number
  high: number
  medium: number
  low: number
}

interface Asset { id: string; name: string; type: string; assignedToId: string | null; status: string }
interface Person { id: string; name: string }
interface PendingTask {
  id: string
  assetId: string
  checkTemplateId: string
  priority: string
  dueDate: string | null
  notes: string | null
  status: string
  createdAt: string
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  },
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

export function DashboardPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [siteStats, setSiteStats] = useState<SiteStat[]>([])
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([])
  const [defectBreakdown, setDefectBreakdown] = useState<DefectBreakdown>({ critical: 0, high: 0, medium: 0, low: 0 })
  const [assets, setAssets] = useState<Asset[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user || !token) return
    try {
      const cid = user.companyId
      const [s, ss, rc, db, a, p] = await Promise.all([
        api<DashboardStats>(`/dashboard/stats?companyId=${cid}`, { token }),
        api<SiteStat[]>(`/dashboard/site-stats?companyId=${cid}`, { token }),
        api<RecentCheck[]>(`/dashboard/recent-checks?companyId=${cid}`, { token }),
        api<DefectBreakdown>(`/dashboard/defect-breakdown?companyId=${cid}`, { token }),
        api<Asset[]>(`/assets?companyId=${cid}`, { token }),
        api<Person[]>(`/people?companyId=${cid}`, { token }),
      ])
      setStats(s)
      setSiteStats(ss)
      setRecentChecks(rc)
      setDefectBreakdown(db)
      setAssets(a)
      setPeople(p)

      // Fetch pending tasks for the current user
      try {
        const tasks = await api<PendingTask[]>(
          `/task-assignments?companyId=${cid}&assignedTo=${user.id}&status=pending`,
          { token },
        )
        setPendingTasks(tasks)
      } catch { /* task API may not exist yet */ }
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a.name])), [assets])
  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people])

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  const totalDefects = defectBreakdown.critical + defectBreakdown.high + defectBreakdown.medium + defectBreakdown.low

  const myKit = assets.filter((a) => a.assignedToId === user?.id)
  const typeIcons: Record<string, typeof Package> = { vehicle: Truck, trailer: Container, plant: Wrench, machinery: Wrench }

  // Determine if user is an operator (show simplified home)
  const isOperator = user?.role === 'operator'

  if (isOperator) {
    return (
      <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hey {user.firstName}</h1>
          <p className="text-sm text-chex-muted mt-0.5">{dateStr}</p>
        </div>

        {/* My Kit */}
        {myKit.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-chex-text mb-3 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="h-4 w-4 text-chex-yellow" />
              My Kit
            </h2>
            <div className="space-y-2">
              {myKit.map((a) => {
                const KitIcon = typeIcons[a.type] || Package
                return (
                  <Card
                    key={a.id}
                    className="cursor-pointer hover:border-chex-yellow/20 transition-colors"
                    onClick={() => navigate(`/assets/${a.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-yellow/10 flex items-center justify-center shrink-0">
                        <KitIcon className="w-4 h-4 text-chex-yellow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-chex-text truncate">{a.name}</p>
                        <p className="text-xs text-chex-muted capitalize">{a.type}</p>
                      </div>
                      <Badge variant={a.status === 'active' ? 'green' : a.status === 'defective' ? 'red' : 'default'}>{a.status}</Badge>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Big scan button */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card
            className="cursor-pointer hover:border-chex-yellow/30 transition-all text-center py-10"
            onClick={() => navigate('/scan')}
          >
            <QrCode className="w-16 h-16 text-chex-yellow mx-auto mb-4" />
            <p className="text-lg font-bold text-chex-text">Scan QR Code</p>
            <p className="text-sm text-chex-muted mt-1">Start a check by scanning an asset</p>
          </Card>
        </motion.div>

        {/* Pending tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-chex-text uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-chex-yellow" />
                Assigned Tasks
              </h2>
              <Badge variant="amber">{pendingTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:border-chex-yellow/30 transition-colors"
                  onClick={() => navigate(`/checks/new?assetId=${task.assetId}&templateId=${task.checkTemplateId}&taskId=${task.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      task.priority === 'urgent' ? 'bg-chex-red animate-pulse' :
                      task.priority === 'high' ? 'bg-chex-red' :
                      task.priority === 'normal' ? 'bg-chex-yellow' : 'bg-chex-muted'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-chex-text truncate">
                        {assetMap.get(task.assetId) || 'Asset'}
                      </p>
                      <p className="text-xs text-chex-muted">
                        {task.priority !== 'normal' && <span className="capitalize">{task.priority} · </span>}
                        {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No due date'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-chex-faint shrink-0" />
                  </div>
                </Card>
              ))}
              {pendingTasks.length > 5 && (
                <p className="text-xs text-chex-muted text-center pt-1 cursor-pointer hover:text-chex-yellow" onClick={() => navigate('/tasks')}>
                  +{pendingTasks.length - 5} more — view all
                </p>
              )}
            </div>
          </div>
        )}

        {/* My recent checks */}
        <div>
          <h2 className="text-sm font-semibold text-chex-text mb-3 uppercase tracking-wider">Your Recent Checks</h2>
          {recentChecks.filter((c) => c.personId === user.id).length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-chex-muted">No checks today. Scan a QR code to start.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentChecks
                .filter((c) => c.personId === user.id)
                .slice(0, 5)
                .map((check) => (
                  <Card
                    key={check.id}
                    className="cursor-pointer hover:border-chex-yellow/20 transition-colors"
                    onClick={() => navigate(`/checks/${check.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusDot
                        status={check.overallResult === 'pass' ? 'pass' : check.overallResult === 'fail' ? 'fail' : 'pending'}
                        size="md"
                        label=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-chex-text truncate">{assetMap.get(check.assetId) || 'Unknown asset'}</p>
                        <p className="text-xs text-chex-muted">{timeAgo(check.createdAt)}</p>
                      </div>
                      <Badge variant={check.overallResult === 'pass' ? 'green' : check.overallResult === 'fail' ? 'red' : 'default'}>
                        {check.overallResult || check.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="yellow" className="text-center py-4 cursor-pointer" onClick={() => navigate('/assets')}>
            <CardValue className="text-2xl">{stats?.totalAssets ?? 0}</CardValue>
            <CardDescription>Assets</CardDescription>
          </Card>
          <Card variant={stats?.openDefects ? 'red' : 'green'} className="text-center py-4 cursor-pointer" onClick={() => navigate('/defects')}>
            <CardValue className="text-2xl">{stats?.openDefects ?? 0}</CardValue>
            <CardDescription>Open Defects</CardDescription>
          </Card>
        </div>
      </div>
    )
  }

  // Manager / Supervisor dashboard
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Command Overview</h1>
          <p className="text-sm text-chex-muted mt-0.5">{dateStr}</p>
        </div>
        <Badge variant="green" pulse>LIVE</Badge>
      </div>

      {/* My Kit (managers/supervisors) */}
      {myKit.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-chex-text mb-3 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="h-4 w-4 text-chex-yellow" />
            Your Assigned Kit
          </h2>
          <div className="grid lg:grid-cols-3 gap-2">
            {myKit.map((a) => {
              const KitIcon = typeIcons[a.type] || Package
              return (
                <Card
                  key={a.id}
                  className="cursor-pointer hover:border-chex-yellow/20 transition-colors"
                  onClick={() => navigate(`/assets/${a.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-yellow/10 flex items-center justify-center shrink-0">
                      <KitIcon className="w-4 h-4 text-chex-yellow" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-chex-text truncate">{a.name}</p>
                      <p className="text-xs text-chex-muted capitalize">{a.type}</p>
                    </div>
                    <Badge variant={a.status === 'active' ? 'green' : a.status === 'defective' ? 'red' : 'default'}>{a.status}</Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={stagger.item}>
          <Card variant="yellow" className="relative overflow-hidden cursor-pointer" onClick={() => navigate('/assets')}>
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-chex-muted">Total Assets</CardTitle>
              <Package className="h-4 w-4 text-chex-faint" />
            </div>
            <CardValue>{stats?.totalAssets ?? 0}</CardValue>
            <CardDescription>{stats?.defectiveAssets ? `${stats.defectiveAssets} defective` : 'All operational'}</CardDescription>
          </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
          <Card variant="green" className="relative overflow-hidden cursor-pointer" onClick={() => navigate('/checks')}>
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-chex-muted">Checks Today</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-chex-faint" />
            </div>
            <CardValue>{stats?.checksToday ?? 0}</CardValue>
            <CardDescription>{stats?.totalAssets ? `${Math.round(((stats?.checksToday ?? 0) / stats.totalAssets) * 100)}% of fleet` : '—'}</CardDescription>
          </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
          <Card variant="red" className="relative overflow-hidden cursor-pointer" onClick={() => navigate('/defects')}>
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-chex-muted">Open Defects</CardTitle>
              <AlertTriangle className="h-4 w-4 text-chex-faint" />
            </div>
            <CardValue>{stats?.openDefects ?? 0}</CardValue>
            <CardDescription>{stats?.criticalDefects ? `${stats.criticalDefects} critical` : 'None critical'}</CardDescription>
          </Card>
        </motion.div>

        <motion.div variants={stagger.item}>
          <Card variant="amber" className="relative overflow-hidden cursor-pointer" onClick={() => navigate('/people')}>
            <div className="flex items-start justify-between mb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-chex-muted">Active Crew</CardTitle>
              <Users className="h-4 w-4 text-chex-faint" />
            </div>
            <CardValue>{stats?.activePeople ?? 0}</CardValue>
            <CardDescription>{stats?.activeSites ?? 0} site{(stats?.activeSites ?? 0) !== 1 ? 's' : ''}</CardDescription>
          </Card>
        </motion.div>
      </motion.div>

      {/* Map mini + recent checks */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Map card */}
        <Card
          className="lg:col-span-3 min-h-[280px] relative overflow-hidden cursor-pointer hover:border-chex-yellow/20 transition-colors"
          onClick={() => navigate('/map')}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MapPin className="h-10 w-10 text-chex-faint mx-auto" />
              <div>
                <p className="text-sm font-medium text-chex-muted">Interactive Map</p>
                <p className="text-xs text-chex-faint">
                  {recentChecks.filter((c) => c.startLat).length} GPS checks in last 24h — tap to view
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-chex-faint">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chex-green" />Pass</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chex-red" />Defect</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chex-yellow pulse-live" />Live</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent checks */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Recent Checks</CardTitle>
          {recentChecks.length === 0 ? (
            <p className="text-sm text-chex-muted text-center py-6">No checks in the last 24h</p>
          ) : (
            <div className="space-y-3">
              {recentChecks.slice(0, 5).map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-3 p-2.5 rounded-[var(--radius-md)] bg-chex-black/30 hover:bg-chex-raised transition-colors cursor-pointer"
                  onClick={() => navigate(`/checks/${check.id}`)}
                >
                  <StatusDot
                    status={check.overallResult === 'pass' ? 'pass' : check.overallResult === 'fail' ? 'fail' : 'pending'}
                    size="md"
                    className="mt-1.5"
                    label=""
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-chex-text truncate">{assetMap.get(check.assetId) || 'Unknown'}</p>
                    <p className="text-xs text-chex-muted">{personMap.get(check.personId) || 'Unknown'}</p>
                  </div>
                  <span className="text-xs text-chex-faint whitespace-nowrap">{timeAgo(check.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Site overview */}
      {siteStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-chex-text mb-3 uppercase tracking-wider">Sites</h2>
          <motion.div
            className="grid lg:grid-cols-3 gap-3"
            variants={stagger.container}
            initial="initial"
            animate="animate"
          >
            {siteStats.map((site) => (
              <motion.div key={site.id} variants={stagger.item}>
                <Card className="hover:border-chex-yellow/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-chex-text">{site.name}</p>
                      <p className="text-xs text-chex-muted">{site.teams} team{site.teams !== 1 ? 's' : ''} · {site.assets} asset{site.assets !== 1 ? 's' : ''}</p>
                    </div>
                    {site.openDefects > 0 ? (
                      <Badge variant="red">{site.openDefects} defects</Badge>
                    ) : (
                      <Badge variant="green">All clear</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-chex-muted">
                      <span>Checks today</span>
                      <span className="font-mono">{site.checksToday}/{site.assets}</span>
                    </div>
                    <ProgressBar
                      value={site.checksToday}
                      max={Math.max(site.assets, 1)}
                      color={site.checksToday >= site.assets ? 'green' : 'yellow'}
                      size="sm"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Defect severity breakdown */}
      {totalDefects > 0 && (
        <Card variant="red" glow={defectBreakdown.critical > 0} className="cursor-pointer" onClick={() => navigate('/defects')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-red/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-chex-red" />
            </div>
            <div>
              <p className="text-sm font-semibold text-chex-red">{totalDefects} Open Defect{totalDefects !== 1 ? 's' : ''}</p>
              <p className="text-xs text-chex-muted">Tap to view all</p>
            </div>
          </div>
          <div className="flex gap-3">
            {defectBreakdown.critical > 0 && <Badge variant="red" pulse>{defectBreakdown.critical} critical</Badge>}
            {defectBreakdown.high > 0 && <Badge variant="red">{defectBreakdown.high} high</Badge>}
            {defectBreakdown.medium > 0 && <Badge variant="amber">{defectBreakdown.medium} medium</Badge>}
            {defectBreakdown.low > 0 && <Badge variant="default">{defectBreakdown.low} low</Badge>}
          </div>
        </Card>
      )}

      {/* Calibration warnings */}
      {stats && stats.calibrationsDue.length > 0 && (
        <Card variant="amber">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-amber/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-chex-amber" />
            </div>
            <div>
              <p className="text-sm font-semibold text-chex-amber">{stats.calibrationsDue.length} Calibration{stats.calibrationsDue.length !== 1 ? 's' : ''} Due</p>
              <p className="text-xs text-chex-muted">Within the next 14 days</p>
            </div>
          </div>
          <div className="space-y-1">
            {stats.calibrationsDue.map((cal) => (
              <p key={cal.id} className="text-xs text-chex-muted">
                <span className="text-chex-text font-medium">{cal.name}</span> — {daysUntil(cal.calibrationDue)} day{daysUntil(cal.calibrationDue) !== 1 ? 's' : ''}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
