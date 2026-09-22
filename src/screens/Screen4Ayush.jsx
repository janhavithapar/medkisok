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
    <div className="mx-auto max-w-4xl px-4 py-8 pb-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-amber-100 shadow-[0_18px_32px_rgba(16,185,129,0.14)]">
          <Leaf className="text-emerald-700" size={30} />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">{locale.ayurvedic}</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{locale.ayurvedaHistory}</h1>
        <p className="mt-2 text-slate-600">{locale.chooseOptions}</p>
      </div>

      <section className="mb-8 rounded-[2rem] border border-emerald-100 bg-white/80 p-5 shadow-[0_18px_40px_rgba(12,36,28,0.06)] sm:p-6">
        <SectionHeading title={locale.dashavidha} description={locale.constitution} onSpeak={() => speak(locale.dashavidha)} />
        <AyushGroup label={locale.constitution} value={ayush.prakriti} options={CONSTITUTIONS} onSelect={(value) => select('prakriti', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.currentBalance} value={ayush.vikriti} options={VIKRITI} onSelect={(value) => select('vikriti', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.digestion} value={ayush.agni} options={AGNI} onSelect={(value) => select('agni', value)} onSpeak={speak} language={sessionData.patient.language} />
        <AyushGroup label={locale.bowel} value={ayush.koshtha} options={KOSHTHA} onSelect={(value) => select('koshtha', value)} onSpeak={speak} language={sessionData.patient.language} />
        <div className="mt-4 flex justify-center"><VoiceMic size="sm" onResult={(value) => voiceTo('prakriti', value)} label={locale.speakAnswer} /></div>
      </section>

      <section className="mb-8 rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-[0_18px_40px_rgba(251,191,36,0.08)] sm:p-6">
        <SectionHeading title={locale.ahara} description={locale.allDiet} onSpeak={() => speak(locale.ahara)} />
        <Checklist options={AHARA} selected={ayush.ahara} onToggle={(value) => toggle('ahara', value)} onSpeak={speak} language={sessionData.patient.language} />
      </section>

      <section className="mb-8 rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-5 shadow-[0_18px_40px_rgba(14,165,233,0.08)] sm:p-6">
        <SectionHeading title={locale.vihara} description={locale.routine} onSpeak={() => speak(locale.vihara)} />
        <AyushGroup label={locale.sleep} value={ayush.sleepHours} options={SLEEP} onSelect={(value) => select('sleepHours', value)} onSpeak={speak} language={sessionData.patient.language} />
        <p className="mt-5 mb-2 text-sm font-black text-slate-700">{locale.activity}</p>
        <Checklist options={ACTIVITY} selected={ayush.activityHabits} onToggle={(value) => toggle('activityHabits', value)} onSpeak={speak} language={sessionData.patient.language} />
        <div className="mt-4 flex justify-center"><VoiceMic size="sm" onResult={(value) => voiceTo('activityHabits', [value])} label={locale.speakAnswer} /></div>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300" aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={onNext} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-black text-white shadow-[0_20px_30px_rgba(16,185,129,0.2)] transition hover:brightness-105">
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
