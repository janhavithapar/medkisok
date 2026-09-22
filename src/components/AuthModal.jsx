import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Sparkles,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocale } from '../i18n.js'

export default function AuthModal({ isOpen, onClose, preferredRole = 'patient' }) {
  const { data, updatePatient, loginWithPhone, registerWithPhone, demoAccounts } = useKiosk()
  const locale = getLocale(data.patient.language)
  const isDoctorPortal = preferredRole === 'doctor'

  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Registration fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [abhaId, setAbhaId] = useState('')
  const [doctorMode, setDoctorMode] = useState('signin')
  const [doctorLicense, setDoctorLicense] = useState('')
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Medicine')
  const [doctorEmail, setDoctorEmail] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  function handleQuickDemo(demo) {
    setTab('login')
    setPhone(demo.phone)
    setPassword(demo.password)
    setError('')
  }

  function handleLogin(e) {
    e?.preventDefault()
    setError('')
    setSuccess('')

    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10) {
      setError(locale.invalidMobile)
      return
    }
    if (!password) {
      setError(locale.invalidPassword)
      return
    }

    const res = loginWithPhone(clean, password)
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please check credentials.')
      return
    }

    setSuccess(`Welcome back, ${res.user.name}!`)
    setTimeout(() => {
      onClose()
      setSuccess('')
    }, 900)
  }

  function handleSignUp(e) {
    e?.preventDefault()
    setError('')
    setSuccess('')

    const clean = phone.replace(/\D/g, '').slice(-10)

    if (isDoctorPortal) {
      if (!name.trim()) {
        setError('Please enter the doctor full name.')
        return
      }
      if (!doctorLicense.trim()) {
        setError('Please enter the medical license number.')
        return
      }
      if (!doctorSpecialty.trim()) {
        setError('Please select or enter the doctor specialty.')
        return
      }
      if (!doctorEmail.trim() || !doctorEmail.includes('@')) {
        setError('Please enter a valid email address.')
        return
      }
      if (clean.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.')
        return
      }
      if (!password || password.length < 4) {
        setError('Password must be at least 4 characters long.')
        return
      }

      const res = registerWithPhone({
        name: name.trim(),
        phone: clean,
        password,
        role: 'doctor',
        licenseNumber: doctorLicense.trim(),
        specialty: doctorSpecialty.trim(),
        email: doctorEmail.trim().toLowerCase(),
      })

      if (!res.success) {
        setError(res.error || 'Doctor registration failed.')
        return
      }

      setSuccess('Doctor account created successfully. Redirecting to the dashboard...')
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 900)
      return
    }

    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (clean.length !== 10) {
      setError(locale.invalidMobile)
      return
    }
    if (!password || password.length < 4) {
      setError(locale.invalidPassword)
      return
    }
    const res = registerWithPhone({
      name: name.trim(),
      phone: clean,
      password,
      age,
      gender,
      role: 'patient',
      abhaId: abhaId.trim(),
    })

    if (!res.success) {
      setError(res.error || 'Registration failed')
      return
    }

    setSuccess(`Account registered! Signed in as ${res.user.name}.`)
    setTimeout(() => {
      onClose()
      setSuccess('')
    }, 900)
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {isDoctorPortal ? (
          <div className="flex flex-col gap-5 pt-3">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setDoctorMode('signin')}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  doctorMode === 'signin' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Doctor Sign In
              </button>
              <button
                type="button"
                onClick={() => setDoctorMode('signup')}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  doctorMode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                New Doctor Registration
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {doctorMode === 'signin' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Medical License ID / Mobile Number
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                    <span className="border-r border-slate-200 px-4 text-base font-semibold text-slate-600">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-4 py-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="9811122233"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Secure Password
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="min-h-0 px-4 text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-2xl font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-400 hover:to-emerald-300"
                >
                  Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white placeholder:text-slate-400"
                    placeholder="Dr. Asha Verma"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Medical License Number</label>
                  <input
                    value={doctorLicense}
                    onChange={(e) => setDoctorLicense(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white placeholder:text-slate-400"
                    placeholder="ML-2048"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Specialty</label>
                  <input
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white placeholder:text-slate-400"
                    placeholder="General Medicine"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Email</label>
                  <input
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white placeholder:text-slate-400"
                    placeholder="doctor@hospital.org"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Mobile Number</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="border-r border-slate-200 px-4 text-base font-semibold text-slate-600">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-4 py-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="9811122233"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Secure Password</label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-4 py-3 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="min-h-0 px-4 text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-3 text-base font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-400 hover:to-emerald-300"
                >
                  Create Doctor Account
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-3">
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button type="button" onClick={() => setTab('login')} className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${tab === 'login' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'}`}>Sign In</button>
              <button type="button" onClick={() => setTab('signup')} className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${tab === 'signup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'}`}>Sign Up</button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Mobile Number</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                    <span className="border-r border-slate-200 px-3 text-sm font-semibold text-slate-600">+91</span>
                    <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent px-3 py-3 text-base font-semibold text-slate-800 outline-none" placeholder="9876543210" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Password</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base font-semibold text-slate-800 outline-none" placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="min-h-0 px-3 text-slate-500 hover:text-slate-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>

                <button type="submit" className="w-full rounded-xl bg-sky-600 px-4 py-3 text-base font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700">{locale.signIn}</button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Mobile Number</label>
                  <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white" placeholder="9876543210" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Password</label>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-semibold text-slate-800 outline-none focus:border-sky-500 focus:bg-white" placeholder="Create a secure password" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-sky-600 px-4 py-3 text-base font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700">{locale.registerAndContinue}</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
