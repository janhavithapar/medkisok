import React from 'react'
import { Check, ChevronLeft, ChevronRight, Volume2, Leaf } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic, { speak as speakText } from '../components/VoiceMic.jsx'
import { getLocale, translateOption } from '../i18n.js'

const CONSTITUTIONS = ['Vata', 'Pitta', 'Kapha']
const VIKRITI = ['Balanced', 'Vata imbalance', 'Pitta imbalance', 'Kapha imbalance']
const AGNI = ['Balanced', 'Variable', 'Intense', 'Slow']
const KOSHTHA = ['Soft', 'Regular', 'Hard']
const AHARA = ['Vegetarian', 'Non-vegetarian', 'Spicy foods', 'Irregular meals', 'Frequent snacks']
const SLEEP = ['Less than 5 hours', '5-7 hours', '7-9 hours', 'More than 9 hours']
const ACTIVITY = ['Walking', 'Yoga', 'Exercise', 'Mostly seated', 'Physically active work']

export default function Screen4Ayush({ onNext, onBack }) {
  const { sessionData, updateIntake } = useKiosk()
  const ayush = sessionData.intake.ayush
  const locale = getLocale(sessionData.patient.language)

  function select(key, value) {
    updateIntake(`ayush.${key}`, value)
  }

  function toggle(key, value) {
    const current = ayush[key] || []
    updateIntake(`ayush.${key}`, current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function speak(text) {
    speakText(translateOption(text, sessionData.patient.language) || text, sessionData.patient.language)
  }

  function voiceTo(key, transcript) {
    select(key, transcript)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-medi-100 flex items-center justify-center mx-auto mb-3">
          <Leaf className="text-medi-700" size={28} />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-medi-700">{locale.ayurvedic}</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">{locale.ayurvedaHistory}</h1>
        <p className="text-slate-500 mt-2">{locale.chooseOptions}</p>
      </div>

      <section className="mb-8">
        <SectionHeading title={locale.dashavidha} description={locale.constitution} onSpeak={() => speak(locale.dashavidha)} />
        <AyushGroup label={locale.constitution} value={ayush.prakriti} options={CONSTITUTIONS} onSelect={(value) => select('prakriti', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.currentBalance} value={ayush.vikriti} options={VIKRITI} onSelect={(value) => select('vikriti', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.digestion} value={ayush.agni} options={AGNI} onSelect={(value) => select('agni', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.bowel} value={ayush.koshtha} options={KOSHTHA} onSelect={(value) => select('koshtha', value)} onSpeak={speak} language={sessionData.patient.language} />
        <div className="flex justify-center mt-4"><VoiceMic size="sm" onResult={(value) => voiceTo('prakriti', value)} label={locale.speakAnswer} /></div>
      </section>

      <section className="mb-8">
        <SectionHeading title={locale.ahara} description={locale.allDiet} onSpeak={() => speak(locale.ahara)} />
        <Checklist options={AHARA} selected={ayush.ahara} onToggle={(value) => toggle('ahara', value)} onSpeak={speak} language={sessionData.patient.language} />
      </section>

      <section className="mb-8">
        <SectionHeading title={locale.vihara} description={locale.routine} onSpeak={() => speak(locale.vihara)} />
        <AyushGroup label={locale.sleep} value={ayush.sleepHours} options={SLEEP} onSelect={(value) => select('sleepHours', value)} onSpeak={speak} language={sessionData.patient.language} />
        <p className="text-sm font-bold text-slate-700 mb-2 mt-5">{locale.activity}</p>
        <Checklist options={ACTIVITY} selected={ayush.activityHabits} onToggle={(value) => toggle('activityHabits', value)} onSpeak={speak} language={sessionData.patient.language} />
        <div className="flex justify-center mt-4"><VoiceMic size="sm" onResult={(value) => voiceTo('activityHabits', [value])} label={locale.speakAnswer} /></div>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 flex items-center justify-center" aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={onNext} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2">
          {locale.saveAyurveda} <Check size={20} /> <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

function SectionHeading({ title, description, onSpeak }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500 mt-1">{description}</p></div>
      <button type="button" onClick={onSpeak} aria-label={`Read ${title} aloud`} className="w-12 h-12 rounded-full bg-medi-50 text-medi-700 flex items-center justify-center" title="Read aloud"><Volume2 size={20} /></button>
    </div>
  )
}

function AyushGroup({ label, value, options, onSelect, onSpeak, language }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-bold text-slate-700 mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option) => <OptionCard key={option} label={option} selected={value === option} onSelect={() => onSelect(option)} onSpeak={onSpeak} language={language} />)}
      </div>
    </div>
  )
}

function Checklist({ options, selected, onToggle, onSpeak, language }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((option) => <OptionCard key={option} label={option} selected={selected.includes(option)} onSelect={() => onToggle(option)} onSpeak={onSpeak} language={language} />)}
    </div>
  )
}

function OptionCard({ label, selected, onSelect, onSpeak, language }) {
  function readOption(event) {
    event.stopPropagation()
    onSpeak(label)
  }

  function selectWithKeyboard(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div role="button" tabIndex="0" onClick={onSelect} onKeyDown={selectWithKeyboard} className={`min-h-[64px] rounded-2xl border-2 p-2 text-left flex items-center gap-2 transition-colors cursor-pointer ${selected ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200 bg-white text-slate-700 hover:border-medi-300'}`}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${selected ? 'bg-medi-600 text-white' : 'bg-slate-100 text-transparent'}`}><Check size={16} /></span>
      <span className="flex-1 text-sm font-semibold">{translateOption(label, language)}</span>
      <button type="button" onClick={readOption} aria-label={`Read ${label} aloud`} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-medi-700" title="Read aloud"><Volume2 size={16} /></button>
    </div>
  )
}
