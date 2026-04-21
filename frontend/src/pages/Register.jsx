import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Shield, Users, Info } from 'lucide-react'

const steps = ['Personal Info', 'Your Role', 'Review']

const pwStrength = (p) => {
  if (!p) return { score: 0, label: '', color: '' }
  let s = 0
  if (p.length >= 6) s++; if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  const map = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-emerald-400' },
    { label: 'Very Strong', color: 'bg-emerald-600' },
  ]
  return { score: s, ...map[s] }
}

export default function Register() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'resident' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const strength = pwStrength(form.password)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to Panchayat')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Panchayat Logo" className="h-20 w-auto mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
          <p className="text-zinc-400 text-sm mt-1">Join your society on Panchayat</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200 ${i <= step ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-emerald-700' : 'text-zinc-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-zinc-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 text-lg">Personal Information</h3>
              <div>
                <label className="input-label">Full Name</label>
                <div className="relative"><User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input className="input pl-10" placeholder="Priya Sharma" value={form.name} onChange={e => f('name', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="email" className="input pl-10" placeholder="priya@example.com" value={form.email} onChange={e => f('email', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input className="input pl-10" placeholder="+91 9876543210" value={form.phone} onChange={e => f('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Min 6 characters" value={form.password} onChange={e => f('password', e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-zinc-200'}`} />)}
                    </div>
                    <p className="text-xs font-medium text-zinc-500">{strength.label}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 text-lg">Your Role</h3>
              <div className="grid grid-cols-2 gap-3">
                {[['resident', Users, 'Resident', 'I live in the society'], ['admin', Shield, 'Admin', 'I manage the society']].map(([r, Icon, label, sub]) => (
                  <button key={r} type="button" onClick={() => f('role', r)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${form.role === r ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${form.role === r ? 'bg-emerald-500' : 'bg-zinc-100'}`}>
                      <Icon size={17} className={form.role === r ? 'text-white' : 'text-zinc-400'} />
                    </div>
                    <p className={`font-semibold text-sm ${form.role === r ? 'text-emerald-700' : 'text-zinc-700'}`}>{label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={13} className="text-emerald-600 flex-shrink-0" />
                  <p className="font-semibold text-sm text-emerald-700">Note</p>
                </div>
                <p className="text-xs leading-relaxed text-emerald-600">After registration, ask your society admin to link your account to your flat.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-900 text-lg">Review & Confirm</h3>
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-3">
                {[['Name', form.name], ['Email', form.email], ['Phone', form.phone || '—'], ['Role', form.role]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-medium">{k}</span>
                    <span className="text-zinc-900 font-semibold capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 text-center">By creating an account you agree to our Terms of Service.</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 justify-center">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && (!form.name || !form.email || !form.password)}
                className="btn-primary flex-1 justify-center">
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <>Create Account <ArrowRight size={14} /></>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
