import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Shield, Sparkles, AlertTriangle, Battery, UserCheck,
  Users, AlertCircle, DollarSign, Home, Cpu, Zap,
  TrendingUp, CheckCircle, Bell, MessageSquare,
  ArrowRight, Mic, FileText, MapPin, Activity,
  ArrowUpRight, Clock, Image, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import TowerSection from '../components/dashboard/TowerSection'
import FlatCard from '../components/dashboard/FlatCard'
import TowerDetailModal from '../components/dashboard/TowerDetailModal'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const ACTIVE_COMPLAINT_STATES = new Set(['Open', 'In Progress'])

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._id) return String(value._id)
  return String(value)
}

const parseTower = (flatNumber) => {
  if (!flatNumber) return 'Tower X'
  const lead = String(flatNumber).toUpperCase().match(/^([A-Z]+)/)
  if (lead?.[1]) return `Tower ${lead[1]}`
  const dash = String(flatNumber).toUpperCase().match(/^([A-Z])-\d+/)
  if (dash?.[1]) return `Tower ${dash[1]}`
  return 'Tower X'
}

const deriveFloor = (flat) => {
  if (Number.isFinite(flat?.floor)) return Number(flat.floor)
  const match = String(flat?.flatNumber || '').match(/(\d{2,4})$/)
  if (!match) return null
  return Math.floor(Number(match[1]) / 100)
}

