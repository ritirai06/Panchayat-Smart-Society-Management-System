import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import AppModal from '../components/ui/AppModal'
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Siren, PhoneCall,
  HeartPulse, Flame, Eye, X, CheckCircle, RefreshCw, Clock
} from 'lucide-react'

const CONTACTS = [
  { role: 'Main Gate Security',        name: 'Ramesh Singh',            phone: '+91 9988776655' },
  { role: 'Society Management Office', name: 'Alok Gupta',              phone: '+91 9876543219' },
  { role: 'Local Police Precinct',     name: 'Sector 45 Police Station',phone: '0120-2444555' },
  { role: 'Nearby Hospital',           name: 'Max Hospital Ambulance',  phone: '102 / +91 9888877777' },
]

const TYPE_MAP = {
  Medical:  { label: 'Medical / Ambulance', color: 'rose',   icon: HeartPulse },
  Fire:     { label: 'Fire Emergency',      color: 'orange', icon: Flame },
  Security: { label: 'Gate Security',       color: 'blue',   icon: ShieldCheck },
  Police:   { label: 'Local Police',        color: 'slate',  icon: Siren },
}

const STATUS_STYLE = {
  Active:       'bg-rose-100 text-rose-700 border border-rose-200',
  Acknowledged: 'bg-amber-100 text-amber-700 border border-amber-200',
  Resolved:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
}

