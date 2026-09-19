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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      <div className="kiosk-panel rounded-[2rem] overflow-hidden">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-medi-700 text-white p-7 sm:p-10 flex flex-col justify-between min-h-[270px]">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-7">
                <Languages size={29} />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-medi-100 font-bold">Welcome to MediKiosk</p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mt-3">Let’s make your visit easier.</h1>
              <p className="text-medi-100 mt-4 max-w-sm">Choose the language you are most comfortable speaking. Your questions and voice support will follow your choice.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-medi-100 mt-8"><ShieldCheck size={18} /> Private, patient-first intake</div>
          </div>
          <div className="p-6 sm:p-10 bg-white">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.16em] text-medi-700 font-bold">Step 1 of your visit</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">Choose your language</h2>
              <p className="text-slate-500 mt-1">अपनी भाषा चुनें</p>
            </div>
            <label className="block mb-5">
              <span className="block text-sm font-bold text-slate-700 mb-2">Select hospital</span>
              <select value={data.selectedHospital} onChange={(event) => setSelectedHospital(event.target.value)} className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-slate-700 font-semibold focus:outline-none focus:border-medi-500">
                {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => choose(lang.code)}
            className={`h-16 rounded-2xl border-2 text-lg font-semibold flex items-center justify-between px-4 transition-all
              ${data.patient.language === lang.code
                ? 'border-medi-600 bg-medi-50 text-medi-700 shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-medi-300 hover:-translate-y-0.5'}`}
          >
            <span>{lang.label}</span>
            {data.patient.language === lang.code && <Check size={19} />}
          </button>
        ))}
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-slate-400"><span className="w-2 h-2 rounded-full bg-medi-500" /> Select one to continue automatically <ArrowRight size={16} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
