import React from 'react'
import { Check, ChevronLeft, ChevronRight, Volume2, Leaf } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic from '../components/VoiceMic.jsx'

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

  function select(key, value) {
    updateIntake(`ayush.${key}`, value)
  }

  function toggle(key, value) {
    const current = ayush[key] || []
    updateIntake(`ayush.${key}`, current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
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
        <p className="text-sm font-bold uppercase tracking-wide text-medi-700">Ayurvedic OPD</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-1">Your Ayurveda history</h1>
        <p className="text-slate-500 mt-2">Choose the options that best describe you. You can tap or speak.</p>
      </div>

      <section className="mb-8">
        <SectionHeading title="Dashavidha Pariksha" description="Constitution and digestive assessment" onSpeak={() => speak('Dashavidha Pariksha. Constitution and digestive assessment.')} />
        <AyushGroup label="Prakriti - your natural constitution" value={ayush.prakriti} options={CONSTITUTIONS} onSelect={(value) => select('prakriti', value)} onSpeak={speak} />
        <AyushGroup label="Vikriti - your current balance" value={ayush.vikriti} options={VIKRITI} onSelect={(value) => select('vikriti', value)} onSpeak={speak} />
        <AyushGroup label="Agni - your digestive fire" value={ayush.agni} options={AGNI} onSelect={(value) => select('agni', value)} onSpeak={speak} />
        <AyushGroup label="Koshtha - your bowel nature" value={ayush.koshtha} options={KOSHTHA} onSelect={(value) => select('koshtha', value)} onSpeak={speak} />
        <div className="flex justify-center mt-4"><VoiceMic size="sm" onResult={(value) => voiceTo('prakriti', value)} label="Speak constitution" /></div>
      </section>

      <section className="mb-8">
        <SectionHeading title="Ahara - diet" description="Select all that apply" onSpeak={() => speak('Ahara. Select all diet types that apply.')} />
        <Checklist options={AHARA} selected={ayush.ahara} onToggle={(value) => toggle('ahara', value)} onSpeak={speak} />
      </section>

      <section className="mb-8">
        <SectionHeading title="Vihara - sleep and activity" description="Tell us about your daily routine" onSpeak={() => speak('Vihara. Sleep and activity. Tell us about your daily routine.')} />
        <AyushGroup label="How many hours do you sleep?" value={ayush.sleepHours} options={SLEEP} onSelect={(value) => select('sleepHours', value)} onSpeak={speak} />
        <p className="text-sm font-bold text-slate-700 mb-2 mt-5">Activity habits - select all that apply</p>
        <Checklist options={ACTIVITY} selected={ayush.activityHabits} onToggle={(value) => toggle('activityHabits', value)} onSpeak={speak} />
        <div className="flex justify-center mt-4"><VoiceMic size="sm" onResult={(value) => voiceTo('activityHabits', [value])} label="Speak about your routine" /></div>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 flex items-center justify-center" aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <button type="button" onClick={onNext} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2">
          Save Ayurveda history <Check size={20} /> <ChevronRight size={20} />
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

function AyushGroup({ label, value, options, onSelect, onSpeak }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-bold text-slate-700 mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {options.map((option) => <OptionCard key={option} label={option} selected={value === option} onSelect={() => onSelect(option)} onSpeak={onSpeak} />)}
      </div>
    </div>
  )
}

function Checklist({ options, selected, onToggle, onSpeak }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((option) => <OptionCard key={option} label={option} selected={selected.includes(option)} onSelect={() => onToggle(option)} onSpeak={onSpeak} />)}
    </div>
  )
}

function OptionCard({ label, selected, onSelect, onSpeak }) {
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
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <button type="button" onClick={readOption} aria-label={`Read ${label} aloud`} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-medi-700" title="Read aloud"><Volume2 size={16} /></button>
    </div>
  )
}
