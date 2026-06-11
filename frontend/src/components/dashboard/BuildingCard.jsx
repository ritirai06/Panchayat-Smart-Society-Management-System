import { FiAlertCircle, FiHome, FiUsers, FiChevronRight } from 'react-icons/fi'
import { Building2 } from 'lucide-react'

export default function BuildingCard({ tower, active, onClick, societyImage }) {
  if (!tower) return null

  const occupancyColor =
    tower.occupancy >= 80 ? 'text-emerald-400' :
    tower.occupancy >= 40 ? 'text-amber-400' : 'text-rose-400'

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl text-left transition-all duration-300 focus:outline-none ${
        active
          ? 'ring-2 ring-emerald-400 shadow-2xl shadow-emerald-900/40 -translate-y-1'
          : 'hover:shadow-2xl hover:shadow-emerald-900/30 hover:-translate-y-1'
      }`}
    >
      {/* Dark card background */}
      <div className="relative bg-gradient-to-br from-[#0B0F19] via-[#0d1a14] to-[#063B2B] overflow-hidden">

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Glow orb */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

        {/* Image or illustrated placeholder */}
        <div className="relative h-44 overflow-hidden">
          {(tower.image || societyImage) ? (
            <>
              <img
                src={tower.image || societyImage}
                alt={tower.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
            </>
          ) : (
            <div className="h-full w-full flex items-end justify-center pb-6 relative">
              {/* Illustrated building */}
              <div className="relative flex items-end gap-1.5">
                {/* Tower silhouettes */}
                {[
                  { h: 'h-20', w: 'w-7', windows: 6 },
                  { h: 'h-28', w: 'w-10', windows: 9 },
                  { h: 'h-16', w: 'w-6', windows: 4 },
                ].map((b, i) => (
                  <div key={i} className={`${b.h} ${b.w} rounded-t-sm bg-emerald-900/60 border border-emerald-700/30 relative overflow-hidden flex-shrink-0`}>
                    <div className="absolute inset-1 grid grid-cols-2 gap-0.5">
                      {Array.from({ length: b.windows }).map((_, j) => (
                        <div
                          key={j}
                          className={`rounded-[1px] ${j % 3 === 0 ? 'bg-emerald-400/60' : j % 2 === 0 ? 'bg-amber-400/40' : 'bg-emerald-900/80'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Ground line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-emerald-700/30" />
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#063B2B]/60 to-transparent" />
            </div>
          )}
        </div>

        {/* Occupancy badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 rounded-full bg-black/50 border border-white/10 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${occupancyColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${occupancyColor.replace('text-', 'bg-')} animate-pulse`} />
            {tower.occupancy}% occupied
          </span>
        </div>

        {/* Active indicator */}
        {active && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Selected
            </span>
          </div>
        )}

        {/* Tower name + arrow */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <Building2 size={12} className="text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide">{tower.name}</h4>
            </div>
            <FiChevronRight
              size={14}
              className="text-emerald-400/60 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-[#0d1a14] border-t border-emerald-900/40 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1 text-slate-500 font-medium">
              <FiHome size={10} /> Flats
            </p>
            <p className="font-bold text-white">{tower.flats}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1 text-emerald-500/70 font-medium">
              <FiUsers size={10} /> Occupied
            </p>
            <p className="font-bold text-emerald-400">{tower.occupied}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1 text-amber-500/70 font-medium">
              <FiAlertCircle size={10} /> Issues
            </p>
            <p className={`font-bold ${tower.activeComplaints > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
              {tower.activeComplaints}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}
