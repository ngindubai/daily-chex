import { useState, useEffect, useCallback } from 'react'
import { Building2, Plus, Users, Package, MapPin, X, Loader2 } from 'lucide-react'
import { Card, Badge, Button, Input } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Site {
  id: string
  name: string
  address: string | null
  postcode: string | null
  lat: string | null
  lng: string | null
  status: string
  teamCount: number
  peopleCount: number
  assetCount: number
}

export function SitesPage() {
  const { user, token } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '', postcode: '' })
  const [saving, setSaving] = useState(false)

  const fetchSites = useCallback(() => {
    if (!user || !token) return
    api<Site[]>(`/sites?companyId=${user.companyId}`, { token })
      .then(setSites)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, token])

  useEffect(() => { fetchSites() }, [fetchSites])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name || !user || !token) return
    setSaving(true)
    try {
      await api('/sites', {
        token,
        method: 'POST',
        body: JSON.stringify({ companyId: user.companyId, ...addForm }),
      })
      setShowAdd(false)
      setAddForm({ name: '', address: '', postcode: '' })
      fetchSites()
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
        <h1 className="text-xl font-bold tracking-tight">Sites</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Site
        </Button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <Card variant="yellow" className="relative">
          <button
            onClick={() => setShowAdd(false)}
            className="absolute top-3 right-3 p-1 text-chex-muted hover:text-chex-text cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold mb-3">New Site</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              label="Site name"
              placeholder="e.g. M62 Junction 8 Upgrade"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Address"
                placeholder="Street address"
                value={addForm.address}
                onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
              />
              <Input
                label="Postcode"
                placeholder="WA5 4QE"
                value={addForm.postcode}
                onChange={(e) => setAddForm((f) => ({ ...f, postcode: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={saving || !addForm.name}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Create Site
              </Button>
            </div>
          </form>
        </Card>
      )}

      {sites.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-10 h-10 text-chex-faint mx-auto mb-3" />
          <p className="text-sm text-chex-muted">No sites yet. Add your first site to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sites.map((site) => (
            <Card key={site.id} className="cursor-pointer hover:border-chex-yellow/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-chex-raised flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-chex-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-chex-text">{site.name}</p>
                    <Badge variant={site.status === 'active' ? 'green' : 'default'}>
                      {site.status}
                    </Badge>
                  </div>
                  {(site.address || site.postcode) && (
                    <p className="text-xs text-chex-muted mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[site.address, site.postcode].filter(Boolean).join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-chex-muted">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {site.peopleCount} people · {site.teamCount} team{site.teamCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {site.assetCount} assets
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
