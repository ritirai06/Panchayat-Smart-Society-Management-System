import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Users, Info } from 'lucide-react'
import api from '../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState([
    { label: 'Premium', value: 'Gym' },
    { label: 'Infinity', value: 'Pool' },
    { label: 'Smart', value: 'Security' }
  ])
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/societies/public/stats')
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats)
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left dark panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 grain"
        style={{ background: 'linear-gradient(160deg,#18181b 0%,#09090b 60%,#052e16 100%)' }}>
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl" />

        <div className="relative flex items-center justify-center">
          <img src="/logo.png" alt="Panchayat Logo" className="h-28 w-auto object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            AI-Powered Society Management
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Smart Living.<br />
            <span className="text-emerald-400">Simplified.</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Manage your residential community with AI-powered tools — complaints, payments, bylaws, and more.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {Array.isArray(stats) && stats.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                <p className="font-bold text-white text-lg">{s.value}</p>
                <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-white/5 border border-white/8 rounded-2xl p-5">
          <p className="text-zinc-300 text-sm italic leading-relaxed">
            "Panchayat transformed how we manage Green Valley. Complaints resolved 3x faster!"
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">R</div>
            <div>
              <p className="text-white text-xs font-semibold">Rajesh Kumar</p>
              <p className="text-zinc-500 text-xs">Admin, Green Valley Apts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="Panchayat Logo" className="h-12 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-1">Welcome back</h2>
          <p className="text-zinc-400 text-sm mb-7">Sign in to your society portal</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="email" className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            New to Panchayat?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
