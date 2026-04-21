import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiHome, FiUser } from 'react-icons/fi'

const paymentBadge = (status) => {
  if (status === 'Paid') return 'badge-paid'
  if (status === 'Pending') return 'badge-overdue'
  if (status === 'Overdue') return 'badge-overdue'
  return 'badge-pending'
}

const issueBadge = (pendingComplaints) => {
  if (pendingComplaints > 0) return 'badge-medium'
  return 'badge-resolved'
}

export default function FlatCard({ flat }) {
  if (!flat) return null

  return (
    <article
      className={`card relative h-full min-w-[84%] snap-start border transition-all duration-200 md:min-w-0 ${
        flat.pendingComplaints > 0
          ? 'border-amber-200/90 shadow-md shadow-amber-100/70 hover:-translate-y-0.5'
          : 'border-zinc-100 hover:border-emerald-200 hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{flat.tower}</p>
          <h4 className="text-base font-bold text-zinc-900">{flat.flatNumber}</h4>
        </div>
        <span className={flat.isOccupied ? 'badge-resolved' : 'badge-closed'}>{flat.isOccupied ? 'Occupied' : 'Vacant'}</span>
      </div>

      <div className="space-y-2.5 text-sm">
        <p className="flex items-center gap-2 text-zinc-600">
          <FiUser size={13} className="text-zinc-400" />
          <span className="font-medium text-zinc-800">{flat.residentName || 'No active resident'}</span>
        </p>
        <p className="flex items-center gap-2 text-zinc-500">
          <FiHome size={13} className="text-zinc-400" />
          Floor {flat.floor ?? '--'} • {flat.type || 'Unit'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={paymentBadge(flat.paymentStatus)}>
          <FiCreditCard size={11} />
          {flat.paymentStatus}
        </span>
        <span className={issueBadge(flat.pendingComplaints)}>
          {flat.pendingComplaints > 0 ? (
            <>
              <FiAlertCircle size={11} />
              {flat.pendingComplaints} issues
            </>
          ) : (
            <>
              <FiCheckCircle size={11} />
              No issues
            </>
          )}
        </span>
      </div>
    </article>
  )
}
