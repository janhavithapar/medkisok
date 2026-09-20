import React, { useState } from 'react'
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

export default function AuthModal({ isOpen, onClose }) {
  const { data, updatePatient, loginWithPhone, registerWithPhone, demoAccounts } = useKiosk()
  const locale = getLocale(data.patient.language)

  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Registration fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [role, setRole] = useState('patient') // 'patient' | 'doctor' | 'nurse'
  const [abhaId, setAbhaId] = useState('')

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

    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }
    const clean = phone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10) {
      setError(locale.invalidMobile)
      return
    }
    if (!password || password.length < 4) {
      setError(locale.invalidPassword)
      return
    }
    if (role === 'patient' && !data.patient?.consent?.hospitalDataSharing) {
      setError('Please check "Share with this hospital" to register.')
      return
    }

    const res = registerWithPhone({
      name: name.trim(),
      phone: clean,
      password,
      age,
      gender,
      role,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-medi-600 to-skyclin-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {tab === 'login' ? locale.login : locale.signUp}
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Secure authentication with Mobile Number &amp; Password
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors min-h-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all min-h-0 ${
              tab === 'login'
                ? 'bg-white text-medi-700 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {locale.signIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup')
              setError('')
              setSuccess('')
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all min-h-0 ${
              tab === 'signup'
                ? 'bg-white text-medi-700 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {locale.signUp}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-center gap-2.5 text-red-700 text-sm animate-shake">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-emerald-800 text-sm">
              <CheckCircle size={18} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {locale.mobileNumber}
                </label>
                <div className="relative flex rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <span className="inline-flex items-center px-3.5 text-sm font-semibold text-slate-500 border-r border-slate-200 bg-slate-100/60 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-3 bg-transparent text-slate-900 font-semibold text-base outline-none tracking-wide"
                  />
                  <div className="flex items-center pr-3 text-slate-400">
                    <Phone size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {locale.password}
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 bg-transparent text-slate-900 font-medium text-base outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="px-3 text-slate-400 hover:text-slate-600 min-h-0"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="pr-3 text-slate-400">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-13 py-3.5 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-base shadow-md shadow-medi-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {locale.signIn}
              </button>

              {/* Quick Demo Accounts */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>One-Click Demo Profiles:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemo(acc)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-medi-300 text-left transition-all min-h-0 group"
                    >
                      <span className="block text-xs font-bold text-slate-800 group-hover:text-medi-700 flex items-center gap-1">
                        {acc.role === 'patient' && <User size={13} />}
                        {acc.role === 'doctor' && <Stethoscope size={13} className="text-skyclin-600" />}
                        {acc.role === 'nurse' && <HeartPulse size={13} className="text-amber-500" />}
                        {acc.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                        {acc.phone}
                      </span>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-semibold">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {locale.fullName} *
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent text-slate-900 font-semibold text-sm outline-none"
                  />
                  <div className="pr-3 text-slate-400">
                    <User size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {locale.mobileNumber} *
                </label>
                <div className="relative flex rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <span className="inline-flex items-center px-3 text-xs font-semibold text-slate-500 border-r border-slate-200 bg-slate-100/60 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 bg-transparent text-slate-900 font-semibold text-sm outline-none"
                  />
                  <div className="flex items-center pr-3 text-slate-400">
                    <Phone size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {locale.age}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-sm text-slate-900 outline-none focus:border-medi-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {locale.gender}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-sm text-slate-900 outline-none focus:border-medi-600 focus:bg-white"
                  >
                    <option value="Male">{locale.male}</option>
                    <option value="Female">{locale.female}</option>
                    <option value="Other">{locale.other}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all min-h-0 ${
                      role === 'patient'
                        ? 'border-medi-600 bg-medi-50 text-medi-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all min-h-0 ${
                      role === 'doctor'
                        ? 'border-skyclin-600 bg-skyclin-50 text-skyclin-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('nurse')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all min-h-0 ${
                      role === 'nurse'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Nurse
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {locale.password} *
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-transparent text-slate-900 font-medium text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="px-3 text-slate-400 hover:text-slate-600 min-h-0"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="pr-3 text-slate-400">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              {/* Privacy Consent Checkbox */}
              {role === 'patient' && (
                <label className="flex gap-2.5 items-start cursor-pointer p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors text-left">
                  <input
                    type="checkbox"
                    checked={data.patient?.consent?.hospitalDataSharing || false}
                    onChange={(e) =>
                      updatePatient('consent', {
                        ...data.patient?.consent,
                        hospitalDataSharing: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 accent-medi-600 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-600">
                    <strong className="text-slate-800 font-bold block">{locale.shareHospital} *</strong>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{locale.shareHospitalHelp}</span>
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="w-full h-13 py-3.5 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-base shadow-md shadow-medi-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {locale.registerAndContinue}
              </button>
            </form>
          )}

          {/* Switch Tab Footnote */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {tab === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setTab('signup')
                  setError('')
                  setSuccess('')
                }}
                className="text-medi-700 font-bold hover:underline min-h-0"
              >
                {locale.dontHaveAccount}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTab('login')
                  setError('')
                  setSuccess('')
                }}
                className="text-medi-700 font-bold hover:underline min-h-0"
              >
                {locale.alreadyHaveAccount}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
