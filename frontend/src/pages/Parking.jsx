import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AppModal from '../components/ui/AppModal'
import toast from 'react-hot-toast'
import {
  Car, Bike, Zap, ParkingSquare, Plus, Search,
  RefreshCw, Trash2, Camera, ShieldAlert, ShieldCheck
} from 'lucide-react'

const slotStatusClass = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Occupied:  'bg-rose-50    text-rose-700    border-rose-200',
  Reserved:  'bg-amber-50   text-amber-700   border-amber-200',
  Visitor:   'bg-blue-50    text-blue-700    border-blue-200',
}
const slotTypeIcon = { Car: Car, Bike: Bike, EV: Zap }

// Add Slot Modal
function AddSlotModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ slotNumber: '', block: 'A', floor: 'B1', slotType: 'Car', isVisitorSlot: false })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/parking/slots', form)
      toast.success('Slot added!')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <AppModal open={open} onClose={onClose} title="Add Parking Slot">
      <form onSubmit={submit} className="space-y-4 text-xs font-semibold">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Slot Number</label>
            <input className="input" placeholder="P-01" required value={form.slotNumber}
              onChange={e => setForm({ ...form, slotNumber: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Block</label>
            <input className="input" placeholder="A" value={form.block}
              onChange={e => setForm({ ...form, block: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Floor</label>
            <input className="input" placeholder="B1" value={form.floor}
              onChange={e => setForm({ ...form, floor: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Type</label>
            <select className="input text-xs" value={form.slotType} onChange={e => setForm({ ...form, slotType: e.target.value })}>
              <option>Car</option><option>Bike</option><option>EV</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
          <input type="checkbox" className="h-4 w-4 rounded accent-emerald-600 text-brand focus:ring-brand"
            checked={form.isVisitorSlot} onChange={e => setForm({ ...form, isVisitorSlot: e.target.checked })} />
          Mark as Visitor Slot
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
          <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs" disabled={saving}>
            {saving ? 'Saving...' : 'Add Slot'}
          </button>
        </div>
      </form>
    </AppModal>
  )
}

// Add Vehicle Modal
function AddVehicleModal({ open, residents, onClose, onSaved }) {
  const [form, setForm] = useState({ ownerName: '', flatNumber: '', vehicleNumber: '', vehicleType: 'Car', brand: '', color: '', resident: '' })
  const [saving, setSaving] = useState(false)

  const pickResident = (id) => {
    const r = residents.find(r => r._id === id)
    if (r) setForm(f => ({ ...f, resident: id, ownerName: r.name, flatNumber: r.flat?.flatNumber || '' }))
  }

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/parking/vehicles', { ...form, vehicleNumber: form.vehicleNumber.toUpperCase() })
      toast.success('Vehicle registered!')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <AppModal open={open} onClose={onClose} title="Register Vehicle">
      <form onSubmit={submit} className="space-y-4 text-xs font-semibold">
        <div>
          <label className="input-label">Resident Owner</label>
          <select className="input text-xs" value={form.resident} onChange={e => pickResident(e.target.value)} required>
            <option value="">Select Resident</option>
            {residents.map(r => <option key={r._id} value={r._id}>{r.name} — Flat {r.flat?.flatNumber}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Vehicle Number</label>
            <input className="input uppercase" placeholder="MH01AB1234" required value={form.vehicleNumber}
              onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Type</label>
            <select className="input text-xs" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
              <option>Car</option><option>Bike</option><option>EV</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="input-label">Brand / Make</label>
            <input className="input" placeholder="Honda" value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div>
            <label className="input-label">Color</label>
            <input className="input" placeholder="White" value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
          <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs" disabled={saving}>
            {saving ? 'Saving...' : 'Register'}
          </button>
        </div>
      </form>
    </AppModal>
  )
}

// Assign Modal
function AssignModal({ open, slots, vehicles, onClose, onSaved }) {
  const [form, setForm] = useState({ slotId: '', vehicleId: '', residentId: '' })
  const [saving, setSaving] = useState(false)
  const availableSlots = slots.filter(s => s.status === 'Available')

  const pickVehicle = (id) => {
    const v = vehicles.find(v => v._id === id)
    setForm(f => ({ ...f, vehicleId: id, residentId: v?.resident?._id || '' }))
  }

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/parking/slots/assign', form)
      toast.success('Slot assigned!')
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <AppModal open={open} onClose={onClose} title="Assign Parking Slot">
      <form onSubmit={submit} className="space-y-4 text-xs font-semibold">
        <div>
          <label className="input-label">Vehicle</label>
          <select className="input text-xs" value={form.vehicleId} onChange={e => pickVehicle(e.target.value)} required>
            <option value="">Select Vehicle</option>
            {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber} — {v.ownerName} ({v.flatNumber})</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Slot</label>
          <select className="input text-xs" value={form.slotId} onChange={e => setForm({ ...form, slotId: e.target.value })} required>
            <option value="">Select Available Slot</option>
            {availableSlots.map(s => <option key={s._id} value={s._id}>{s.slotNumber} — Block {s.block}, {s.floor} ({s.slotType})</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2 text-xs">Cancel</button>
          <button type="submit" className="btn-primary flex-1 justify-center py-2 text-xs" disabled={saving || !availableSlots.length}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </AppModal>
  )
}

const INITIAL_ANPR_LOGS = [
  { id: 1, plate: 'MH-12-PQ-8899', type: 'Resident', time: '17:15', date: '2026-06-09', direction: 'Entry', status: 'Allowed', slot: 'P-03' },
  { id: 2, plate: 'DL-3C-AS-4500', type: 'Visitor', time: '16:40', date: '2026-06-09', direction: 'Entry', status: 'Allowed', slot: 'V-01' },
]

export default function Parking() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const societyId = user?.society?._id || user?.society

  const [stats, setStats] = useState(null)
  const [slots, setSlots] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [residents, setResidents] = useState([])
  const [tab, setTab] = useState('slots')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'slot' | 'vehicle' | 'assign'
  
  // OpenCV Number Plate recognition simulation states
  const [anprLogs, setAnprLogs] = useState(() => {
    const saved = localStorage.getItem('panchayat_anpr_logs')
    return saved ? JSON.parse(saved) : INITIAL_ANPR_LOGS
  })
  const [cameraScanning, setCameraScanning] = useState(false)
  const [detectedPlate, setDetectedPlate] = useState('')
  const [simulationFlow, setSimulationFlow] = useState(null) // 'entry' | 'exit'
  const [violations, setViolations] = useState([
    { id: 1, plate: 'UP-16-AB-9999', type: 'Unauthorized Vehicle', reason: 'Unregistered plate detected in Resident Zone', slot: 'P-12', time: '15:20' }
  ])

  useEffect(() => {
    localStorage.setItem('panchayat_anpr_logs', JSON.stringify(anprLogs))
  }, [anprLogs])

  const load = useCallback(async () => {
    if (!societyId) return
    setLoading(true)
    try {
      const [sRes, vRes, statsRes] = await Promise.all([
        api.get(`/parking/slots/${societyId}`),
        api.get(`/parking/vehicles/${societyId}`),
        api.get(`/parking/stats/${societyId}`),
      ])
      setSlots(sRes.data.slots || [])
      setVehicles(vRes.data.vehicles || [])
      setStats(statsRes.data.stats || null)
    } catch { toast.error('Failed to load parking data') }
    finally { setLoading(false) }
  }, [societyId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isAdmin && societyId) {
      api.get(`/residents/society/${societyId}`)
        .then(r => setResidents(r.data.residents || []))
        .catch(() => {})
    }
  }, [isAdmin, societyId])

  const releaseSlot = async (slotId) => {
    try {
      await api.put(`/parking/slots/${slotId}/release`)
      toast.success('Slot released')
      load()
    } catch { toast.error('Failed to release slot') }
  }

  const deleteVehicle = async (id) => {
    if (!confirm('Remove this vehicle?')) return
    try {
      await api.delete(`/parking/vehicles/${id}`)
      toast.success('Vehicle removed')
      load()
    } catch { toast.error('Failed') }
  }

  // ANPR License Plate Scanner Simulator
  const simulateANPR = (direction) => {
    setSimulationFlow(direction)
    setCameraScanning(true)
    setDetectedPlate('')

    // Sample plates to simulate scanning
    const samplePlates = direction === 'entry' 
      ? ['DL-3C-ZZ-1234', 'MH-02-CD-5678', 'KA-51-EF-9911', 'UP-16-XY-7777']
      : anprLogs.filter(log => log.direction === 'Entry').map(l => l.plate)

    const randomPlate = samplePlates.length > 0 
      ? samplePlates[Math.floor(Math.random() * samplePlates.length)]
      : 'DL-01-AB-1234'

    let timer = 0
    const interval = setInterval(() => {
      timer += 1
      if (timer === 3) {
        clearInterval(interval)
        setCameraScanning(false)
        setDetectedPlate(randomPlate)
        
        // Log entry/exit
        const isRegistered = vehicles.some(v => v.vehicleNumber === randomPlate)
        const allocatedSlot = direction === 'entry' 
          ? (isRegistered ? 'P-05' : 'V-03')
          : 'N/A'

        const newLog = {
          id: Date.now(),
          plate: randomPlate,
          type: isRegistered ? 'Resident' : 'Visitor',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().slice(0, 10),
          direction: direction === 'entry' ? 'Entry' : 'Exit',
          status: 'Allowed',
          slot: allocatedSlot
        }

        setAnprLogs(prev => [newLog, ...prev])
        toast.success(`Plate scanned: ${randomPlate} (${direction})`, { icon: '📸' })
        
        // If unregistered and entering, check if visitor pass exists
        if (direction === 'entry' && !isRegistered) {
          toast(`Unregistered guest vehicle auto-routed to Visitor Slot ${allocatedSlot}`, { icon: 'ℹ️' })
        }
      }
    }, 800)
  }

  const filteredSlots = slots.filter(s => {
    if (typeFilter !== 'All' && s.slotType !== typeFilter) return false
    if (statusFilter !== 'All' && s.status !== statusFilter) return false
    if (search && !s.slotNumber.toLowerCase().includes(search.toLowerCase()) &&
        !s.block.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.vehicleNumber.toLowerCase().includes(q) ||
           v.ownerName.toLowerCase().includes(q) ||
           v.flatNumber.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Logistics Control</h2>
          <p className="text-sm text-slate-500 mt-0.5">Allocate smart spaces, verify active registers, and monitor plate scanners</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModal('vehicle')} className="btn-secondary text-sm">
              <Car size={14} /> Add Vehicle
            </button>
            <button onClick={() => setModal('slot')} className="btn-secondary text-sm">
              <Plus size={14} /> Add Slot
            </button>
            <button onClick={() => setModal('assign')} className="btn-primary text-sm">
              <ParkingSquare size={14} /> Assign Slot
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Slots</span>
            <p className="text-lg font-black text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Occupied</span>
            <p className="text-lg font-black text-rose-700 mt-2">{stats.occupied}</p>
          </div>
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Available</span>
            <p className="text-lg font-black text-emerald-700 mt-2">{stats.available}</p>
          </div>
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Visitor Slots</span>
            <p className="text-lg font-black text-blue-700 mt-2">{stats.visitor}</p>
          </div>
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">EV Charging</span>
            <p className="text-lg font-black text-emerald-700 mt-2">{stats.ev}</p>
          </div>
          <div className="card p-4 flex flex-col justify-between h-24 shadow-sm border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Registered</span>
            <p className="text-lg font-black text-amber-700 mt-2">{stats.vehicles}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-100 bg-slate-100 p-1 w-fit">
        {['slots', 'vehicles', 'anpr'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
              tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'anpr' ? 'OpenCV ANPR' : t}
          </button>
        ))}
      </div>

      {/* OpenCV ANPR Simulator Screen */}
      {tab === 'anpr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulated Camera Feed Viewport */}
          <div className="card lg:col-span-2 space-y-4 border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gate 01 OpenCV ANPR Feed</h3>
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Camera Live
              </span>
            </div>

            {/* Video mockup frame */}
            <div className="h-56 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800">
              {/* Scanlines animations */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-brand/35 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-shimmer" style={{ animationDuration: '3s' }} />
              
              {cameraScanning ? (
                <div className="text-center space-y-2 text-white animate-pulse">
                  <Camera size={40} className="mx-auto text-brand animate-spin" />
                  <p className="text-xs font-bold font-mono tracking-wider">SCANNING VEHICLE LICENSE PLATE...</p>
                </div>
              ) : detectedPlate ? (
                <div className="text-center space-y-3">
                  <div className="inline-block bg-white border-4 border-black text-black px-6 py-2 rounded font-mono font-bold text-xl uppercase tracking-widest shadow-lg">
                    {detectedPlate}
                  </div>
                  <p className="text-[10px] text-brand uppercase tracking-wider font-bold">Verification Passed</p>
                </div>
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <Camera size={32} className="mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">Ready to scan plates</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => simulateANPR('entry')} 
                disabled={cameraScanning}
                className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold shadow-md shadow-brand/10">
                Simulate Vehicle Entry
              </button>
              <button 
                onClick={() => simulateANPR('exit')} 
                disabled={cameraScanning}
                className="btn-secondary flex-1 justify-center py-2.5 text-xs font-bold">
                Simulate Vehicle Exit
              </button>
            </div>
          </div>

          {/* Violations Sidebar */}
          <div className="card space-y-4 border border-rose-100 bg-rose-50/5 p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-rose-500" size={16} />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">ANPR Violation Alerts</h3>
            </div>
            
            <div className="space-y-3">
              {violations.map(v => (
                <div key={v.id} className="p-3 bg-white border border-rose-100 rounded-2xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs bg-slate-950 text-white px-2 py-0.5 rounded border border-slate-800">
                      {v.plate}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                      {v.type}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 leading-snug">{v.reason}</p>
                  <div className="flex justify-between text-[9px] text-slate-400 font-semibold pt-1.5 border-t border-slate-50">
                    <span>Target: Slot {v.slot}</span>
                    <span>Logged {v.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entry/Exit history logs */}
          <div className="card lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scanner Event Records</h3>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-head">Plate Number</th>
                    <th className="table-head">Identifier</th>
                    <th className="table-head">Scan Date</th>
                    <th className="table-head">Direction</th>
                    <th className="table-head">Assigned Space</th>
                    <th className="table-head">Authorization</th>
                  </tr>
                </thead>
                <tbody>
                  {anprLogs.map(log => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono font-bold text-xs bg-slate-100 border px-2 py-0.5 rounded text-slate-800">
                          {log.plate}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-xs">{log.type}</td>
                      <td className="table-cell text-xs">{log.date} {log.time}</td>
                      <td className="table-cell text-xs">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${log.direction === 'Entry' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {log.direction}
                        </span>
                      </td>
                      <td className="table-cell font-bold text-brand">{log.slot}</td>
                      <td className="table-cell">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck size={11} className="text-brand" /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Slots grid / tables filters */}
      {tab !== 'anpr' && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 text-xs" placeholder={tab === 'slots' ? 'Search slot number or block...' : 'Search vehicles...'}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {tab === 'slots' && (
            <>
              <select className="input w-auto text-xs py-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option>Car</option><option>Bike</option><option>EV</option>
              </select>
              <select className="input w-auto text-xs py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option>Available</option><option>Occupied</option><option>Reserved</option><option>Visitor</option>
              </select>
            </>
          )}
          <button onClick={load} className="btn-icon"><RefreshCw size={14} /></button>
        </div>
      )}

      {/* Slots Grid */}
      {tab === 'slots' && (
        <div>
          {filteredSlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <ParkingSquare className="mx-auto mb-2 text-slate-300" size={32} />
              <p className="text-sm font-semibold text-slate-500">No slots found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredSlots.map(slot => {
                const TypeIcon = slotTypeIcon[slot.slotType] || Car
                return (
                  <div key={slot._id}
                    className={`relative rounded-2xl border p-4 transition-all hover:shadow-md ${
                      slot.status === 'Available' ? 'border-emerald-100 bg-emerald-50/20' :
                      slot.status === 'Occupied'  ? 'border-rose-100    bg-rose-50/10' :
                      slot.status === 'Reserved'  ? 'border-amber-100   bg-amber-50/10' :
                                                    'border-blue-100    bg-blue-50/10'
                    }`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${slotStatusClass[slot.status]}`}>
                        {slot.status}
                      </span>
                      {slot.isVisitorSlot && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-black text-blue-600">Visitor</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon size={16} className="text-slate-400 flex-shrink-0" />
                      <span className="font-bold text-slate-900 text-sm">{slot.slotNumber}</span>
                    </div>
                    <p className="text-xs text-slate-500">Block {slot.block} · {slot.floor}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{slot.slotType}</p>
                    {slot.assignedVehicle && (
                      <p className="mt-2 text-xs font-semibold text-slate-700 truncate">
                        {slot.assignedVehicle.vehicleNumber}
                      </p>
                    )}
                    {slot.assignedResident && (
                      <p className="text-[10px] text-slate-400 truncate font-medium">{slot.assignedResident.name}</p>
                    )}
                    {isAdmin && slot.status === 'Occupied' && (
                      <button onClick={() => releaseSlot(slot._id)}
                        className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors">
                        Release Space
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Vehicles Table */}
      {tab === 'vehicles' && (
        <div className="table-wrap">
          {filteredVehicles.length === 0 ? (
            <div className="py-16 text-center">
              <Car className="mx-auto mb-2 text-zinc-300" size={32} />
              <p className="text-sm font-semibold text-zinc-500">No vehicles registered</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head">Vehicle No.</th>
                  <th className="table-head">Owner</th>
                  <th className="table-head">Flat</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Brand / Color</th>
                  <th className="table-head">Slot Space</th>
                  {isAdmin && <th className="table-head text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => (
                  <tr key={v._id} className="table-row">
                    <td className="table-cell font-bold text-slate-950">{v.vehicleNumber}</td>
                    <td className="table-cell font-semibold">{v.ownerName}</td>
                    <td className="table-cell text-xs font-semibold">Flat {v.flatNumber}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {v.vehicleType === 'Car'  && <Car  size={11} />}
                        {v.vehicleType === 'Bike' && <Bike size={11} />}
                        {v.vehicleType === 'EV'   && <Zap  size={11} />}
                        {v.vehicleType}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">{[v.brand, v.color].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="table-cell">
                      {v.parkingSlot ? (
                        <span className="badge-resolved">{v.parkingSlot.slotNumber}</span>
                      ) : (
                        <span className="badge-pending">Unallocated</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-right">
                        <button onClick={() => deleteVehicle(v._id)} className="btn-icon text-rose-500 hover:bg-rose-50">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <AddSlotModal    open={modal === 'slot'}    onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      <AddVehicleModal open={modal === 'vehicle'} residents={residents} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      <AssignModal     open={modal === 'assign'}  slots={slots} vehicles={vehicles} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
    </div>
  )
}
