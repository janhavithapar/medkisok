import React, { useState } from 'react'
import { AlertTriangle, Bot, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic from '../components/VoiceMic.jsx'

const QUESTIONS = [
  {
    key: 'chiefComplaint',
    title: 'What problem brings you in today?',
    options: ['Pain', 'Fever', 'Cough', 'Breathlessness', 'Bleeding'],
  },
  {
    key: 'hpi.site',
    title: 'Where do you feel it?',
    options: ['Chest', 'Head', 'Stomach', 'Back', 'Whole body'],
  },
  {
    key: 'hpi.onset',
    title: 'When did it start?',
    options: ['Today', 'Yesterday', 'This week', 'More than a week ago'],
  },
  {
    key: 'hpi.character',
    title: 'What does it feel like?',
    options: ['Sharp', 'Dull', 'Burning', 'Throbbing', 'Pressure'],
  },
  {
    key: 'hpi.radiation',
    title: 'Does it spread or come with other symptoms?',
    options: ['Does not spread', 'Spreads to arm', 'Spreads to back', 'With nausea', 'With dizziness'],
    secondaryKey: 'hpi.associatedSymptoms',
  },
  {
    key: 'hpi.timing',
    title: 'What makes it better or worse?',
    options: ['Constant', 'Comes and goes', 'Worse with activity', 'Better with rest', 'After eating'],
    secondaryKey: 'hpi.exacerbatingRelieving',
  },
  {
    key: 'hpi.severity',
    title: 'How severe is it from 0 to 10?',
    options: ['0 - None', '1 - Mild', '3 - Mild', '5 - Moderate', '7 - Severe', '10 - Worst'],
  },
]

export default function Screen3Intake({ onNext }) {
  const { data, updateIntake } = useKiosk()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const question = QUESTIONS[step]
  const answer = getValue(data.intake, question.key)
  const redFlagTriggered = data.intake.redFlagTriggered

  function saveAnswer(value) {
    updateIntake(question.key, value)
    if (question.secondaryKey) updateIntake(question.secondaryKey, value)
    setDraft('')
  }

  function submitDraft(event) {
    event.preventDefault()
    if (draft.trim()) saveAnswer(draft.trim())
  }

  function nextStep() {
    if (step < QUESTIONS.length - 1) {
      setStep((current) => current + 1)
      setDraft('')
    }
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0))
    setDraft('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
      {redFlagTriggered && <RedFlagAlert flags={data.intake.redFlags} />}

      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-medi-600 flex items-center justify-center shrink-0">
          <Bot size={20} color="white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-medi-700 mb-1">Clinical intake</p>
          <h1 className="text-xl font-bold text-slate-800">{question.title}</h1>
        </div>
      </div>

      <div className="mb-6" aria-label={`Step ${step + 1} of 7`}>
        <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
          <span>Step {step + 1} of 7</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-medi-600 transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
      </div>

      {answer && (
        <div className="flex justify-end mb-5">
          <div className="bg-medi-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">{answer}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => saveAnswer(option)}
            className={`min-h-[60px] rounded-2xl border-2 px-3 py-2 text-left font-semibold transition-colors ${answer === option ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200 bg-white text-slate-700 hover:border-medi-300'}`}
          >
            {option}
          </button>
        ))}
      </div>

      <form onSubmit={submitDraft} className="mb-5">
        <label htmlFor="intake-answer" className="sr-only">Type your answer</label>
        <div className="flex gap-2">
          <input
            id="intake-answer"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Or type your answer"
            className="flex-1 h-14 rounded-2xl border-2 border-slate-200 px-4 focus:outline-none focus:border-medi-500"
          />
          <button type="submit" className="h-14 px-5 rounded-2xl bg-medi-600 text-white font-bold">Add</button>
        </div>
      </form>

      <div className="flex justify-center mb-7">
        <VoiceMic onResult={saveAnswer} label="Speak your answer" />
      </div>

      {step === QUESTIONS.length - 1 && <AdditionalHistory data={data.intake} updateIntake={updateIntake} />}

      <div className="flex gap-3">
        <button type="button" onClick={previousStep} disabled={step === 0} className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 flex items-center justify-center disabled:opacity-40" aria-label="Previous question">
          <ChevronLeft size={22} />
        </button>
        {step < QUESTIONS.length - 1 ? (
          <button type="button" onClick={nextStep} disabled={!answer} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            Next question <ChevronRight size={20} />
          </button>
        ) : (
          <button type="button" onClick={onNext} disabled={!answer} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40">
            Continue <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

function AdditionalHistory({ data, updateIntake }) {
  return (
    <section className="border-t border-slate-200 pt-6 mb-7">
      <h2 className="text-lg font-bold text-slate-800 mb-1">A little more about your history</h2>
      <p className="text-sm text-slate-500 mb-4">These details help the doctor prepare. You can leave any field blank.</p>
      <HistoryField label="Past medical or surgical history" value={data.pastMedicalSurgicalHistory} onChange={(value) => updateIntake('pastMedicalSurgicalHistory', value)} />
      <HistoryField label="Medicines or allergies" value={data.drugAllergyHistory.allergies.join(', ')} onChange={(value) => updateIntake('drugAllergyHistory.allergies', value ? value.split(',').map((item) => item.trim()) : [])} />
      <HistoryField label="Family and personal history" value={`${data.familyHistory}${data.personalHistory ? `; ${data.personalHistory}` : ''}`} onChange={(value) => { updateIntake('familyHistory', value); updateIntake('personalHistory', value) }} />
      <HistoryField label="Other symptoms or concerns" value={data.reviewOfSystems} onChange={(value) => updateIntake('reviewOfSystems', value)} />
    </section>
  )
}

function HistoryField({ label, value, onChange }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-semibold text-slate-600 mb-1">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="2" className="w-full rounded-xl border-2 border-slate-200 p-3 resize-none focus:outline-none focus:border-medi-500" />
    </label>
  )
}

function RedFlagAlert({ flags }) {
  return (
    <div className="fixed inset-x-0 top-0 z-20 bg-red-700 text-white shadow-xl" role="alert">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-start gap-3">
        <ShieldAlert size={28} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-lg">Please wait, we are calling a nurse to see you now.</p>
          <p className="text-sm text-red-100 mt-1">Your answers need urgent review. Please stay here and follow staff instructions.</p>
          <p className="text-xs text-red-200 mt-2">{flags.join(' | ')}</p>
        </div>
        <AlertTriangle size={20} className="shrink-0" />
      </div>
    </div>
  )
}

function getValue(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source) || ''
}
