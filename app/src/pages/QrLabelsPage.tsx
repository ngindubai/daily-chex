import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Printer, Loader2, QrCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

interface Asset {
  id: string
  name: string
  type: string
  qrCode: string | null
  registration: string | null
  plantId: string | null
}

export function QrLabelsPage() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [qrUrls, setQrUrls] = useState<Map<string, string>>(new Map())
  const printRef = useRef<HTMLDivElement>(null)

  const fetchAssets = useCallback(async () => {
    if (!user || !token) return
    try {
      const rows = await api<Asset[]>(`/assets?companyId=${user.companyId}`, { token })
      setAssets(rows.filter((a) => a.qrCode))
      // Pre-select all
      setSelected(new Set(rows.filter((a) => a.qrCode).map((a) => a.id)))

      // Generate QR data URLs
      const map = new Map<string, string>()
      await Promise.all(
        rows.filter((a) => a.qrCode).map(async (a) => {
          const url = await QRCode.toDataURL(a.qrCode!, {
            width: 150,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          })
          map.set(a.id, url)
        }),
      )
      setQrUrls(map)
    } catch { /* ignore */ }
    setLoading(false)
  }, [user, token])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const toggleAsset = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>QR Labels — DailyChex</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10mm; }
        .label { border: 1px solid #ccc; border-radius: 4px; padding: 8px; text-align: center; page-break-inside: avoid; }
        .label img { width: 100px; height: 100px; }
        .label .name { font-size: 10px; font-weight: bold; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .label .code { font-size: 9px; font-family: monospace; color: #666; }
        .label .sub { font-size: 8px; color: #999; margin-top: 2px; }
        @media print { .grid { padding: 5mm; gap: 4px; } }
      </style>
      </head><body>
      <div class="grid">
        ${content.innerHTML}
      </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-chex-yellow animate-spin" />
      </div>
    )
  }

  const selectedAssets = assets.filter((a) => selected.has(a.id))

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/assets')}
          className="h-9 w-9 rounded-[var(--radius-md)] bg-chex-surface border border-chex-border flex items-center justify-center hover:border-chex-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">Print QR Labels</h1>
          <p className="text-xs text-chex-muted">{selected.size} of {assets.length} assets selected</p>
        </div>
        <Button variant="primary" size="sm" disabled={selected.size === 0} onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5" />
          Print Labels
        </Button>
      </div>

      {/* Toggle list */}
      <div className="space-y-1">
        {assets.map((a) => (
          <label
            key={a.id}
            className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-chex-surface/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(a.id)}
              onChange={() => toggleAsset(a.id)}
              className="w-4 h-4 accent-[#facc15] rounded"
            />
            <span className="text-sm font-medium flex-1 truncate">{a.name}</span>
            <span className="text-xs font-mono text-chex-faint">{a.qrCode}</span>
          </label>
        ))}
      </div>

      {/* Preview */}
      {selectedAssets.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {selectedAssets.map((a) => (
              <div key={a.id} className="text-center space-y-1">
                {qrUrls.has(a.id) ? (
                  <img src={qrUrls.get(a.id)} alt={a.qrCode || ''} className="w-16 h-16 mx-auto rounded" />
                ) : (
                  <div className="w-16 h-16 mx-auto bg-chex-surface rounded flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-chex-faint" />
                  </div>
                )}
                <p className="text-[10px] font-medium truncate">{a.name}</p>
                <p className="text-[9px] font-mono text-chex-faint">{a.qrCode}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        {selectedAssets.map((a) => (
          <div key={a.id} className="label">
            {qrUrls.has(a.id) && <img src={qrUrls.get(a.id)} alt={a.qrCode || ''} />}
            <div className="name">{a.name}</div>
            <div className="code">{a.qrCode}</div>
            <div className="sub">{a.registration || a.plantId || a.type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
