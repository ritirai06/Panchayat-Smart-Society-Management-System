import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Bot, Send, BookOpen, MessageSquare, Zap, Mic, MicOff, Sparkles, MapPin, Building2 } from 'lucide-react'

const QUICK = [
  'Show my flat details',
  'Any pending dues?',
  'Gym timings?',
]

const SOCIETY_IMAGES = [
  'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1472224371017-08207f84aaae?auto=format&fit=crop&w=1400&q=80',
]

const getImageForSociety = (societyId) => {
  if (!societyId) return SOCIETY_IMAGES[0]
  const text = String(societyId)
  const hash = text.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return SOCIETY_IMAGES[hash % SOCIETY_IMAGES.length]
}

const TypingDots = () => (
  <div className="flex gap-1.5 px-1 py-1">
    {[0, 150, 300].map((d) => (
      <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
    ))}
  </div>
)

const renderText = (text) => {
  if (!text) return text
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) => (
    i % 2 === 1 ? <strong key={i} className="font-semibold">{p}</strong> : p
  ))
}

const getWelcomeMessage = (societyName) => (
  societyName
    ? `Hi! I'm Panchayat AI for ${societyName}. I am trained on your society context, bylaws, and support flows.`
    : 'Hi! I am Panchayat AI. Ask me anything about your society, dues, amenities, or complaints.'
)

export default function Chatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('chat')
  const [recording, setRecording] = useState(false)
  const [society, setSociety] = useState(null)
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
    try {
      const endpoint = mode === 'bylaw' ? '/ai/bylaw' : '/ai/chat'
      const payload = mode === 'bylaw' ? { question: msg, societyId } : { message: msg, societyId }
      const { data } = await api.post(endpoint, payload)
      const reply = mode === 'bylaw' ? data.answer : data.reply
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, fallback: data.fallback }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Speech recognition not supported in this browser')
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
    r.onerror = () => setRecording(false)
    r.onend = () => setRecording(false)
    recognitionRef.current = r
    r.start()
    setRecording(true)
  }

  const clearChat = () => setMessages([{ role: 'assistant', content: getWelcomeMessage(society?.name) }])

  const coverImage = getImageForSociety(societyId)

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col animate-fade-in">
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-zinc-200/80 shadow-lg shadow-zinc-200/40">
        <img src={coverImage} alt="Society cover" className="h-36 w-full object-cover md:h-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-900/65 to-zinc-900/30" />

        <div className="absolute inset-0 flex flex-wrap items-start justify-between gap-3 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-300/30">
                <Bot size={19} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Panchayat AI</h2>
              <p className="flex items-center gap-1 text-xs text-emerald-100">
                <Sparkles size={10} className="text-emerald-300" />
                AI trained on your society
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-200">
                <Building2 size={11} />
                {society?.name || 'Sunrise Heights'}
                <MapPin size={11} className="ml-2" />
                {society?.city || 'Noida'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-white/20 p-1 backdrop-blur">
              {[['chat', MessageSquare, 'Chat'], ['bylaw', BookOpen, 'Bylaws']].map(([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
            <button onClick={clearChat} className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/85 p-4 shadow-inner shadow-zinc-100/70">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="mr-2.5 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <p className="leading-relaxed">{renderText(msg.content)}</p>
                {msg.fallback && (
                  <span className="mt-1.5 flex items-center gap-1 text-xs opacity-50">
                    <Zap size={9} />
                    Offline mode
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="mr-2.5 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                <Bot size={13} className="text-white" />
              </div>
              <div className="chat-bubble-ai">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length <= 1 && mode === 'chat' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            className="input pr-12"
            placeholder={mode === 'bylaw' ? 'Ask about society rules and bylaws...' : 'Ask anything about your society...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            disabled={loading}
          />
          <button
            onClick={toggleRecording}
            className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-all ${
              recording ? 'animate-pulse bg-red-50 text-red-500' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-500'
            }`}
          >
            {recording ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </div>
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary px-4 disabled:opacity-40">
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
