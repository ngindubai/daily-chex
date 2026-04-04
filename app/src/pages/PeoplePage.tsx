import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, X, Loader2, UserPlus } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Person {
  id: string
  firstName: string
  lastName: string
  role: string
  phone: string | null
  email: string | null
  teamId: string | null
  status: string
}

interface Team {
  id: string
  name: string
  siteId: string
}

interface Site {
  id: string
  name: string
}

const roleBadgeVariant: Record<string, 'default' | 'yellow' | 'blue' | 'amber'> = {
  operator: 'default',
  supervisor: 'yellow',
  manager: 'blue',
  admin: 'amber',
}

export function PeoplePage() {
  const { user, token } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', role: 'operator', phone: '', email: '', teamId: '', pin: '' })
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(() => {
    if (!user || !token) return
    Promise.all([
      api<Person[]>(`/people?companyId=${user.companyId}`, { token }),
      api<Team[]>(`/teams?companyId=${user.companyId}`, { token }),
      api<Site[]>(`/sites?companyId=${user.companyId}`, { token }),
    ])
      .then(([p, t, s]) => {
        setPeople(p)
        setTeams(t)
        setSites(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const siteMap = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])

  const getTeamSite = (teamId: string | null) => {
    if (!teamId) return { teamName: 'Unassigned', siteName: '' }
    const team = teamMap.get(teamId)
    if (!team) return { teamName: 'Unknown', siteName: '' }
    const site = siteMap.get(team.siteId)
    return { teamName: team.name, siteName: site?.name || '' }
  }

  const filtered = useMemo(() => {
    return people
      .filter((p) => p.status === 'active')
      .filter((p) => {
        if (roleFilter && p.role !== roleFilter) return false
        if (search) {
          const q = search.toLowerCase()
          const name = `${p.firstName} ${p.lastName}`.toLowerCase()
          return name.includes(q) || (p.email || '').toLowerCase().includes(q)
        }
        return true
      })
  }, [people, search, roleFilter])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.firstName || !addForm.lastName || !user || !token) return
    setSaving(true)
    try {
      await api('/people', {
        token,
        method: 'POST',
        body: JSON.stringify({
          companyId: user.companyId,
          ...addForm,
          teamId: addForm.teamId || undefined,
          pin: addForm.pin || undefined,
          email: addForm.email || undefined,
          phone: addForm.phone || undefined,
        }),
      })
      setShowAdd(false)
      setAddForm({ firstName: '', lastName: '', role: 'operator', phone: '', email: '', teamId: '', pin: '' })
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
        <h1 className="text-xl font-bold tracking-tight">People</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Person
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search people..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 hover:border-chex-muted focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 transition-colors"
        >
          <option value="">All roles</option>
          <option value="operator">Operator</option>
          <option value="supervisor">Supervisor</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Add person form */}
      {showAdd && (
        <Card variant="yellow" className="relative">
          <button
            onClick={() => setShowAdd(false)}
            className="absolute top-3 right-3 p-1 text-chex-muted hover:text-chex-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold mb-3">New Person</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                value={addForm.firstName}
                onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <Input
                label="Last name"
                value={addForm.lastName}
                onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
                >
                  <option value="operator">Operator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-chex-muted uppercase tracking-wider">Team</label>
                <select
                  value={addForm.teamId}
                  onChange={(e) => setAddForm((f) => ({ ...f, teamId: e.target.value }))}
                  className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3"
                >
                  <option value="">None</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({siteMap.get(t.siteId)?.name || 'Unknown site'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Phone"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="PIN (4 digits)"
                maxLength={4}
                pattern="[0-9]{4}"
                value={addForm.pin}
                onChange={(e) => setAddForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving || !addForm.firstName || !addForm.lastName}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Add Person
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* People list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <UserPlus className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">
            {people.length === 0
              ? 'No people yet. Add your first team member.'
              : 'No results matching your search.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((person) => {
            const { teamName, siteName } = getTeamSite(person.teamId)
            return (
              <Card key={person.id} className="flex items-center gap-4 cursor-pointer hover:border-chex-yellow/20 transition-colors">
                <div className="h-10 w-10 rounded-full bg-chex-raised border border-chex-border flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-chex-yellow">
                    {person.firstName[0]}{person.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-chex-text">
                      {person.firstName} {person.lastName}
                    </p>
                    <Badge variant={roleBadgeVariant[person.role] || 'default'}>
                      {person.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-chex-muted">
                    {teamName}{siteName ? ` · ${siteName}` : ''}
                  </p>
                </div>
                {person.phone && (
                  <span className="hidden sm:block text-xs text-chex-faint">{person.phone}</span>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
