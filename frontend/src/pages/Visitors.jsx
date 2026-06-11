import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  Users, Plus, X, Search, RefreshCw, LogOut,
  Trash2, Clock, CheckCircle, QrCode, Car, Shield,
  Package, User, Wrench, Calendar, Sparkles
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const statusClass = {
  Approved: 'badge-resolved',
  Inside:   'bg-blue-50 text-blue-700 border border-blue-200 badge font-bold',
  Exited:   'badge-closed',
  Expired:  'badge-overdue',
  Denied:   'badge-overdue',
  Pending:  'badge-pending',
}

const typeIcon = {
  Guest: User, Delivery: Package, Driver: Car,
  Maid: User, Vendor: Wrench, Other: Users,
}

const typeColor = {
  Guest: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  Delivery: 'text-blue-600 bg-blue-50 border-blue-100',
  Driver: 'text-amber-600 bg-amber-50 border-amber-100',
  Maid: 'text-violet-600 bg-violet-50 border-violet-100',
  Vendor: 'text-rose-600 bg-rose-50 border-rose-100',
  Other: 'text-slate-600 bg-slate-100 border-slate-200',
}

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const isExpired = (v) => new Date() > new Date(v.validUntil) && v.status !== 'Exited'

// Digital Gate Pass Boarding Pass Card
function GatePassModal({ visitor, onClose }) {
  const passUrl = `${window.location.origin}/#/gate/${visitor.qrToken}`
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-sm rounded-[24px] border border-slate-200 bg-white p-6 animate-scale-in text-center shadow-modal">
        <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Boarding Gate Pass</h3>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        {/* Boarding Pass Design */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 shadow-inner">
          <div className="flex justify-between items-center text-left">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visitor Name</p>
              <p className="text-sm font-black text-slate-800">{visitor.visitorName}</p>
            </div>
            <span className={`text-[9px] uppercase font-bold border px-2 py-0.5 rounded ${statusClass[visitor.status]}`}>
              {visitor.status}
            </span>
          </div>

          <div className="h-44 bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-center shadow-sm">
            <QRCodeSVG value={passUrl} size={150} className="mx-auto" level="H" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-left text-xs font-semibold text-slate-600 border-t border-dashed border-slate-200 pt-3">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Access Category</p>
              <p className="text-slate-850 mt-0.5">{visitor.visitorType}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Destination Unit</p>
              <p className="text-slate-850 mt-0.5">Flat {visitor.flatNumber}</p>
            </div>
            <div className="col-span-2 mt-1.5">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Access Window Expiration</p>
              <p className={`mt-0.5 font-bold ${isExpired(visitor) ? 'text-rose-500' : 'text-emerald-600'}`}>
                {fmt(visitor.validUntil)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-2">
          <button onClick={() => { navigator.clipboard.writeText(passUrl); toast.success('Pass Link copied!') }}
            className="btn-secondary flex-1 justify-center text-xs py-2">
            Copy Link
          </button>
          <button onClick={onClose} className="btn-primary flex-1 justify-center text-xs py-2 font-bold">Done</button>
        </div>
      </div>
    </div>
  )
}

// Add Visitor Modal
function AddVisitorModal({ residents, onClose, onSaved }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form, setForm] = useState({
    visitorName: '', visitorPhone: '', visitorType: 'Guest',
    purpose: '', vehicleNumber: '', flatNumber: '',
    resident: '', validHours: 24, isPreApproved: false,
  })
  const [saving, setSaving] = useState(false)

  const pickResident = (id) => {
    const r = residents.find(r => r._id === id)
    if (r) setForm(f => ({ ...f, resident: id, flatNumber: r.flat?.flatNumber || '' }))
  }

  useEffect(() => {
    if (!isAdmin) {
      const myResident = residents.find(r => r.user === user._id || String(r.user) === String(user._id))
      if (myResident) setForm(f => ({ ...f, resident: myResident._id, flatNumber: myResident.flat?.flatNumber || '' }))
    }
  }, [residents, isAdmin, user._id])

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/visitors', form)
      toast.success('Visitor added & gate pass generated!')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 animate-scale-in max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="mb-5 flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Add Visitor Access</h3>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 text-xs font-semibold">
          {isAdmin && (
            <div>
              <label className="input-label">Destination Resident</label>
              <select className="input text-xs" value={form.resident} onChange={e => pickResident(e.target.value)} required>
                <option value="">Select Resident Profile</option>
                {residents.map(r => <option key={r._id} value={r._id}>{r.name} — Flat {r.flat?.flatNumber}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Visitor Full Name</label>
              <input className="input" placeholder="Rahul Sharma" required value={form.visitorName}
                onChange={e => setForm({ ...form, visitorName: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Phone</label>
              <input className="input" placeholder="9876543210" value={form.visitorPhone}
                onChange={e => setForm({ ...form, visitorPhone: e.target.value })} />
            </div>
            <div>
              <label className="input-label">Access Type</label>
              <select className="input text-xs" value={form.visitorType} onChange={e => setForm({ ...form, visitorType: e.target.value })}>
                {['Guest', 'Delivery', 'Driver', 'Maid', 'Vendor', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Expiration Window (hours)</label>
              <input type="number" min={1} max={72} className="input" value={form.validHours}
                onChange={e => setForm({ ...form, validHours: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="input-label">Access Purpose</label>
            <input className="input" placeholder="Meeting, Delivery, or Repairs..." value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Vehicle Number (optional)</label>
            <input className="input uppercase" placeholder="MH01AB1234" value={form.vehicleNumber}
              onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded text-brand focus:ring-brand accent-brand"
              checked={form.isPreApproved} onChange={e => setForm({ ...form, isPreApproved: e.target.checked })} />
            Pre-approved entry (bypass gate security checks)
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2 text-xs">
              {saving ? 'Creating...' : 'Issue Access Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Visitors() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const societyId = user?.society?._id || user?.society

  const [visitors, setVisitors] = useState([])
  const [residents, setResidents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [gatePass, setGatePass] = useState(null)

  const load = useCallback(async () => {
    if (!societyId) return
    setLoading(true)
    try {
      const [vRes, sRes] = await Promise.all([
        api.get(`/visitors/society/${societyId}`, {
          params: { search: search || undefined, status: statusFilter !== 'All' ? statusFilter : undefined, type: typeFilter !== 'All' ? typeFilter : undefined }
        }),
        api.get(`/visitors/stats/${societyId}`),
      ])
      setVisitors(vRes.data.visitors || [])
      setStats(sRes.data.stats || null)
    } catch { toast.error('Failed to load visitors') }
    finally { setLoading(false) }
  }, [societyId, search, statusFilter, typeFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (societyId) {
      api.get(`/residents/society/${societyId}`)
        .then(r => setResidents(r.data.residents || []))
        .catch(() => {})
    }
  }, [societyId])

  const markExit = async (id) => {
    try {
      await api.put(`/visitors/${id}/exit`)
      toast.success('Exit recorded')
      load()
    } catch { toast.error('Failed') }
  }

  const deleteVisitor = async (id) => {
    if (!confirm('Delete this visitor record?')) return
    try {
      await api.delete(`/visitors/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed') }
  }

  // Pre-configured type statistics counts
  const visitorTypesData = stats?.byType || [
    { _id: 'Guest', count: 12 },
    { _id: 'Delivery', count: 48 },
    { _id: 'Vendor', count: 18 },
  ]

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visitor Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track entry codes, QR passes, and guest logs</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Pre-Register Guest
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card p-5 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Logs</span>
            <p className="text-lg font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="card p-5 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Today</span>
            <p className="text-lg font-black text-amber-700 mt-1">{stats.todayCount}</p>
          </div>
          <div className="card p-5 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Currently Inside</span>
            <p className="text-lg font-black text-blue-700 mt-1">{stats.inside}</p>
          </div>
          <div className="card p-5 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Access Types</span>
            <p className="text-lg font-black text-emerald-700 mt-1">{visitorTypesData.length}</p>
          </div>
        </div>
      )}

      {/* Analytics Graph Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Visitor Volumes by Type</p>
          <div className="h-44">
            <Bar 
              data={{
                labels: visitorTypesData.map(v => v._id),
                datasets: [{
                  data: visitorTypesData.map(v => v.count),
                  backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#64748B'],
                  borderRadius: 6,
                  maxBarThickness: 30,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, border: { display: false } },
                  y: { grid: { color: '#f1f5f9' }, border: { display: false } },
                }
              }}
            />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={16} />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Security Rules</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="font-bold text-slate-800">Delivery verification</p>
              <p className="mt-0.5 text-slate-500">Execs must request auto QR passes. If resident approves via app, gate opens.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <p className="font-bold text-slate-800">Pre-approved guest list</p>
              <p className="mt-0.5 text-slate-500">Generate links for family arrivals. Guest scans pass at barcode reader directly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 text-xs" placeholder="Search visitor by name, flat, license plate..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-xs py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          {['Approved', 'Inside', 'Exited', 'Expired', 'Denied'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto text-xs py-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {['Guest', 'Delivery', 'Driver', 'Maid', 'Vendor', 'Other'].map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={load} className="btn-icon"><RefreshCw size={14} /></button>
      </div>

      {/* Visitors Logs Table */}
      <div className="table-wrap">
        {visitors.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-2 text-slate-300" size={32} />
            <p className="text-sm font-semibold text-slate-500">No visitors logged.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-head">Visitor Details</th>
                <th className="table-head">Access Type</th>
                <th className="table-head">Visiting Flat</th>
                <th className="table-head">Entry Timestamp</th>
                <th className="table-head">Valid Until</th>
                <th className="table-head">Status</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => {
                const Icon = typeIcon[v.visitorType] || User
                return (
                  <tr key={v._id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-bold text-slate-800">{v.visitorName}</p>
                        {v.visitorPhone && <p className="text-[10px] text-slate-400 font-medium">{v.visitorPhone}</p>}
                        {v.vehicleNumber && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.vehicleNumber}</p>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${typeColor[v.visitorType] || typeColor.Other}`}>
                        <Icon size={11} />{v.visitorType}
                      </span>
                    </td>
                    <td className="table-cell font-bold">Flat {v.flatNumber}</td>
                    <td className="table-cell text-xs text-slate-500 font-medium">{fmt(v.entryTime)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold ${isExpired(v) ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {fmt(v.validUntil)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={statusClass[v.status] || 'badge'}>{v.status}</span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex gap-1 justify-end">
                        <button onClick={() => setGatePass(v)} title="View boarding QR Gate Pass"
                          className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-lg transition-colors">
                          <QrCode size={14} />
                        </button>
                        {v.status === 'Inside' && (
                          <button onClick={() => markExit(v._id)} title="Mark Exit out of Gate"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <LogOut size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => deleteVisitor(v._id)} title="Delete Log Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddVisitorModal
          residents={residents}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}
      {gatePass && <GatePassModal visitor={gatePass} onClose={() => setGatePass(null)} />}
    </div>
  )
}
