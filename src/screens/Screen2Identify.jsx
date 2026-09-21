import React, { useState, useEffect } from 'react'
import {
  Camera,
  Check,
  Delete,
  QrCode,
  ShieldCheck,
  Upload,
  Volume2,
  ExternalLink,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  AlertCircle,
  Smartphone,
  ArrowLeft,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocale } from '../i18n.js'
import { speak } from '../components/VoiceMic.jsx'

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export default function Screen2Identify({ onNext, onBack }) {
  const { data, updatePatient, loginWithPhone, registerWithPhone, demoAccounts } = useKiosk()
  const locale = getLocale(data.patient.language)

  const [idMethod, setIdMethod] = useState('mobile') // 'mobile' | 'abha'
  const [authSubTab, setAuthSubTab] = useState('signin') // 'signin' | 'signup'

  // Mobile Auth State
  const [mobilePhone, setMobilePhone] = useState(data.patient.phone || '')
  const [mobilePassword, setMobilePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [regName, setRegName] = useState(data.patient.name || '')
  const [regAge, setRegAge] = useState(data.patient.age || '')
  const [regGender, setRegGender] = useState(data.patient.gender || 'Male')
  const [authError, setAuthError] = useState('')

  // ABHA State
  const [scanMode, setScanMode] = useState(false)
  const [scanMessage, setScanMessage] = useState('')
  const [manualId, setManualId] = useState(data.patient.abhaId || '')

  // Keep state cleanly in sync when session resets (e.g. on logout)
  useEffect(() => {
    setMobilePhone(data.patient.phone || '')
    setRegName(data.patient.name || '')
    setRegAge(data.patient.age || '')
    setManualId(data.patient.abhaId || '')
  }, [data.patient.phone, data.patient.name, data.patient.age, data.patient.abhaId])

  const consent = data.patient.consent || {
    hospitalDataSharing: false,
    abhaLinking: false,
  }

  function readConsent() {
    speak(`${locale.shareHospital}. ${locale.shareHospitalHelp}`, data.patient.language)
  }

  function setConsent(key, value) {
    updatePatient('consent', { ...consent, [key]: value })
  }

  function addDigit(digit) {
    if (manualId.length < 14) setManualId((current) => current + digit)
  }

  function removeDigit() {
    setManualId((current) => current.slice(0, -1))
  }

  function continueWithId() {
    if (!consent.hospitalDataSharing) {
      setAuthError('Please check "Share with this hospital" to continue.')
      return
    }
    updatePatient('abhaId', manualId)
    onNext?.()
  }

  function continueWalkIn() {
    if (!consent.hospitalDataSharing) {
      updatePatient('consent', { ...consent, hospitalDataSharing: true })
    }
    updatePatient('abhaId', '')
    onNext?.()
  }

  function handleUpload(event) {
    if (event.target.files?.length) {
      setScanMessage('QR image received. ABHA details will be verified by the hospital.')
    }
  }

  function handleDemoFill() {
    const demo = demoAccounts?.find((a) => a.role === 'patient') || { phone: '9876543210', password: 'password123' }
    setMobilePhone(demo.phone)
    setMobilePassword(demo.password)
    setRegName(demo.name || 'Ramesh Kumar')
    setRegAge(demo.age || '42')
    setConsent('hospitalDataSharing', true)
    setAuthError('')
  }

  function handleMobileSignIn(e) {
    e?.preventDefault()
    setAuthError('')
    const clean = mobilePhone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10) {
      setAuthError(locale.invalidMobile)
      return
    }
    if (!mobilePassword) {
      setAuthError(locale.invalidPassword)
      return
    }
    if (!consent.hospitalDataSharing) {
      setAuthError('Please check "Share with this hospital" to continue.')
      return
    }
    const res = loginWithPhone(clean, mobilePassword)
    if (!res.success) {
      setAuthError(res.error || 'Authentication failed. Please check your credentials.')
      return
    }
    onNext?.()
  }

  function handleMobileSignUp(e) {
    e?.preventDefault()
    setAuthError('')
    if (!regName.trim()) {
      setAuthError('Please enter your full name')
      return
    }
    const clean = mobilePhone.replace(/\D/g, '').slice(-10)
    if (clean.length !== 10) {
      setAuthError(locale.invalidMobile)
      return
    }
    if (!mobilePassword || mobilePassword.length < 4) {
      setAuthError(locale.invalidPassword)
      return
    }
    if (!consent.hospitalDataSharing) {
      setAuthError('Please check "Share with this hospital" to register and continue.')
      return
    }
    const res = registerWithPhone({
      name: regName.trim(),
      phone: clean,
      password: mobilePassword,
      age: regAge,
      gender: regGender,
      role: 'patient',
    })
    if (!res.success) {
      setAuthError(res.error || 'Registration failed')
      return
    }
    onNext?.()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors min-h-0 py-1"
        >
          <ArrowLeft size={16} />
          <span>{locale.back || 'Back'}</span>
        </button>
      )}

      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-medi-100 flex items-center justify-center mx-auto mb-3">
          {idMethod === 'mobile' ? (
            <Smartphone className="text-medi-600" size={28} />
          ) : (
            <QrCode className="text-medi-600" size={28} />
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{locale.identify}</h1>
        <p className="text-slate-500 mt-1.5">{locale.identifyHelp}</p>
      </div>

      {/* Main Identification Mode Switcher */}
      <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-200/70 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setIdMethod('mobile')
            setAuthError('')
          }}
          className={`h-13 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-0 ${
            idMethod === 'mobile'
              ? 'bg-white text-medi-700 shadow-md border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone size={18} />
          <span>{locale.tabMobile}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIdMethod('abha')
            setAuthError('')
          }}
          className={`h-13 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-0 ${
            idMethod === 'abha'
              ? 'bg-white text-medi-700 shadow-md border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode size={18} />
          <span>{locale.tabAbha}</span>
        </button>
      </div>

      {authError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-center gap-2.5 text-red-700 text-sm animate-shake">
          <AlertCircle size={18} className="shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* MODE 1: MOBILE NUMBER & PASSWORD */}
      {idMethod === 'mobile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-5">
          {/* Sub-tab: Sign In vs Sign Up */}
          <div className="flex border-b border-slate-200 mb-5 pb-1 gap-4">
            <button
              type="button"
              onClick={() => {
                setAuthSubTab('signin')
                setAuthError('')
              }}
              className={`pb-2.5 text-sm font-bold border-b-2 transition-all min-h-0 ${
                authSubTab === 'signin'
                  ? 'border-medi-600 text-medi-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthSubTab('signup')
                setAuthError('')
              }}
              className={`pb-2.5 text-sm font-bold border-b-2 transition-all min-h-0 ${
                authSubTab === 'signup'
                  ? 'border-medi-600 text-medi-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {locale.signUp}
            </button>
          </div>

          {authSubTab === 'signin' ? (
            <form onSubmit={handleMobileSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {locale.mobileNumber}
                </label>
                <div className="relative flex rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <span className="inline-flex items-center px-4 text-sm font-bold text-slate-600 border-r border-slate-200 bg-slate-100/60 rounded-l-2xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3.5 bg-transparent text-slate-900 font-bold text-lg outline-none tracking-wider"
                  />
                  <div className="flex items-center pr-4 text-slate-400">
                    <Phone size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  {locale.password}
                </label>
                <div className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={mobilePassword}
                    onChange={(e) => setMobilePassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-transparent text-slate-900 font-bold text-base outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="px-3 text-slate-400 hover:text-slate-600 min-h-0"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <div className="pr-4 text-slate-400">
                    <Lock size={20} />
                  </div>
                </div>
              </div>

              {/* Demo Patient Filler */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-medi-700 hover:text-medi-800 bg-medi-50 hover:bg-medi-100 px-3 py-1.5 rounded-lg transition min-h-0 border border-medi-200/70"
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{locale.demoPatient} (Ramesh)</span>
                </button>
              </div>

              <div className="pt-2">
                <ConsentChoice
                  checked={consent.hospitalDataSharing}
                  onChange={(val) => setConsent('hospitalDataSharing', val)}
                  title={locale.shareHospital}
                  description={locale.shareHospitalHelp}
                  onListen={readConsent}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-base shadow-lg shadow-medi-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Check size={20} />
                {locale.continueWithMobile}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMobileSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {locale.fullName} *
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-3 bg-transparent text-slate-900 font-bold text-sm outline-none"
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
                  <span className="inline-flex items-center px-3 text-xs font-bold text-slate-500 border-r border-slate-200 bg-slate-100/60 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 bg-transparent text-slate-900 font-bold text-sm outline-none"
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
                    placeholder="e.g. 42"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-sm text-slate-900 outline-none focus:border-medi-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {locale.gender}
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-sm text-slate-900 outline-none focus:border-medi-600 focus:bg-white"
                  >
                    <option value="Male">{locale.male}</option>
                    <option value="Female">{locale.female}</option>
                    <option value="Other">{locale.other}</option>
                  </select>
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
                    placeholder="Choose a password"
                    value={mobilePassword}
                    onChange={(e) => setMobilePassword(e.target.value)}
                    className="w-full px-3.5 py-3 bg-transparent text-slate-900 font-medium text-sm outline-none"
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

              <div className="pt-2">
                <ConsentChoice
                  checked={consent.hospitalDataSharing}
                  onChange={(val) => setConsent('hospitalDataSharing', val)}
                  title={locale.shareHospital}
                  description={locale.shareHospitalHelp}
                  onListen={readConsent}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-base shadow-lg shadow-medi-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Check size={20} />
                {locale.registerAndContinue}
              </button>
            </form>
          )}
        </div>
      )}

      {/* MODE 2: ABHA ID / QR CODE */}
      {idMethod === 'abha' && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setScanMode(true)}
              className={`h-16 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2 ${
                scanMode ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Camera size={21} /> {locale.scanQr}
            </button>
            <label className="h-16 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={21} /> {locale.uploadQr}
              <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
            </label>
          </div>

          {scanMode && (
            <div className="rounded-2xl border-2 border-dashed border-medi-300 bg-medi-50 p-6 text-center mb-5">
              <Camera className="mx-auto text-medi-600 mb-2" size={34} />
              <p className="font-semibold text-slate-700">{locale.scanQr}</p>
              <p className="text-sm text-slate-500 mt-1">{locale.identifyHelp}</p>
            </div>
          )}
          {scanMessage && <p className="text-sm text-medi-700 mb-4 text-center">{scanMessage}</p>}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm">
            <label htmlFor="abha-id" className="block text-sm font-semibold text-slate-600 mb-2">
              {locale.enterAbha}
            </label>
            <div id="abha-id" className="h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl tracking-widest text-slate-800 font-mono">
              {manualId || locale.enterDigits}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {KEYPAD.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => addDigit(digit)}
                  className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-xl font-bold text-slate-700 transition"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={removeDigit}
                className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
                aria-label="Delete last digit"
              >
                <Delete size={22} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <ConsentChoice
              checked={consent.hospitalDataSharing}
              onChange={(val) => setConsent('hospitalDataSharing', val)}
              title={locale.shareHospital}
              description={locale.shareHospitalHelp}
              onListen={readConsent}
              required
            />
          </div>

          <button
            type="button"
            onClick={continueWithId}
            disabled={!manualId}
            className="w-full h-14 rounded-2xl bg-medi-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-medi-600/20 mb-3"
          >
            <Check size={20} /> {locale.continueAbha}
          </button>
        </>
      )}

      {/* Walk-in & External Help Links */}
      <button
        type="button"
        onClick={continueWalkIn}
        className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors"
      >
        {locale.walkIn}
      </button>

      <a
        href="https://abha.abdm.gov.in"
        target="_blank"
        rel="noreferrer"
        className="mt-5 rounded-2xl border border-skyclin-100 bg-skyclin-50 p-4 flex items-start gap-3 text-skyclin-800 transition hover:border-skyclin-300"
      >
        <ExternalLink size={20} className="shrink-0 mt-0.5" />
        <span>
          <strong className="block">ABHA help</strong>
          <span className="text-sm">Need help creating or finding your ABHA ID? Visit the official government portal.</span>
        </span>
      </a>
    </div>
  )
}

function ConsentChoice({ checked, onChange, title, description, required, onListen }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
      <label className="flex gap-3 items-start cursor-pointer flex-1 select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 accent-medi-600 rounded cursor-pointer shrink-0"
        />
        <div>
          <span className="block font-bold text-sm text-slate-800 leading-tight">
            {title}
            {required ? ' *' : ''}
          </span>
          {description && (
            <span className="block text-xs text-slate-500 mt-1 leading-normal">{description}</span>
          )}
        </div>
      </label>
      {onListen && (
        <button
          type="button"
          onClick={onListen}
          title="Listen to privacy notice"
          className="shrink-0 p-1.5 rounded-lg text-medi-600 hover:text-medi-800 hover:bg-medi-100/70 transition min-h-0"
        >
          <Volume2 size={18} />
        </button>
      )}
    </div>
  )
}
