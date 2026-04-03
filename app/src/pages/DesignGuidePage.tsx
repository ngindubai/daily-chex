import { Button, Card, CardTitle, CardValue, CardDescription, Badge, Input, StatusDot, ProgressBar } from '@/components/ui'
import { Search, Plus, AlertTriangle, Check, X, Zap } from 'lucide-react'

export function DesignGuidePage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-10 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Design System</h1>
        <p className="text-sm text-chex-muted mt-1">Daily-Chex component library — DeWalt black &amp; yellow</p>
      </div>

      {/* ---- COLOURS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Colours</h2>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { name: 'Black', cls: 'bg-chex-black border border-chex-border' },
            { name: 'Surface', cls: 'bg-chex-surface' },
            { name: 'Raised', cls: 'bg-chex-raised' },
            { name: 'Hover', cls: 'bg-chex-hover' },
            { name: 'Yellow', cls: 'bg-chex-yellow' },
            { name: 'Green', cls: 'bg-chex-green' },
            { name: 'Red', cls: 'bg-chex-red' },
            { name: 'Amber', cls: 'bg-chex-amber' },
          ].map((c) => (
            <div key={c.name} className="text-center">
              <div className={`h-12 rounded-[var(--radius-md)] ${c.cls}`} />
              <p className="text-xs text-chex-muted mt-1.5">{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- TYPOGRAPHY ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Typography</h2>
        <div className="space-y-3">
          <p className="text-3xl font-bold tracking-tight">Display — Rubik Bold 30px</p>
          <p className="text-xl font-bold tracking-tight">Heading — Rubik Bold 20px</p>
          <p className="text-base font-semibold">Subtitle — Rubik Semibold 16px</p>
          <p className="text-sm">Body — Rubik Regular 14px</p>
          <p className="text-xs text-chex-muted">Caption — Rubik Regular 12px</p>
          <p className="text-xs font-mono text-chex-yellow">Mono — JetBrains Mono 12px</p>
        </div>
      </section>

      {/* ---- BUTTONS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary"><Zap className="h-4 w-4" />Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger"><AlertTriangle className="h-4 w-4" />Danger</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="secondary" size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
      </section>

      {/* ---- CARDS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Cards</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card>
            <CardTitle>Default Card</CardTitle>
            <CardValue>128</CardValue>
            <CardDescription>Standard surface</CardDescription>
          </Card>
          <Card variant="yellow">
            <CardTitle>Yellow Card</CardTitle>
            <CardValue className="text-chex-yellow">42</CardValue>
            <CardDescription>Warning / highlight</CardDescription>
          </Card>
          <Card variant="green">
            <CardTitle>Green Card</CardTitle>
            <CardValue className="text-chex-green">98%</CardValue>
            <CardDescription>Success / all-clear</CardDescription>
          </Card>
          <Card variant="red" glow>
            <CardTitle>Red Card (Glow)</CardTitle>
            <CardValue className="text-chex-red">5</CardValue>
            <CardDescription>Critical alert</CardDescription>
          </Card>
          <Card variant="amber">
            <CardTitle>Amber Card</CardTitle>
            <CardValue className="text-chex-amber">3</CardValue>
            <CardDescription>Caution / upcoming</CardDescription>
          </Card>
          <Card variant="blue">
            <CardTitle>Blue Card</CardTitle>
            <CardValue className="text-chex-blue">12</CardValue>
            <CardDescription>Info / neutral</CardDescription>
          </Card>
        </div>
      </section>

      {/* ---- BADGES ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="yellow">Yellow</Badge>
          <Badge variant="green">Pass</Badge>
          <Badge variant="red">Fail</Badge>
          <Badge variant="amber">Pending</Badge>
          <Badge variant="blue">Info</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="green" pulse>Live</Badge>
          <Badge variant="red" pulse>Critical</Badge>
        </div>
      </section>

      {/* ---- STATUS DOTS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Status Dots</h2>
        <div className="flex flex-wrap gap-6">
          <StatusDot status="pass" />
          <StatusDot status="fail" />
          <StatusDot status="pending" />
          <StatusDot status="overdue" />
          <StatusDot status="live" />
          <StatusDot status="na" />
        </div>
      </section>

      {/* ---- INPUTS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Inputs</h2>
        <div className="grid gap-4 max-w-sm">
          <Input label="Asset Name" placeholder="Enter asset name..." />
          <Input label="Search" placeholder="Search..." icon={<Search className="h-4 w-4" />} />
          <Input label="With Error" placeholder="Something wrong" error="This field is required" />
        </div>
      </section>

      {/* ---- PROGRESS BARS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Progress Bars</h2>
        <div className="space-y-4 max-w-md">
          <ProgressBar value={76} color="yellow" showLabel />
          <ProgressBar value={100} color="green" showLabel />
          <ProgressBar value={35} color="red" showLabel />
          <ProgressBar value={58} color="amber" showLabel />
          <ProgressBar value={45} color="yellow" size="sm" />
        </div>
      </section>

      {/* ---- GLOW EFFECTS ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Glow Effects</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-20 rounded-[var(--radius-lg)] bg-chex-surface border border-chex-yellow/20 glow-yellow flex items-center justify-center text-xs text-chex-yellow font-semibold">Yellow Glow</div>
          <div className="h-20 rounded-[var(--radius-lg)] bg-chex-surface border border-chex-green/20 glow-green flex items-center justify-center text-xs text-chex-green font-semibold">Green Glow</div>
          <div className="h-20 rounded-[var(--radius-lg)] bg-chex-surface border border-chex-red/20 glow-red flex items-center justify-center text-xs text-chex-red font-semibold">Red Glow</div>
          <div className="h-20 rounded-[var(--radius-lg)] bg-chex-surface border border-chex-amber/20 glow-amber flex items-center justify-center text-xs text-chex-amber font-semibold">Amber Glow</div>
        </div>
      </section>

      {/* ---- ICON BUTTONS DEMO ---- */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-chex-muted mb-4">Icon Actions</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon"><Check className="h-4 w-4 text-chex-green" /></Button>
          <Button variant="secondary" size="icon"><X className="h-4 w-4 text-chex-red" /></Button>
          <Button variant="secondary" size="icon"><AlertTriangle className="h-4 w-4 text-chex-amber" /></Button>
          <Button variant="secondary" size="icon"><Zap className="h-4 w-4 text-chex-yellow" /></Button>
        </div>
      </section>
    </div>
  )
}
