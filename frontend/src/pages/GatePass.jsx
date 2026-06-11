import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { CheckCircle, XCircle, Clock, User, Building2, Car } from 'lucide-react'

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const statusStyle = {
  Approved: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500', text: 'Valid Pass' },
  Inside:   { bg: 'bg-blue-50 border-blue-200',       icon: CheckCircle, iconColor: 'text-blue-500',    text: 'Currently Inside' },
  Exited:   { bg: 'bg-zinc-50 border-zinc-200',       icon: Clock,       iconColor: 'text-zinc-400',    text: 'Already Exited' },
  Expired:  { bg: 'bg-rose-50 border-rose-200',       icon: XCircle,     iconColor: 'text-rose-500',    text: 'Pass Expired' },
  Denied:   { bg: 'bg-rose-50 border-rose-200',       icon: XCircle,     iconColor: 'text-rose-500',    text: 'Access Denied' },
}

export default function GatePass() {
  const { token } = useParams()
  const [visitor, setVisitor] = useState(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/visitors/verify/${token}`)
      .then(r => setVisitor(r.data.visitor))
      .catch(e => setError(e.response?.data?.message || 'Invalid gate pass'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
        <XCircle className="text-rose-500" size={32} />
      </div>
      <h2 className="text-xl font-bold text-zinc-900">Invalid Gate Pass</h2>
      <p className="text-sm text-zinc-500">{error}</p>
    </div>
  )

  const style = statusStyle[visitor.status] || statusStyle.Approved
  const StatusIcon = style.icon

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
      <div className={`w-full max-w-sm rounded-2xl border-2 p-6 shadow-xl ${style.bg}`}>
        {/* Header */}
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="Panchayat" className="h-10 w-auto object-contain opacity-80" />
          <h1 className="text-lg font-bold text-zinc-900">Panchayat Gate Pass</h1>
        </div>

        {/* Status */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <StatusIcon className={style.iconColor} size={44} />
          <span className={`text-base font-bold ${style.iconColor}`}>{style.text}</span>
        </div>

        {/* Details */}
        <div className="space-y-3 rounded-xl bg-white/70 p-4">
          <Row icon={User} label="Visitor" value={visitor.visitorName} />
          <Row icon={User} label="Type" value={visitor.visitorType} />
          <Row icon={Building2} label="Visiting Flat" value={visitor.flatNumber} />
          {visitor.hostedBy?.name && <Row icon={User} label="Host" value={visitor.hostedBy.name} />}
          {visitor.vehicleNumber && <Row icon={Car} label="Vehicle" value={visitor.vehicleNumber} />}
          {visitor.purpose && <Row icon={Clock} label="Purpose" value={visitor.purpose} />}
          <Row icon={Clock} label="Valid Until" value={fmt(visitor.validUntil)} highlight={new Date() > new Date(visitor.validUntil)} />
          {visitor.entryTime && <Row icon={CheckCircle} label="Entry Time" value={fmt(visitor.entryTime)} />}
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-400">
          Scan verified by Panchayat Security System
        </p>
      </div>
    </div>
  )
}

const Row = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
      <Icon size={12} />{label}
    </span>
    <span className={`text-xs font-semibold ${highlight ? 'text-rose-600' : 'text-zinc-800'}`}>{value}</span>
  </div>
)
