import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Bell, CheckCheck, AlertTriangle, CreditCard, Megaphone, Info, X, Send } from 'lucide-react'

const TYPE_CONFIG = {
  complaint:    { icon: AlertTriangle, bg: 'bg-amber-50',   text: 'text-amber-500',   border: 'border-l-amber-400',   label: 'Complaint' },
  payment:      { icon: CreditCard,    bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-l-emerald-400', label: 'Payment' },
  announcement: { icon: Megaphone, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-l-emerald-400', label: 'Announcement' },
  reminder:     { icon: Bell,          bg: 'bg-rose-50',    text: 'text-rose-500',    border: 'border-l-rose-400',    label: 'Reminder' },
  system:       { icon: Info,          bg: 'bg-slate-50',   text: 'text-slate-400',   border: 'border-l-slate-300',   label: 'System' },
}

const SkeletonRow = () => (
  <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100">
    <div className="animate-shimmer w-9 h-9 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="animate-shimmer h-4 w-48 rounded-lg" />
      <div className="animate-shimmer h-3 w-64 rounded-lg" />
    </div>
  </div>
)

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnnounce, setShowAnnounce] = useState(false)
  const [announce, setAnnounce] = useState({ title: '', message: '' })
  const [sending, setSending] = useState(false)
  const isAdmin = user?.role === 'admin'

  const fetchNotifs = async () => {
    setLoading(true)
    try { const { data } = await api.get('/notifications'); setNotifications(data.notifications) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifs() }, [])

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {})
    setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {})
    setNotifications(p => p.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  const sendAnnouncement = async (e) => {
    e.preventDefault(); setSending(true)
    try {
      await api.post('/notifications/announce', announce)
      toast.success('Announcement sent!')
      setShowAnnounce(false); setAnnounce({ title: '', message: '' }); fetchNotifs()
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Notifications</h2>
          <p className="section-sub">
            {unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowAnnounce(true)} className="btn-primary text-sm">
              <Megaphone size={14} /> Announce
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-slate-50 ring-1 ring-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={22} className="text-slate-300" />
          </div>
          <p className="font-semibold text-slate-500">No notifications yet</p>
          <p className="text-slate-400 text-sm mt-1">Updates about complaints, payments, and announcements will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
            const Icon = cfg.icon
            return (
              <div key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`bg-white rounded-xl border border-l-4 ${cfg.border} border-slate-100 p-4 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-all duration-150 ${!n.isRead ? 'shadow-sm' : 'opacity-75'}`}>
                <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Announce Modal */}
      {showAnnounce && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 ring-1 ring-emerald-100 rounded-xl flex items-center justify-center">
                  <Megaphone size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Send Announcement</h3>
                  <p className="text-xs text-slate-400">Broadcast to all residents</p>
                </div>
              </div>
              <button onClick={() => setShowAnnounce(false)} className="btn-icon"><X size={17} /></button>
            </div>
            <form onSubmit={sendAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="input-label">Title</label>
                <input className="input" placeholder="e.g. Society Meeting on Sunday" value={announce.title}
                  onChange={e => setAnnounce({ ...announce, title: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Message</label>
                <textarea className="input resize-none" rows={4} placeholder="Write your announcement..."
                  value={announce.message} onChange={e => setAnnounce({ ...announce, message: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAnnounce(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1 justify-center">
                  {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : <><Send size={13} />Send to All</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
