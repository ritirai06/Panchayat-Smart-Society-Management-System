import { useEffect } from 'react'
import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiHome, FiMapPin, FiUser, FiUsers, FiX } from 'react-icons/fi'

/* ── helpers ──────────────────────────────────────────────── */
const paymentBadge = (status) => {
  if (status === 'Paid') return 'badge-paid'
  if (status === 'Pending' || status === 'Overdue') return 'badge-overdue'
  return 'badge-pending'
}

function FlatRow({ flat }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        flat.pendingComplaints > 0
          ? 'border-amber-200 bg-amber-50/60 hover:shadow-amber-100'
          : 'border-zinc-100 bg-white hover:border-emerald-200 hover:shadow-emerald-100/50'
      }`}
    >
      {/* flat number badge */}
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xs font-bold text-white">
        {flat.flatNumber}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {flat.residentName || 'Vacant'}
          </p>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              flat.isOccupied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {flat.isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <FiHome size={10} />
          Floor {flat.floor ?? '--'} • {flat.type || 'Unit'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <span className={`${paymentBadge(flat.paymentStatus)} flex items-center gap-1`}>
          <FiCreditCard size={10} />
          {flat.paymentStatus}
        </span>
        {flat.pendingComplaints > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <FiAlertCircle size={10} />
            {flat.pendingComplaints} issue{flat.pendingComplaints > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── main modal ───────────────────────────────────────────── */
export default function TowerDetailModal({ tower, flats, onClose }) {
  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!tower) return null

  const towerFlats = flats.filter((f) => f.tower === tower.name)
  const occupied   = towerFlats.filter((f) => f.isOccupied).length
  const vacant     = towerFlats.length - occupied
  const issues     = towerFlats.reduce((s, f) => s + f.pendingComplaints, 0)

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* panel */}
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl animate-scale-in">

        {/* ── hero ── */}
        <div className="relative h-44 flex-shrink-0 overflow-hidden sm:h-52">
          <img
            src={tower.image}
            alt={tower.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-900/40 to-transparent" />

          {/* close */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
          >
            <FiX size={16} />
          </button>

          {/* occupancy pill */}
          <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
            {tower.occupancy}% occupied
          </span>

          {/* title */}
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
              Society Towers
            </p>
            <h2 className="text-2xl font-bold text-white">{tower.name}</h2>
          </div>
        </div>

        {/* ── stat strip ── */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100 bg-zinc-50">
          <div className="flex flex-col items-center py-3">
            <FiHome size={14} className="mb-1 text-zinc-400" />
            <p className="text-lg font-bold text-zinc-900">{towerFlats.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Flats</p>
          </div>
          <div className="flex flex-col items-center py-3">
            <FiUsers size={14} className="mb-1 text-emerald-500" />
            <p className="text-lg font-bold text-emerald-700">{occupied}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Occupied</p>
          </div>
          <div className="flex flex-col items-center py-3">
            <FiAlertCircle size={14} className="mb-1 text-amber-500" />
            <p className="text-lg font-bold text-amber-700">{issues}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Issues</p>
          </div>
        </div>

        {/* ── flat list ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            {towerFlats.length} Unit{towerFlats.length !== 1 ? 's' : ''}
          </p>

          {towerFlats.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50">
                <FiHome size={20} className="text-zinc-300" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">No flats in this tower</p>
              <p className="mt-1 text-xs text-zinc-400">Add flats with this tower prefix to see them here.</p>
            </div>
          ) : (
            towerFlats.map((flat) => <FlatRow key={flat._id} flat={flat} />)
          )}
        </div>
      </div>
    </div>
  )
}
