import { FiAlertCircle, FiHome, FiUsers } from 'react-icons/fi'

export default function BuildingCard({ tower, active, onClick }) {
  if (!tower) return null

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
        active
          ? 'border-emerald-300 shadow-lg shadow-emerald-100 -translate-y-0.5'
          : 'border-zinc-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60 hover:-translate-y-1'
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={tower.image}
          alt={tower.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-900/30 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 backdrop-blur">
          {tower.occupancy}% occupied
        </span>
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="text-base font-bold text-white">{tower.name}</h4>
        </div>
      </div>

      <div className="bg-white p-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-zinc-50 p-2">
            <p className="flex items-center gap-1 text-zinc-500">
              <FiHome size={11} /> Flats
            </p>
            <p className="mt-1 font-semibold text-zinc-900">{tower.flats}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2">
            <p className="flex items-center gap-1 text-emerald-600">
              <FiUsers size={11} /> Occupied
            </p>
            <p className="mt-1 font-semibold text-emerald-700">{tower.occupied}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-2">
            <p className="flex items-center gap-1 text-amber-600">
              <FiAlertCircle size={11} /> Active
            </p>
            <p className="mt-1 font-semibold text-amber-700">{tower.activeComplaints}</p>
          </div>
        </div>
      </div>
    </button>
  )
}
