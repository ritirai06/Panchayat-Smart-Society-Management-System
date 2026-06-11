import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Bot, Send, BookOpen, MessageSquare, Zap, Mic, MicOff, Sparkles, MapPin, Building2, Trash2, History, Plus } from 'lucide-react'

const QUICK = [
  { text: 'What are gym timings?', category: 'Facilities' },
  { text: 'Show pending payments.', category: 'Payments' },
  { text: 'Visitor gate policy.', category: 'Security' },
  { text: 'Parking speed limits.', category: 'Parking' },
  { text: 'Complaint status review.', category: 'Tickets' }
]

const MOCK_HISTORY = [
  { id: 1, title: 'Gym opening hours query', timestamp: '1 hour ago' },
  { id: 2, title: 'Dues calculation breakdown', timestamp: 'Yesterday' },
  { id: 3, title: 'Intruder security gate bylaws', timestamp: '3 days ago' },
]

const TypingDots = () => (
  <div className="flex gap-1.5 px-1 py-1">
    {[0, 150, 300].map((d) => (
      <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-350" style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
    ))}
  </div>
)

const renderText = (text) => {
  if (!text) return text
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) => (
    i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{p}</strong> : p
  ))
}

const getWelcomeMessage = (societyName) => (
  societyName
    ? `Hi! I'm Panchayat AI for ${societyName}. Ask me anything about rules, dues, amenity timings, or raise a ticket.`
    : 'Hi! I am Panchayat AI. Ask me anything about your society, dues, amenities, or complaints.'
)

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('chat') // 'chat' | 'bylaw'
  const [recording, setRecording] = useState(false)
  const [society, setSociety] = useState(null)
  const [historyList, setHistoryList] = useState(MOCK_HISTORY)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const societyId = user?.society?._id || user?.society

  useEffect(() => {
    if (!societyId) return
    api.get(`/societies/${societyId}`)
      .then(({ data }) => {
        setSociety(data.society)
        setMessages([{ role: 'assistant', content: getWelcomeMessage(data.society?.name) }])
      })
      .catch(() => {
        setMessages([{ role: 'assistant', content: getWelcomeMessage('') }])
      })
  }, [societyId])

  useEffect(() => {
    if (messages.length === 0) setMessages([{ role: 'assistant', content: getWelcomeMessage(society?.name) }])
  }, [messages.length, society?.name])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    // Add to simulated history list
    if (messages.length <= 1) {
      setHistoryList([{ id: Date.now(), title: msg.length > 28 ? msg.substring(0, 28) + '...' : msg, timestamp: 'Just now' }, ...historyList])
    }

    try {
      const endpoint = mode === 'bylaw' ? '/ai/bylaw' : '/ai/chat'
      const payload = mode === 'bylaw' ? { question: msg, societyId } : { message: msg, societyId }
      const { data } = await api.post(endpoint, payload)
      const reply = (mode === 'bylaw' ? data.answer : data.reply) || 'Sorry, I could not generate a response. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, fallback: data.fallback }])
    } catch (err) {
      const serverMsg = err?.response?.data?.answer || err?.response?.data?.message
      setMessages((prev) => [...prev, { role: 'assistant', content: serverMsg || 'Sorry, I am having trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const isSpeechSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition) && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast.error('Speech recognition not supported in this browser. Use Chrome or Edge.')
      return
    }
    const r = new SR()
    r.lang = 'en-IN'
    r.continuous = false
    r.interimResults = false
    r.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setRecording(false)
    }
    r.onerror = (e) => {
      setRecording(false)
      console.error('[Speech] error:', e.error)
      if (e.error === 'not-allowed') toast.error('Microphone blocked. Allow microphone access in address bar.')
      else if (e.error === 'network') toast.error('Speech recognition needs internet connection.')
      else if (e.error === 'no-speech') toast('No speech detected. Try again.')
      else toast.error(`Mic error: ${e.error || 'unknown'}. Try typing instead.`)
    }
    r.onend = () => setRecording(false)
    recognitionRef.current = r
    try {
      r.start()
      setRecording(true)
    } catch (err) {
      console.error('[Speech] start error:', err)
      toast.error('Could not start recording. Please allow microphone access.')
    }
  }

  const clearChat = () => setMessages([{ role: 'assistant', content: getWelcomeMessage(society?.name) }])

  return (
    <div className="flex h-[calc(100vh-7rem)] border border-slate-200 bg-white rounded-[24px] overflow-hidden shadow-sm font-sans animate-fade-in">
      
      {/* Left Chat History Panel (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-50 border-r border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <button onClick={clearChat} className="w-full btn-primary py-2 text-xs font-bold justify-center flex gap-1.5 items-center">
            <Plus size={13} /> New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-1">
              <History size={10} /> Chat Logs History
            </p>
            <div className="space-y-0.5">
              {historyList.map(h => (
                <button key={h.id} onClick={() => { send(h.title); toast.success('Loaded query from log') }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 truncate transition-colors">
                  💬 {h.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Top Header info */}
        <div className="p-4 md:px-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 shadow-sm bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-9 w-9 bg-brand/10 text-brand border border-brand/20 rounded-xl flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-snug">Panchayat AI</h3>
              <p className="text-[10px] text-slate-450 text-slate-400 font-semibold flex items-center gap-0.5">
                <Sparkles size={9} className="text-brand animate-pulse" /> Groq LLaMA 3.3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {[['chat', MessageSquare, 'General Chat'], ['bylaw', BookOpen, 'Bylaws Agent']].map(([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all ${
                    mode === m ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={10} />
                  {label}
                </button>
              ))}
            </div>
            <button onClick={clearChat} className="btn-secondary text-[10px] font-bold py-1.5 px-3">
              Clear
            </button>
          </div>
        </div>

        {/* Chat message threads */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/25">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="mr-3 mt-1 h-7 w-7 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot size={13} />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <p className="leading-relaxed text-xs font-medium">{renderText(msg.content)}</p>
                {msg.fallback && (
                  <span className="mt-1 flex items-center gap-1 text-[8px] opacity-40 uppercase tracking-widest font-black">
                    Local Search Fallback
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="mr-3 mt-1 h-7 w-7 rounded-full bg-brand/10 border border-brand/25 text-brand flex items-center justify-center flex-shrink-0">
                <Bot size={13} />
              </div>
              <div className="chat-bubble-ai">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer actions prompt & textbox inputs */}
        <div className="p-4 border-t border-slate-100 space-y-3 shadow-inner bg-white">
          {/* Query prompt suggestions bubbles */}
          {messages.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              {QUICK.map((q) => (
                <button
                  key={q.text}
                  onClick={() => send(q.text)}
                  className="flex-shrink-0 rounded-full border border-slate-250 border-slate-200 bg-white hover:bg-emerald-50 hover:border-brand/30 hover:text-emerald-700 px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-xs transition-all flex items-center gap-1.5"
                >
                  💡 {q.text}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                className="input pr-10 text-xs"
                placeholder={mode === 'bylaw' ? 'Search society bylaws (e.g. Pet policy fine...)' : 'Type your query here...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                disabled={loading}
              />
              <button
                onClick={toggleRecording}
                disabled={!isSpeechSupported}
                title={!isSpeechSupported ? 'Microphone not supported' : recording ? 'Mute' : 'Speak'}
                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-all ${
                  !isSpeechSupported ? 'opacity-20 cursor-not-allowed' :
                  recording ? 'bg-rose-50 text-rose-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-brand'
                }`}
              >
                {recording ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            </div>
            <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary px-4 py-2.5 disabled:opacity-40 flex items-center justify-center">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
