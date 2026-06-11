import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldAlert, X, Clock, Home, User, Eye, CheckCircle } from 'lucide-react'

const TYPE_COLOR = {
  Medical: 'bg-rose-600', Fire: 'bg-orange-600',
  Security: 'bg-blue-600', Police: 'bg-slate-800',
  Guard: 'bg-purple-600', Other: 'bg-rose-500',
}

function AlertCard({ alert, onAcknowledge, onViewDetails }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-rose-200 overflow-hidden"
    >
      {/* Red header bar */}
      <div className={`${TYPE_COLOR[alert.type] || TYPE_COLOR.Other} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-white animate-pulse" />
          <span className="text-white text-xs font-black uppercase tracking-widest">
            {alert.type} Emergency
          </span>
        </div>
        <span className="text-white/70 text-[10px] font-semibold flex items-center gap-1">
          <Clock size={10} />
          {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Resident</p>
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <User size={10} className="text-slate-400" /> {alert.raisedBy}
            </p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-100">
            <p className="text-rose-400 text-[10px] font-bold uppercase mb-0.5">Flat</p>
            <p className="font-bold text-rose-700 flex items-center gap-1">
              <Home size={10} /> {alert.flatNumber || 'Unknown'}
            </p>
          </div>
        </div>

        {alert.description && (
          <p className="text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 font-medium leading-relaxed">
            {alert.description}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onViewDetails(alert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Eye size={12} /> View Details
          </button>
          <button
            onClick={() => onAcknowledge(alert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 transition-colors"
          >
            <CheckCircle size={12} /> Acknowledge
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function SOSAlertModal({ alerts, onAcknowledge, onViewDetails, onDismiss }) {
  // ESC to dismiss top alert
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && alerts.length) onDismiss(alerts[0]) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [alerts, onDismiss])

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {alerts.map(alert => (
          <div key={alert.sosId} className="pointer-events-auto">
            <AlertCard
              alert={alert}
              onAcknowledge={onAcknowledge}
              onViewDetails={onViewDetails}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
