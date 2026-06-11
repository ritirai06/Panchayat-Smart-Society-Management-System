import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Settings, Shield, Landmark, Zap, Users,
  Save, Plus, X, Upload, Image, MapPin, DollarSign,
  Wifi, ChevronRight, CheckCircle, AlertCircle, Edit3,
  Hash, Phone, Mail, Globe, Clock, Star, Layers,
  ToggleLeft, ToggleRight, Bell, Lock, Eye, Trash2,
  RefreshCw, Download, Camera, Briefcase, FileText
} from 'lucide-react'

const TABS = [
  { id: 'general',    label: 'General',     icon: Building2  },
  { id: 'amenities',  label: 'Amenities',   icon: Star       },
  { id: 'bylaws',     label: 'Bylaws',      icon: FileText   },
  { id: 'security',   label: 'Security',    icon: Shield     },
  { id: 'billing',    label: 'Billing',     icon: DollarSign },
]

const AMENITY_PRESETS = [
  { label: 'Swimming Pool',   icon: '🏊' },
  { label: 'Gymnasium',       icon: '🏋️' },
  { label: 'Clubhouse',       icon: '🏛️' },
  { label: 'Parking',         icon: '🚗' },
  { label: 'Garden',          icon: '🌿' },
  { label: 'Playground',      icon: '🛝' },
  { label: 'CCTV',            icon: '📷' },
  { label: 'Lift',            icon: '🛗' },
  { label: 'Intercom',        icon: '📞' },
  { label: 'Generator',       icon: '⚡' },
  { label: 'Solar Panels',    icon: '☀️' },
  { label: 'Jogging Track',   icon: '🏃' },
]

const SecurityToggle = ({ label, description, enabled, onChange }) => (
  <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-emerald-500' : 'bg-slate-200'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  </div>
)

