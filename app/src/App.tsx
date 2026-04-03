import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { MapPage } from '@/pages/MapPage'
import { ScanPage } from '@/pages/ScanPage'
import { ChecksPage } from '@/pages/ChecksPage'
import { DefectsPage } from '@/pages/DefectsPage'
import { AssetsPage } from '@/pages/AssetsPage'
import { SitesPage } from '@/pages/SitesPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { DesignGuidePage } from '@/pages/DesignGuidePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="checks" element={<ChecksPage />} />
          <Route path="defects" element={<DefectsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="design-guide" element={<DesignGuidePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
