import React from 'react'
import { ArrowRight, Check, Languages, ShieldCheck } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

export default function LanguageSelect({ onNext }) {
  const { data, updatePatient, hospitals, setSelectedHospital } = useKiosk()

  function choose(code) {
    updatePatient('language', code)
    onNext?.()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="kiosk-panel overflow-hidden rounded-[2rem]">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-h-[260px] flex-col justify-between bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-7 text-white sm:p-10">
            <div>
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_12px_24px_rgba(4,27,18,0.2)]">
                <Languages size={29} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Welcome to MediKiosk</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Let’s make your visit easier.</h1>
              <p className="mt-4 max-w-sm text-sm text-emerald-50 sm:text-base">
                Choose the language you are most comfortable speaking. Your questions and voice support will follow your choice.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-emerald-50">
              <ShieldCheck size={18} />
              <span>Private, patient-first intake</span>
            </div>
          </div>

          <div className="bg-white/75 p-6 sm:p-10">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Step 1 of your visit</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Choose your language</h2>
              <p className="mt-1 text-slate-500">अपनी भाषा चुनें</p>
            </div>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Select hospital</span>
              <select
                value={data.selectedHospital}
                onChange={(event) => setSelectedHospital(event.target.value)}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:bg-white"
              >
                {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => choose(lang.code)}
                  className={`flex h-16 items-center justify-between rounded-2xl border-2 px-4 text-lg font-semibold transition-all ${
                    data.patient.language === lang.code
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_10px_24px_rgba(31,167,106,0.12)]'
                      : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-emerald-300'
                  }`}
                >
                  <span>{lang.label}</span>
                  {data.patient.language === lang.code && <Check size={19} />}
                </button>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-2 text-sm text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Select one to continue automatically</span>
              <ArrowRight size={16} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
