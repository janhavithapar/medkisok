import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bot, ChevronLeft, ChevronRight, Keyboard, Send, ShieldAlert, Volume2 } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic, { speak } from '../components/VoiceMic.jsx'
import { getBotReply, getLocale } from '../i18n.js'

const PROTOCOL_PATHS = {
  cardiac: [
    { id: 'cardiac-radiation', key: 'hpi.radiation', titleKey: 'cardiacLocation', options: ['Yes, radiating', 'Chest only', 'Unsure'] },
    { id: 'cardiac-quality', key: 'hpi.character', titleKey: 'cardiacQuality', options: ['Heavy squeezing', 'Sharp/Stabbing', 'Burning'] },
    { id: 'cardiac-autonomic', key: 'hpi.associatedSymptoms', titleKey: 'cardiacAutonomic', options: ['Yes, sweating/dizzy', 'Nausea only', 'No'] },
    { id: 'cardiac-rest', key: 'hpi.exacerbatingRelieving', titleKey: 'cardiacRest', options: ['Eases with rest', 'Continuous', 'Unsure'] },
  ],
  respiratory: [
    { id: 'respiratory-mechanics', key: 'hpi.exacerbatingRelieving', titleKey: 'respiratoryMechanics', options: ['Worse with breath/cough', 'No change', 'Unsure'] },
    { id: 'respiratory-sputum', key: 'hpi.associatedSymptoms', titleKey: 'respiratorySputum', options: ['No phlegm', 'Yellow/green', 'Rusty/bloody'] },
    { id: 'respiratory-position', key: 'hpi.timing', titleKey: 'respiratoryPosition', options: ['Worse lying flat', 'Same sitting/lying', 'Unsure'] },
    { id: 'respiratory-wheeze', key: 'hpi.character', titleKey: 'respiratoryWheeze', options: ['Wheezing', 'Normal breathing', 'Unsure'] },
  ],
  abdominal: [
    { id: 'abdominal-site', key: 'hpi.site', titleKey: 'abdominalSite', options: ['Lower right', 'Upper right', 'Middle stomach', 'All over'] },
    { id: 'abdominal-meals', key: 'hpi.exacerbatingRelieving', titleKey: 'abdominalMeals', options: ['Worse after eating', 'Worse empty stomach', 'No relation'] },
    { id: 'abdominal-peritoneal', key: 'hpi.character', titleKey: 'abdominalPeritoneal', options: ['Sharp with movement', 'No change with movement', 'Unsure'] },
    { id: 'abdominal-bleed', key: 'hpi.associatedSymptoms', titleKey: 'abdominalBleed', options: ['Black stools/blood vomit', 'Cannot pass gas', 'None'] },
  ],
  fever: [
    { id: 'fever-rigors', key: 'hpi.timing', titleKey: 'feverRigors', options: ['Severe chills', 'Mild chills', 'No chills'] },
    { id: 'fever-meningeal', key: 'hpi.associatedSymptoms', titleKey: 'feverMeningeal', options: ['Stiff neck/light sensitivity', 'Severe throat infection', 'No'] },
    { id: 'fever-rash-urinary', key: 'hpi.character', titleKey: 'feverRashUrinary', options: ['Rash', 'Painful urination', 'No'] },
  ],
  neurological: [
    { id: 'neuro-sudden', key: 'hpi.onset', titleKey: 'neuroSudden', options: ['Sudden', 'Gradual'] },
    { id: 'neuro-motor', key: 'hpi.associatedSymptoms', titleKey: 'neuroMotor', options: ['One-sided weakness/numbness', 'Face weakness', 'No'] },
    { id: 'neuro-speech', key: 'hpi.character', titleKey: 'neuroSpeech', options: ['Speech trouble', 'Double vision', 'No'] },
    { id: 'neuro-thunderclap', key: 'hpi.severity', titleKey: 'neuroThunderclap', options: ['Worst sudden headache', 'Severe but not sudden', 'No'] },
  ],
  uri: [
    { id: 'uri-chronology', key: 'hpi.onset', titleKey: 'uriChronology', options: ['1-3 days', '4-7 days', 'More than a week'] },
    { id: 'uri-systemic', key: 'hpi.associatedSymptoms', titleKey: 'uriSystemic', options: ['Body aches/fatigue', 'Low-grade fever', 'None'] },
    { id: 'uri-progression', key: 'hpi.character', titleKey: 'uriProgression', options: ['Clear/Watery', 'Thick yellow/green', 'Blood-tinged'] },
    { id: 'uri-allergy', key: 'hpi.timing', titleKey: 'uriAllergy', options: ['Itchy/watery eyes', 'Every year now', 'Neither'] },
  ],
  cough: [
    { id: 'cough-quality', key: 'hpi.character', titleKey: 'coughQuality', options: ['Dry', 'Productive/Mucus', 'Both'] },
    { id: 'cough-triggers', key: 'hpi.exacerbatingRelieving', titleKey: 'coughTriggers', options: ['Worse at night', 'Worse lying down', 'Worse after eating', 'No pattern'] },
    { id: 'cough-duration', key: 'hpi.onset', titleKey: 'coughDuration', options: ['More than 3 weeks', '1-3 weeks', 'Less than 1 week'] },
    { id: 'cough-signs', key: 'hpi.associatedSymptoms', titleKey: 'coughSigns', options: ['Chest pain', 'Wheezing/fever', 'None'] },
  ],
  headache: [
    { id: 'headache-location', key: 'hpi.site', titleKey: 'headacheLocation', options: ['Both temples/sides', 'One side only', 'Forehead', 'Back of head'] },
    { id: 'headache-quality', key: 'hpi.character', titleKey: 'headacheQuality', options: ['Throbbing/Pounding', 'Dull/Pressing', 'Sharp/Stabbing'] },
    { id: 'headache-aggravating', key: 'hpi.exacerbatingRelieving', titleKey: 'headacheAggravating', options: ['Sensitive to both', 'Slightly bothered', 'No'] },
    { id: 'headache-visual', key: 'hpi.associatedSymptoms', titleKey: 'headacheVisual', options: ['Nausea/dizziness', 'Visual changes', 'No'] },
  ],
}

