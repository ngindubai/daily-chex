import { Plus, Search } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'

const mockPeople = [
  { id: 1, name: 'Dave Mitchell', role: 'Operator', pin: '1234', team: 'Groundworks A', site: 'M62 Junction 8', checksToday: 4 },
  { id: 2, name: 'Mike Taylor', role: 'Operator', pin: '5678', team: 'Groundworks A', site: 'M62 Junction 8', checksToday: 3 },
  { id: 3, name: 'Chris Palmer', role: 'Supervisor', pin: '9012', team: 'Groundworks A', site: 'M62 Junction 8', checksToday: 2 },
  { id: 4, name: 'Steve Roberts', role: 'Operator', pin: '3456', team: 'Drainage', site: 'Leeds A64 Widening', checksToday: 5 },
  { id: 5, name: 'Sarah Jones', role: 'Manager', pin: '—', team: '—', site: 'All Sites', checksToday: 0 },
]

const roleBadge: Record<string, React.ReactNode> = {
  Operator: <Badge variant="default">Operator</Badge>,
  Supervisor: <Badge variant="yellow">Supervisor</Badge>,
  Manager: <Badge variant="blue">Manager</Badge>,
  Admin: <Badge variant="amber">Admin</Badge>,
}

export function PeoplePage() {
  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">People</h1>
        <Button variant="primary" size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Person
        </Button>
      </div>

      <Input
        placeholder="Search people..."
        icon={<Search className="h-4 w-4" />}
      />

      <div className="space-y-2">
        {mockPeople.map((person) => (
          <Card key={person.id} className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors">
            <div className="h-10 w-10 rounded-full bg-chex-raised border border-chex-border flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-chex-yellow">
                {person.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-chex-text">{person.name}</p>
                {roleBadge[person.role]}
              </div>
              <p className="text-xs text-chex-muted">{person.team} · {person.site}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-chex-text font-mono">{person.checksToday}</p>
              <p className="text-xs text-chex-faint">checks today</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