export default function SOS() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const societyId = user?.society?._id || user?.society

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [triggerType, setTriggerType] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)
  const countdownRef = useRef(null)

  const fetchLogs = useCallback(async () => {
    if (!isAdmin || !societyId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/sos/${societyId}`)
      setLogs(data.logs || [])
    } catch { toast.error('Failed to load SOS logs') }
    finally { setLoading(false) }
  }, [isAdmin, societyId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Countdown logic
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    } else if (countdown === 0 && triggerType) {
      fireSOS()
    }
    return () => clearTimeout(countdownRef.current)
  }, [countdown, triggerType])

  const startCountdown = (type) => {
    setTriggerType(type)
    setCountdown(3)
    toast(`Initiating ${type} SOS in 3 seconds...`, { icon: '🚨' })
  }

  const cancelSOS = () => {
    clearTimeout(countdownRef.current)
    setCountdown(0)
    setTriggerType(null)
    toast.success('Emergency alert cancelled')
  }

  const fireSOS = async () => {
    const type = triggerType
    setTriggerType(null)
    setCountdown(0)
    try {
      await api.post('/sos', { type, description: '' })
      toast.error('🚨 EMERGENCY BROADCAST TRANSMITTED!', { duration: 5000 })
      fetchLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send SOS')
    }
  }

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/sos/${id}/acknowledge`)
      toast.success('SOS acknowledged')
      fetchLogs()
    } catch { toast.error('Failed') }
  }

  const handleResolve = async (id) => {
    try {
      await api.put(`/sos/${id}/resolve`)
      toast.success('SOS resolved')
      fetchLogs()
      if (selectedLog?._id === id) setSelectedLog(null)
    } catch { toast.error('Failed') }
  }

  const activeLogs = logs.filter(l => l.status !== 'Resolved')

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-500 animate-pulse" size={24} />
            Emergency Response Center
          </h2>
          <p className="text-sm text-slate-500 mt-1">Raise one-click distress alerts and contact emergency services</p>
        </div>
        {isAdmin && (
          <button onClick={fetchLogs} className="btn-icon" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Active emergencies banner */}
      {isAdmin && activeLogs.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-5 py-3 animate-pulse">
          <Siren className="text-rose-600 flex-shrink-0" size={20} />
          <p className="text-sm font-black text-rose-700">
            {activeLogs.length} ACTIVE EMERGENCY{activeLogs.length > 1 ? 'S' : ''} — IMMEDIATE RESPONSE REQUIRED
          </p>
        </div>
      )}

      {/* Countdown overlay */}
      {countdown > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-rose-950/80 backdrop-blur-md p-4">
          <div className="text-center space-y-6 max-w-sm">
            <Siren className="h-24 w-24 text-white mx-auto animate-bounce" />
            <h1 className="text-3xl font-extrabold text-white">TRIGGERING {triggerType?.toUpperCase()} SOS</h1>
            <p className="text-rose-200 text-sm">Broadcasting to security & admin in:</p>
            <div className="text-8xl font-black text-white">{countdown}</div>
            <button onClick={cancelSOS} className="w-full py-3 rounded-2xl bg-white text-rose-700 font-bold text-sm hover:bg-rose-50 transition-colors">
              CANCEL ALERT
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trigger panel */}
        <div className="card lg:col-span-2 space-y-5 border border-rose-100 bg-rose-50/10">
          <div>
            <h3 className="text-base font-bold text-slate-900">Distress Channels</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click to initiate alert — 3-second cancel window</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(TYPE_MAP).map(([type, { label, color, icon: Icon }]) => (
              <button key={type} onClick={() => startCountdown(type)}
                className={`flex flex-col items-center justify-center p-6 bg-white border border-${color}-200 rounded-3xl hover:bg-${color}-50/30 transition-all hover:shadow-md group`}>
                <div className={`h-14 w-14 rounded-2xl bg-${color}-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <span className={`font-bold text-${color}-700 text-sm`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="card space-y-4">
          <h3 className="text-base font-bold text-slate-900">Direct Lines</h3>
          <div className="space-y-2.5">
            {CONTACTS.map((c, i) => (
              <div key={i} className="p-3 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400">{c.role}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{c.name}</p>
                  <p className="text-xs font-mono text-slate-500 mt-1">{c.phone}</p>
                </div>
                <a href={`tel:${c.phone}`} className="h-9 w-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center rounded-xl">
                  <PhoneCall size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency History */}
      {isAdmin && (
        <div className="card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Emergency History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Full incident log with acknowledgement and resolution tracking</p>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Type</th>
                  <th className="table-head">Resident</th>
                  <th className="table-head">Flat</th>
                  <th className="table-head">Time</th>
                  <th className="table-head">Acknowledged By</th>
                  <th className="table-head">Status</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">No SOS events recorded</td></tr>
                ) : logs.map(log => (
                  <tr key={log._id} className="table-row">
                    <td className="table-cell">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${log.status === 'Active' ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`} />
                        {log.type}
                      </span>
                    </td>
                    <td className="table-cell text-xs font-semibold">{log.raisedBy?.name || '—'}</td>
                    <td className="table-cell text-xs">{log.resident?.flatNumber || log.flatNumber || '—'}</td>
                    <td className="table-cell text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={10} />
                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">{log.acknowledgedBy?.name || '—'}</td>
                    <td className="table-cell">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => setSelectedLog(log)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="View">
                          <Eye size={13} />
                        </button>
                        {log.status === 'Active' && (
                          <button onClick={() => handleAcknowledge(log._id)}
                            className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                            Ack
                          </button>
                        )}
                        {log.status !== 'Resolved' && (
                          <button onClick={() => handleResolve(log._id)}
                            className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AppModal open={!!selectedLog} onClose={() => setSelectedLog(null)} title={`SOS: ${selectedLog?.type}`}>
        {selectedLog && (
          <div className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border rounded-2xl p-3">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Resident</p>
                <p className="text-slate-800 font-bold">{selectedLog.raisedBy?.name || '—'}</p>
              </div>
              <div className="bg-slate-50 border rounded-2xl p-3">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Flat</p>
                <p className="text-slate-800 font-bold">{selectedLog.resident?.flatNumber || selectedLog.flatNumber || '—'}</p>
              </div>
              <div className="bg-slate-50 border rounded-2xl p-3">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Logged At</p>
                <p className="text-slate-800">{new Date(selectedLog.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 border rounded-2xl p-3">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Status</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[selectedLog.status]}`}>{selectedLog.status}</span>
              </div>
              {selectedLog.acknowledgedBy && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 col-span-2">
                  <p className="text-amber-500 text-[10px] uppercase font-bold mb-1">Acknowledged By</p>
                  <p className="text-amber-800 font-bold">{selectedLog.acknowledgedBy.name}</p>
                </div>
              )}
              {selectedLog.resolvedAt && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 col-span-2">
                  <p className="text-emerald-500 text-[10px] uppercase font-bold mb-1">Resolved At</p>
                  <p className="text-emerald-800 font-bold">{new Date(selectedLog.resolvedAt).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
            {selectedLog.description && (
              <div className="bg-slate-50 border rounded-2xl p-3">
                <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Description</p>
                <p className="text-slate-700 leading-relaxed">{selectedLog.description}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {selectedLog.status === 'Active' && (
                <button onClick={() => handleAcknowledge(selectedLog._id)}
                  className="flex-1 btn-secondary justify-center py-2 text-xs text-amber-600 border-amber-200 hover:bg-amber-50">
                  Acknowledge
                </button>
              )}
              {selectedLog.status !== 'Resolved' && (
                <button onClick={() => handleResolve(selectedLog._id)}
                  className="flex-1 btn-primary justify-center py-2 text-xs">
                  <CheckCircle size={13} /> Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </AppModal>
    </div>
  )
}