const GENERAL_PATH = [
  { id: 'general-site', key: 'hpi.site', titleKey: 'where', options: ['One area', 'Several areas', 'All over'] },
  { id: 'general-onset', key: 'hpi.onset', titleKey: 'when', options: ['Today', 'Yesterday', 'This week', 'More than a week ago'] },
  { id: 'general-character', key: 'hpi.character', titleKey: 'feel', options: ['Sharp', 'Dull', 'Burning', 'Other'] },
  { id: 'general-severity', key: 'hpi.severity', titleKey: 'severity', options: ['Mild', 'Moderate', 'Severe'] },
]

function classifyComplaint(text = '') {
  const value = text.toLowerCase()
  if (/chest|heart|छाती|हृदय|நெஞ்சு|ఛాతీ|বুক|છાતી|ಎದೆ/.test(value)) return 'cardiac'
  if (/headache|migraine|सिरदर्द|डोकेदुखी|தலைவலி|తలనొప్పి|মাথাব্যথা|માથાનો દુખાવો|ತಲೆನೋವು/.test(value)) return 'headache'
  if (/runny|running nose|congestion|sneez|cold|नाक बह|जुकाम|नाका|மூக்கு|சளி|ముక్కు|జలుబు|সর্দি|નાક|શરદી|ಮೂಗು|ನೆಗಡಿ/.test(value)) return 'uri'
  if (/cough|खांसी|खोकला|இருமல்|దగ్గు|কাশি|ઉધરસ|ಕೆಮ್ಮ/.test(value)) return 'cough'
  if (/breath|breathing|cough|asthma|सांस|श्वास|छातीत|மூச்சு|இருமல்|శ్వాస|దగ్గు|শ্বাস|কাশি|શ્વાસ|ઉધરસ|ಉಸಿರ|ಕೆಮ್ಮ/.test(value)) return 'respiratory'
  if (/stomach|abdomen|belly|vomit|पेट|उल्टी|வயிறு|வாந்தி|కడుపు|వాంతి|পেট|বমি|પેટ|ઊલટી|ಹೊಟ್ಟೆ|ವಾಂತಿ/.test(value)) return 'abdominal'
  if (/fever|temperature|ताप|बुखार|காய்ச்சல்|జ్వరం|জ্বর|તાવ|ಜ್ವರ/.test(value)) return 'fever'
  if (/stroke|weak|numb|dizzy|headache|चक्कर|कमजोर|डोके|மயக்கம்|தலைவலி|బలహీన|తలవலி|দুর্বল|মাথাব্যথা|નબળ|માથાનો|ದೌರ್ಬಲ್ಯ|ತಲೆನೋವು/.test(value)) return 'neurological'
  return 'general'
}

