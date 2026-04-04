import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { MapPage } from '@/pages/MapPage'
import { ScanPage } from '@/pages/ScanPage'
import { ChecksPage } from '@/pages/ChecksPage'
import { CheckFlowPage } from '@/pages/CheckFlowPage'
import { CheckDetailPage } from '@/pages/CheckDetailPage'
import { DefectsPage } from '@/pages/DefectsPage'
import { DefectDetailPage } from '@/pages/DefectDetailPage'
import { AssetsPage } from '@/pages/AssetsPage'
import { AssetDetailPage } from '@/pages/AssetDetailPage'
import { QrLabelsPage } from '@/pages/QrLabelsPage'
import { SitesPage } from '@/pages/SitesPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { TasksPage } from '@/pages/TasksPage'
import { DesignGuidePage } from '@/pages/DesignGuidePage'
import { LoginPage } from '@/pages/LoginPage'
import { Loader2 } from 'lucide-react'

function ProtectedRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-chex-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-chex-yellow animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="checks" element={<ChecksPage />} />
        <Route path="checks/new" element={<CheckFlowPage />} />
        <Route path="checks/:id" element={<CheckDetailPage />} />
        <Route path="defects" element={<DefectsPage />} />
        <Route path="defects/:id" element={<DefectDetailPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/labels" element={<QrLabelsPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="design-guide" element={<DesignGuidePage />} />
      </Route>
    </Routes>
  )
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-chex-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-chex-yellow animate-spin" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
