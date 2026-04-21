import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState, useRef } from 'react'
import { connectSocket, disconnectSocket } from '../../services/socket'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, AlertCircle, CreditCard,
  Bell, MessageSquare, Settings, LogOut, Menu, X,
  Building2, ChevronRight, Search, Wifi, Home
} from 'lucide-react'

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/residents',     icon: Users,           label: 'Residents',    adminOnly: true },
  { to: '/complaints',    icon: AlertCircle,     label: 'Complaints' },
  { to: '/payments',      icon: CreditCard,      label: 'Payments' },
  { to: '/notifications', icon: Bell,            label: 'Notifications' },
  { to: '/chatbot',       icon: MessageSquare,   label: 'AI Assistant' },
  { to: '/society',       icon: Settings,        label: 'Society',      adminOnly: true },
]

const mobileNav = [
  { to: '/',              icon: Home,           label: 'Home' },
  { to: '/complaints',    icon: AlertCircle,    label: 'Complaints' },
  { to: '/chatbot',       icon: MessageSquare,  label: 'AI Chat' },
  { to: '/notifications', icon: Bell,           label: 'Alerts' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const searchRef = useRef(null)

  useEffect(() => {
    const societyId = user?.society?._id || user?.society
    if (!societyId) return
    const socket = connectSocket(societyId)
    socket.on('new_complaint', () => toast('New complaint raised', { icon: <AlertCircle size={15} className="text-amber-500" /> }))
    socket.on('announcement',  (n) => { toast(n.title, { icon: <Bell size={15} className="text-emerald-500" /> }); setUnread(p => p + 1) })
    socket.on('payment_reminder', () => toast('Payment reminders sent', { icon: <CreditCard size={15} className="text-sky-500" /> }))
    return () => disconnectSocket()
  }, [user])

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() } }
    const handleClickOutside = (e) => { if (profileOpen && !e.target.closest('.profile-trigger')) setProfileOpen(false) }
    window.addEventListener('keydown', h)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', h)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileOpen])

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = navItems.filter(i => !i.adminOnly || user?.role === 'admin')
  const currentPage = navItems.find(i => i.to === location.pathname)?.label || 'Dashboard'

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)' }}>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-white/5">
        <div className="relative flex flex-col items-center">
          <img src="/logo.png" alt="Panchayat Logo" className="h-16 w-auto object-contain transition-transform duration-300 hover:scale-105" />
          <div className="mt-[-10px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full backdrop-blur-md">
            <p className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.25em] whitespace-nowrap">
              {user?.role} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em] px-3 mb-3">Menu</p>
        {visibleNav.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={isActive ? 'nav-item-active' : 'nav-item'}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1 text-[13px]">{label}</span>
              {label === 'Notifications' && unread > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{unread}</span>
              )}
              {isActive && <ChevronRight size={13} className="opacity-50" />}
            </NavLink>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-1.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-150 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
            <LogOut size={14} />
          </div>
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 flex flex-col z-10 shadow-2xl animate-slide-up">
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 p-1" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-zinc-100 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-icon">
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:flex flex-1 max-w-xs">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input ref={searchRef}
                className="input pl-9 pr-14 py-2 h-9 bg-zinc-50 border-zinc-200 focus:bg-white text-sm"
                placeholder="Search..."
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </div>
            <h2 className="sm:hidden font-bold text-zinc-900 text-base">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-1.5 relative profile-trigger">
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              <Wifi size={11} /><span>Live</span>
            </div>
            <button onClick={() => navigate('/notifications')} className="btn-icon relative">
              <Bell size={17} />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
            </button>
            <div 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 py-1.5 z-50 animate-scale-in">
                <div className="px-4 py-2 border-b border-zinc-50 mb-1">
                  <p className="text-sm font-bold text-zinc-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button onClick={() => { navigate('/society'); setProfileOpen(false) }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                  <Settings size={14} /> Settings
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 animate-fade-in">
          <Outlet />
        </main>

        {location.pathname !== '/chatbot' && (
          <button
            onClick={() => navigate('/chatbot')}
            className="lg:hidden fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-300/50 transition-transform duration-200 hover:scale-[1.03] active:scale-95"
          >
            <MessageSquare size={14} />
            Ask AI
          </button>
        )}

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 flex items-center justify-around px-2 py-1 z-40">
          {mobileNav.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <NavLink key={to} to={to} end={to === '/'}
                className={isActive ? 'mobile-nav-item-active' : 'mobile-nav-item'}>
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon size={20} />
                  {label === 'Alerts' && unread > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