export default function Society() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pincode: '',
    phone: '', email: '', website: '',
    maintenanceAmount: 2000, amenities: [], rules: '', logo: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [createForm, setCreateForm] = useState({ name: '', address: '', city: '', maintenanceAmount: 2000 })
  const [amenityInput, setAmenityInput] = useState('')
  const [security, setSecurity] = useState({
    gatePassApproval: true,
    visitorOTP: true,
    twoFactor: false,
    autoLogout: true,
    auditLogs: true,
    ipWhitelist: false,
  })
  const fileRef = useRef()
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) { setLoading(false); return }
    api.get(`/societies/${societyId}`)
      .then(({ data }) => {
        setForm({
          name: data.society.name || '',
          address: data.society.address || '',
          city: data.society.city || '',
          state: data.society.state || '',
          pincode: data.society.pincode || '',
          phone: data.society.phone || '',
          email: data.society.email || '',
          website: data.society.website || '',
          maintenanceAmount: data.society.maintenanceAmount || 2000,
          amenities: data.society.amenities || [],
          rules: data.society.rules || '',
          logo: data.society.logo || ''
        })
        if (data.society.logo) setLogoPreview(data.society.logo)
      })
      .catch(() => toast.error('Failed to load society'))
      .finally(() => setLoading(false))
  }, [societyId])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogo(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const toggleAmenity = (label) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(label)
        ? prev.amenities.filter(a => a !== label)
        : [...prev.amenities, label]
    }))
  }

  const addCustomAmenity = () => {
    const val = amenityInput.trim()
    if (!val || form.amenities.includes(val)) return
    setForm(prev => ({ ...prev, amenities: [...prev.amenities, val] }))
    setAmenityInput('')
  }

  const removeAmenity = (label) => {
    setForm(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== label) }))
  }

  const saveSociety = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'amenities') formData.append(k, JSON.stringify(v))
        else formData.append(k, v)
      })
      if (logo) formData.append('image', logo)
      await api.put(`/societies/${societyId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await api.put(`/societies/${societyId}/rules`, { rules: form.rules })
      toast.success('Society settings saved successfully')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const createSociety = async (e) => {
    e.preventDefault()
    try {
      await api.post('/societies', createForm)
      toast.success('Society created!')
      window.location.reload()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create society') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading society settings...</p>
      </div>
    </div>
  )

  if (!societyId) return (
    <div className="space-y-6">
      {/* Hero Empty State */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #10B981 0%, transparent 70%)'
        }} />
        <div className="relative">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Society Linked</h2>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Create your society profile to start managing residents, amenities, and operations.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Create Society
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Create Society</h3>
                  <p className="text-sm text-slate-500">Set up your society profile</p>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
              <form onSubmit={createSociety} className="space-y-4">
                {[
                  { label: 'Society Name', key: 'name', placeholder: 'Green Valley Apartments', type: 'text' },
                  { label: 'Address', key: 'address', placeholder: '123 Main Street', type: 'text' },
                  { label: 'City', key: 'city', placeholder: 'Mumbai', type: 'text' },
                  { label: 'Monthly Maintenance (₹)', key: 'maintenanceAmount', placeholder: '2000', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                    <input
                      type={f.type} placeholder={f.placeholder} required
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      value={createForm[f.key]}
                      onChange={e => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
                    Create Society
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Society Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your society profile, amenities, bylaws, and security policies.</p>
        </div>
        <button
          onClick={saveSociety}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-emerald-200"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── GENERAL TAB ── */}
          {activeTab === 'general' && (
            <form onSubmit={saveSociety} className="space-y-5">
              {/* Logo + Identity Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase size={14} className="text-emerald-500" /> Society Identity
                </h3>
                <div className="flex items-start gap-6">
                  {/* Logo Upload */}
                  <div className="flex-shrink-0">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Camera size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-xs text-slate-400 group-hover:text-emerald-500 mt-1 transition-colors">Logo</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Upload size={16} className="text-white" />
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <p className="text-xs text-slate-400 text-center mt-2">Click to upload</p>
                  </div>

                  {/* Name + basic info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Society Name</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Green Valley Apartments"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Phone size={11} /> Contact Phone
                      </label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Mail size={11} /> Contact Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="admin@society.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                        <Globe size={11} /> Website
                      </label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        value={form.website}
                        onChange={e => setForm({ ...form, website: e.target.value })}
                        placeholder="https://greenvalley.in"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-500" /> Location &amp; Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Street Address</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Flat No., Building, Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">PIN Code</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                      value={form.pincode}
                      onChange={e => setForm({ ...form, pincode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-500" /> Maintenance Fees
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Monthly Maintenance Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        value={form.maintenanceAmount}
                        onChange={e => setForm({ ...form, maintenanceAmount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-semibold mb-1">Annual Revenue Projection</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      ₹{(form.maintenanceAmount * 12).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-emerald-500 mt-0.5">Per resident · 12 months</p>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ── AMENITIES TAB ── */}
          {activeTab === 'amenities' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Star size={14} className="text-emerald-500" /> Facility Amenities
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Select or add amenities available in your society</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                    {form.amenities.length} Selected
                  </span>
                </div>

                {/* Preset Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-5">
                  {AMENITY_PRESETS.map(({ label }) => {
                    const active = form.amenities.includes(label)
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleAmenity(label)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          active
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm shadow-emerald-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {active ? (
                          <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                        )}
                        {label}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Amenity Input */}
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    placeholder="Add custom amenity..."
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Selected Tags */}
                {form.amenities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-3">ACTIVE AMENITIES</p>
                    <div className="flex flex-wrap gap-2">
                      {form.amenities.map(a => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200"
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() => removeAmenity(a)}
                            className="text-emerald-400 hover:text-emerald-700 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={saveSociety}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Amenities'}
              </button>
            </div>
          )}

          {/* ── BYLAWS TAB ── */}
          {activeTab === 'bylaws' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <FileText size={14} className="text-emerald-500" /> Society Bylaws &amp; Rules
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Used by the AI Bylaw Bot to answer resident queries. Write one rule per line.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap size={12} className="text-amber-400" />
                    AI-powered search
                  </div>
                </div>

                {/* Bylaw editor with line numbering feel */}
                <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-300" />
                      <div className="w-3 h-3 rounded-full bg-amber-300" />
                      <div className="w-3 h-3 rounded-full bg-green-300" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">society-bylaws.txt</span>
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                        <Download size={11} /> Export
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="w-full px-4 py-4 font-mono text-sm text-slate-700 bg-white resize-none focus:outline-none leading-relaxed"
                    rows={16}
                    placeholder={`Enter your society bylaws here...\n\nExample:\n1. No loud music after 10:00 PM\n2. All pets must be registered with society office\n3. Gym timings: 6:00 AM – 10:00 PM\n4. Visitors must sign in at the gate\n5. Parking in designated slots only`}
                    value={form.rules}
                    onChange={e => setForm({ ...form, rules: e.target.value })}
                  />
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {form.rules.split('\n').filter(l => l.trim()).length} rules defined
                    </span>
                    <span className="text-xs text-slate-400">{form.rules.length} characters</span>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSociety}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Bylaws'}
              </button>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-emerald-500" /> Access &amp; Security Controls
                </h3>
                <p className="text-xs text-slate-500 mb-5">Configure security policies for your society management system.</p>

                <div className="divide-y divide-slate-100">
                  <SecurityToggle
                    label="Gate Pass Approval Required"
                    description="All visitor gate passes require admin/resident approval before entry"
                    enabled={security.gatePassApproval}
                    onChange={v => setSecurity(s => ({ ...s, gatePassApproval: v }))}
                  />
                  <SecurityToggle
                    label="OTP Verification for Visitors"
                    description="Residents receive an OTP when their visitor arrives at the gate"
                    enabled={security.visitorOTP}
                    onChange={v => setSecurity(s => ({ ...s, visitorOTP: v }))}
                  />
                  <SecurityToggle
                    label="Two-Factor Authentication"
                    description="Require 2FA for admin accounts when logging in"
                    enabled={security.twoFactor}
                    onChange={v => setSecurity(s => ({ ...s, twoFactor: v }))}
                  />
                  <SecurityToggle
                    label="Auto Session Timeout"
                    description="Automatically log out inactive users after 30 minutes"
                    enabled={security.autoLogout}
                    onChange={v => setSecurity(s => ({ ...s, autoLogout: v }))}
                  />
                  <SecurityToggle
                    label="Audit Logs"
                    description="Track all admin actions with timestamps and IP addresses"
                    enabled={security.auditLogs}
                    onChange={v => setSecurity(s => ({ ...s, auditLogs: v }))}
                  />
                  <SecurityToggle
                    label="IP Whitelist"
                    description="Restrict admin access to approved IP addresses only"
                    enabled={security.ipWhitelist}
                    onChange={v => setSecurity(s => ({ ...s, ipWhitelist: v }))}
                  />
                </div>
              </div>

              {/* Security Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Security Score</p>
                    <p className="text-xs text-slate-500 mt-0.5">Based on your current security configuration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-600">
                      {Math.round((Object.values(security).filter(Boolean).length / Object.values(security).length) * 100)}%
                    </p>
                    <p className="text-xs text-emerald-500">Security rating</p>
                  </div>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(Object.values(security).filter(Boolean).length / Object.values(security).length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  {Object.values(security).filter(Boolean).length} of {Object.values(security).length} security features enabled
                </p>
              </div>

              <button
                onClick={() => toast.success('Security settings saved')}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <Save size={14} /> Save Security Settings
              </button>
            </div>
          )}

          {/* ── BILLING TAB ── */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              {/* Current Plan Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -translate-y-10 translate-x-10" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Current Plan</p>
                      <h3 className="text-2xl font-bold">Enterprise Pro</h3>
                      <p className="text-slate-400 text-sm mt-1">Unlimited residents · All features · Priority support</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">₹2,999</span>
                    <span className="text-slate-400 text-sm mb-1">/month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Next renewal: January 1, 2026</p>
                </div>
              </div>

              {/* Billing Info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Landmark size={14} className="text-emerald-500" /> Billing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Billing Contact Name', placeholder: 'Riti Rai' },
                    { label: 'GST Number', placeholder: '22AAAAA0000A1Z5' },
                    { label: 'Billing Email', placeholder: 'billing@society.com' },
                    { label: 'PAN Number', placeholder: 'AAAAA0000A' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-emerald-500" /> Invoice History
                </h3>
                <div className="space-y-2">
                  {[
                    { month: 'December 2024', amount: '₹2,999', status: 'Paid', date: 'Dec 1, 2024' },
                    { month: 'November 2024', amount: '₹2,999', status: 'Paid', date: 'Nov 1, 2024' },
                    { month: 'October 2024',  amount: '₹2,999', status: 'Paid', date: 'Oct 1, 2024' },
                  ].map(inv => (
                    <div key={inv.month} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{inv.month}</p>
                        <p className="text-xs text-slate-400">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-slate-800">{inv.amount}</span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle size={10} /> {inv.status}
                        </span>
                        <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                          <Download size={12} /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => toast.success('Billing details saved')}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                <Save size={14} /> Save Billing Details
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
