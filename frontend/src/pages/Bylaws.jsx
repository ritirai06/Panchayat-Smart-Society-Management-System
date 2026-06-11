import { useState, useEffect } from 'react'
import { Search, BookOpen, Edit, Plus, Trash2, Calendar, User, Sparkles, BookOpenCheck, History, ArrowRight, X } from 'lucide-react'
import toast from 'react-hot-toast'

const INITIAL_RULES = [
  { id: 1, category: 'Parking', title: 'Speed Limit inside Premises', content: 'All vehicles must maintain a strict speed limit of under 10 km/h within the society driveways. Violations attract a fine of ₹500.', lastUpdated: '2026-04-12', author: 'Alok Gupta', version: 'v1.2' },
  { id: 2, category: 'Parking', title: 'Visitor Parking Slots', content: 'Visitor parking is reserved only for registered guests for a maximum of 24 hours. Vehicles parked without a gate pass will be towed.', lastUpdated: '2026-03-10', author: 'Alok Gupta', version: 'v1.0' },
  { id: 3, category: 'Visitor', title: 'Delivery Personnel Verification', content: 'All courier and food delivery executives must register at the gate, scan the guard code, and wait for resident digital approval before entry.', lastUpdated: '2026-05-01', author: 'Alok Gupta', version: 'v2.0' },
  { id: 4, category: 'Pets', title: 'Leash and Cleanup Rules', content: 'Pets must be on a leash in common areas at all times. Owners are strictly responsible for cleaning pet waste; failure to do so attracts a penalty of ₹1,000.', lastUpdated: '2026-02-15', author: 'Alok Gupta', version: 'v1.1' },
  { id: 5, category: 'Maintenance', title: 'Monthly Dues Payment Timeline', content: 'Maintenance dues are issued on the 1st of every month and are payable by the 10th. Payments received after the 15th attract a late fee of 1.5% compounding weekly.', lastUpdated: '2026-05-10', author: 'Alok Gupta', version: 'v1.5' },
  { id: 6, category: 'Security', title: 'Loud Music and Quiet Hours', content: 'Quiet hours are observed from 10 PM to 7 AM. Loud parties, drilling, or general construction noise are strictly prohibited during this time.', lastUpdated: '2026-01-20', author: 'Alok Gupta', version: 'v1.0' },
  { id: 7, category: 'Facilities', title: 'Clubhouse and Pool Timings', content: 'Swimming Pool timings: 6 AM to 10 AM, and 4 PM to 8 PM. Closed on Mondays for filtration. Clubhouse is open from 6 AM to 10 PM daily.', lastUpdated: '2026-04-05', author: 'Alok Gupta', version: 'v1.3' },
]

const CATEGORIES = ['All', 'Parking', 'Visitor', 'Maintenance', 'Pets', 'Security', 'Facilities']

const AI_QA_PAIRS = [
  { keywords: ['gym', 'timing', 'time', 'hours'], answer: 'Gym timings are from 6:00 AM to 10:00 PM daily. Please carry a clean pair of athletic shoes.' },
  { keywords: ['payment', 'due', 'date', 'late'], answer: 'Monthly maintenance is due by the 10th of every month. Late payments after the 15th attract a 1.5% late fee penalty.' },
  { keywords: ['pet', 'dog', 'waste', 'leash'], answer: 'Pets must be kept on a leash in common courtyards. Failure to clean pet waste carries a fine of ₹1,000.' },
  { keywords: ['parking', 'speed', 'limit'], answer: 'Vehicles must maintain a speed limit of under 10 km/h inside driveways. Visitor parking is capped at 24 hours.' },
  { keywords: ['music', 'loud', 'party', 'night'], answer: 'Quiet hours are from 10:00 PM to 7:00 AM. Loud speakers or heavy noises are prohibited during this interval.' },
  { keywords: ['pool', 'swim', 'swimming'], answer: 'Swimming pool timings are 6 AM - 10 AM, and 4 PM - 8 PM. Pool is closed on Mondays for chemical maintenance.' }
]

