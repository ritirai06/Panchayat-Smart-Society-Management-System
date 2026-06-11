import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  Bell, BellOff, Megaphone, AlertCircle, CreditCard, ShieldAlert, UserCheck, 
  ParkingSquare, Plus, CheckSquare, Trash2, X, Clock, HelpCircle 
} from 'lucide-react'
import AppModal from '../components/ui/AppModal'

const typeIcon = {
  Announcement: Megaphone,
  Complaint: AlertCircle,
  Payment: CreditCard,
  Security: ShieldAlert,
  Visitor: UserCheck,
  Parking: ParkingSquare,
}

const typeColor = {
  Announcement: 'text-blue-500 bg-blue-50 border border-blue-100',
  Complaint: 'text-amber-500 bg-amber-50 border border-amber-100',
  Payment: 'text-emerald-500 bg-emerald-50 border border-emerald-100',
  Security: 'text-rose-500 bg-rose-50 border border-rose-100',
  Visitor: 'text-indigo-500 bg-indigo-50 border border-indigo-100',
  Parking: 'text-slate-500 bg-slate-50 border border-slate-150',
}

export default function Notifications() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const societyId = user?.society?._id || user?.society

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All') // 'All' | 'Unread' | 'Announcement' | 'Payment' | 'Security'
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'Announcement' })
  const [submitting, setSubmitting] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to update') }
  }

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return
    try {
      await api.delete('/notifications/clear-all')
      setNotifications([])
      toast.success('Notifications cleared')
    } catch { toast.error('Failed to clear') }
  }

  const createAnnouncement = async (e) => {
    e.preventDefault()
    if (!form.title || !form.message) return
    setSubmitting(true)
    try {
      await api.post('/notifications/announce', { ...form, societyId })
      toast.success('Announcement broadcasted!')
      setShowAdd(false)
      setForm({ title: '', message: '', type: 'Announcement' })
      fetchNotifications()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  // Filter notifications based on tab selection
  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true
    if (activeTab === 'Unread') return !n.isRead
    return n.type === activeTab
  })

  // Date Grouping logic: Today, Yesterday, Older
  const groupNotificationsByDate = () => {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const groups = {
      Today: [],
      Yesterday: [],
      Older: []
    }

    filtered.forEach(n => {
      const nDate = new Date(n.createdAt)
      if (nDate.toDateString() === today.toDateString()) {
        groups.Today.push(n)
      } else if (nDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(n)
      } else {
        groups.Older.push(n)
      }
    })

    return groups
  }

  const grouped = groupNotificationsByDate()

  const renderNotificationCard = (n) => {
    const Icon = typeIcon[n.type] || HelpCircle
    const colors = typeColor[n.type] || typeColor.Announcement

    return (
      <div 
        key={n._id}
        onClick={() => !n.isRead && markRead(n._id)}
        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
          !n.isRead 
            ? 'bg-emerald-50/10 border-brand/20 shadow-sm' 
            : 'bg-white border-slate-100 hover:bg-slate-50/50'
        }`}>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`text-xs font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h4>
            <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
              <Clock size={9} />
              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">{n.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${colors}`}>
              {n.type}
            </span>
          </div>
        </div>
        {!n.isRead && (
          <div className="h-2 w-2 bg-brand rounded-full self-center flex-shrink-0 animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications Hub</h2>
          <p className="text-sm text-slate-500 mt-0.5">Society broadcasts, billing alerts, and visitor logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="btn-secondary text-xs font-semibold py-2">
            <CheckSquare size={13} /> Mark All Read
          </button>
          <button onClick={clearAll} className="btn-secondary text-xs font-semibold py-2 text-rose-500 hover:bg-rose-50 border-rose-200">
            <Trash2 size={13} /> Clear Inbox
          </button>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
              <Plus size={14} /> New Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto pb-1 max-w-full">
        {['All', 'Unread', 'Announcement', 'Payment', 'Security', 'Visitor', 'Parking'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Notification Lists */}
      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BellOff className="text-slate-300" size={20} />
            </div>
            <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">Your alerts inbox is completely clean.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([groupName, list]) => {
            if (list.length === 0) return null
            return (
              <div key={groupName} className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">{groupName}</h3>
                <div className="space-y-2">
                  {list.map(n => renderNotificationCard(n))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Broadcaster creation modal */}
      <AppModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Broadcast Announcement"
      >
            <form onSubmit={createAnnouncement} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="input-label">Title</label>
                <input className="input" placeholder="e.g. Schedule Water Tank Cleaning" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Message Details</label>
                <textarea className="input resize-none text-xs" rows={4} placeholder="Detailed instructions for residents..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Category</label>
                <select className="input text-xs" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['Announcement', 'Payment', 'Security', 'Visitor', 'Parking'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs font-bold" disabled={submitting}>
                  {submitting ? 'Broadcasting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
      </AppModal>
    </div>
  )
}
