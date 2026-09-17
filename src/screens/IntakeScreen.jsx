import React, { useState } from 'react'
import { AlertTriangle, Bot, ChevronRight, Send } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic from '../components/VoiceMic.jsx'

const COMMON_SYMPTOMS = [
  'Fever', 'Headache', 'Chest pain', 'Cough', 'Stomach pain',
  'Vomiting', 'Body ache', 'Shortness of breath', 'Dizziness',
]

export default function IntakeScreen({ onNext }) {
  const { data, updateIntake, addSymptomTag } = useKiosk()
  const [textInput, setTextInput] = useState('')

  function handleVoiceResult(transcript) {
    updateIntake('chiefComplaint', transcript)
  }

  function handleTagClick(symptom) {
    addSymptomTag(symptom)
  }

  function handleTextSubmit(e) {
    e.preventDefault()
    if (!textInput.trim()) return
    updateIntake('chiefComplaint', textInput.trim())
    setTextInput('')
  }

  const hasRedFlags = data.intake.redFlags.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Chat-style prompt bubble */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-medi-600 flex items-center justify-center shrink-0">
          <Bot size={20} color="white" />
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 max-w-[85%]">
          <p className="text-slate-800">
            Hi {data.patient.name}, what problem brings you in today? You can tap a
            symptom, type it, or press the mic and speak.
          </p>
        </div>
      </div>

      {/* Current chief complaint echoed back, chat-bubble style */}
      {data.intake.chiefComplaint && (
        <div className="flex justify-end mb-6">
          <div className="bg-medi-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]">
            <p>{data.intake.chiefComplaint}</p>
          </div>
        </div>
      )}

      {/* Red flag alert, shown live to reassure patient it's been noted */}
      {hasRedFlags && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700 font-medium">
            This has been flagged for urgent doctor review.
          </p>
        </div>
      )}

      {/* Symptom quick-tap cards */}
      <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">
        Common symptoms
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {COMMON_SYMPTOMS.map((symptom) => (
          <button
            key={symptom}
            onClick={() => handleTagClick(symptom)}
            className="min-h-[56px] rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium
              hover:border-medi-400 hover:bg-medi-50 transition-colors text-left"
          >
            {symptom}
          </button>
        ))}
      </div>

      {/* Text input fallback */}
      <form onSubmit={handleTextSubmit} className="flex items-center gap-2 mb-8">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type your symptom here…"
          className="flex-1 h-14 rounded-2xl border-2 border-slate-200 px-4 text-slate-800 focus:outline-none focus:border-medi-500"
        />
        <button
          type="submit"
          aria-label="Submit"
          className="w-14 h-14 rounded-2xl bg-medi-600 flex items-center justify-center text-white shrink-0"
        >
          <Send size={20} />
        </button>
      </form>

      {/* Persistent voice mic */}
      <div className="flex justify-center mb-8">
        <VoiceMic onResult={handleVoiceResult} label="Tap and describe your problem" />
      </div>

      {/* Continue */}
      <button
        onClick={onNext}
        disabled={!data.intake.chiefComplaint}
        className="w-full h-14 rounded-2xl bg-medi-600 disabled:bg-slate-200 disabled:text-slate-400
          text-white font-semibold flex items-center justify-center gap-1 shadow-md fixed bottom-4 left-1/2 -translate-x-1/2 max-w-2xl mx-auto
          sm:static sm:translate-x-0"
        style={{ width: 'min(calc(100% - 2rem), 42rem)' }}
      >
        Continue <ChevronRight size={20} />
      </button>
    </div>
  )
}
