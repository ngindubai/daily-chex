import { useState, useEffect, useCallback } from 'react'
import { Loader2, Building2, Plus, Trash2, Pencil, X, Check, ShieldAlert } from 'lucide-react'

interface Company {
  id: string
  name: string
  slug: string
  createdAt: string
  peopleCount: number
  assetCount: number
  siteCount: number
}

const SESSION_KEY = 'chex_admin_key'

function adminApi<T>(path: string, key: string, options?: RequestInit): Promise<T> {
  return fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(options?.headers || {}),
    },
  }).then(async (r) => {
    if (!r.ok) {
      const body = await r.json().catch(() => ({ error: r.statusText }))
      throw new Error(body.error || r.statusText)
    }
    return r.json()
  })
}

export function AdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem(SESSION_KEY) || '')
  const [keyInput, setKeyInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [authed, setAuthed] = useState(false)

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Add company form
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSlug, setAddSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Edit company
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchCompanies = useCallback(async (k: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi<Company[]>('/companies', k)
      setCompanies(data)
      setAuthed(true)
      sessionStorage.setItem(SESSION_KEY, k)
    } catch (e: any) {
      if (e.message === 'Unauthorized') {
        setAuthError('Invalid admin key')
        setAuthed(false)
      } else {
        setError(e.message)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (key) fetchCompanies(key)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setKey(keyInput)
    fetchCompanies(keyInput)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      await adminApi('/companies', key, {
        method: 'POST',
        body: JSON.stringify({ name: addName, slug: addSlug }),
      })
      setShowAdd(false)
      setAddName('')
      setAddSlug('')
      fetchCompanies(key)
    } catch (e: any) {
      setSaveError(e.message)
    }
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    setEditSaving(true)
    try {
      await adminApi(`/companies/${id}`, key, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, slug: editSlug }),
      })
      setEditId(null)
      fetchCompanies(key)
    } catch { /* show error inline */ }
    setEditSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    setDeleteError('')
    try {
      await adminApi(`/companies/${id}`, key, { method: 'DELETE' })
      setDeleteId(null)
      fetchCompanies(key)
    } catch (e: any) {
      setDeleteError(e.message)
    }
    setDeleting(false)
  }

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-chex-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-chex-text">App Admin</h1>
            <p className="text-sm text-chex-muted text-center">Enter your super-admin key to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Admin key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full h-10 bg-chex-surface border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow focus:ring-1 focus:ring-chex-yellow/30 outline-none"
              autoFocus
            />
            {authError && <p className="text-xs text-red-400">{authError}</p>}
            <button
              type="submit"
              disabled={!keyInput}
              className="w-full h-10 bg-chex-yellow text-chex-black font-semibold text-sm rounded-[var(--radius-md)] hover:bg-chex-yellow/90 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin dashboard ──
  return (
    <div className="min-h-screen bg-chex-black p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-chex-text">App Admin</h1>
              <p className="text-xs text-chex-muted">Company management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 h-9 px-3 bg-chex-yellow text-chex-black text-sm font-semibold rounded-[var(--radius-md)] hover:bg-chex-yellow/90 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Company
            </button>
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setKey('') }}
              className="h-9 px-3 bg-chex-surface border border-chex-border text-chex-muted text-sm rounded-[var(--radius-md)] hover:text-chex-text transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Add company form */}
        {showAdd && (
          <div className="bg-chex-surface border border-chex-yellow/30 rounded-[var(--radius-lg)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Company</h3>
              <button onClick={() => setShowAdd(false)} className="text-chex-muted hover:text-chex-text cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 flex-1 min-w-[160px]">
                <label className="text-xs text-chex-muted uppercase tracking-wider font-medium">Company name</label>
                <input
                  placeholder="SAW Utilities Ltd"
                  value={addName}
                  onChange={(e) => {
                    setAddName(e.target.value)
                    if (!addSlug) setAddSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }}
                  className="w-full h-9 bg-chex-bg border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 focus:border-chex-yellow outline-none"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[120px]">
                <label className="text-xs text-chex-muted uppercase tracking-wider font-medium">Slug</label>
                <input
                  placeholder="saw-utilities"
                  value={addSlug}
                  onChange={(e) => setAddSlug(e.target.value)}
                  className="w-full h-9 bg-chex-bg border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-3 font-mono focus:border-chex-yellow outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!addName || !addSlug || saving}
                className="h-9 px-4 bg-chex-yellow text-chex-black text-sm font-semibold rounded-[var(--radius-md)] disabled:opacity-40 cursor-pointer hover:bg-chex-yellow/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </form>
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          </div>
        )}

        {/* Company list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 text-sm">{error}</div>
        ) : (
          <div className="space-y-2">
            {companies.length === 0 && (
              <div className="text-center py-12 text-chex-muted text-sm">No companies yet.</div>
            )}
            {companies.map((c) => (
              <div
                key={c.id}
                className="bg-chex-surface border border-chex-border rounded-[var(--radius-lg)] p-4"
              >
                {editId === c.id ? (
                  <div className="flex flex-wrap gap-3 items-center">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-[140px] h-8 bg-chex-bg border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-2 focus:border-chex-yellow outline-none"
                    />
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className="w-36 h-8 bg-chex-bg border border-chex-border rounded-[var(--radius-md)] text-sm text-chex-text px-2 font-mono focus:border-chex-yellow outline-none"
                    />
                    <button onClick={() => handleEdit(c.id)} disabled={editSaving} className="h-8 w-8 flex items-center justify-center text-green-400 hover:text-green-300 cursor-pointer">
                      {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditId(null)} className="h-8 w-8 flex items-center justify-center text-chex-muted hover:text-chex-text cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-raised border border-chex-border flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-chex-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-chex-text">{c.name}</p>
                      <p className="text-xs text-chex-faint font-mono">{c.slug}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-chex-muted shrink-0">
                      <span title="People">{c.peopleCount} people</span>
                      <span title="Assets">{c.assetCount} assets</span>
                      <span title="Sites">{c.siteCount} sites</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditId(c.id); setEditName(c.name); setEditSlug(c.slug) }}
                        className="h-8 w-8 flex items-center justify-center text-chex-muted hover:text-chex-text rounded-[var(--radius-sm)] hover:bg-chex-raised transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(c.id); setDeleteError('') }}
                        className="h-8 w-8 flex items-center justify-center text-chex-muted hover:text-red-400 rounded-[var(--radius-sm)] hover:bg-chex-raised transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirm */}
                {deleteId === c.id && (
                  <div className="mt-3 pt-3 border-t border-chex-border">
                    <p className="text-sm text-red-400 mb-2">
                      Delete <strong>{c.name}</strong>? This cannot be undone.
                      {c.peopleCount > 0 && ` (${c.peopleCount} people must be removed first)`}
                    </p>
                    {deleteError && <p className="text-xs text-red-400 mb-2">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting || c.peopleCount > 0}
                        className="h-8 px-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-[var(--radius-md)] hover:bg-red-500/20 disabled:opacity-40 cursor-pointer"
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="h-8 px-3 bg-chex-raised text-chex-muted text-sm rounded-[var(--radius-md)] hover:text-chex-text cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-chex-faint text-center">
          Company ID: {companies[0]?.id?.split('-')[0] || '—'} · {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'} registered
        </p>
      </div>
    </div>
  )
}
