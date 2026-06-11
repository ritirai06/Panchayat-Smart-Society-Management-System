import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { connectSocket, disconnectSocket } from '../../services/socket'
import { useSOS } from '../../hooks/useSOS'
import SOSAlertModal from '../ui/SOSAlertModal'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, AlertCircle, CreditCard, Bell,
  MessageSquare, Settings, LogOut, Menu, X, ChevronRight,
  Search, Wifi, Home, ParkingSquare, UserCheck, Zap,
  Plus, ChevronDown, Building2, Shield, CalendarDays, ShieldAlert,
  ChevronLeft, BookOpen, Sparkles
} from 'lucide-react'

const navGroups = [
  {
    title: 'Operations',
    items: [
      { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/residents',     icon: Users,           label: 'Residents',   adminOnly: true },
      { to: '/complaints',    icon: AlertCircle,     label: 'Complaints' },
      { to: '/payments',      icon: CreditCard,      label: 'Payments' },
      { to: '/parking',       icon: ParkingSquare,   label: 'Parking' },
      { to: '/visitors',      icon: UserCheck,       label: 'Visitors' },
      { to: '/bookings',      icon: CalendarDays,    label: 'Bookings' },
    ]
  },
  {
    title: 'System & Rules',
    items: [
      { to: '/notifications', icon: Bell,            label: 'Notifications' },
      { to: '/chatbot',       icon: MessageSquare,   label: 'AI Assistant' },
      { to: '/bylaws',        icon: BookOpen,        label: 'Bylaws' },
      { to: '/society',       icon: Settings,        label: 'Society',     adminOnly: true },
    ]
  }
]

const mobileNav = [
  { to: '/',           icon: Home,          label: 'Home' },
  { to: '/complaints', icon: AlertCircle,   label: 'Issues' },
  { to: '/parking',    icon: ParkingSquare, label: 'Parking' },
  { to: '/chatbot',    icon: MessageSquare, label: 'AI' },
  { to: '/sos',        icon: ShieldAlert,   label: 'SOS' },
]

const sidebarVariants = {
  open:   { x: 0,    opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: -280, opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [quickOpen, setQuickOpen] = useState(false)
  const [activeSOSAlerts, setActiveSOSAlerts] = useState([])
  const [socketRef, setSocketRef] = useState(null)
  const searchRef = useRef(null)

  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) return
    const socket = connectSocket(societyId)
    setSocketRef(socket)
    socket.on('new_complaint',   () => toast('New complaint raised',      { icon: '⚠️' }))
    socket.on('announcement',    (n) => { toast(n.title,                  { icon: '📢' }); setUnread(p => p + 1) })
    socket.on('payment_reminder',() => toast('Payment reminders sent',   { icon: '💳' }))
    socket.on('parking_assigned',(d) => toast(`Slot ${d.slotNumber} assigned`, { icon: '🅿' }))
    socket.on('visitor_entry',   (d) => toast(`${d.visitorName} entered`, { icon: '🚪' }))
    socket.on('visitor_exit',    (d) => toast(`${d.visitorName} exited`,  { icon: '👋' }))
    return () => disconnectSocket()
  }, [societyId])

  const handleSOSAlert = useCallback((data) => {
    setActiveSOSAlerts(prev => {
      const exists = prev.find(a => a.sosId === data.sosId)
      return exists ? prev : [data, ...prev]
    })
  }, [])

  const { stopSound } = useSOS({
    socket: socketRef,
    isAdmin: user?.role === 'admin',
    onAlert: handleSOSAlert,
  })

  const handleAcknowledge = async (alert) => {
    stopSound()
    setActiveSOSAlerts(prev => prev.filter(a => a.sosId !== alert.sosId))
    try { await api.put(`/sos/${alert.sosId}/acknowledge`) } catch {}
  }

  const handleDismiss = (alert) => {
    setActiveSOSAlerts(prev => prev.filter(a => a.sosId !== alert.sosId))
  }

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setSidebarOpen(false); setProfileOpen(false); setQuickOpen(false) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  // Get current path name for breadcrumbs
  const getBreadcrumb = () => {
    const path = location.pathname
    if (path === '/') return ['Dashboard']
    const parts = path.split('/').filter(Boolean)
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1))
  }

  const breadcrumbs = getBreadcrumb()

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-slate-300">
      {/* Logo Section */}
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/20 flex-shrink-0">
          <Building2 size={18} className="text-brand" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-sm font-bold text-white tracking-wide">Panchayat</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              <p className="text-[10px] text-brand font-medium capitalize tracking-wider">{user?.role} Mode</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        {navGroups.map((group, gIdx) => {
          // Check if group contains any items that are visible to user
          const visibleItems = group.items.filter(i => !i.adminOnly || user?.role === 'admin')
          if (visibleItems.length === 0) return null

          return (
            <div key={gIdx} className="space-y-1.5">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(({ to, icon: Icon, label }) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                  return (
                    <NavLink key={to} to={to} end={to === '/'}
                      className={isActive ? 'nav-item-active' : 'nav-item'}
                      title={isCollapsed ? label : ''}>
                      <Icon size={18} className="flex-shrink-0" />
                      {!isCollapsed && <span className="flex-1 text-[13px] tracking-wide truncate">{label}</span>}
                      {!isCollapsed && label === 'Notifications' && unread > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Dedicated SOS Menu Item */}
        <div className="pt-2 border-t border-white/5">
          <NavLink to="/sos" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                  : 'text-rose-400 hover:bg-rose-500/5'
              }`
            }
            title={isCollapsed ? 'Emergency SOS' : ''}>
            <ShieldAlert size={18} className="flex-shrink-0 animate-pulse text-rose-500" />
            {!isCollapsed && <span className="flex-1 text-[13px] font-bold uppercase tracking-wider">Emergency SOS</span>}
            {!isCollapsed && activeSOSAlerts.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse px-1">
                {activeSOSAlerts.length}
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="hidden lg:flex px-4 py-2 border-t border-white/5 justify-end">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
          <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Fixed User Profile Card */}
      <div className="border-t border-white/5 p-3">
        <div className={`flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 ${isCollapsed ? 'justify-center px-1' : 'px-3'} py-3`}>
          <div className="relative flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-bold text-white text-xs ring-2 ring-white/10">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-brand" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[10px] text-slate-500">{user?.email}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
            <LogOut size={13} /> Sign out
          </button>
        )}
      </div>
    </div>
  )

  const quickActions = [
    { label: 'Add Resident',    icon: Users,       path: '/residents',     adminOnly: true },
    { label: 'New Complaint',   icon: AlertCircle, path: '/complaints' },
    { label: 'Add Parking Slot',icon: ParkingSquare,path: '/parking',      adminOnly: true },
    { label: 'Visitor Pass',    icon: UserCheck,   path: '/visitors' },
    { label: 'Notifications',   icon: Bell,        path: '/notifications', adminOnly: true },
    { label: 'Book Facility',   icon: CalendarDays,path: '/bookings' },
  ].filter(a => !a.adminOnly || user?.role === 'admin')

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-shrink-0 flex-col border-r border-slate-200 bg-sidebar transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="sidebar"
              initial="closed" animate="open" exit="closed"
              variants={sidebarVariants}
              className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-slate-200 lg:hidden shadow-modal"
            >
              <button className="absolute right-3 top-3.5 z-10 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setSidebarOpen(false)}>
                <X size={18} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden text-text-secondary">
              <Menu size={20} />
            </button>

            {/* Breadcrumb for Desktop */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>
                Society OS
              </span>
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <ChevronRight size={12} className="text-text-disabled" />
                  <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-text-primary' : 'font-medium hover:text-text-primary transition-colors cursor-pointer'}>
                    {crumb}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Page Title */}
            <span className="lg:hidden text-sm font-semibold text-text-primary">{breadcrumbs[breadcrumbs.length - 1]}</span>
          </div>

          {/* Right Side Items */}
          <div className="flex items-center gap-2">
            {/* Linear-style Global Search */}
            <div className="relative hidden md:flex items-center w-60">
              <Search size={14} className="absolute left-3 text-text-muted/70" />
              <input
                ref={searchRef}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg py-1.5 pl-9 pr-12 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand focus:bg-white transition-all shadow-inner"
                placeholder="Search anything (⌘K)"
              />
              <kbd className="absolute right-2 rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[9px] text-text-muted font-mono pointer-events-none">
                ⌘K
              </kbd>
            </div>

            {/* Quick Actions */}
            <div className="relative">
              <button onClick={() => setQuickOpen(p => !p)} className="btn-secondary btn-sm flex gap-1 items-center h-8 font-semibold">
                <Plus size={14} /> Quick Add
              </button>
              <AnimatePresence>
                {quickOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-modal z-50 py-1.5 overflow-hidden"
                  >
                    {quickActions.map(a => (
                      <button key={a.label} onClick={() => { navigate(a.path); setQuickOpen(false) }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors">
                        <a.icon size={13} className="text-text-muted" />{a.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Emergency SOS counter */}
            {user?.role === 'admin' && activeSOSAlerts.length > 0 && (
              <button
                onClick={() => navigate('/sos')}
                className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black text-white animate-pulse shadow-lg shadow-rose-200"
              >
                <ShieldAlert size={12} /> {activeSOSAlerts.length} SOS
              </button>
            )}

            {/* Live status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-1 text-[10px] font-bold text-brand uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" /> Live
            </div>

            {/* Notifications Shortcut */}
            <button onClick={() => navigate('/notifications')} className="btn-icon relative text-text-secondary hover:bg-slate-100 rounded-lg">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-status-danger ring-2 ring-white" />
              )}
            </button>

            {/* AI Shortcut */}
            <button onClick={() => navigate('/chatbot')} className="btn-icon text-brand hover:bg-emerald-50 rounded-lg" title="AI Assistant">
              <Sparkles size={18} className="animate-pulse" />
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-xs font-bold ring-2 ring-emerald-50 transition-transform hover:scale-105 active:scale-95">
                {user?.name?.[0]?.toUpperCase()}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-modal z-50 py-1.5 overflow-hidden"
                  >
                    <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                      <p className="text-sm font-semibold text-text-primary truncate">{user?.name}</p>
                      <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-brand/5 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider capitalize">
                        {user?.role}
                      </span>
                    </div>
                    {user?.role === 'admin' && (
                      <button onClick={() => { navigate('/society'); setProfileOpen(false) }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors">
                        <Settings size={13} /> Society Settings
                      </button>
                    )}
                    <button onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-status-danger hover:bg-rose-50 transition-colors">
                      <LogOut size={13} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile Floating AI FAB */}
        {location.pathname !== '/chatbot' && (
          <button
            onClick={() => navigate('/chatbot')}
            className="lg:hidden fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95">
            <Sparkles size={14} /> AI Assistant
          </button>
        )}

        {/* Mobile Bottom Nav Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur px-2 py-1 shadow-lg">
          {mobileNav.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} end={to === '/'} className={isActive ? 'mobile-nav-item-active' : 'mobile-nav-item'}>
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand/10 text-brand' : 'text-slate-400'}`}>
                  <Icon size={19} />
                  {label === 'Alerts' && unread > 0 && (
                    <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-status-danger ring-1 ring-white" />
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide mt-0.5">{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* SOS Alert Popups */}
      <SOSAlertModal
        alerts={activeSOSAlerts}
        onAcknowledge={handleAcknowledge}
        onViewDetails={() => navigate('/sos')}
        onDismiss={handleDismiss}
      />
    </div>
  )
}
