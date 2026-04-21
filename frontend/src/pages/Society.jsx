import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiSave, FiPlus, FiX, FiImage } from 'react-icons/fi'
import { Building2 } from 'lucide-react'

export default function Society() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', address: '', city: '', maintenanceAmount: 2000, amenities: '', rules: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [logo, setLogo] = useState(null)
  const [createForm, setCreateForm] = useState({ name: '', address: '', city: '', maintenanceAmount: 2000 })
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) { setLoading(false); return }
    api.get(`/societies/${societyId}`)
      .then(({ data }) => setForm({
        name: data.society.name,
        address: data.society.address,
        city: data.society.city,
        maintenanceAmount: data.society.maintenanceAmount,
        amenities: data.society.amenities?.join(', ') || '',
        rules: data.society.rules || ''
      }))
      .catch(() => toast.error('Failed to load society'))
      .finally(() => setLoading(false))
  }, [societyId])

  const saveSociety = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('address', form.address)
      formData.append('city', form.city)
      formData.append('maintenanceAmount', form.maintenanceAmount)
      formData.append('amenities', JSON.stringify(form.amenities.split(',').map(a => a.trim()).filter(Boolean)))
      if (logo) formData.append('image', logo)

      await api.put(`/societies/${societyId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.put(`/societies/${societyId}/rules`, { rules: form.rules })
      toast.success('Society updated!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const createSociety = async (e) => {
    e.preventDefault()
    try {
      await api.post('/societies', createForm)
      toast.success('Society created!')
      window.location.reload()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  if (!societyId) return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-zinc-900">Society Settings</h2>
      <div className="card text-center py-14">
        <img src="/logo.png" alt="Panchayat Logo" className="h-16 w-auto mx-auto mb-4 grayscale opacity-40 object-contain" />
        <p className="text-zinc-700 font-semibold mb-1">No society linked</p>
        <p className="text-zinc-400 text-sm mb-6">Create a new society to get started</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <FiPlus /> Create Society
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-zinc-900">Create Society</h3>
              <button onClick={() => setShowCreate(false)} className="btn-icon"><FiX size={18} /></button>
            </div>
            <form onSubmit={createSociety} className="space-y-4">
              <div><label className="input-label">Society Name</label>
                <input className="input" placeholder="Green Valley Apartments" value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required /></div>
              <div><label className="input-label">Address</label>
                <input className="input" placeholder="123 Main Street" value={createForm.address}
                  onChange={e => setCreateForm({ ...createForm, address: e.target.value })} required /></div>
              <div><label className="input-label">City</label>
                <input className="input" placeholder="Mumbai" value={createForm.city}
                  onChange={e => setCreateForm({ ...createForm, city: e.target.value })} required /></div>
              <div><label className="input-label">Monthly Maintenance (₹)</label>
                <input type="number" className="input" value={createForm.maintenanceAmount}
                  onChange={e => setCreateForm({ ...createForm, maintenanceAmount: e.target.value })} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-zinc-900">Society Settings</h2>
      <form onSubmit={saveSociety} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-semibold text-zinc-900">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="input-label">Society Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="input-label">City</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required /></div>
          </div>
          <div><label className="input-label">Address</label>
            <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required /></div>
          <div><label className="input-label">Monthly Maintenance (₹)</label>
            <input type="number" className="input w-48" value={form.maintenanceAmount}
              onChange={e => setForm({ ...form, maintenanceAmount: e.target.value })} /></div>
          <div><label className="input-label">Facilities (comma separated)</label>
            <input className="input" placeholder="Gym, Pool, Parking, Clubhouse" value={form.amenities}
              onChange={e => setForm({ ...form, amenities: e.target.value })} /></div>
          
          <div>
            <label className="input-label">Society Logo</label>
            <div className="flex items-center gap-4">
              {form.logo && !logo && <img src={form.logo} alt="Current logo" className="w-16 h-16 rounded-xl object-contain border border-zinc-100" />}
              {logo && <img src={URL.createObjectURL(logo)} alt="Preview" className="w-16 h-16 rounded-xl object-contain border border-zinc-100" />}
              <label className="flex-1">
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogo(e.target.files[0])} />
                <div className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 border border-dashed border-emerald-200 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-emerald-50 transition-colors cursor-pointer font-medium">
                  <FiImage size={14} /> {logo ? logo.name : 'Change Logo'}
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-zinc-900">Society Bylaws</h3>
            <p className="text-sm text-zinc-400 mt-1">Used by the AI Bylaw Bot to answer resident queries.</p>
          </div>
          <textarea className="input resize-none font-mono text-sm" rows={10}
            placeholder={"Enter society rules and bylaws here...\n\nExample:\n1. No loud music after 10 PM\n2. Pets must be registered\n3. Gym timings: 6 AM - 10 PM"}
            value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })} />
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
