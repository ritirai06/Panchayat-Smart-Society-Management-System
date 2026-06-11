import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Shield, Users, Info, Sparkles } from 'lucide-react'

const steps = ['Contact Details', 'Platform Role', 'Verify Profile']

const pwStrength = (p) => {
  if (!p) return { score: 0, label: '', color: '' }
  let s = 0
  if (p.length >= 6) s++; if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
  const map = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-rose-400' },
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
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20 mx-auto shadow-sm shadow-brand/10">
            <Building2 className="text-brand" size={22} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-slate-500 text-xs font-medium">Link your credentials to register with your community portal</p>
        </div>

        {/* Multi-step progress tracker */}
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all duration-300 ${i <= step ? 'bg-brand text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                {i < step ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wide hidden sm:block ${i === step ? 'text-brand' : 'text-slate-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-brand' : 'bg-slate-100'}`} />}
            </div>
          ))}
        </div>

        {/* Wizard Card container */}
        <div className="card p-8">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5"><User size={16} className="text-brand" /> Personal Details</h3>
              
              <div className="space-y-1">
                <label className="input-label">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10" placeholder="Priya Sharma" value={form.name} onChange={e => f('name', e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" className="input pl-10" placeholder="priya@example.com" value={form.email} onChange={e => f('email', e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="input-label">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-10" placeholder="+91 9876543210" value={form.phone} onChange={e => f('phone', e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Min 6 characters" value={form.password} onChange={e => f('password', e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2.5 animate-slide-up">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-slate-100'}`} />)}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{strength.label} Password</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5"><Shield size={16} className="text-brand" /> Choose Platform Role</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['resident', Users, 'Resident', 'I live in the society'],
                  ['admin', Shield, 'Admin', 'I manage the operations']
                ].map(([r, Icon, label, sub]) => (
                  <button key={r} type="button" onClick={() => f('role', r)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 flex flex-col justify-between h-36 ${
                      form.role === r ? 'border-brand bg-brand/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.role === r ? 'bg-brand text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className={`font-bold text-xs ${form.role === r ? 'text-brand' : 'text-slate-800'}`}>{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
                <Info size={16} className="text-brand flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-brand uppercase tracking-wider">Note regarding profiles</p>
                  <p className="text-[10px] leading-relaxed text-emerald-800 font-medium mt-1">If registering as a resident, your account must be mapped/linked to your actual flat by the society admin before dues or parking details load.</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5"><CheckCircle size={16} className="text-brand" /> Review Details</h3>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                {[
                  ['Full Name', form.name],
                  ['Email Address', form.email],
                  ['Phone Number', form.phone || '—'],
                  ['Account Role', form.role]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-slate-900 capitalize">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                By submitting registration, you agree to our Terms of Service & Privacy Policy.
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 justify-center py-2.5 text-xs font-semibold">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                disabled={step === 0 && (!form.name || !form.email || !form.password || form.password.length < 6)}
                className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold">
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold shadow-md shadow-brand/10">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Confirm & Create <ArrowRight size={14} />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-semibold mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:text-brand-dark transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
