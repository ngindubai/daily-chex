import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MapPin,
  ScanLine,
  Package,
  Users,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/checks', icon: ClipboardCheck, label: 'Checks' },
  { to: '/defects', icon: AlertTriangle, label: 'Defects' },
  { to: '/assets', icon: Package, label: 'Assets' },
  { to: '/sites', icon: Building2, label: 'Sites' },
  { to: '/people', icon: Users, label: 'People' },
]

const mobileNav = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/checks', icon: ClipboardCheck, label: 'Checks' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/assets', icon: Package, label: 'More' },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-chex-black">
      {/* ---- Desktop Sidebar ---- */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-chex-border bg-chex-surface shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-chex-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[var(--radius-md)] bg-chex-yellow flex items-center justify-center">
              <ClipboardCheck className="h-4.5 w-4.5 text-chex-black" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-chex-text">DAILY</span>
              <span className="text-sm font-bold tracking-tight text-chex-yellow">-CHEX</span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-chex-yellow-bg text-chex-yellow border border-chex-yellow/15'
                    : 'text-chex-muted hover:text-chex-text hover:bg-chex-raised border border-transparent'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom status bar */}
        <div className="p-4 border-t border-chex-border">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-chex-green opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chex-green" />
            </span>
            <span className="text-xs text-chex-muted">System Online</span>
          </div>
        </div>
      </aside>

      {/* ---- Mobile sidebar overlay ---- */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-56 z-50 bg-chex-surface border-r border-chex-border lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-chex-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-[var(--radius-md)] bg-chex-yellow flex items-center justify-center">
                    <ClipboardCheck className="h-4.5 w-4.5 text-chex-black" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-sm font-bold tracking-tight text-chex-text">DAILY</span>
                    <span className="text-sm font-bold tracking-tight text-chex-yellow">-CHEX</span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-[var(--radius-sm)] text-chex-muted hover:text-chex-text hover:bg-chex-raised transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {mainNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-chex-yellow-bg text-chex-yellow border border-chex-yellow/15'
                          : 'text-chex-muted hover:text-chex-text hover:bg-chex-raised border border-transparent'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---- Main content area ---- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile + desktop) */}
        <header className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 border-b border-chex-border bg-chex-surface/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-[var(--radius-sm)] text-chex-muted hover:text-chex-text hover:bg-chex-raised transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-chex-yellow flex items-center justify-center">
                <ClipboardCheck className="h-3.5 w-3.5 text-chex-black" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xs font-bold tracking-tight text-chex-text">DAILY</span>
                <span className="text-xs font-bold tracking-tight text-chex-yellow">-CHEX</span>
              </div>
            </div>

            {/* Desktop page title area - populated by pages */}
            <div className="hidden lg:block" />
          </div>

          {/* Right side — will hold user avatar + notifications later */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-chex-raised border border-chex-border flex items-center justify-center text-xs font-bold text-chex-yellow">
              DC
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ---- Mobile bottom tab bar ---- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-chex-surface/95 backdrop-blur-md border-t border-chex-border flex items-center justify-around px-2 z-30 safe-area-inset-bottom">
        {mobileNav.map((item) => {
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          const isScan = item.to === '/scan'

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 py-1 min-w-[56px]"
            >
              {isScan ? (
                <div className={cn(
                  'h-11 w-11 -mt-5 rounded-full flex items-center justify-center transition-all duration-200',
                  'bg-chex-yellow shadow-[0_0_24px_rgba(250,204,21,0.3)] active:scale-90'
                )}>
                  <item.icon className="h-5 w-5 text-chex-black" strokeWidth={2.5} />
                </div>
              ) : (
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-150',
                    isActive ? 'text-chex-yellow' : 'text-chex-faint'
                  )}
                />
              )}
              <span className={cn(
                'text-[10px] font-medium transition-colors duration-150',
                isActive ? 'text-chex-yellow' : 'text-chex-faint',
                isScan && 'text-chex-yellow'
              )}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
