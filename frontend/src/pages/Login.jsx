import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Building2, Eye, EyeOff, Zap, Shield, Users, ArrowRight, Star, Award, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const features = [
  { icon: Shield, title: 'Enterprise Security', text: 'State-of-the-art secure JWT session authentication.' },
  { icon: Zap, title: 'Autonomous Operations', text: 'Simulated ANPR OpenCV gate scanners and AI assistant.' },
  { icon: Users, title: 'Unified Society OS', text: 'Centralized resident, parking, finance, and SOS channels.' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Left Panel - Premium Brand Featureboard */}
      <div className="hidden relative overflow-hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0B0F19]">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#063B2B] to-[#04281E]" />
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/5 blur-[120px]" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/35 shadow-lg shadow-brand/10">
              <Building2 size={20} className="text-brand" />
            </div>
            <span className="text-lg font-black text-white tracking-wider uppercase">Panchayat</span>
          </div>
        </div>

        {/* Feature Carousel Section */}
        <div className="relative z-10 space-y-8 my-auto max-w-lg">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
              <Sparkles size={12} /> Next-Gen Society OS
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Operating system for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">
                modern communities.
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Experience investor-grade operations: automate visitor gate passes, monitor vehicle slots, process maintenance billing, and leverage localized AI search.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 text-brand flex-shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Award size={12} className="text-brand" />
            <span>ISO 27001 Certified</span>
          </div>
          <span>© 2026 Panchayat SaaS</span>
        </div>
      </div>

      {/* Right Panel - Modern Login Card */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 bg-slate-50/50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white border border-slate-100 rounded-[24px] p-8 md:p-10 shadow-modal"
        >
          {/* Mobile brand header */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/20">
              <Building2 size={16} className="text-brand" />
            </div>
            <span className="text-base font-bold text-text-primary">Panchayat</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sign in</h1>
            <p className="mt-1.5 text-xs text-text-secondary">Enter credentials to access your society dashboard</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-status-danger/25 bg-status-danger/5 px-4 py-3 text-xs text-status-danger font-semibold"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="input-label">Email address</label>
              <input
                type="email" className="input" placeholder="admin@society.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                required autoFocus
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="input-label">Password</label>
                <a href="#/forgot" className="text-[11px] font-semibold text-brand hover:text-brand-dark transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-primary transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)} 
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand" 
                />
                Remember me
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 justify-center shadow-md shadow-brand/10 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold">
                  Sign in <ArrowRight size={14} />
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-secondary font-medium">
            New society?{' '}
            <Link to="/register" className="font-bold text-brand hover:text-brand-dark transition-colors">
              Request Platform Registration
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