const ROS_OPTIONS = ['rosBreathing', 'rosChest', 'rosFever', 'rosDigestive', 'rosNeurological', 'rosNone']

export default function Screen3Intake({ onNext }) {
  const { data, updateIntake } = useKiosk()
  const locale = getLocale(data.patient.language)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [phase, setPhase] = useState(data.intake.chiefComplaint ? 'protocol' : 'chief')
  const [typingOpen, setTypingOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [reviewItems, setReviewItems] = useState([])
  const skipQuestionSpeech = useRef(false)
  const category = classifyComplaint(data.intake.chiefComplaint)
  const questionFlow = PROTOCOL_PATHS[category] || GENERAL_PATH
  const question = phase === 'chief' ? { id: 'chief-complaint', key: 'chiefComplaint', titleKey: 'problem', options: [] } : questionFlow[currentStepIndex]
  const answer = getValue(data.intake, question.key)
  const isLastStep = phase === 'protocol' && currentStepIndex === questionFlow.length - 1

  useEffect(() => {
    if (skipQuestionSpeech.current) {
      skipQuestionSpeech.current = false
      return
    }
    speak(locale[question.titleKey], data.patient.language)
  }, [phase, currentStepIndex, data.patient.language])

  function saveAnswer(value) {
    const cleanValue = String(value || '').trim()
    if (!cleanValue) return
    updateIntake(question.key, cleanValue)
    if (phase === 'chief') {
      setPhase('protocol')
      setCurrentStepIndex(0)
      const nextQuestion = PROTOCOL_PATHS[classifyComplaint(cleanValue)]?.[0]
      if (nextQuestion) speak(`${getBotReply(data.patient.language)} ${locale[nextQuestion.titleKey]}`, data.patient.language)
      return
    }
    if (question.secondaryKey) updateIntake(question.secondaryKey, cleanValue)
    setDraft('')
    setTypingOpen(false)
    if (!isLastStep) {
      const nextQuestion = questionFlow[currentStepIndex + 1]
      skipQuestionSpeech.current = true
      speak(`${getBotReply(data.patient.language)} ${locale[nextQuestion.titleKey]}`, data.patient.language)
      window.setTimeout(() => setCurrentStepIndex((current) => current + 1), 350)
    } else {
      speak(`${getBotReply(data.patient.language)} ${locale.reviewTitle}`, data.patient.language)
      setShowReview(true)
    }
  }

  function toggleReview(key) {
    setReviewItems((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  function finishReview() {
    updateIntake('reviewOfSystems', reviewItems.map((key) => locale[key]).join(', ') || locale.rosNone)
    speak(locale.reviewContinue, data.patient.language)
    onNext?.()
  }

  if (showReview) {
    return <ReviewOfSystems language={data.patient.language} selected={reviewItems} onToggle={toggleReview} onContinue={finishReview} />
  }

  function submitDraft(event) {
    event.preventDefault()
    saveAnswer(draft)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
      {data.intake.redFlagTriggered && <RedFlagAlert flags={data.intake.redFlags} language={data.patient.language} />}

      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-medi-600 flex items-center justify-center shrink-0"><Bot size={22} color="white" /></div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-medi-700 mb-1">{locale.clinicalIntake}</p>
          <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{locale[question.titleKey]}</h1>
            <button type="button" onClick={() => speak(locale[question.titleKey], data.patient.language)} aria-label={locale.readAloud} className="w-10 h-10 rounded-full bg-medi-50 text-medi-700 flex items-center justify-center"><Volume2 size={18} /></button>
          </div>
        </div>
      </div>

      <div className="mb-6" aria-label={phase === 'chief' ? locale.clinicalIntake : `${locale.step} ${currentStepIndex + 1} ${locale.of} ${questionFlow.length}`}>
        <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2"><span>{phase === 'chief' ? locale.clinicalIntake : `${locale.step} ${currentStepIndex + 1} ${locale.of} ${questionFlow.length}`}</span><span>{phase === 'chief' ? ' ' : `${Math.round(((currentStepIndex + 1) / questionFlow.length) * 100)}${locale.percent}`}</span></div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-medi-600 transition-all" style={{ width: phase === 'chief' ? '12%' : `${((currentStepIndex + 1) / questionFlow.length) * 100}%` }} /></div>
      </div>

      <div className="space-y-4 mb-7 min-h-24">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-medi-100 text-medi-700 flex items-center justify-center shrink-0"><Bot size={17} /></div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"><p className="text-slate-800">{locale[question.titleKey]}</p><p className="text-xs text-slate-400 mt-2">{locale.speakAnswer}</p></div>
        </div>
        {answer && <div className="flex justify-end"><div className="bg-medi-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">{answer}</div></div>}
      </div>

      <div className="rounded-3xl border-2 border-medi-200 bg-medi-50/60 p-6 mb-5">
        <p className="text-center text-sm font-semibold text-medi-800 mb-4">{locale.speakAnswer}</p>
        <div className="flex justify-center"><VoiceMic onResult={saveAnswer} label={locale.speakAnswer} /></div>
        <p className="text-center text-xs text-slate-500 mt-4">{locale.speakAnswer}</p>
      </div>

      {question.options?.length > 0 && <div className="grid grid-cols-2 gap-3 mb-5">{question.options.map((option) => <button key={option} type="button" onClick={() => saveAnswer(option)} className={`min-h-14 rounded-2xl border-2 bg-white px-3 text-left text-sm font-semibold text-slate-700 hover:border-medi-400 ${answer === option ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200'}`}>{option}</button>)}</div>}

      <button type="button" onClick={() => setTypingOpen((current) => !current)} className="mx-auto mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600"><Keyboard size={17} /> {typingOpen ? locale.back : locale.typeAnswer}</button>
      {typingOpen && <form onSubmit={submitDraft} className="flex gap-2 mb-6"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={locale.typeAnswer} className="flex-1 h-14 rounded-2xl border-2 border-slate-200 px-4 focus:outline-none focus:border-medi-500" /><button type="submit" aria-label={locale.add} className="h-14 w-14 rounded-2xl bg-medi-600 text-white flex items-center justify-center"><Send size={20} /></button></form>}

      <div className="flex gap-3">
        <button type="button" onClick={() => { if (phase === 'protocol' && currentStepIndex > 0) setCurrentStepIndex((current) => current - 1); else if (phase === 'protocol') setPhase('chief'); setTypingOpen(false) }} disabled={phase === 'chief'} className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 flex items-center justify-center disabled:opacity-40" aria-label={locale.back}><ChevronLeft size={22} /></button>
        {phase === 'protocol' && isLastStep ? <button type="button" onClick={() => setShowReview(true)} disabled={!answer} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40">{locale.reviewTitle} <ChevronRight size={20} /></button> : <div className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-500 font-semibold flex items-center justify-center">{phase === 'chief' ? locale.speakAnswer : locale.next}</div>}
      </div>

      {isLastStep && <AdditionalHistory data={data.intake} updateIntake={updateIntake} language={data.patient.language} />}
    </div>
  )
}

function ReviewOfSystems({ language, selected, onToggle, onContinue }) {
  const locale = getLocale(language)
  return <div className="max-w-2xl mx-auto px-4 py-8"><div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"><p className="text-xs font-bold uppercase tracking-wide text-medi-700">{locale.clinicalIntake}</p><h1 className="text-2xl font-bold text-slate-800 mt-2">{locale.reviewTitle}</h1><p className="text-slate-500 mt-2">{locale.reviewSelect}</p><div className="grid grid-cols-2 gap-3 mt-6">{ROS_OPTIONS.map((key) => <button type="button" key={key} onClick={() => onToggle(key)} className={`min-h-16 rounded-2xl border-2 p-3 text-left font-semibold ${selected.includes(key) ? 'border-medi-600 bg-medi-50 text-medi-700' : 'border-slate-200 bg-white text-slate-700'}`}>{locale[key]}</button>)}</div><div className="flex items-center gap-3 mt-7"><VoiceMic label={locale.speakAnswer} onResult={(value) => onToggle(value)} size="sm" /><button type="button" onClick={onContinue} className="flex-1 h-14 rounded-2xl bg-medi-600 text-white font-bold">{locale.reviewContinue}</button></div></div></div>
}

function AdditionalHistory({ data, updateIntake, language }) {
  const locale = getLocale(language)
  return <section className="border-t border-slate-200 pt-6 mt-8"><h2 className="text-lg font-bold text-slate-800 mb-1">{locale.past}</h2><p className="text-sm text-slate-500 mb-4">{locale.speakAnswer}</p><VoiceHistoryField label={locale.pastHistory} value={data.pastMedicalSurgicalHistory} onChange={(value) => updateIntake('pastMedicalSurgicalHistory', value)} /><VoiceHistoryField label={locale.medicinesAllergies} value={data.drugAllergyHistory.allergies.join(', ')} onChange={(value) => updateIntake('drugAllergyHistory.allergies', value ? value.split(',').map((item) => item.trim()) : [])} /><VoiceHistoryField label={locale.familyPersonal} value={`${data.familyHistory}${data.personalHistory ? `; ${data.personalHistory}` : ''}`} onChange={(value) => { updateIntake('familyHistory', value); updateIntake('personalHistory', value) }} /><VoiceHistoryField label={locale.otherConcerns} value={data.reviewOfSystems} onChange={(value) => updateIntake('reviewOfSystems', value)} /></section>
}

function VoiceHistoryField({ label, value, onChange }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-700">{label}</span><VoiceMic size="sm" onResult={onChange} label={label} /></div><textarea value={value} onChange={(event) => onChange(event.target.value)} rows="2" placeholder={label} className="w-full mt-2 rounded-xl border border-slate-200 p-2 text-sm" /></div>
}

function RedFlagAlert({ flags, language }) {
  const locale = getLocale(language)
  return <div className="fixed inset-x-0 top-0 z-20 bg-red-700 text-white shadow-xl" role="alert"><div className="max-w-2xl mx-auto px-4 py-4 flex items-start gap-3"><ShieldAlert size={28} className="shrink-0 mt-0.5" /><div><p className="font-bold text-lg">{locale.priorityAlert}</p><p className="text-sm text-red-100 mt-1">{locale.urgentHelp}</p><p className="text-xs text-red-200 mt-2">{flags.join(' | ')}</p></div><AlertTriangle size={20} className="shrink-0" /></div></div>
}

function getValue(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source) || ''
}
