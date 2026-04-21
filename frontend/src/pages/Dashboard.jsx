import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  FiUsers, FiAlertCircle, FiDollarSign, FiHome, FiCpu, FiZap,
  FiTrendingUp, FiCheckCircle, FiBell, FiMessageSquare,
  FiArrowRight, FiMic, FiFileText, FiMapPin, FiActivity,
  FiArrowUpRight, FiClock, FiImage, FiChevronRight
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import TowerSection from '../components/dashboard/TowerSection'
import FlatCard from '../components/dashboard/FlatCard'
import TowerDetailModal from '../components/dashboard/TowerDetailModal'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1462899006636-339e08d1844e?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=80',
]

const TOWER_IMAGES = [
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1613545325268-9265e1609167?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
]

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
  return text.split('\n').filter((l) => l.trim()).map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((p, j) => (j % 2 === 1 ? <strong key={j} className="font-semibold text-slate-900">{p}</strong> : p))
    const isNumbered = /^\d+\./.test(line.trim())
    const isBullet = /^[-•]/.test(line.trim())
    if (isNumbered || isBullet) {
      return (
        <div key={i} className="mt-2 flex gap-2">
          <span className="mt-0.5 flex-shrink-0 font-bold text-emerald-500">{isNumbered ? `${line.match(/^\d+/)?.[0]}.` : '•'}</span>
          <p className="text-sm leading-relaxed text-slate-600">{rendered}</p>
        </div>
      )
    }
    return <p key={i} className={`text-sm leading-relaxed text-slate-600 ${i > 0 ? 'mt-1.5' : ''}`}>{rendered}</p>
  })
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
    indigo: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', trend: 'text-emerald-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', trend: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100', trend: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', ring: 'ring-rose-100', trend: 'text-rose-600' },
  }
  const c = colors[color] || colors.indigo

  return (
    <div className="card group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div className={`h-10 w-10 ${c.bg} rounded-xl ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`${c.icon} text-lg`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${c.trend}`}>
            <FiArrowUpRight size={12} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

const ChartCard = ({ title, icon: Icon, children, empty }) => (
  <div className="card">
    <div className="mb-5 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
        <Icon className="text-sm text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
    {empty ? (
      <div className="flex h-44 flex-col items-center justify-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
          <FiActivity className="text-lg text-slate-300" />
        </div>
        <p className="text-xs text-slate-400">No data yet</p>
      </div>
    ) : (
      <div className="h-44">{children}</div>
    )}
  </div>
)

function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [towerFilter, setTowerFilter] = useState('All')
  const [floorFilter, setFloorFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [towerDetail, setTowerDetail] = useState(null)
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) return
    Promise.all([
      api.get(`/complaints/stats/${societyId}`),
      api.get(`/payments/stats/${societyId}`),
      api.get(`/residents/society/${societyId}`),
      api.get(`/flats/society/${societyId}`),
      api.get(`/complaints/society/${societyId}`),
      api.get(`/payments/society/${societyId}`),
      api.get(`/societies/${societyId}`),
    ])
      .then(([cStats, pStats, residentsRes, flatsRes, complaintsRes, paymentsRes, societyRes]) => {
        setStats({
          complaints: cStats.data.byCategory || [],
          complaintStatus: cStats.data.byStatus || [],
          payments: pStats.data.stats || [],
          residents: residentsRes.data.residents?.length || 0,
          flats: flatsRes.data.flats?.length || 0,
          residentsList: residentsRes.data.residents || [],
          flatsList: flatsRes.data.flats || [],
          complaintsList: complaintsRes.data.complaints || [],
          paymentsList: paymentsRes.data.payments || [],
          society: societyRes.data.society || null,
        })
      })
      .catch(() => {})
  }, [societyId])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 7500)
    return () => clearInterval(timer)
  }, [])

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
          image: TOWER_IMAGES[i % TOWER_IMAGES.length],
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
      toast.error('AI service unavailable')
    } finally {
      setLoadingAI(false)
    }
  }

  if (!stats || !analytics) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-shimmer h-60 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="animate-shimmer h-64 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const totalComplaints = stats.complaints.reduce((sum, complaint) => sum + complaint.count, 0)
  const paid = stats.payments.find((payment) => payment._id === 'Paid')
  const pending = stats.payments.find((payment) => payment._id === 'Pending')
  const overdue = stats.payments.find((payment) => payment._id === 'Overdue')

  const societyName = stats.society?.name || 'Sunrise Heights'
  const societyLocation = stats.society?.city ? `${stats.society.city}${stats.society?.address ? `, ${stats.society.address.split(',')[0]}` : ''}` : 'Noida, Sector 45'
  const amenityTag = stats.society?.amenities?.length ? stats.society.amenities.slice(0, 3).join(' • ') : 'Gym • Pool • Parking'
  const facilitiesCount = stats.society?.amenities?.length || 0

  const chartColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#065f46', '#047857']
  const statusColors = { Open: '#f59e0b', 'In Progress': '#3b82f6', Resolved: '#10b981', Closed: '#94a3b8' }
  const payColors = { Paid: '#10b981', Overdue: '#ef4444', Pending: '#f59e0b', Waived: '#8b5cf6' }

  const chartOpts = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f8fafc' }, border: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
            <FiClock size={12} />
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          All systems operational
        </div>
      </div>

      <section className="group relative overflow-hidden rounded-3xl border border-zinc-200/60 shadow-xl shadow-zinc-200/50">
        <img
          src={HERO_IMAGES[heroIndex]}
          alt="Society cover"
          className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-900/50 to-zinc-900/20" />

        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <button
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-white/30"
            onClick={() => setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)}
          >
            Change View
          </button>
        </div>

        <div className="absolute inset-x-4 bottom-4 z-10 md:inset-x-6 md:bottom-6">
          <div className="max-w-2xl rounded-2xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-lg md:p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Society Overview</p>
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{societyName}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-100">
              <FiMapPin size={13} />
              {societyLocation}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {analytics.towers.length || 1} Towers
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {stats.flats} Flats
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {amenityTag}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FiHome} label="Total Flats" value={stats.flats} sub="Registered units" color="indigo" />
        <StatCard icon={FiUsers} label="Residents" value={stats.residents} sub="Active members" color="indigo" />
        <StatCard icon={FiAlertCircle} label="Complaints" value={totalComplaints} sub="Total raised" color="amber" />
        <StatCard
          icon={FiDollarSign}
          label="Collected"
          value={`₹${(paid?.total || 0).toLocaleString('en-IN')}`}
          sub={`${(pending?.count || 0) + (overdue?.count || 0)} pending`}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Society Snapshot</h3>
              <p className="text-sm text-zinc-500">Live occupancy and monthly collection performance</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {analytics.collectionPct}% collection
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Flats</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{stats.flats}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Occupied</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{analytics.occupiedCount}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vacant</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{analytics.vacantCount}</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-500">
              <span>Monthly collection</span>
              <span>{analytics.collectionPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${analytics.collectionPct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-50 px-2 py-1.5 text-zinc-600">Paid: ₹{analytics.paidTotal.toLocaleString('en-IN')}</div>
              <div className="rounded-lg bg-zinc-50 px-2 py-1.5 text-zinc-600">Pending: ₹{analytics.pendingTotal.toLocaleString('en-IN')}</div>
              <div className="rounded-lg bg-zinc-50 px-2 py-1.5 text-zinc-600">Overdue: ₹{analytics.overdueTotal.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-emerald-100/70" />
          <div className="mb-4 flex items-center gap-2">
            <FiImage className="text-emerald-500" size={14} />
            <h3 className="text-sm font-semibold text-zinc-900">Mini Site Map</h3>
          </div>
          <div className="space-y-2.5">
            {analytics.towers.length === 0 && (
              <p className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-400">Add tower flats like A-101 to see the visual map.</p>
            )}
            {analytics.towers.map((tower) => (
              <button
                key={tower.name}
                onClick={() => {
                  setTowerFilter(tower.name)
                  setFloorFilter('All')
                }}
                className="group flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2.5 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{tower.name}</p>
                  <p className="text-xs text-zinc-500">{tower.flats} flats • {tower.occupancy}% occupied</p>
                </div>
                <FiChevronRight className="text-zinc-400 transition group-hover:text-emerald-600" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <TowerSection
        towers={analytics.towers}
        selectedTower={towerFilter === 'All' ? '' : towerFilter}
        onTowerDetail={(tower) => setTowerDetail(tower)}
      />

      {towerDetail && (
        <TowerDetailModal
          tower={towerDetail}
          flats={analytics.flatCards}
          onClose={() => setTowerDetail(null)}
        />
      )}

      <section className="card space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Flats Explorer</h3>
            <p className="text-sm text-zinc-500">Explore every unit with occupancy, complaint, and payment signals</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input w-auto text-sm"
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
            <select className="input w-auto text-sm" value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)}>
              <option value="All">All Floors</option>
              {analytics.availableFloors.map((floor) => (
                <option key={floor} value={String(floor)}>Floor {floor}</option>
              ))}
            </select>
            <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard title="Complaints by Category" icon={FiAlertCircle} empty={!stats?.complaints?.length}>
          <Doughnut
            data={{
              labels: (stats?.complaints || []).map((complaint) => complaint._id),
              datasets: [{ data: (stats?.complaints || []).map((complaint) => complaint.count), backgroundColor: chartColors, borderWidth: 0, hoverOffset: 6 }],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 8, font: { size: 11 }, padding: 12 } } },
              cutout: '65%',
            }}
          />
        </ChartCard>

        <ChartCard title="Complaints by Status" icon={FiTrendingUp} empty={!stats?.complaintStatus?.length}>
          <Bar
            data={{
              labels: (stats?.complaintStatus || []).map((complaint) => complaint._id),
              datasets: [{
                data: (stats?.complaintStatus || []).map((complaint) => complaint.count),
                backgroundColor: (stats?.complaintStatus || []).map((complaint) => statusColors[complaint._id] || '#94a3b8'),
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 40,
              }],
            }}
            options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, ticks: { ...chartOpts.scales.y.ticks, stepSize: 1 } } } }}
          />
        </ChartCard>

        <ChartCard title="Payment Overview" icon={FiDollarSign} empty={!stats?.payments?.length}>
          <Bar
            data={{
              labels: (stats?.payments || []).map((payment) => payment._id),
              datasets: [{
                data: (stats?.payments || []).map((payment) => payment.total),
                backgroundColor: (stats?.payments || []).map((payment) => payColors[payment._id] || '#94a3b8'),
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 40,
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

      <div className="card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-200">
              <FiCpu className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Insights</h3>
              <p className="text-xs text-slate-400">Powered by Groq LLaMA 3.3 70B</p>
            </div>
          </div>
          <button onClick={getAISummary} disabled={loadingAI || !societyId} className="btn-primary text-sm">
            {loadingAI ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analyzing...
              </>
            ) : (
              <>
                <FiZap size={13} />
                Generate Insights
              </>
            )}
          </button>
        </div>
        {aiSummary ? (
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <FiCheckCircle className="flex-shrink-0 text-emerald-500" size={14} />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Analysis Complete</span>
            </div>
            <div className="space-y-0.5">{renderMarkdown(aiSummary)}</div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-100 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <FiCpu className="text-emerald-300" size={20} />
            </div>
            <p className="text-sm font-semibold text-slate-500">No insights generated yet</p>
            <p className="mt-1 text-xs text-slate-400">Click Generate Insights to analyze complaints and activity.</p>
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
    { icon: FiAlertCircle, label: 'Raise Complaint', sub: 'Report an issue', path: '/complaints', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100' },
    { icon: FiMic, label: 'Voice Ticket', sub: 'Speak your complaint', path: '/complaints', color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-100' },
    { icon: FiDollarSign, label: 'My Payments', sub: 'View and pay dues', path: '/payments', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { icon: FiMessageSquare, label: 'AI Assistant', sub: 'Ask anything', path: '/chatbot', color: 'text-teal-600', bg: 'bg-teal-50', ring: 'ring-teal-100' },
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
    <div className="space-y-5 animate-fade-in">
      <div className="grain relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-emerald-950 p-6 text-white">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
            <FiClock size={11} />
            {today}
          </p>
          <h2 className="text-xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
          {society && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-300">
              <FiMapPin size={12} />
              {society.name}, {society.city}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/20 px-3.5 py-2 text-sm backdrop-blur-sm">
              <span className="text-xs text-zinc-300">Maintenance</span>
              <p className="font-bold">₹{society?.maintenanceAmount?.toLocaleString('en-IN') || '--'}/mo</p>
            </div>
            {pendingPayment && (
              <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/80 px-3.5 py-2 text-sm backdrop-blur-sm">
                <FiAlertCircle size={13} />
                <div>
                  <p className="text-xs text-red-200">Payment Due</p>
                  <p className="font-bold">₹{pendingPayment.amount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'My Complaints', value: myComplaints.length, sub: `${openComplaints.length} active`, icon: FiAlertCircle, color: 'amber' },
          { label: 'Pending Payment', value: pendingPayment ? `₹${pendingPayment.amount?.toLocaleString('en-IN')}` : 'Clear', sub: pendingPayment ? pendingPayment.month : 'All paid', icon: FiDollarSign, color: pendingPayment ? 'rose' : 'emerald' },
          { label: 'Notifications', value: unreadCount, sub: unreadCount ? 'Unread' : 'All read', icon: FiBell, color: 'indigo' },
          { label: 'Facilities', value: facilitiesCount, sub: 'Available', icon: FiHome, color: 'indigo' },
        ].map(({ label, value, sub, icon, color }) => (
          <StatCard key={label} icon={icon} label={label} value={value} sub={sub} color={color} />
        ))}
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map(({ icon: Icon, label, sub, path, color, bg, ring }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="card group p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
            >
              <div className={`mb-3 h-10 w-10 ${bg} rounded-xl ring-1 ${ring} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                <Icon className={`${color} text-lg`} />
              </div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">My Complaints</h3>
            <button onClick={() => navigate('/complaints')} className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700">
              View all <FiArrowRight size={11} />
            </button>
          </div>
          {myComplaints.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <FiFileText className="text-lg text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No complaints raised yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myComplaints.slice(0, 4).map((complaint) => (
                <div key={complaint._id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3 transition-colors hover:bg-emerald-50/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{complaint.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{complaint.category} • {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`${statusStyle[complaint.status]} ml-3 flex-shrink-0`}>{complaint.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Recent Notifications</h3>
            <button onClick={() => navigate('/notifications')} className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700">
              View all <FiArrowRight size={11} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <FiBell className="text-lg text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification._id} className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${!notification.isRead ? 'border border-emerald-100/80 bg-emerald-50' : 'bg-zinc-50'}`}>
                  <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${!notification.isRead ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                    <FiBell className={`text-xs ${!notification.isRead ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{notification.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{notification.message}</p>
                  </div>
                  {!notification.isRead && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {society?.amenities?.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <FiActivity className="text-slate-400" size={15} />
            <h3 className="text-sm font-semibold text-slate-900">Society Amenities</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {society.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
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
