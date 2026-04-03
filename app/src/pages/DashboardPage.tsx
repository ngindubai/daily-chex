import { motion } from 'framer-motion'
import {
  Package,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react'
import { Card, CardTitle, CardValue, CardDescription, Badge, StatusDot, ProgressBar } from '@/components/ui'

const stats = [
  { label: 'Total Assets', value: '247', icon: Package, change: '+12 this week', variant: 'yellow' as const },
  { label: 'Checks Today', value: '38', icon: ClipboardCheck, change: '76% complete', variant: 'green' as const },
  { label: 'Open Defects', value: '14', icon: AlertTriangle, change: '3 critical', variant: 'red' as const },
  { label: 'Overdue', value: '6', icon: Clock, change: '2 > 72h', variant: 'amber' as const },
]

const recentChecks = [
  { id: 1, asset: 'Ford Transit LJ72 XKR', type: 'Daily Vehicle', operator: 'Dave M.', time: '12 min ago', status: 'pass' as const },
  { id: 2, asset: 'CAT 320 Excavator', type: 'PUWER Weekly', operator: 'Mike T.', time: '34 min ago', status: 'fail' as const },
  { id: 3, asset: 'Hilti TE 60-ATC', type: 'PUWER Weekly', operator: 'Chris P.', time: '1h ago', status: 'pass' as const },
  { id: 4, asset: 'Ifor Williams HB510', type: 'Trailer Weekly', operator: 'Steve R.', time: '2h ago', status: 'pending' as const },
]

const sites = [
  { name: 'M62 Junction 8', checks: 12, total: 16, defects: 3, teams: 2 },
  { name: 'Leeds A64 Widening', checks: 8, total: 8, defects: 0, teams: 1 },
  { name: 'Manchester Water Main', checks: 6, total: 14, defects: 5, teams: 3 },
]

const stagger = {
  container: {
    animate: {
      transition: { staggerChildren: 0.06 },
    },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  },
}

export function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Command Overview</h1>
          <p className="text-sm text-chex-muted mt-0.5">SAW Utilities — Thursday 3 April 2026</p>
        </div>
        <Badge variant="green" pulse>LIVE</Badge>
      </div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={stagger.item}>
            <Card variant={stat.variant} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-chex-muted">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-chex-faint" />
              </div>
              <CardValue>{stat.value}</CardValue>
              <CardDescription>{stat.change}</CardDescription>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Map placeholder + recent checks */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Map card */}
        <Card className="lg:col-span-3 min-h-[280px] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MapPin className="h-10 w-10 text-chex-faint mx-auto" />
              <div>
                <p className="text-sm font-medium text-chex-muted">Interactive Map</p>
                <p className="text-xs text-chex-faint">GPS check locations — coming in Step 8</p>
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
          <div className="space-y-3">
            {recentChecks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 p-2.5 rounded-[var(--radius-md)] bg-chex-black/30 hover:bg-chex-raised transition-colors"
              >
                <StatusDot status={check.status} size="md" className="mt-1.5" label="" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-chex-text truncate">{check.asset}</p>
                  <p className="text-xs text-chex-muted">{check.type} · {check.operator}</p>
                </div>
                <span className="text-xs text-chex-faint whitespace-nowrap">{check.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Site overview */}
      <div>
        <h2 className="text-sm font-semibold text-chex-text mb-3 uppercase tracking-wider">Sites</h2>
        <motion.div
          className="grid lg:grid-cols-3 gap-3"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {sites.map((site) => (
            <motion.div key={site.name} variants={stagger.item}>
              <Card className="hover:border-chex-yellow/20 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-chex-text">{site.name}</p>
                    <p className="text-xs text-chex-muted">{site.teams} team{site.teams !== 1 ? 's' : ''}</p>
                  </div>
                  {site.defects > 0 ? (
                    <Badge variant="red">{site.defects} defects</Badge>
                  ) : (
                    <Badge variant="green">All clear</Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-chex-muted">
                    <span>Checks</span>
                    <span className="font-mono">{site.checks}/{site.total}</span>
                  </div>
                  <ProgressBar
                    value={site.checks}
                    max={site.total}
                    color={site.checks === site.total ? 'green' : 'yellow'}
                    size="sm"
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Overdue alert card */}
      <Card variant="red" glow>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-red/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-chex-red" />
          </div>
          <div>
            <p className="text-sm font-semibold text-chex-red">6 Overdue Checks</p>
            <p className="text-xs text-chex-muted mt-0.5">
              2 assets have not been checked for over 72 hours. <span className="text-chex-red cursor-pointer hover:underline">View overdue →</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Calibration warning */}
      <Card variant="amber">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[var(--radius-md)] bg-chex-amber/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-chex-amber" />
          </div>
          <div>
            <p className="text-sm font-semibold text-chex-amber">3 Calibrations Due</p>
            <p className="text-xs text-chex-muted mt-0.5">
              Hilti TE 60-ATC in 5 days, Leica GPS unit in 8 days, Wacker Neuson plate in 12 days
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
