import React, { useState } from 'react'
import {
  Camera,
  Check,
  Delete,
  QrCode,
  ShieldCheck,
  Upload,
  Volume2,
  ExternalLink,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocale } from '../i18n.js'
import { speak } from '../components/VoiceMic.jsx'

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export default function Screen2Identify({ onNext }) {
  const { data, updatePatient } = useKiosk()
  const locale = getLocale(data.patient.language)
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false)
  const [scanMode, setScanMode] = useState(false)
  const [scanMessage, setScanMessage] = useState('')
  const [manualId, setManualId] = useState(data.patient.abhaId || '')

  const consent = data.patient.consent || {
    hospitalDataSharing: false,
    abhaLinking: false,
  }

  function readConsent() {
    speak(`${locale.shareHospital}. ${locale.shareHospitalHelp} ${locale.linkAbha}. ${locale.linkAbhaHelp}`, data.patient.language)
  }

  function setConsent(key, value) {
    updatePatient('consent', { ...consent, [key]: value })
  }

  function acceptConsent() {
    if (!consent.hospitalDataSharing) return
    setHasAcceptedConsent(true)
  }

  function addDigit(digit) {
    if (manualId.length < 14) setManualId((current) => current + digit)
  }

  function removeDigit() {
    setManualId((current) => current.slice(0, -1))
  }

  function continueWithId() {
    updatePatient('abhaId', manualId)
    onNext?.()
  }

  function continueWalkIn() {
    updatePatient('abhaId', '')
    onNext?.()
  }

  function handleUpload(event) {
    if (event.target.files?.length) {
      setScanMessage('QR image received. ABHA details will be verified by the hospital.')
    }
  }

  if (!hasAcceptedConsent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-medi-100 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="text-medi-600" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{locale.privacy}</h1>
          <p className="text-slate-500 mt-2">{locale.privacyHelp}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <ConsentChoice
            checked={consent.hospitalDataSharing}
            onChange={(value) => setConsent('hospitalDataSharing', value)}
            title={locale.shareHospital}
            description={locale.shareHospitalHelp}
            required
          />
          <ConsentChoice
            checked={consent.abhaLinking}
            onChange={(value) => setConsent('abhaLinking', value)}
            title={locale.linkAbha}
            description={locale.linkAbhaHelp}
          />
        </div>

        <button
          type="button"
          onClick={readConsent}
          className="w-full mt-4 h-14 rounded-2xl border-2 border-medi-200 bg-medi-50 text-medi-700 font-semibold flex items-center justify-center gap-2"
        >
          <Volume2 size={20} />
          {locale.listen}
        </button>
        <button
          type="button"
          onClick={acceptConsent}
          disabled={!consent.hospitalDataSharing}
          className="w-full mt-3 h-14 rounded-2xl bg-medi-600 text-white font-bold disabled:opacity-40"
        >
          {locale.continue}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-medi-100 flex items-center justify-center mx-auto mb-3">
          <QrCode className="text-medi-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{locale.identify}</h1>
        <p className="text-slate-500 mt-2">{locale.identifyHelp}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setScanMode(true)}
          className={`h-16 rounded-2xl border-2 font-semibold flex items-center justify-center gap-2 ${scanMode ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200 bg-white text-slate-700'}`}
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

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <label htmlFor="abha-id" className="block text-sm font-semibold text-slate-600 mb-2">
          {locale.enterAbha}
        </label>
        <div id="abha-id" className="h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl tracking-widest text-slate-800">
          {manualId || locale.enterDigits}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {KEYPAD.map((digit) => (
            <button key={digit} type="button" onClick={() => addDigit(digit)} className="h-14 rounded-xl bg-slate-100 text-xl font-bold text-slate-700">
              {digit}
            </button>
          ))}
          <button type="button" onClick={removeDigit} className="h-14 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center" aria-label="Delete last digit">
            <Delete size={22} />
          </button>
        </div>
      </div>

      <button type="button" onClick={continueWithId} disabled={!manualId} className="w-full mt-4 h-14 rounded-2xl bg-medi-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2">
        <Check size={20} /> {locale.continueAbha}
      </button>
      <button type="button" onClick={continueWalkIn} className="w-full mt-3 h-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-bold">
        {locale.walkIn}
      </button>
      <a href="https://abha.abdm.gov.in" target="_blank" rel="noreferrer" className="mt-5 rounded-2xl border border-skyclin-100 bg-skyclin-50 p-4 flex items-start gap-3 text-skyclin-800 transition hover:border-skyclin-300">
        <ExternalLink size={20} className="shrink-0 mt-0.5" />
        <span><strong className="block">ABHA help</strong><span className="text-sm">Need help creating or finding your ABHA ID? Visit the official government portal.</span></span>
      </a>
    </div>
  )
}

function ConsentChoice({ checked, onChange, title, description, required }) {
  return (
    <label className="flex gap-3 items-start cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-6 w-6 accent-medi-600"
      />
      <span>
        <span className="block font-bold text-slate-800">{title}{required ? ' *' : ''}</span>
        <span className="block text-sm text-slate-500 mt-1">{description}</span>
      </span>
    </label>
  )
}