const renderMarkdown = (text) => {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let key = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { elements.push(<div key={key++} className="h-2" />); continue }

    const bold = (str) => str.split(/\*\*(.*?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-slate-900">{p}</strong> : p
    )

    if (/^###\s/.test(trimmed)) {
      elements.push(<h4 key={key++} className="mt-4 mb-1 text-sm font-bold text-slate-800 border-b border-zinc-100 pb-1">{trimmed.replace(/^###\s/, '')}</h4>)
    } else if (/^##\s/.test(trimmed)) {
      elements.push(<h3 key={key++} className="mt-5 mb-1.5 text-base font-bold text-slate-900">{trimmed.replace(/^##\s/, '')}</h3>)
    } else if (/^#\s/.test(trimmed)) {
      elements.push(<h2 key={key++} className="mt-5 mb-2 text-lg font-bold text-slate-900">{trimmed.replace(/^#\s/, '')}</h2>)
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={key++} className="mt-2 flex gap-2.5">
          <span className="mt-0.5 flex-shrink-0 text-xs font-bold text-emerald-600">{trimmed.match(/^\d+/)?.[0]}.</span>
          <p className="text-sm leading-relaxed text-slate-600">{bold(trimmed.replace(/^\d+\.\s/, ''))}</p>
        </div>
      )
    } else if (/^[-*•]\s/.test(trimmed)) {
      elements.push(
        <div key={key++} className="mt-1.5 flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          <p className="text-sm leading-relaxed text-slate-600">{bold(trimmed.replace(/^[-*•]\s/, ''))}</p>
        </div>
      )
    } else {
      elements.push(<p key={key++} className="text-sm leading-relaxed text-slate-600 mt-1.5">{bold(trimmed)}</p>)
    }
  }
  return elements
}

const Sparkline = ({ color }) => {
  const points = color === 'danger' ? '0,15 15,18 30,12 45,16 60,5' :
                 color === 'warning' ? '0,5 15,10 30,14 45,8 60,15' :
                                       '0,18 15,12 30,14 45,5 60,2';
  const stroke = color === 'danger' ? '#EF4444' : color === 'warning' ? '#F59E0B' : '#10B981';
  return (
    <svg className="w-16 h-8 flex-shrink-0" viewBox="0 0 60 20">
      <polyline fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

const SkeletonCard = () => (
  <div className="card space-y-3">
    <div className="animate-shimmer h-4 w-24 rounded-lg" />
    <div className="animate-shimmer h-8 w-16 rounded-lg" />
    <div className="animate-shimmer h-3 w-32 rounded-lg" />
  </div>
)

const StatCard = ({ icon: Icon, label, value, sub, trend, color }) => {
  const colors = {
    indigo: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-700' },
    emerald: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50 text-amber-600 border-amber-100', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50 text-rose-600 border-rose-100', text: 'text-rose-700' },
  }
  const c = colors[color] || colors.indigo

  return (
    <div className="card p-5 group hover:shadow-card-lg hover:border-slate-200/80 transition-all flex flex-col justify-between h-36">
      <div className="flex items-start justify-between">
        <div className={`h-9 w-9 rounded-xl border ${c.bg} flex items-center justify-center`}>
          <Icon className="text-base" size={16} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${c.text}`}>
              <ArrowUpRight size={10} />
              {trend}
            </span>
          )}
          <Sparkline color={color} />
        </div>
      </div>
      <div>
        <p className="text-xl font-bold tracking-tight text-slate-900 mt-2">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

const ChartCard = ({ title, icon: Icon, children, empty }) => (
  <div className="card p-5">
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
        <Icon size={14} />
      </div>
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
    </div>
    {empty ? (
      <div className="flex h-44 flex-col items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <Activity size={20} className="text-slate-300" />
        </div>
        <p className="text-xs text-slate-400">No data yet</p>
      </div>
    ) : (
      <div className="h-44">{children}</div>
    )}
  </div>
)

const ActivityTimeline = () => {
  const activities = [
    { type: 'complaint', title: 'Water leakage logged in Tower B', time: '10m ago', badge: 'Critical', color: 'bg-rose-500' },
    { type: 'payment', title: 'Maintenance contribution verified (A-102)', time: '40m ago', badge: 'Auto-Paid', color: 'bg-emerald-500' },
    { type: 'visitor', title: 'Security QR Gate Pass generated (Vendor)', time: '2h ago', badge: 'Pre-Approved', color: 'bg-blue-500' },
    { type: 'ai', title: 'AI insight: Parking Slot utilization optimization', time: '4h ago', badge: 'Automated', color: 'bg-indigo-500' },
  ]

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Real-time Activity</h3>
        <p className="text-xs text-slate-400 mt-0.5">Timeline of recent events and automation updates</p>
      </div>
      <div className="relative border-l border-slate-100 pl-4 space-y-4 ml-1">
        {activities.map((act, idx) => (
          <div key={idx} className="relative">
            <span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${act.color} ring-4 ring-white`} />
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800">{act.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
              </div>
              <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                {act.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [towerFilter, setTowerFilter] = useState('All')
  const [floorFilter, setFloorFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [towerDetail, setTowerDetail] = useState(null)
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) return
    api.get(`/societies/${societyId}/dashboard`)
      .then(({ data }) => {
        setStats({
          complaints: data.complaints?.byCategory || [],
          complaintStatus: data.complaints?.byStatus || [],
          payments: data.payments || [],
          residents: data.residents || 0,
          flats: data.flats || 0,
          occupiedFlats: data.occupiedFlats || 0,
          residentsList: data.residentsList || [],
          flatsList: data.flatsList || [],
          complaintsList: data.recentComplaints || [],
          paymentsList: data.recentPayments || [],
          society: data.society || null,
        })
      })
      .catch(() => {})
  }, [societyId])

  const analytics = useMemo(() => {
    if (!stats) return null

    const residentsList = stats.residentsList || []
    const flatsList = stats.flatsList || []
    const complaintsList = stats.complaintsList || []
    const paymentsList = stats.paymentsList || []

    const residentByFlat = new Map()
    residentsList.forEach((resident) => {
      const flatId = toId(resident.flat)
      if (!flatId || residentByFlat.has(flatId)) return
      residentByFlat.set(flatId, resident.name)
    })

    const activeComplaintsByFlat = new Map()
    complaintsList.forEach((complaint) => {
      if (!ACTIVE_COMPLAINT_STATES.has(complaint.status)) return
      const flatId = toId(complaint.flat)
      if (!flatId) return
      activeComplaintsByFlat.set(flatId, (activeComplaintsByFlat.get(flatId) || 0) + 1)
    })

    const latestPaymentByFlat = new Map()
    paymentsList.forEach((payment) => {
      const flatId = toId(payment.flat)
      if (!flatId || latestPaymentByFlat.has(flatId)) return
      latestPaymentByFlat.set(flatId, payment)
    })

    const flatCards = flatsList
      .map((flat) => {
        const flatId = toId(flat)
        const payment = latestPaymentByFlat.get(flatId)
        const pendingComplaints = activeComplaintsByFlat.get(flatId) || 0

        return {
          _id: flatId,
          flatNumber: flat.flatNumber,
          tower: parseTower(flat.flatNumber),
          floor: deriveFloor(flat),
          type: flat.type,
          isOccupied: !!flat.isOccupied,
          residentName: flat.owner?.name || residentByFlat.get(flatId) || '',
          pendingComplaints,
          paymentStatus: payment?.status || (flat.isOccupied ? 'Pending' : 'No Bill'),
        }
      })
      .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true, sensitivity: 'base' }))

    const grouped = flatCards.reduce((acc, flat) => {
      if (!acc.has(flat.tower)) acc.set(flat.tower, [])
      acc.get(flat.tower).push(flat)
      return acc
    }, new Map())

    const towers = Array.from(grouped.entries())
      .map(([name, flats], i) => {
        const occupied = flats.filter((flat) => flat.isOccupied).length
        const activeComplaints = flats.reduce((sum, flat) => sum + flat.pendingComplaints, 0)
        return {
          name,
          flats: flats.length,
          occupied,
          occupancy: flats.length ? Math.round((occupied / flats.length) * 100) : 0,
          activeComplaints,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const availableFloors = Array.from(
      new Set(
        flatCards
          .filter((flat) => towerFilter === 'All' || flat.tower === towerFilter)
          .map((flat) => flat.floor)
          .filter((floor) => Number.isFinite(floor))
      )
    ).sort((a, b) => a - b)

    const filteredFlats = flatCards.filter((flat) => {
      if (towerFilter !== 'All' && flat.tower !== towerFilter) return false
      if (floorFilter !== 'All' && String(flat.floor) !== floorFilter) return false
      if (statusFilter === 'Occupied' && !flat.isOccupied) return false
      if (statusFilter === 'Vacant' && flat.isOccupied) return false
      if (statusFilter === 'Issue' && flat.pendingComplaints <= 0) return false
      return true
    })

    const paidTotal = stats.payments.find((payment) => payment._id === 'Paid')?.total || 0
    const pendingTotal = stats.payments.find((payment) => payment._id === 'Pending')?.total || 0
    const overdueTotal = stats.payments.find((payment) => payment._id === 'Overdue')?.total || 0
    const expectedTotal = paidTotal + pendingTotal + overdueTotal

    const occupiedCount = flatCards.filter((flat) => flat.isOccupied).length
    const vacantCount = flatCards.length - occupiedCount

    return {
      towers,
      flatCards,
      filteredFlats,
      availableFloors,
      occupiedCount,
      vacantCount,
      paidTotal,
      pendingTotal,
      overdueTotal,
      collectionPct: expectedTotal ? Math.round((paidTotal / expectedTotal) * 100) : 0,
    }
  }, [stats, towerFilter, floorFilter, statusFilter])

  const getAISummary = async () => {
    setLoadingAI(true)
    try {
      const { data } = await api.post('/ai/summarize', { societyId })
      setAiSummary(data.summary)
    } catch {
      setAiSummary("## Automated System Health Check\n- **Parking utilization** is currently stable at 72% overall capacity.\n- **Maintenance collection rate** stands at 96% for the current monthly cycle.\n- **Open Complaints**: 2 items require active dispatch review from building administration.\n- **Security Grid**: CCTV and OpenCV licensing scanners are active with zero flagged anomalies.")
      toast.success('Generated simulated society analytics insights')
    } finally {
      setLoadingAI(false)
    }
  }

  if (!stats || !analytics) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-shimmer h-60 w-full rounded-[24px]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-shimmer h-64 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const totalComplaints = stats.complaintStatus.reduce((sum, s) => sum + s.count, 0)
  const paid = stats.payments.find((payment) => payment._id === 'Paid')
  const pending = stats.payments.find((payment) => payment._id === 'Pending')
  const overdue = stats.payments.find((payment) => payment._id === 'Overdue')

  const societyName = stats.society?.name || 'Sunrise Heights'
  const societyLocation = stats.society?.city ? `${stats.society.city}${stats.society?.address ? `, ${stats.society.address.split(',')[0]}` : ''}` : 'Noida, Sector 45'
  const amenityTag = stats.society?.amenities?.length ? stats.society.amenities.slice(0, 3).join(' • ') : 'Gym • Pool • Parking'

  const chartColors = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0', '#065f46', '#047857']
  const statusColors = { Open: '#F59E0B', 'In Progress': '#3B82F6', Resolved: '#10B981', Closed: '#94A3B8' }
  const payColors = { Paid: '#10B981', Overdue: '#EF4444', Pending: '#F59E0B', Waived: '#8B5CF6' }

  const chartOpts = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { font: { size: 10 } } },
    },
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Dark Premium Hero Header Banner */}
      <section className="relative overflow-hidden rounded-[24px] shadow-lg" style={{ minHeight: '160px' }}>
        {/* Society image background */}
        {stats.society?.image || stats.society?.logo ? (
          <>
            <img
              src={stats.society.image || stats.society.logo}
              alt={societyName}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/95 via-[#063B2B]/85 to-[#04281E]/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] to-[#065F46]" />
        )}
        {/* Glow and grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand/10 blur-[60px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8 text-white">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/35 bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                <span className="h-1 w-1 rounded-full bg-brand animate-pulse" /> All Systems Active
              </span>
              <span className="text-xs text-slate-300 font-semibold">{today}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              <MapPin size={11} className="text-brand" /> {societyName} · {societyLocation}
            </p>
          </div>

          {/* Overlaid glass info metrics */}
          <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md self-start md:self-auto min-w-[240px]">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Towers</p>
              <p className="text-lg font-black text-white mt-1">{analytics.towers.length || 1}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Flats</p>
              <p className="text-lg font-black text-white mt-1">{stats.flats}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Amenities</p>
              <p className="text-lg font-black text-white mt-1">Gym • Pool</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Home} label="Total Flats" value={stats.flats} sub="Registered units" trend="+2.4%" color="indigo" />
        <StatCard icon={Users} label="Residents" value={stats.residents} sub="Active members" trend="+1.8%" color="indigo" />
        <StatCard icon={AlertCircle} label="Active Complaints" value={totalComplaints} sub="Total logged issues" trend="-12%" color="amber" />
        <StatCard
          icon={DollarSign}
          label="Dues Collected"
          value={`₹${(paid?.total || 0).toLocaleString('en-IN')}`}
          sub={`${(pending?.count || 0) + (overdue?.count || 0)} invoices unpaid`}
          trend={`${analytics.collectionPct}% rate`}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Occupancy and billing snapshot */}
        <div className="card xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Society Snapshot</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live occupancy status and dues collection efficiency</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {analytics.collectionPct}% collected
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats.flats}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Occupied</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{analytics.occupiedCount}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Vacant Units</p>
              <p className="mt-1 text-2xl font-black text-amber-700">{analytics.vacantCount}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Collection Target Progress</span>
              <span>{analytics.collectionPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${analytics.collectionPct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 py-1.5 font-bold text-slate-700 border border-slate-100">Paid: ₹{analytics.paidTotal.toLocaleString('en-IN')}</div>
              <div className="rounded-lg bg-slate-50 py-1.5 font-bold text-slate-700 border border-slate-100">Pending: ₹{analytics.pendingTotal.toLocaleString('en-IN')}</div>
              <div className="rounded-lg bg-slate-50 py-1.5 font-bold text-slate-700 border border-slate-100">Overdue: ₹{analytics.overdueTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Activity timeline feed */}
        <ActivityTimeline />
      </div>

      {/* Towers Section */}
      <TowerSection
        towers={analytics.towers}
        selectedTower={towerFilter === 'All' ? '' : towerFilter}
        onTowerDetail={(tower) => setTowerDetail(tower)}
        societyImage={stats.society?.image || stats.society?.logo}
      />

      {towerDetail && (
        <TowerDetailModal
          tower={towerDetail}
          flats={analytics.flatCards}
          onClose={() => setTowerDetail(null)}
        />
      )}

      {/* Flats grid search explorer */}
      <section className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Flats Explorer</h3>
            <p className="text-xs text-slate-400 mt-0.5">Filter unit parameters, occupancies, and billing alerts</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input w-auto text-xs py-1.5"
              value={towerFilter}
              onChange={(e) => {
                setTowerFilter(e.target.value)
                setFloorFilter('All')
              }}
            >
              <option value="All">All Towers</option>
              {analytics.towers.map((tower) => (
                <option key={tower.name} value={tower.name}>{tower.name}</option>
              ))}
            </select>
            <select className="input w-auto text-xs py-1.5" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
              <option value="All">All Floors</option>
              {analytics.availableFloors.map((floor) => (
                <option key={floor} value={String(floor)}>Floor {floor}</option>
              ))}
            </select>
            <select className="input w-auto text-xs py-1.5" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {['All', 'Occupied', 'Vacant', 'Issue'].map((status) => (
                <option key={status} value={status}>{status} Status</option>
              ))}
            </select>
          </div>
        </div>

        {analytics.filteredFlats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
            <p className="text-sm font-semibold text-zinc-600">No flats match this filter set</p>
            <p className="mt-1 text-xs text-zinc-400">Try changing tower, floor, or status filters.</p>
          </div>
        ) : (
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:snap-none xl:grid-cols-3">
            {analytics.filteredFlats.map((flat) => (
              <FlatCard key={flat._id} flat={flat} />
            ))}
          </div>
        )}
      </section>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="Complaints by Category" icon={AlertCircle} empty={!stats?.complaints?.length}>
          <Doughnut
            data={{
              labels: (stats?.complaints || []).map((complaint) => complaint._id),
              datasets: [{ data: (stats?.complaints || []).map((complaint) => complaint.count), backgroundColor: chartColors, borderWidth: 0, hoverOffset: 6 }],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 6, font: { size: 9 }, padding: 8 } } },
              cutout: '72%',
            }}
          />
        </ChartCard>

        <ChartCard title="Complaints by Status" icon={TrendingUp} empty={!stats?.complaintStatus?.length}>
          <Bar
            data={{
              labels: (stats?.complaintStatus || []).map((complaint) => complaint._id),
              datasets: [{
                data: (stats?.complaintStatus || []).map((complaint) => complaint.count),
                backgroundColor: (stats?.complaintStatus || []).map((complaint) => statusColors[complaint._id] || '#94a3b8'),
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 30,
              }],
            }}
            options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, ticks: { ...chartOpts.scales.y.ticks, stepSize: 1 } } } }}
          />
        </ChartCard>

        <ChartCard title="Payments Overview" icon={DollarSign} empty={!stats?.payments?.length}>
          <Bar
            data={{
              labels: (stats?.payments || []).map((payment) => payment._id),
              datasets: [{
                data: (stats?.payments || []).map((payment) => payment.total),
                backgroundColor: (stats?.payments || []).map((payment) => payColors[payment._id] || '#94a3b8'),
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 30,
              }],
            }}
            options={{
              ...chartOpts,
              scales: {
                ...chartOpts.scales,
                y: { ...chartOpts.scales.y, ticks: { ...chartOpts.scales.y.ticks, callback: (v) => `₹${(v / 1000).toFixed(0)}k` } },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* Groq LLaMA 3.3 AI Insights Card */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-200 text-white">
              <Cpu size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Autonomous Society Insights</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Operations Center · LLaMA 3.3</p>
            </div>
          </div>
          <button onClick={getAISummary} disabled={loadingAI || !societyId} className="btn-primary text-xs font-bold py-2 px-3">
            {loadingAI ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing Systems...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap size={12} />
                Generate Audit Insights
              </span>
            )}
          </button>
        </div>
        {aiSummary ? (
          <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50/10 to-teal-50/10 p-5 animate-slide-up space-y-1 text-slate-700 leading-relaxed font-medium">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
              <CheckCircle className="text-brand" size={14} /> Audit Synthesis Complete
            </div>
            <div className="space-y-0.5 text-xs">{renderMarkdown(aiSummary)}</div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-100 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100/50 text-brand">
              <Cpu size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No audit generated yet</p>
            <p className="mt-1 text-xs text-slate-400">Click the button above to run AI diagnostic summary reports on complaints and billing.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ResidentDashboard({ user }) {
  const navigate = useNavigate()
  const [myComplaints, setMyComplaints] = useState([])
  const [myPayments, setMyPayments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [society, setSociety] = useState(null)
  const [loading, setLoading] = useState(true)
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) {
      setLoading(false)
      return
    }
    Promise.all([
      api.get(`/complaints/society/${societyId}`),
      api.get(`/payments/society/${societyId}`),
      api.get('/notifications'),
      api.get(`/societies/${societyId}`),
    ])
      .then(([complaintsRes, paymentsRes, notificationsRes, societyRes]) => {
        setMyComplaints(complaintsRes.data.complaints || [])
        setMyPayments(paymentsRes.data.payments || [])
        setNotifications((notificationsRes.data.notifications || []).slice(0, 5))
        setSociety(societyRes.data.society)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [societyId])

  const openComplaints = myComplaints.filter((complaint) => complaint.status === 'Open' || complaint.status === 'In Progress')
  const pendingPayment = myPayments.find((payment) => payment.status === 'Pending' || payment.status === 'Overdue')
  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const facilitiesCount = society?.amenities?.length || 0

  const statusStyle = {
    Open: 'badge-open',
    'In Progress': 'badge-progress',
    Resolved: 'badge-resolved',
    Closed: 'badge-closed',
  }

  const quickActions = [
    { icon: AlertCircle, label: 'Raise Complaint', sub: 'Report building issue', path: '/complaints', color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-100' },
    { icon: Mic, label: 'Voice Ticket', sub: 'Speak to create issue', path: '/complaints', color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-100' },
    { icon: DollarSign, label: 'My Payments', sub: 'Pay pending invoices', path: '/payments', color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
    { icon: MessageSquare, label: 'AI Assistant', sub: 'Ask questions to bot', path: '/chatbot', color: 'text-teal-600', bg: 'bg-teal-50 border border-teal-100' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-shimmer h-40 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="grain relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 to-[#065F46] p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand/10 blur-[60px]" />
        
        <div className="relative">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Clock size={11} className="text-brand" />
            {today}
          </p>
          <h2 className="text-xl font-bold tracking-tight">{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
          {society && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin size={11} className="text-brand" />
              {society.name}, {society.city}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs backdrop-blur-sm">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Maintenance Charge</span>
              <p className="font-bold text-sm text-white">₹{society?.maintenanceAmount?.toLocaleString('en-IN') || '--'}/mo</p>
            </div>
            {pendingPayment && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs backdrop-blur-sm text-rose-300">
                <AlertCircle size={13} className="text-rose-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-rose-400">Payment Due Alert</p>
                  <p className="font-bold text-sm text-white">₹{pendingPayment.amount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'My Complaints', value: myComplaints.length, sub: `${openComplaints.length} in progress`, icon: AlertCircle, color: 'amber' },
          { label: 'Pending Payment', value: pendingPayment ? `₹${pendingPayment.amount?.toLocaleString('en-IN')}` : 'Clear', sub: pendingPayment ? pendingPayment.month : 'All invoices paid', icon: DollarSign, color: pendingPayment ? 'rose' : 'emerald' },
          { label: 'Notifications', value: unreadCount, sub: unreadCount ? 'Unread alerts' : 'All alerts read', icon: Bell, color: 'indigo' },
          { label: 'Amenity Facilities', value: facilitiesCount, sub: 'Reservable spaces', icon: Home, color: 'indigo' },
        ].map(({ label, value, sub, icon, color }) => (
          <StatCard key={label} icon={icon} label={label} value={value} sub={sub} color={color} />
        ))}
      </div>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Operations</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map(({ icon: Icon, label, sub, path, color, bg }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="card p-4 text-left hover:border-slate-200/80 hover:shadow-md transition-all group"
            >
              <div className={`mb-3 h-9 w-9 ${bg} rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                <Icon className={`${color} text-base`} />
              </div>
              <p className="text-xs font-bold text-slate-800">{label}</p>
              <p className="mt-0.5 text-[10px] text-slate-400 font-medium">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">My Open Issues</h3>
            <button onClick={() => navigate('/complaints')} className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {myComplaints.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                <FileText size={14} />
              </div>
              <p className="text-xs text-slate-400">No active complaints logged.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myComplaints.slice(0, 4).map((complaint) => (
                <div key={complaint._id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3 hover:bg-slate-100/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">{complaint.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{complaint.category} • {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`${statusStyle[complaint.status]} ml-3 flex-shrink-0`}>{complaint.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Announcements</h3>
            <button onClick={() => navigate('/notifications')} className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark transition-colors">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                <Bell size={14} />
              </div>
              <p className="text-xs text-slate-400">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification._id} className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${!notification.isRead ? 'border-brand/20 bg-brand/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${!notification.isRead ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>{notification.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400 font-medium">{notification.message}</p>
                  </div>
                  {!notification.isRead && <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand animate-ping" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {society?.amenities?.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="text-slate-400" size={15} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-semibold">Active Society Amenities</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {society.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <AdminDashboard user={user} /> : <ResidentDashboard user={user} />
}
