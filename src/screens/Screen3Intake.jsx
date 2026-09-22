import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Send,
  ShieldAlert,
  Volume2,
  Sparkles,
  Cpu,
  Settings,
  Loader2,
  CheckCircle2,
  VolumeX,
  AudioWaveform,
  Languages,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic, { speak } from '../components/VoiceMic.jsx'
import { getBotReply, getLocale } from '../i18n.js'
import { getNextClinicalQuestion, validateMedicalIntent } from '../services/aiIntakeService.js'
import AiConfigModal from '../components/AiConfigModal.jsx'

const ROS_OPTIONS = ['rosBreathing', 'rosChest', 'rosFever', 'rosDigestive', 'rosNeurological', 'rosNone']

const COMMON_CHIEF_COMPLAINTS = [
  'Eye check up / Glasses',
  'Chest discomfort',
  'Fever & chills',
  'Stomach ache',
  'Dental pain',
  'Skin rash or allergy',
  'Severe headache',
  'Knee or joint pain',
]

export default function Screen3Intake({ onNext }) {
  const { data, updateIntake, geminiApiKey } = useKiosk()
  const locale = getLocale(data.patient.language)

  const [phase, setPhase] = useState('chief')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: locale.problem,
    helperText: 'Tell us what brought you in today.',
    options: [],
    source: 'smart-engine',
    isLastQuestion: false,
  })
  const [conversationHistory, setConversationHistory] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoListen, setAutoListen] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const initialSpokenRef = useRef(false)

  function addMessage(speaker, text) {
    if (!text) return
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${speaker}-${Date.now()}-${Math.random()}`,
        speaker,
        text,
      },
    ])
  }

  function speakQuestion(text) {
    speak(text, data.patient.language, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false)
        setAutoListen(true)
      },
    })
  }

  useEffect(() => {
    if (!autoListen) return
    const timer = window.setTimeout(() => {
      setAutoListen(true)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [autoListen])

  useEffect(() => {
    if (!initialSpokenRef.current) {
      initialSpokenRef.current = true
      const introText = locale.problem
      setCurrentQuestion((prev) => ({ ...prev, questionText: introText }))
      addMessage('assistant', introText)
      speakQuestion(introText)
    }
  }, [data.patient.language])

  async function processResponse(rawResponse) {
    const answer = String(rawResponse || '').trim()
    if (!answer) return

    const validation = validateMedicalIntent(answer, data.patient.language)

    if (!validation.valid) {
      setAutoListen(false)
      setLiveTranscript(validation.redirect)
      addMessage('assistant', validation.redirect)
      speakQuestion(validation.redirect)
      return
    }

    setAutoListen(false)
    setLiveTranscript(answer)
    addMessage('patient', answer)

    if (phase === 'chief') {
      updateIntake('chiefComplaint', answer)
      const initialHistory = [{ questionText: locale.problem, answerText: answer }]
      setConversationHistory(initialHistory)
      setPhase('dynamic')
      setCurrentStepIndex(0)
      setIsProcessing(true)

      try {
        const nextQuestion = await getNextClinicalQuestion({
          apiKey: geminiApiKey,
          patientInfo: data.patient,
          complaint: answer,
          history: initialHistory,
          stepIndex: 0,
          language: data.patient.language,
        })

        setCurrentQuestion(nextQuestion)
        addMessage('assistant', nextQuestion.questionText)
        speakQuestion(nextQuestion.questionText)
      } catch (err) {
        console.error('Error producing first follow-up question:', err)
      } finally {
        setIsProcessing(false)
      }

      return
    }

    const newEntry = {
      questionText: currentQuestion.questionText,
      answerText: answer,
    }

    const updatedHistory = [...conversationHistory, newEntry]
    setConversationHistory(updatedHistory)

    if (currentStepIndex === 0) {
      updateIntake('hpi.character', answer)
    } else if (currentStepIndex === 1) {
      updateIntake('hpi.timing', answer)
    } else {
      updateIntake('hpi.associatedSymptoms', answer)
    }

    if (currentQuestion.isLastQuestion || currentStepIndex >= 3) {
      const summaryText = updatedHistory
        .map((entry, idx) => `Q${idx + 1}: ${entry.questionText}\nA: ${entry.answerText}`)
        .join('\n\n')
      updateIntake('pastMedicalSurgicalHistory', summaryText)

      const completeText = 'Thank you. I have the key details and am passing them to the care team.'
      addMessage('assistant', completeText)
      speakQuestion(completeText)
      window.setTimeout(() => onNext?.(), 1800)
      return
    }

    setIsProcessing(true)
    try {
      const nextIndex = currentStepIndex + 1
      const nextQuestion = await getNextClinicalQuestion({
        apiKey: geminiApiKey,
        patientInfo: data.patient,
        complaint: data.intake.chiefComplaint || conversationHistory[0]?.answerText,
        history: updatedHistory,
        stepIndex: nextIndex,
        language: data.patient.language,
      })

      setCurrentStepIndex(nextIndex)
      setCurrentQuestion(nextQuestion)
      addMessage('assistant', nextQuestion.questionText)
      speakQuestion(nextQuestion.questionText)
    } catch (err) {
      console.error('Error producing follow-up question:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const totalEstimatedSteps = 3
  const progressPercent = phase === 'chief'
    ? 15
    : Math.round(((currentStepIndex + 1) / totalEstimatedSteps) * 100)
  const stepLabels = ['Concern', 'Symptoms', 'History', 'Finish']
  const currentStepNumber = phase === 'chief' ? 1 : Math.min(currentStepIndex + 2, stepLabels.length)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="kiosk-panel rounded-[2rem] p-4 shadow-[0_30px_80px_rgba(15,35,29,0.12)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-600 shadow-[0_16px_30px_rgba(31,167,106,0.2)] ${isSpeaking || isListening || autoListen ? 'ring-4 ring-emerald-200/70' : ''}`}>
              <span className={`absolute inset-0 rounded-2xl border border-emerald-100/90 ${isSpeaking || isListening || autoListen ? 'animate-ping' : ''}`} />
              <Bot className="relative text-white" size={26} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{locale.clinicalIntake}</p>
              <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">AI Clinical Intake</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span className={`h-2.5 w-2.5 rounded-full ${isListening || autoListen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isListening ? 'Listening' : autoListen ? 'Ready to hear you' : isSpeaking ? 'Speaking' : 'Standby'}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1
            const isDone = stepNumber < currentStepNumber
            const isActive = stepNumber === currentStepNumber
            return (
              <div key={label} className={`rounded-xl border px-2 py-2 text-center ${isActive ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : isDone ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                <div className="text-[10px] font-black uppercase tracking-[0.14em]">Step {stepNumber}</div>
                <div className="mt-1 text-[11px] font-semibold">{label}</div>
              </div>
            )
          })}
        </div>

        <div className="mb-6 overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            <span>{phase === 'chief' ? 'Primary concern' : `Adaptive question ${currentStepIndex + 1}`}</span>
            <span className="text-emerald-700">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Conversation</p>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live assist
              </div>
            </div>

            <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
              {chatMessages.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {locale.problem}
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.speaker === 'patient'
                          ? 'rounded-tr-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'rounded-tl-md border border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-b from-emerald-50 via-white to-slate-50 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Live intake</p>
              {isProcessing && (
                <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                  Thinking
                </div>
              )}
            </div>

            <div className="mb-5 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-[0_18px_30px_rgba(31,167,106,0.2)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">Current prompt</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-50">{data.patient.language?.toUpperCase()}</span>
              </div>
              <p className="text-base font-semibold leading-relaxed">{currentQuestion.questionText}</p>
              {currentQuestion.helperText && (
                <p className="mt-2 text-xs text-emerald-50/90">{currentQuestion.helperText}</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Transcript preview</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-700">{isListening ? 'Listening' : 'Ready'}</span>
              </div>
              <div className="min-h-[110px] rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                {liveTranscript || 'Listening for your spoken response...'}
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <VoiceMic
                autoStart={autoListen}
                onResult={(value) => processResponse(value)}
                onPartialTranscript={(value) => setLiveTranscript(value)}
                onListeningChange={setIsListening}
                label={locale.speakAnswer}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewOfSystems({ language, selected, onToggle, onContinue }) {
  const locale = getLocale(language)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-medi-700">
          {locale.clinicalIntake}
        </p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          {locale.reviewTitle}
        </h1>
        <p className="text-slate-500 mt-2 text-sm">{locale.reviewSelect}</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {ROS_OPTIONS.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => onToggle(key)}
              className={`min-h-16 rounded-2xl border-2 p-3 text-left font-semibold transition-all ${
                selected.includes(key)
                  ? 'border-medi-600 bg-medi-50 text-medi-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {locale[key]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-7">
          <VoiceMic label={locale.speakAnswer} onResult={(value) => onToggle(value)} size="sm" />
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 h-14 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold transition-all shadow-md shadow-medi-600/20"
          >
            {locale.reviewContinue}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdditionalHistory({ data, updateIntake, language }) {
  const locale = getLocale(language)
  return (
    <section className="border-t border-slate-200 pt-6 mt-8">
      <h2 className="text-lg font-bold text-slate-800 mb-1">{locale.past}</h2>
      <p className="text-sm text-slate-500 mb-4">{locale.speakAnswer}</p>
      <VoiceHistoryField
        label={locale.pastHistory}
        value={data.pastMedicalSurgicalHistory}
        onChange={(value) => updateIntake('pastMedicalSurgicalHistory', value)}
      />
      <VoiceHistoryField
        label={locale.medicinesAllergies}
        value={data.drugAllergyHistory.allergies.join(', ')}
        onChange={(value) =>
          updateIntake(
            'drugAllergyHistory.allergies',
            value ? value.split(',').map((item) => item.trim()) : []
          )
        }
      />
      <VoiceHistoryField
        label={locale.familyPersonal}
        value={`${data.familyHistory}${data.personalHistory ? `; ${data.personalHistory}` : ''}`}
        onChange={(value) => {
          updateIntake('familyHistory', value)
          updateIntake('personalHistory', value)
        }}
      />
      <VoiceHistoryField
        label={locale.otherConcerns}
        value={data.reviewOfSystems}
        onChange={(value) => updateIntake('reviewOfSystems', value)}
      />
    </section>
  )
}

function VoiceHistoryField({ label, value, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <VoiceMic size="sm" onResult={onChange} label={label} />
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows="2"
        placeholder={label}
        className="w-full mt-2 rounded-xl border border-slate-200 p-2 text-sm focus:outline-none focus:border-medi-400"
      />
    </div>
  )
}

function RedFlagAlert({ flags, language }) {
  const locale = getLocale(language)
  return (
    <div className="fixed inset-x-0 top-0 z-30 bg-red-700 text-white shadow-xl animate-bounce-short" role="alert">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-start gap-3">
        <ShieldAlert size={28} className="shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-lg">{locale.priorityAlert}</p>
          <p className="text-sm text-red-100 mt-1">{locale.urgentHelp}</p>
          <p className="text-xs text-red-200 mt-2">{flags.join(' | ')}</p>
        </div>
        <AlertTriangle size={20} className="shrink-0" />
      </div>
    </div>
  )
}
