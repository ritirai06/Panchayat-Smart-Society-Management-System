import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, X, Plus, AlertCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const FACILITIES = [
  { id: 'clubhouse', name: 'Clubhouse', icon: '🏢', area: 'Block A, Ground Floor', capacity: 150, rate: '₹1,500/hr', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80' },
  { id: 'gym', name: 'Elite Gym', icon: '💪', area: 'Block C, Terrace', capacity: 20, rate: 'Free', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80' },
  { id: 'pool', name: 'Swimming Pool', icon: '🏊', area: 'Block B, Courtyard', capacity: 40, rate: 'Free', img: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80' },
  { id: 'hall', name: 'Community Hall', icon: '🏛️', area: 'Block A, 1st Floor', capacity: 300, rate: '₹5,000/day', img: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80' },
]

const INITIAL_BOOKINGS = [
  { id: 1, facility: 'Community Hall', date: '2026-06-12', slot: 'Full Day', resident: 'Aarav Mehta', flat: 'A-203', status: 'Approved' },
  { id: 2, facility: 'Clubhouse', date: '2026-06-10', slot: '18:00 - 20:00', resident: 'Neha Sharma', flat: 'C-405', status: 'Pending' },
  { id: 3, facility: 'Swimming Pool', date: '2026-06-09', slot: '07:00 - 09:00', resident: 'Rahul Verma', flat: 'B-102', status: 'Approved' },
  { id: 4, facility: 'Elite Gym', date: '2026-06-09', slot: '17:00 - 18:00', resident: 'Priya Iyer', flat: 'A-108', status: 'Approved' },
]

export default function Bookings() {
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('panchayat_bookings')
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS
  })

  const [selectedFacility, setSelectedFacility] = useState(FACILITIES[0])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ date: new Date().toISOString().slice(0, 10), slot: '18:00 - 20:00', residentName: '', flatNumber: '' })
  
  useEffect(() => {
    localStorage.setItem('panchayat_bookings', JSON.stringify(bookings))
  }, [bookings])

  const handleBook = (e) => {
    e.preventDefault()
    if (!formData.residentName || !formData.flatNumber) {
      toast.error('Please fill in all details')
      return
    }

    const newBooking = {
      id: Date.now(),
      facility: selectedFacility.name,
      date: formData.date,
      slot: formData.slot,
      resident: formData.residentName,
      flat: formData.flatNumber,
      status: 'Pending'
    }

    setBookings([newBooking, ...bookings])
    setShowModal(false)
    setFormData({ date: new Date().toISOString().slice(0, 10), slot: '18:00 - 20:00', residentName: '', flatNumber: '' })
    toast.success('Booking request submitted!')
  }

  const handleApprove = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Approved' } : b))
    toast.success('Booking approved')
  }

  const handleReject = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Rejected' } : b))
    toast.error('Booking rejected')
  }

  const getStatusBadge = (status) => {
    if (status === 'Approved') return 'badge-resolved'
    if (status === 'Pending') return 'badge-pending'
    return 'badge-overdue'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Facility Bookings</h2>
          <p className="text-sm text-slate-500 mt-0.5">Reserve shared community amenities and track requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Book Facility
        </button>
      </div>

      {/* Grid of Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FACILITIES.map((fac) => (
          <div key={fac.id} className="card p-0 overflow-hidden flex flex-col group border border-slate-100 hover:border-brand/20 transition-all hover:shadow-md">
            <div className="h-40 overflow-hidden relative">
              <img src={fac.img} alt={fac.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div>
                  <span className="text-2xl">{fac.icon}</span>
                  <h3 className="text-base font-bold text-white mt-1">{fac.name}</h3>
                </div>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5 text-xs text-slate-500">
                <p>📍 {fac.area}</p>
                <p>👥 Capacity: <span className="font-semibold text-slate-700">{fac.capacity} people</span></p>
                <p>💳 Rate: <span className="font-semibold text-emerald-600">{fac.rate}</span></p>
              </div>
              <button 
                onClick={() => { setSelectedFacility(fac); setShowModal(true) }}
                className="mt-4 w-full btn-secondary py-1.5 text-xs font-semibold justify-center">
                Select & Book
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings log */}
        <div className="card lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Booking History</h3>
            <p className="text-xs text-slate-400 mt-0.5">Review ongoing reservations and status</p>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Facility</th>
                  <th className="table-head">Date</th>
                  <th className="table-head">Slot / Time</th>
                  <th className="table-head">Resident</th>
                  <th className="table-head">Status</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">No bookings logged.</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="table-row">
                      <td className="table-cell font-semibold text-slate-800">{b.facility}</td>
                      <td className="table-cell text-xs">{b.date}</td>
                      <td className="table-cell text-xs">{b.slot}</td>
                      <td className="table-cell text-xs">
                        <span className="font-medium text-slate-700">{b.resident}</span> ({b.flat})
                      </td>
                      <td className="table-cell">
                        <span className={getStatusBadge(b.status)}>{b.status}</span>
                      </td>
                      <td className="table-cell text-right whitespace-nowrap">
                        {b.status === 'Pending' ? (
                          <div className="inline-flex gap-1">
                            <button onClick={() => handleApprove(b.id)} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded text-xs font-bold transition-all">
                              Approve
                            </button>
                            <button onClick={() => handleReject(b.id)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded text-xs font-bold transition-all">
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info panel */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={16} />
            <h3 className="text-base font-bold text-slate-900">Booking Rules</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="font-bold text-slate-800">Advanced Notice Required</p>
              <p className="mt-0.5 text-slate-500">Reservations for the Clubhouse and Community Hall must be raised at least 48 hours prior.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="font-bold text-slate-800">Capacity Limits</p>
              <p className="mt-0.5 text-slate-500">For safety, guest volumes should strictly match the maximum threshold listed for each facility.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="font-bold text-slate-800">Maintenance Contribution</p>
              <p className="mt-0.5 text-slate-500">Paid bookings are appended to your next maintenance invoice cycle automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md bg-white rounded-[24px] border border-slate-200 shadow-modal animate-scale-in p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Book {selectedFacility?.name}</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="input-label">Facility Selected</label>
                <select 
                  className="input" 
                  value={selectedFacility.id} 
                  onChange={(e) => setSelectedFacility(FACILITIES.find(f => f.id === e.target.value))}>
                  {FACILITIES.map(f => <option key={f.id} value={f.id}>{f.name} ({f.rate})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label">Slot/Time</label>
                  <select 
                    className="input" 
                    value={formData.slot} 
                    onChange={e => setFormData({ ...formData, slot: e.target.value })}>
                    <option>06:00 - 08:00</option>
                    <option>09:00 - 12:00</option>
                    <option>12:00 - 15:00</option>
                    <option>15:00 - 18:00</option>
                    <option>18:00 - 20:00</option>
                    <option>20:00 - 22:00</option>
                    <option>Full Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Resident Name</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Aarav Mehta" 
                  value={formData.residentName} 
                  onChange={e => setFormData({ ...formData, residentName: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="input-label">Flat Number</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="A-203" 
                  value={formData.flatNumber} 
                  onChange={e => setFormData({ ...formData, flatNumber: e.target.value })} 
                  required 
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>By submitting this booking, you agree to comply with all rules and cleanup guidelines of the society.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Submit Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
