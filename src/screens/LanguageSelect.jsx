import React from 'react'
import { Languages } from 'lucide-react'
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
  const { data, updatePatient } = useKiosk()

  function choose(code) {
    updatePatient('language', code)
    onNext?.()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-medi-100 flex items-center justify-center mb-3">
          <Languages className="text-medi-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Choose your language</h1>
        <p className="text-slate-500 mt-1">अपनी भाषा चुनें</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => choose(lang.code)}
            className={`h-16 rounded-2xl border-2 text-lg font-semibold flex items-center justify-center transition-colors
              ${data.patient.language === lang.code
                ? 'border-medi-600 bg-medi-50 text-medi-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-medi-300'}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  )
}
