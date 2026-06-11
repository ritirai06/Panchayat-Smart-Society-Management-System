import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Users, Home, Search, X, Truck, Image, Camera, Eye, Download, DollarSign, AlertCircle, User } from 'lucide-react'
import AppModal from '../components/ui/AppModal'

const FLAT_TYPES = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK']
const emptyFlat = { flatNumber: '', floor: '', type: '2BHK', area: '' }
const emptyResident = { name: '', phone: '', email: '', type: 'owner', flat: '', familyMembers: [] }

export default function Residents() {
  const { user } = useAuth()
  const [residents, setResidents] = useState([])
  const [flats, setFlats] = useState([])
  const [tab, setTab] = useState('residents')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [flatForm, setFlatForm] = useState(emptyFlat)
  const [residentForm, setResidentForm] = useState(emptyResident)
  const [editTarget, setEditTarget] = useState(null)
  const [profileDrawer, setProfileDrawer] = useState(null) // selected resident for profile view
  const [activeProfileTab, setActiveProfileTab] = useState('personal')
  const [newMember, setNewMember] = useState({ name: '', relation: '', age: '' })
  const [flatImage, setFlatImage] = useState(null)
  const [residentImage, setResidentImage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const societyId = user?.society?._id || user?.society
  const isAdmin = user?.role === 'admin'

  const fetchData = useCallback(async () => {
    if (!societyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter) params.append('type', typeFilter)
      const [r, f] = await Promise.all([
        api.get(`/residents/society/${societyId}?${params}`),
        api.get(`/flats/society/${societyId}`)
      ])
      setResidents(r.data.residents)
      setFlats(f.data.flats)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [societyId, search, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const t = setTimeout(() => fetchData(), 400); return () => clearTimeout(t) }, [search])

  const openEditFlat = (flat) => { setEditTarget(flat); setFlatForm({ flatNumber: flat.flatNumber, floor: flat.floor || '', type: flat.type, area: flat.area || '' }); setModal('editFlat') }
  const openEditResident = (r) => { setEditTarget(r); setResidentForm({ name: r.name, phone: r.phone, email: r.email || '', type: r.type, flat: r.flat?._id || '', familyMembers: r.familyMembers || [] }); setModal('editResident') }

  const submitFlat = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      Object.entries(flatForm).forEach(([k, v]) => formData.append(k, v))
      formData.append('societyId', societyId)
      if (flatImage) formData.append('image', flatImage)

      if (modal === 'editFlat') { await api.put(`/flats/${editTarget._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Flat updated!') }
      else { await api.post('/flats', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Flat added!') }
      setModal(null); setFlatForm(emptyFlat); setFlatImage(null); setEditTarget(null); fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const submitResident = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      Object.entries(residentForm).forEach(([k, v]) => {
        if (k === 'familyMembers') formData.append(k, JSON.stringify(v))
        else formData.append(k, v)
      })
      formData.append('societyId', societyId)
      if (residentImage) formData.append('image', residentImage)

      if (modal === 'editResident') { await api.put(`/residents/${editTarget._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Resident updated!') }
      else { await api.post('/residents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Resident added!') }
      setModal(null); setResidentForm(emptyResident); setResidentImage(null); setEditTarget(null); fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const deleteResident = async (id) => {
    if (!confirm('Remove this resident?')) return
    try { await api.delete(`/residents/${id}`); toast.success('Resident removed'); fetchData() }
    catch { toast.error('Failed') }
  }

  const deleteFlat = async (id) => {
    if (!confirm('Delete this flat?')) return
    try { await api.delete(`/flats/${id}`); toast.success('Flat deleted'); fetchData() }
    catch { toast.error('Failed') }
  }

  const addFamilyMember = () => {
    if (!newMember.name) return
    setResidentForm(prev => ({ ...prev, familyMembers: [...prev.familyMembers, { ...newMember, age: Number(newMember.age) }] }))
    setNewMember({ name: '', relation: '', age: '' })
  }

  const removeFamilyMember = (idx) => {
    setResidentForm(prev => ({ ...prev, familyMembers: prev.familyMembers.filter((_, i) => i !== idx) }))
  }

  // Client side directory CSV export
  const exportToCSV = () => {
    if (residents.length === 0) {
      toast.error('No resident entries to export')
      return
    }
    const headers = 'Name,Phone,Email,Role,Flat,Family Members Count\n'
    const rows = residents.map(r => `"${r.name}","${r.phone}","${r.email || ''}","${r.type}","Flat ${r.flat?.flatNumber || 'N/A'}",${r.familyMembers?.length || 0}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `panchayat_residents_directory.csv`
    link.click()
    toast.success('CSV Directory exported successfully!')
  }

  // Pagination index computations
  const totalPages = Math.ceil((tab === 'residents' ? residents.length : flats.length) / itemsPerPage)
  const paginatedResidents = residents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const paginatedFlats = flats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const hasFilters = search || typeFilter

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Residents & Flat Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage occupied units, tenancy files, and community listings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportToCSV} className="btn-secondary text-sm">
            <Download size={14} /> Export CSV
          </button>
          {isAdmin && (
            <>
              <button onClick={() => { setModal('addFlat'); setFlatForm(emptyFlat) }} className="btn-secondary text-sm">
                <Plus size={14} /> Add Flat
              </button>
              <button onClick={() => { setModal('addResident'); setResidentForm(emptyResident) }} className="btn-primary text-sm">
                <Plus size={14} /> Add Resident
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['residents', 'flats'].map(t => (
          <button key={t} onClick={() => { setTab(t); setCurrentPage(1) }}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${tab === t ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} {t === 'residents' ? `(${(residents || []).length})` : `(${(flats || []).length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="input pl-9 text-xs" placeholder={tab === 'residents' ? "Search residents..." : "Search flats..."}
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
        </div>
        {tab === 'residents' && (
          <select className="input w-auto text-xs py-2" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1) }}>
            <option value="">All Role Types</option>
            <option value="owner">Owner</option>
            <option value="tenant">Tenant</option>
          </select>
        )}
        {hasFilters && (
          <button onClick={() => { setSearch(''); setTypeFilter(''); setCurrentPage(1) }} className="btn-secondary text-xs py-2">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table view for residents */}
      {tab === 'residents' && (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-head">Resident Details</th>
                <th className="table-head">Contact</th>
                <th className="table-head">Allocated Unit</th>
                <th className="table-head">Tenure Role</th>
                <th className="table-head">Co-residents</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">No residents match this query.</td>
                </tr>
              ) : (
                paginatedResidents.map(r => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs overflow-hidden border border-emerald-50 flex-shrink-0">
                          {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : r.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{r.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{r.email || 'No email saved'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-medium text-xs">{r.phone}</td>
                    <td className="table-cell">
                      <span className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        Flat {r.flat?.flatNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${r.type === 'owner' ? 'badge-resolved' : 'badge-progress'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="table-cell text-xs font-semibold text-slate-500">
                      {r.familyMembers?.length || 0} co-resident{r.familyMembers?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="table-cell text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setProfileDrawer(r); setActiveProfileTab('personal') }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Profile Drawer">
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEditResident(r)} className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => deleteResident(r._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid view for flats */}
      {tab === 'flats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedFlats.length === 0 ? (
            <p className="text-slate-400 col-span-4 text-center py-12 font-medium">No flat entries found.</p>
          ) : (
            paginatedFlats.map(f => (
              <div key={f._id} className="card p-4 hover:shadow-md hover:border-brand/20 transition-all flex flex-col justify-between">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border ${f.isOccupied ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {f.image ? <img src={f.image} alt={f.flatNumber} className="w-full h-full object-cover" /> : <Home size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Flat {f.flatNumber}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Floor {f.floor || '—'} · {f.type}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${f.isOccupied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {f.isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">{f.area ? `${f.area} sq ft` : 'No area specified'}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditFlat(f)} className="p-1 text-slate-400 hover:text-brand hover:bg-slate-50 rounded transition-colors"><Edit2 size={13} /></button>
                      {!f.isOccupied && <button onClick={() => deleteFlat(f._id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 size={13} /></button>}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-xs font-bold text-slate-500">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="btn-secondary py-1 px-3 text-xs disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {/* Resident Profile side drawer */}
      {profileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-slide-in-r">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-50">
                  {profileDrawer.image ? <img src={profileDrawer.image} alt={profileDrawer.name} className="w-full h-full object-cover" /> : profileDrawer.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{profileDrawer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Flat {profileDrawer.flat?.flatNumber || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setProfileDrawer(null)} className="btn-icon"><X size={18} /></button>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-slate-100 px-6">
              {[
                { id: 'personal', label: 'Details' },
                { id: 'vehicles', label: 'Vehicles' },
                { id: 'members', label: 'Co-residents' }
              ].map(tb => (
                <button 
                  key={tb.id} 
                  onClick={() => setActiveProfileTab(tb.id)}
                  className={`py-3 px-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    activeProfileTab === tb.id 
                      ? 'border-brand text-brand' 
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}>
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeProfileTab === 'personal' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3 text-xs font-semibold">
                    <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">Personal Files</p>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mobile Phone</span>
                      <span className="text-slate-900">{profileDrawer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email Address</span>
                      <span className="text-slate-900">{profileDrawer.email || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tenancy Role</span>
                      <span className="text-slate-900 capitalize font-bold text-brand">{profileDrawer.type}</span>
                    </div>
                  </div>

                  {profileDrawer.flat && (
                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3 text-xs font-semibold">
                      <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">Allocated Flat Information</p>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Flat Number</span>
                        <span className="text-slate-900 font-bold">Flat {profileDrawer.flat.flatNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Floor Level</span>
                        <span className="text-slate-900">Floor {profileDrawer.flat.floor || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Flat Dimensions</span>
                        <span className="text-slate-900">{profileDrawer.flat.area ? `${profileDrawer.flat.area} sq ft` : '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'vehicles' && (
                <div className="space-y-3">
                  <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">Registered Parking Vehicles</p>
                  {Array.isArray(profileDrawer.vehicleNumbers) && profileDrawer.vehicleNumbers.length > 0 ? (
                    profileDrawer.vehicleNumbers.map(v => (
                      <div key={v} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                        <Truck size={16} className="text-brand flex-shrink-0" />
                        <div>
                          <p className="font-bold text-xs text-slate-800 uppercase">{v}</p>
                          <p className="text-[10px] text-slate-400">Authorized Parking Access</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 border border-dashed rounded-xl">
                      No vehicles listed for this profile.
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'members' && (
                <div className="space-y-3">
                  <p className="text-slate-400 uppercase font-bold text-[10px] tracking-wider mb-2">Linked Co-residents</p>
                  {profileDrawer.familyMembers?.length > 0 ? (
                    profileDrawer.familyMembers.map((m, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand/5 border border-brand/20 text-brand rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{m.relation} {m.age ? `· ${m.age} years old` : ''}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 border border-dashed rounded-xl">
                      No family members listed.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-2">
              <button onClick={() => setProfileDrawer(null)} className="btn-secondary flex-1 justify-center py-2 text-xs font-semibold">Close Profile</button>
              {isAdmin && (
                <button 
                  onClick={() => { openEditResident(profileDrawer); setProfileDrawer(null) }} 
                  className="btn-primary flex-1 justify-center py-2 text-xs font-bold">
                  Edit Records
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Flat Modal */}
      <AppModal
        open={modal === 'addFlat' || modal === 'editFlat'}
        onClose={() => setModal(null)}
        title={modal === 'editFlat' ? 'Edit Flat Details' : 'Add New Flat'}
      >
            <form onSubmit={submitFlat} className="space-y-4">
              <div>
                <label className="input-label">Flat Number</label>
                <input className="input" placeholder="101" value={flatForm.flatNumber}
                  onChange={e => setFlatForm({ ...flatForm, flatNumber: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Floor</label>
                  <input type="number" className="input" placeholder="1" value={flatForm.floor}
                    onChange={e => setFlatForm({ ...flatForm, floor: e.target.value })} />
                </div>
                <div>
                  <label className="input-label">Type</label>
                  <select className="input" value={flatForm.type} onChange={e => setFlatForm({ ...flatForm, type: e.target.value })}>
                    {FLAT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Area (sq ft)</label>
                <input type="number" className="input" placeholder="850" value={flatForm.area}
                  onChange={e => setFlatForm({ ...flatForm, area: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Flat Image</label>
                <div className="flex items-center gap-4">
                  {(editTarget?.image || flatImage) && (
                    <img src={flatImage ? URL.createObjectURL(flatImage) : editTarget?.image} alt="Flat" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  )}
                  <label className="flex-1">
                    <input type="file" accept="image/*" className="hidden" onChange={e => setFlatImage(e.target.files[0])} />
                    <div className="flex items-center gap-2 text-xs text-brand hover:text-brand-dark border border-dashed border-slate-200 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-slate-50 transition-colors cursor-pointer font-bold">
                      <Camera size={12} /> {flatImage ? flatImage.name : 'Upload Photo'}
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{modal === 'editFlat' ? 'Update' : 'Add Flat'}</button>
              </div>
            </form>
      </AppModal>

      {/* Add Resident Modal */}
      <AppModal
        open={modal === 'addResident' || modal === 'editResident'}
        onClose={() => setModal(null)}
        title={modal === 'editResident' ? 'Edit Resident Profile' : 'Add New Resident'}
      >
            <form onSubmit={submitResident} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0 text-slate-400">
                  {(editTarget?.image || residentImage) ? (
                    <img src={residentImage ? URL.createObjectURL(residentImage) : editTarget?.image} alt="Resident" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="input-label">Profile Photo</label>
                  <label>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setResidentImage(e.target.files[0])} />
                    <div className="flex items-center gap-2 text-[10px] text-brand hover:text-brand-dark border border-dashed border-slate-200 rounded-lg px-3 py-2 w-full justify-center hover:bg-slate-50 transition-colors cursor-pointer font-bold">
                      <Camera size={10} /> {residentImage ? 'Change Photo' : 'Upload photo'}
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="input-label">Name</label>
                <input className="input" placeholder="John Doe" value={residentForm.name}
                  onChange={e => setResidentForm({ ...residentForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={residentForm.phone}
                  onChange={e => setResidentForm({ ...residentForm, phone: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" className="input" placeholder="john@example.com" value={residentForm.email}
                  onChange={e => setResidentForm({ ...residentForm, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Type</label>
                  <select className="input text-xs" value={residentForm.type} onChange={e => setResidentForm({ ...residentForm, type: e.target.value })}>
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Flat mapping</label>
                  <select className="input text-xs" value={residentForm.flat} onChange={e => setResidentForm({ ...residentForm, flat: e.target.value })} required>
                    <option value="">Select flat unit</option>
                    {flats.filter(f => !f.isOccupied || f._id === (editTarget?.flat?._id || editTarget?.flat)).map(f => (
                      <option key={f._id} value={f._id}>Flat {f.flatNumber} ({f.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Family Members</label>
                {residentForm.familyMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 bg-slate-50 border rounded-xl px-3 py-1.5 text-xs font-semibold">
                    <span className="flex-1 text-slate-700">{m.name} ({m.relation}{m.age ? `, ${m.age}y` : ''})</span>
                    <button type="button" onClick={() => removeFamilyMember(i)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <input className="input text-xs py-1.5" placeholder="Name" value={newMember.name}
                    onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                  <input className="input text-xs py-1.5" placeholder="Relation" value={newMember.relation}
                    onChange={e => setNewMember({ ...newMember, relation: e.target.value })} />
                  <input type="number" className="input text-xs py-1.5" placeholder="Age" value={newMember.age}
                    onChange={e => setNewMember({ ...newMember, age: e.target.value })} />
                </div>
                <button type="button" onClick={addFamilyMember} className="mt-2 text-xs text-brand hover:text-brand-dark flex items-center gap-1 font-bold">
                  <Plus size={12} /> Add Member
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{modal === 'editResident' ? 'Update' : 'Add Resident'}</button>
              </div>
            </form>
      </AppModal>
    </div>
  )
}