export default function Bylaws() {
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('panchayat_rules')
    return saved ? JSON.parse(saved) : INITIAL_RULES
  })

  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  
  const [form, setForm] = useState({ title: '', category: 'Parking', content: '' })

  useEffect(() => {
    localStorage.setItem('panchayat_rules', JSON.stringify(rules))
  }, [rules])

  const handleSearchAi = (e) => {
    e.preventDefault()
    if (!aiQuery.trim()) return

    setLoadingAi(true)
    setAiAnswer('')

    setTimeout(() => {
      const q = aiQuery.toLowerCase()
      const match = AI_QA_PAIRS.find(pair => pair.keywords.some(k => q.includes(k)))
      
      if (match) {
        setAiAnswer(match.answer)
      } else {
        // Fallback search in rule contents
        const localMatch = rules.find(r => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))
        if (localMatch) {
          setAiAnswer(`According to Bylaw Section "${localMatch.title}": ${localMatch.content}`)
        } else {
          setAiAnswer('I could not find a specific rule matching your query. Please ask about parking speed, gym timings, pet cleanup, late fees, quiet hours, or pool schedules.')
        }
      }
      setLoadingAi(false)
    }, 800)
  }

  const handleSaveRule = (e) => {
    e.preventDefault()
    if (!form.title || !form.content) {
      toast.error('Please enter a title and content')
      return
    }

    if (editingRule) {
      // Edit existing
      setRules(prev => prev.map(r => r.id === editingRule.id ? { 
        ...r, 
        title: form.title, 
        category: form.category, 
        content: form.content,
        lastUpdated: new Date().toISOString().slice(0, 10),
        version: `v${(parseFloat(r.version.substring(1)) + 0.1).toFixed(1)}`
      } : r))
      toast.success('Bylaw updated successfully')
    } else {
      // Create new
      const newRule = {
        id: Date.now(),
        title: form.title,
        category: form.category,
        content: form.content,
        lastUpdated: new Date().toISOString().slice(0, 10),
        author: 'Alok Gupta',
        version: 'v1.0'
      }
      setRules([newRule, ...rules])
      toast.success('New bylaw published successfully')
    }

    setEditorOpen(false)
    setEditingRule(null)
    setForm({ title: '', category: 'Parking', content: '' })
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)
    setForm({ title: rule.title, category: rule.category, content: rule.content })
    setEditorOpen(true)
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to archive this rule?')) return
    setRules(prev => prev.filter(r => r.id !== id))
    toast.error('Bylaw archived')
  }

  const filteredRules = rules.filter(r => {
    const catMatch = activeCategory === 'All' || r.category === activeCategory
    const searchMatch = !searchQuery || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.content.toLowerCase().includes(searchQuery.toLowerCase())
    return catMatch && searchMatch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Society Bylaws</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage and review rules, guidelines, and penalty structures</p>
        </div>
        <button onClick={() => { setEditingRule(null); setForm({ title: '', category: 'Parking', content: '' }); setEditorOpen(true) }} className="btn-primary">
          <Plus size={16} /> Publish Bylaw
        </button>
      </div>

      {/* AI Search Hub */}
      <div className="card border border-emerald-100 bg-gradient-to-br from-emerald-50/20 to-teal-50/20 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 shadow-sm">
            <Sparkles size={16} className="text-brand animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Rule Search</h3>
            <p className="text-xs text-slate-400 mt-0.5">Quickly query rules in plain English (e.g., "gym timings", "pet policy")</p>
          </div>
        </div>

        <form onSubmit={handleSearchAi} className="flex gap-2">
          <input 
            className="input text-xs" 
            placeholder="Ask AI: What are swimming pool quiet hours? Or how much is pet fine?" 
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
          />
          <button type="submit" disabled={loadingAi} className="btn-primary px-4 whitespace-nowrap text-xs">
            {loadingAi ? 'Searching...' : 'Ask Assistant'}
          </button>
        </form>

        {aiAnswer && (
          <div className="mt-4 p-4 bg-white border border-emerald-100/60 rounded-xl space-y-1.5 shadow-sm animate-slide-up">
            <p className="text-[10px] uppercase font-bold text-brand flex items-center gap-1.5">
              <Sparkles size={11} /> AI Assistant Response
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{aiAnswer}</p>
          </div>
        )}
      </div>

      {/* Main Grid: Filter List + Accordion/Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Side Panel */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-400 px-2">Categories</p>
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeCategory === cat 
                    ? 'bg-brand/10 text-brand' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}>
                📁 {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Container */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              className="input pl-9 text-xs" 
              placeholder="Search bylaw regulations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredRules.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">No bylaw clauses match this filter set.</div>
            ) : (
              filteredRules.map((rule) => (
                <div key={rule.id} className="card p-5 border border-slate-100/80 hover:border-slate-200 shadow-sm hover:shadow transition-all relative">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge-brand">{rule.category}</span>
                        <span className="text-[10px] font-mono text-slate-400">{rule.version}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{rule.title}</h4>
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => handleEdit(rule)} className="p-1 text-slate-400 hover:text-brand rounded-lg hover:bg-slate-50 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-50 font-medium">
                    {rule.content}
                  </p>

                  <div className="mt-4 flex gap-4 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1"><User size={10} /> Edited by {rule.author}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> Last updated {rule.lastUpdated}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-[24px] border border-slate-200 shadow-modal animate-scale-in p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingRule ? `Revise Clause: ${editingRule.version}` : 'Publish New Bylaw Clause'}
              </h3>
              <button onClick={() => setEditorOpen(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="input-label">Clause Title</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Quiet Hours Limit" 
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Category</label>
                  <select 
                    className="input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Author Identity</label>
                  <input className="input" value="Alok Gupta" disabled />
                </div>
              </div>

              <div>
                <label className="input-label">Clause Content</label>
                <textarea 
                  className="input resize-none font-sans text-xs" 
                  rows={6}
                  placeholder="Describe the rule, boundaries, and penalty details in detail..." 
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  required 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditorOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Publish Clause</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
