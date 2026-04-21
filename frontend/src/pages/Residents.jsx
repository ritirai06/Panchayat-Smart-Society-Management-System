import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiHome, FiSearch, FiX, FiTruck, FiImage, FiCamera } from 'react-icons/fi'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
      <div className="flex items-center justify-between p-6 border-b border-zinc-100">
        <h3 className="font-semibold text-lg text-zinc-900">{title}</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><FiX size={20} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

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
  const [familyView, setFamilyView] = useState(null)
  const [newMember, setNewMember] = useState({ name: '', relation: '', age: '' })
  const [flatImage, setFlatImage] = useState(null)
  const [residentImage, setResidentImage] = useState(null)
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-zinc-900">Residents & Flats</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => { setModal('addFlat'); setFlatForm(emptyFlat) }} className="btn-secondary text-sm">
              <FiPlus /> Add Flat
            </button>
            <button onClick={() => { setModal('addResident'); setResidentForm(emptyResident) }} className="btn-primary text-sm">
              <FiPlus /> Add Resident
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {['residents', 'flats'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white shadow-sm text-emerald-700' : 'text-zinc-500 hover:text-zinc-700'}`}>
            {t} {t === 'residents' ? `(${(residents || []).length})` : `(${(flats || []).length})`}
          </button>
        ))}
      </div>

      {tab === 'residents' && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
            <input className="input pl-9" placeholder="Search by name, phone, email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="owner">Owner</option>
            <option value="tenant">Tenant</option>
          </select>
          {(search || typeFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter('') }} className="btn-secondary text-sm">
              <FiX size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {tab === 'residents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(residents || []).length === 0 && (
            <div className="col-span-3 card text-center py-12 text-zinc-400">
              {search ? `No residents matching "${search}"` : 'No residents found'}
            </div>
          )}
          {(residents || []).map(r => (
            <div key={r._id} className="card hover:shadow-md hover:border-emerald-100 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm overflow-hidden border-2 border-emerald-50">
                    {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : r.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{r.name}</p>
                    <p className="text-sm text-zinc-500">{r.phone}</p>
                    {r.email && <p className="text-xs text-zinc-400">{r.email}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => openEditResident(r)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                    <button onClick={() => deleteResident(r._id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  Flat {r.flat?.flatNumber || 'N/A'}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.type === 'owner' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
                  {r.type}
                </span>
                {r.familyMembers?.length > 0 && (
                  <button onClick={() => setFamilyView(r)}
                    className="bg-zinc-100 text-zinc-600 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
                    <FiUsers size={10} /> {r.familyMembers.length} member{r.familyMembers.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              {Array.isArray(r.vehicleNumbers) && r.vehicleNumbers.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <FiTruck size={11} className="text-zinc-400" />
                  <p className="text-xs text-zinc-400">{r.vehicleNumbers.join(', ')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'flats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(flats || []).length === 0 && <p className="text-zinc-400 col-span-3 text-center py-8">No flats found</p>}
          {(flats || []).map(f => (
            <div key={f._id} className="card hover:shadow-md hover:border-emerald-100 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border-2 ${f.isOccupied ? 'bg-emerald-100 border-emerald-50' : 'bg-zinc-100 border-zinc-50'}`}>
                  {f.image ? <img src={f.image} alt={f.flatNumber} className="w-full h-full object-cover" /> : <FiHome className={f.isOccupied ? 'text-emerald-600' : 'text-zinc-400'} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900">Flat {f.flatNumber}</p>
                  <p className="text-sm text-zinc-500">Floor {f.floor || '—'} · {f.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${f.isOccupied ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    {f.isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEditFlat(f)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                      {!f.isOccupied && <button onClick={() => deleteFlat(f._id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={14} /></button>}
                    </div>
                  )}
                </div>
              </div>
              {f.area && <p className="text-xs text-zinc-400 mt-2">{f.area} sq ft</p>}
            </div>
          ))}
        </div>
      )}

      {(modal === 'addFlat' || modal === 'editFlat') && (
        <Modal title={modal === 'editFlat' ? 'Edit Flat' : 'Add New Flat'} onClose={() => setModal(null)}>
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
                  <img src={flatImage ? URL.createObjectURL(flatImage) : editTarget?.image} alt="Flat" className="w-16 h-16 rounded-xl object-cover border border-zinc-100" />
                )}
                <label className="flex-1">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFlatImage(e.target.files[0])} />
                  <div className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 border border-dashed border-emerald-200 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-emerald-50 transition-colors cursor-pointer font-medium">
                    <FiCamera size={14} /> {flatImage ? flatImage.name : 'Upload Photo'}
                  </div>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">{modal === 'editFlat' ? 'Update' : 'Add Flat'}</button>
            </div>
          </form>
        </Modal>
      )}

      {(modal === 'addResident' || modal === 'editResident') && (
        <Modal title={modal === 'editResident' ? 'Edit Resident' : 'Add Resident'} onClose={() => setModal(null)}>
          <form onSubmit={submitResident} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-zinc-50 flex-shrink-0">
                {(editTarget?.image || residentImage) ? (
                  <img src={residentImage ? URL.createObjectURL(residentImage) : editTarget?.image} alt="Resident" className="w-full h-full object-cover" />
                ) : (
                  <FiUsers size={24} className="text-zinc-300" />
                )}
              </div>
              <div className="flex-1">
                <label className="input-label">Profile Photo</label>
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setResidentImage(e.target.files[0])} />
                  <div className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 border border-dashed border-emerald-200 rounded-lg px-3 py-2 w-full justify-center hover:bg-emerald-50 transition-colors cursor-pointer font-medium">
                    <FiCamera size={12} /> {residentImage ? 'Change' : 'Upload'}
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
                <select className="input" value={residentForm.type} onChange={e => setResidentForm({ ...residentForm, type: e.target.value })}>
                  <option value="owner">Owner</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
              <div>
                <label className="input-label">Flat</label>
                <select className="input" value={residentForm.flat} onChange={e => setResidentForm({ ...residentForm, flat: e.target.value })} required>
                  <option value="">Select flat</option>
                  {flats.filter(f => !f.isOccupied || f._id === (editTarget?.flat?._id || editTarget?.flat)).map(f => (
                    <option key={f._id} value={f._id}>Flat {f.flatNumber} ({f.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">Family Members</label>
              {residentForm.familyMembers.map((m, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 bg-zinc-50 rounded-lg px-3 py-2">
                  <span className="text-sm flex-1 text-zinc-700">{m.name} ({m.relation}{m.age ? `, ${m.age}y` : ''})</span>
                  <button type="button" onClick={() => removeFamilyMember(i)} className="text-zinc-400 hover:text-red-500"><FiX size={14} /></button>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input className="input text-sm" placeholder="Name" value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                <input className="input text-sm" placeholder="Relation" value={newMember.relation}
                  onChange={e => setNewMember({ ...newMember, relation: e.target.value })} />
                <input type="number" className="input text-sm" placeholder="Age" value={newMember.age}
                  onChange={e => setNewMember({ ...newMember, age: e.target.value })} />
              </div>
              <button type="button" onClick={addFamilyMember} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
                <FiPlus size={14} /> Add Member
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">{modal === 'editResident' ? 'Update' : 'Add Resident'}</button>
            </div>
          </form>
        </Modal>
      )}

      {familyView && (
        <Modal title={`${familyView.name}'s Family`} onClose={() => setFamilyView(null)}>
          {familyView.familyMembers?.length === 0
            ? <p className="text-zinc-400 text-center py-4">No family members added</p>
            : (
              <div className="space-y-2">
                {familyView.familyMembers.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-bold">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-zinc-900">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.relation}{m.age ? ` · ${m.age} years` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Modal>
      )}
    </div>
  )
}
