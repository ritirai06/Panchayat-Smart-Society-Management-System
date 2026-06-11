import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  Wrench, Zap, Shield, ArrowUpCircle, Car, Trash2, Volume2, HelpCircle,
  Plus, Search, X, MessageSquare, User, Image, AlertTriangle, Eye, Mic, MicOff,
  KanbanSquare, Table, Clock, List
} from 'lucide-react'
import AppModal from '../components/ui/AppModal'

const CATEGORIES = ['Plumbing', 'Electricity', 'Security', 'Lift', 'Parking', 'Cleanliness', 'Noise', 'Other']
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

const catIcon = {
  Plumbing: Wrench,
  Electricity: Zap,
  Security: Shield,
  Lift: ArrowUpCircle,
  Parking: Car,
  Cleanliness: Trash2,
  Noise: Volume2,
  Other: HelpCircle,
}

const statusStyle = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Resolved: 'badge-resolved',
  Closed: 'badge-closed',
}

const priorityStyle = {
  Critical: 'badge-danger',
  High: 'badge-high',
  Medium: 'badge-warning',
  Low: 'badge-low',
}

const emptyForm = { title: '', description: '', category: 'Other', priority: 'Medium' }

export default function Complaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table' | 'timeline'
  const [filter, setFilter] = useState({ status: '', category: '', priority: '', search: '' })
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceTicket, setVoiceTicket] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [comment, setComment] = useState('')
  const [staffList, setStaffList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const societyId = user?.society?._id || user?.society
  const isAdmin = user?.role === 'admin'

  const fetchComplaints = useCallback(async () => {
    if (!societyId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.category) params.append('category', filter.category)
      if (filter.priority) params.append('priority', filter.priority)
      if (filter.search) params.append('search', filter.search)
      const { data } = await api.get(`/complaints/society/${societyId}?${params}`)
      setComplaints(data.complaints || [])
    } catch { toast.error('Failed to load complaints') }
    finally { setLoading(false) }
  }, [societyId, filter])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])
  useEffect(() => { const t = setTimeout(() => fetchComplaints(), 400); return () => clearTimeout(t) }, [filter.search])
  
  useEffect(() => {
    if (isAdmin && societyId) api.get(`/auth/staff/${societyId}`).then(({ data }) => setStaffList(data.staff || [])).catch(() => {})
  }, [isAdmin, societyId])

  const submitComplaint = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries({ ...form, societyId }).forEach(([k, v]) => formData.append(k, v))
      images.forEach(img => formData.append('images', img))
      await api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Complaint raised!')
      setModal(null); setForm(emptyForm); setImages([]); fetchComplaints()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const confirmVoiceTicket = async () => {
    setSubmitting(true)
    try {
      await api.post('/complaints', { ...voiceTicket, societyId })
      toast.success('Voice complaint submitted!')
      setModal(null); setVoiceTicket(null); setTranscript(''); fetchComplaints()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const updateComplaint = async (id, updates) => {
    try {
      const { data } = await api.put(`/complaints/${id}`, updates)
      toast.success('Updated!')
      setSelectedComplaint(data.complaint); fetchComplaints()
    } catch { toast.error('Failed') }
  }

  const addComment = async () => {
    if (!comment.trim()) return
    await updateComplaint(selectedComplaint._id, { comment }); setComment('')
  }

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Speech recognition not supported'); return }
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-IN'
    r.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text); setRecording(false)
      try {
        const { data } = await api.post('/ai/voice-to-ticket', { transcript: text, societyId })
        setVoiceTicket(data.ticket); setModal('voice')
        toast.success('Voice processed! Review before submitting.')
      } catch { toast.error('AI processing failed') }
    }
    r.onerror = () => { setRecording(false); toast.error('Recording failed') }
    r.onend = () => setRecording(false)
    recognitionRef.current = r; r.start(); setRecording(true)
  }

  const stopRecording = () => { recognitionRef.current?.stop(); setRecording(false) }
  const hasFilters = filter.status || filter.category || filter.priority || filter.search

  // Get matching icon for category
  const getCategoryIcon = (category) => {
    const IconComponent = catIcon[category] || HelpCircle
    return <IconComponent size={14} className="text-slate-400" />
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complaints & Operations</h2>
          <p className="text-sm text-slate-500 mt-0.5">{complaints.length} issue tickets logged</p>
        </div>
        <div className="flex gap-2">
          <button onClick={recording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${recording ? 'bg-rose-500 text-white animate-pulse' : 'btn-secondary'}`}>
            {recording ? <><MicOff size={14} /> Stop</> : <><Mic size={14} /> Voice Ticket</>}
          </button>
          <button onClick={() => { setModal('create'); setForm(emptyForm) }} className="btn-primary text-xs">
            <Plus size={14} /> New Complaint
          </button>
        </div>
      </div>

      {/* Filter and View mode selectors */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Search & Filters */}
        <div className="flex gap-2.5 flex-wrap items-center flex-1 min-w-[320px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input className="input pl-9 text-xs py-2" placeholder="Search tickets..."
              value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          {[
            { key: 'status', opts: STATUSES, placeholder: 'All Status' },
            { key: 'category', opts: CATEGORIES, placeholder: 'All Categories' },
            { key: 'priority', opts: PRIORITIES, placeholder: 'All Priorities' },
          ].map(({ key, opts, placeholder }) => (
            <select key={key} className="input w-auto text-xs py-2" value={filter[key]} onChange={e => setFilter({ ...filter, [key]: e.target.value })}>
              <option value="">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          {hasFilters && (
            <button onClick={() => setFilter({ status: '', category: '', priority: '', search: '' })} className="btn-secondary text-xs py-2">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-shrink-0 self-end lg:self-auto">
          {[
            { id: 'kanban', icon: KanbanSquare, label: 'Kanban' },
            { id: 'table', icon: Table, label: 'Table' },
            { id: 'timeline', icon: Clock, label: 'Timeline' },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === v.id ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <v.icon size={13} />
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map(colStatus => {
            const list = complaints.filter(c => c.status === colStatus)
            return (
              <div key={colStatus} className="space-y-3 bg-slate-50/50 p-4 rounded-[20px] border border-slate-100/80 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{colStatus}</span>
                  <span className="text-[10px] font-bold bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="text-center py-10 text-[11px] text-slate-400 font-medium">No tickets in this phase.</div>
                  ) : (
                    list.map(c => (
                      <div key={c._id} onClick={() => { setSelectedComplaint(c); setModal('detail') }}
                        className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow hover:border-slate-200 transition-all cursor-pointer space-y-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`${priorityStyle[c.priority || 'Medium']}`}>{c.priority}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            {getCategoryIcon(c.category)}
                            {c.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{c.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{c.description}</p>
                        
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                          <span className="truncate max-w-[100px]">Flat {c.flat?.flatNumber || 'N/A'}</span>
                          <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table List View */}
      {viewMode === 'table' && (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-head">Issue Ticket</th>
                <th className="table-head">Category</th>
                <th className="table-head">Raised By</th>
                <th className="table-head">Date Logged</th>
                <th className="table-head">Priority</th>
                <th className="table-head">Status</th>
                <th className="table-head text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">No tickets match this filter query.</td>
                </tr>
              ) : (
                complaints.map(c => (
                  <tr key={c._id} onClick={() => { setSelectedComplaint(c); setModal('detail') }} className="table-row cursor-pointer">
                    <td className="table-cell">
                      <div>
                        <p className="font-bold text-slate-800">{c.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{c.description}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        {getCategoryIcon(c.category)}
                        {c.category}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">{c.raisedBy?.name}</span>
                        <p className="text-[9px] text-slate-400">Flat {c.flat?.flatNumber || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="table-cell text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-cell">
                      <span className={priorityStyle[c.priority || 'Medium']}>{c.priority}</span>
                    </td>
                    <td className="table-cell">
                      <span className={statusStyle[c.status]}>{c.status}</span>
                    </td>
                    <td className="table-cell text-right" onClick={e => e.stopPropagation()}>
                      {isAdmin && c.status !== 'Resolved' && c.status !== 'Closed' ? (
                        <select value={c.status}
                          onChange={e => updateComplaint(c._id, { status: e.target.value })}
                          className="input w-auto text-xs py-1 px-2">
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline List View */}
      {viewMode === 'timeline' && (
        <div className="card space-y-5">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Chronological Operations Tracker</p>
          <div className="relative border-l border-slate-100 pl-6 space-y-6 ml-2">
            {complaints.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs font-medium">No historical logs found.</p>
            ) : (
              complaints.map(c => (
                <div key={c._id} onClick={() => { setSelectedComplaint(c); setModal('detail') }} className="relative cursor-pointer group">
                  <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white ring-2 ring-slate-100 group-hover:bg-brand transition-colors" />
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all space-y-2">
                    <div className="flex justify-between items-center flex-wrap gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className={statusStyle[c.status]}>{c.status}</span>
                        <span className="font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {getCategoryIcon(c.category)}
                          {c.category}
                        </span>
                      </div>
                      <span className="text-slate-400 font-semibold">{new Date(c.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 leading-snug">{c.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">Raised by {c.raisedBy?.name} (Flat {c.flat?.flatNumber || 'N/A'})</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <AppModal
        open={modal === 'create'}
        onClose={() => { setModal(null); setImages([]) }}
        title="Raise Operations Ticket"
      >
            <form onSubmit={submitComplaint} className="space-y-4">
              <div>
                <label className="input-label">Issue Summary</label>
                <input className="input" placeholder="e.g. Lift doors not opening properly" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="input-label">Details & Notes</label>
                <textarea className="input resize-none text-xs" rows={3} placeholder="Please specify floor or unit numbers..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Category</label>
                  <select className="input text-xs" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Priority Level</label>
                  <select className="input text-xs" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Attach Photos (max 5)</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => setImages(Array.from(e.target.files).slice(0, 5))} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs text-brand hover:text-brand-dark border border-dashed border-slate-200 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-slate-50 transition-colors font-bold">
                  <Image size={14} /> {images.length ? `${images.length} photo(s) selected` : 'Click to select pictures'}
                </button>
                {images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {images.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(img)} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-slate-100" />
                        <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px]">
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setModal(null); setImages([]) }} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center text-xs font-bold" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
      </AppModal>

      {/* Voice Review Modal */}
      <AppModal
        open={modal === 'voice' && !!voiceTicket}
        onClose={() => { setModal(null); setVoiceTicket(null) }}
        title="Confirm Voice Ticket"
      >
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-bold mb-1 flex items-center gap-1.5"><Mic size={12} /> Speech Transcript</p>
                <p className="italic text-amber-700 font-medium">"{transcript}"</p>
              </div>
              <div>
                <label className="input-label">Title Summary</label>
                <input className="input" value={voiceTicket.title} onChange={e => setVoiceTicket({ ...voiceTicket, title: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Detailed Notes</label>
                <textarea className="input resize-none text-xs" rows={3} value={voiceTicket.description}
                  onChange={e => setVoiceTicket({ ...voiceTicket, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Category</label>
                  <select className="input text-xs" value={voiceTicket.category} onChange={e => setVoiceTicket({ ...voiceTicket, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Priority</label>
                  <select className="input text-xs" value={voiceTicket.priority} onChange={e => setVoiceTicket({ ...voiceTicket, priority: e.target.value })}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setModal(null); setVoiceTicket(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button onClick={confirmVoiceTicket} className="btn-primary flex-1 justify-center text-xs font-bold" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
      </AppModal>

      {/* Ticket Details Drawer */}
      {modal === 'detail' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-slide-in-r">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Details</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5 truncate max-w-[320px]">{selectedComplaint.title}</h3>
              </div>
              <button onClick={() => { setModal(null); setSelectedComplaint(null) }} className="btn-icon"><X size={18} /></button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={statusStyle[selectedComplaint.status]}>{selectedComplaint.status}</span>
                <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {selectedComplaint.category}
                </span>
                <span className={priorityStyle[selectedComplaint.priority || 'Medium']}>{selectedComplaint.priority}</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Notes & Logs</p>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border p-4 rounded-2xl font-medium">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.images?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="input-label">Attachments</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedComplaint.images.map((url, i) => (
                      <button key={i} type="button" onClick={() => setPreviewImage(url)} className="group relative">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200 group-hover:opacity-85 transition-opacity" />
                        <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border rounded-2xl p-4 text-xs font-semibold">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1.5">Raised By</p>
                  <p className="font-bold text-slate-800">{selectedComplaint.raisedBy?.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedComplaint.raisedBy?.email}</p>
                </div>
                <div className="bg-slate-50 border rounded-2xl p-4 text-xs font-semibold">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1.5">Timestamp</p>
                  <p className="font-bold text-slate-800">{new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN')}</p>
                  {selectedComplaint.resolvedAt && <p className="text-emerald-600 text-[9px] mt-0.5">Closed {new Date(selectedComplaint.resolvedAt).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Dispatch Controls</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Update Status</label>
                      <select className="input text-xs" value={selectedComplaint.status}
                        onChange={e => updateComplaint(selectedComplaint._id, { status: e.target.value })}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    {staffList.length > 0 && (
                      <div>
                        <label className="input-label">Assign to Staff</label>
                        <select className="input text-xs" value={selectedComplaint.assignedTo?._id || ''}
                          onChange={e => updateComplaint(selectedComplaint._id, { assignedTo: e.target.value })}>
                          <option value="">Unassigned</option>
                          {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Feed */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Comments {selectedComplaint.comments?.length > 0 && `(${selectedComplaint.comments.length})`}
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {selectedComplaint.comments?.length === 0 && (
                    <p className="text-slate-400 text-xs py-4 text-center font-medium">No comments posted yet.</p>
                  )}
                  {selectedComplaint.comments?.map((c, i) => (
                    <div key={i} className="bg-slate-50 border p-3 rounded-2xl text-xs font-semibold">
                      <p className="text-slate-700 leading-relaxed">{c.text}</p>
                      <p className="text-[9px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1 text-xs" placeholder="Add response notes..."
                    value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()} />
                  <button onClick={addComment} className="btn-primary px-4 py-2.5 text-xs font-bold">Post</button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100">
              <button onClick={() => { setModal(null); setSelectedComplaint(null) }} className="w-full btn-secondary justify-center py-2 text-xs font-semibold">
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Overlay */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 btn-secondary py-1.5 px-3 text-xs font-bold border-none" onClick={() => setPreviewImage(null)}>
            Close Preview
          </button>
          <img
            src={previewImage}
            alt="Ticket attachment preview"
            className="max-h-[88vh] max-w-[92vw] rounded-2xl border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
