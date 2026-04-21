import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiMic, FiMicOff, FiSearch, FiX, FiMessageSquare, FiUser, FiImage, FiAlertCircle, FiEye } from 'react-icons/fi'

const CATEGORIES = ['Plumbing', 'Electricity', 'Security', 'Lift', 'Parking', 'Cleanliness', 'Noise', 'Other']
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const statusBadge = (s) => ({ Open: 'badge-open', 'In Progress': 'badge-progress', Resolved: 'badge-resolved', Closed: 'badge-closed' }[s] || 'badge-open')
const priorityBadge = (p) => ({ Urgent: 'badge-urgent', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[p] || 'badge-low')

const Modal = ({ title, onClose, children, size = 'md' }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-scale-in`}>
      <div className="flex items-center justify-between p-6 border-b border-zinc-100">
        <h3 className="font-bold text-lg text-zinc-900">{title}</h3>
        <button onClick={onClose} className="btn-icon"><FiX size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

const emptyForm = { title: '', description: '', category: 'Other', priority: 'Medium' }

export default function Complaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
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
      setComplaints(data.complaints)
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="section-title">Complaints</h2>
          <p className="section-sub">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={recording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${recording ? 'bg-red-500 text-white animate-pulse' : 'btn-secondary'}`}>
            {recording ? <><FiMicOff size={14} /> Stop</> : <><FiMic size={14} /> Voice Ticket</>}
          </button>
          <button onClick={() => { setModal('create'); setForm(emptyForm) }} className="btn-primary">
            <FiPlus size={14} /> New Complaint
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input className="input pl-9" placeholder="Search complaints..."
            value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
        </div>
        {[
          { key: 'status', opts: STATUSES, placeholder: 'All Status' },
          { key: 'category', opts: CATEGORIES, placeholder: 'All Categories' },
          { key: 'priority', opts: PRIORITIES, placeholder: 'All Priority' },
        ].map(({ key, opts, placeholder }) => (
          <select key={key} className="input w-auto text-sm" value={filter[key]} onChange={e => setFilter({ ...filter, [key]: e.target.value })}>
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {hasFilters && (
          <button onClick={() => setFilter({ status: '', category: '', priority: '', search: '' })} className="btn-secondary text-sm">
            <FiX size={13} /> Clear
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {complaints.length === 0 && (
          <div className="card text-center py-14">
            <div className="w-12 h-12 bg-zinc-50 ring-1 ring-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FiAlertCircle className="text-zinc-300 text-xl" />
            </div>
            <p className="text-zinc-500 font-semibold">{hasFilters ? 'No complaints match your filters' : 'No complaints yet'}</p>
          </div>
        )}
        {complaints.map(c => (
          <div key={c._id} className="card hover:shadow-md hover:border-emerald-100 cursor-pointer transition-all duration-150"
            onClick={() => { setSelectedComplaint(c); setModal('detail') }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={statusBadge(c.status)}>{c.status}</span>
                  <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{c.category}</span>
                  <span className={priorityBadge(c.priority)}>{c.priority}</span>
                  {c.images?.length > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <FiImage size={10} />
                      {c.images.length} photo{c.images.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-zinc-900">{c.title}</h4>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-1">{c.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 flex-wrap">
                  <span className="flex items-center gap-1"><FiUser size={10} /> {c.raisedBy?.name}</span>
                  {c.flat && <span>Flat {c.flat?.flatNumber}</span>}
                  <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  {c.comments?.length > 0 && <span className="flex items-center gap-1"><FiMessageSquare size={10} /> {c.comments.length}</span>}
                </div>
              </div>
              <div className="flex items-start gap-2.5 flex-shrink-0">
                {c.images?.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(c.images[0]) }}
                    className="group relative"
                    title="Preview image"
                  >
                    <img
                      src={c.images[0]}
                      alt="Complaint preview"
                      className="w-14 h-14 object-cover rounded-xl border border-zinc-200 transition-opacity group-hover:opacity-80"
                    />
                    <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                    </span>
                  </button>
                )}
                {isAdmin && c.status !== 'Resolved' && c.status !== 'Closed' && (
                  <select value={c.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); updateComplaint(c._id, { status: e.target.value }) }}
                    className="input w-auto text-sm flex-shrink-0">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Raise Complaint" onClose={() => { setModal(null); setImages([]) }}>
          <form onSubmit={submitComplaint} className="space-y-4">
            <div><label className="input-label">Title</label>
              <input className="input" placeholder="Brief description of the issue" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="input-label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Detailed description..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="input-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
            <div>
              <label className="input-label">Attach Photos (max 5)</label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => setImages(Array.from(e.target.files).slice(0, 5))} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 border border-dashed border-emerald-200 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-emerald-50 transition-colors font-medium">
                <FiImage size={14} /> {images.length ? `${images.length} photo(s) selected` : 'Click to attach photos'}
              </button>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(img)} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-zinc-100" />
                      <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <FiX size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setModal(null); setImages([]) }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Voice Modal */}
      {modal === 'voice' && voiceTicket && (
        <Modal title="Voice Ticket — Review & Confirm" onClose={() => { setModal(null); setVoiceTicket(null) }}>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1 flex items-center gap-1.5"><FiMic size={13} /> Transcript</p>
              <p className="italic text-amber-700">"{transcript}"</p>
            </div>
            <div><label className="input-label">Title</label>
              <input className="input" value={voiceTicket.title} onChange={e => setVoiceTicket({ ...voiceTicket, title: e.target.value })} /></div>
            <div><label className="input-label">Description</label>
              <textarea className="input resize-none" rows={3} value={voiceTicket.description}
                onChange={e => setVoiceTicket({ ...voiceTicket, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="input-label">Category</label>
                <select className="input" value={voiceTicket.category} onChange={e => setVoiceTicket({ ...voiceTicket, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="input-label">Priority</label>
                <select className="input" value={voiceTicket.priority} onChange={e => setVoiceTicket({ ...voiceTicket, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setModal(null); setVoiceTicket(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={confirmVoiceTicket} className="btn-primary flex-1 justify-center" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selectedComplaint && (
        <Modal title="Complaint Details" onClose={() => { setModal(null); setSelectedComplaint(null) }} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={statusBadge(selectedComplaint.status)}>{selectedComplaint.status}</span>
              <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedComplaint.category}</span>
              <span className={priorityBadge(selectedComplaint.priority)}>{selectedComplaint.priority}</span>
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-lg">{selectedComplaint.title}</h4>
              <p className="text-zinc-600 mt-2 text-sm leading-relaxed">{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.images?.length > 0 && (
              <div>
                <p className="input-label mb-2">Attached Photos</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedComplaint.images.map((url, i) => (
                    <button key={i} type="button" onClick={() => setPreviewImage(url)} className="group relative">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-zinc-100 group-hover:opacity-80 transition-opacity" />
                      <span className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-zinc-400 text-xs mb-1">Raised By</p>
                <p className="font-semibold text-zinc-900 text-sm">{selectedComplaint.raisedBy?.name}</p>
                <p className="text-zinc-400 text-xs">{selectedComplaint.raisedBy?.email}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3">
                <p className="text-zinc-400 text-xs mb-1">Date</p>
                <p className="font-semibold text-zinc-900 text-sm">{new Date(selectedComplaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {selectedComplaint.resolvedAt && <p className="text-emerald-600 text-xs mt-0.5">Resolved {new Date(selectedComplaint.resolvedAt).toLocaleDateString('en-IN')}</p>}
              </div>
            </div>
            {isAdmin && (
              <div className="border-t border-zinc-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-700">Admin Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="input-label">Update Status</label>
                    <select className="input text-sm" value={selectedComplaint.status}
                      onChange={e => updateComplaint(selectedComplaint._id, { status: e.target.value })}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                  {staffList.length > 0 && (
                    <div><label className="input-label">Assign to Staff</label>
                      <select className="input text-sm" value={selectedComplaint.assignedTo?._id || ''}
                        onChange={e => updateComplaint(selectedComplaint._id, { assignedTo: e.target.value })}>
                        <option value="">Unassigned</option>
                        {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select></div>
                  )}
                </div>
              </div>
            )}
            <div className="border-t border-zinc-100 pt-4">
              <p className="text-sm font-semibold text-zinc-700 mb-3">
                Comments {selectedComplaint.comments?.length > 0 && `(${selectedComplaint.comments.length})`}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {selectedComplaint.comments?.length === 0 && <p className="text-zinc-400 text-sm">No comments yet</p>}
                {selectedComplaint.comments?.map((c, i) => (
                  <div key={i} className="bg-zinc-50 rounded-xl p-3 text-sm">
                    <p className="text-zinc-800">{c.text}</p>
                    <p className="text-xs text-zinc-400 mt-1">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" placeholder="Add a comment..."
                  value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()} />
                <button onClick={addComment} className="btn-primary px-4">Post</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 btn-secondary py-1.5 px-3" onClick={() => setPreviewImage(null)}>
            <FiX size={14} />
            Close
          </button>
          <img
            src={previewImage}
            alt="Complaint attachment preview"
            className="max-h-[88vh] max-w-[92vw] rounded-2xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
