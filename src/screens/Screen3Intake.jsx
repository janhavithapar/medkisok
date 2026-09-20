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
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import VoiceMic, { speak } from '../components/VoiceMic.jsx'
import { getBotReply, getLocale } from '../i18n.js'
import { getNextClinicalQuestion } from '../services/aiIntakeService.js'
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

  // Intake phase: 'chief' (complaint) or 'dynamic' (AI/clinical follow-ups)
  const [phase, setPhase] = useState('chief')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Current active question state
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: locale.problem,
    helperText: 'Speak or choose what brings you to the hospital today.',
    options: COMMON_CHIEF_COMPLAINTS,
    source: geminiApiKey ? 'ai' : 'fallback',
    modelUsed: 'gemini-3.8-flash',
    isLastQuestion: false,
  })

  // Full conversation record: [{ questionText, answerText, options }]
  const [conversationHistory, setConversationHistory] = useState([])
  const [currentAnswer, setCurrentAnswer] = useState(data.intake.chiefComplaint || '')

  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [typingOpen, setTypingOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [showReview, setShowReview] = useState(false)
  const [reviewItems, setReviewItems] = useState([])
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [engineSource, setEngineSource] = useState(geminiApiKey ? 'ai' : 'fallback')

  // Spoken voice effect tracking
  const initialSpokenRef = useRef(false)

  // Initial speech greeting on mount
  useEffect(() => {
    if (!initialSpokenRef.current && phase === 'chief') {
      initialSpokenRef.current = true
      speak(locale.problem, data.patient.language)
    }
  }, [phase, locale.problem, data.patient.language])

  // Record an answer without auto-advancing
  function recordAnswer(value) {
    const cleanValue = String(value || '').trim()
    if (!cleanValue) return
    setCurrentAnswer(cleanValue)
    setDraft('')
    setTypingOpen(false)
  }

  // Handle advancing to next question or review
  async function handleContinue() {
    let finalAnswer = currentAnswer
    if (!finalAnswer && draft.trim()) {
      recordAnswer(draft.trim())
      finalAnswer = draft.trim()
    }
    if (!finalAnswer) return

    setDraft('')
    setTypingOpen(false)

    if (phase === 'chief') {
      // Chief complaint captured
      updateIntake('chiefComplaint', finalAnswer)
      const initialEntry = {
        questionText: locale.problem,
        answerText: finalAnswer,
        options: currentQuestion.options,
      }
      setConversationHistory([initialEntry])

      // Generate the first adaptive clinical follow-up question
      setLoadingQuestion(true)
      try {
        const nextQ = await getNextClinicalQuestion({
          apiKey: geminiApiKey,
          patientInfo: data.patient,
          complaint: finalAnswer,
          history: [initialEntry],
          stepIndex: 0,
          language: data.patient.language,
        })

        setCurrentQuestion(nextQ)
        setEngineSource(nextQ.source || 'fallback')
        setPhase('dynamic')
        setCurrentStepIndex(0)
        setCurrentAnswer('')

        // Speak the dynamic question aloud
        speak(`${getBotReply(data.patient.language)} ${nextQ.questionText}`, data.patient.language)
      } catch (err) {
        console.error('Error generating first follow-up question:', err)
      } finally {
        setLoadingQuestion(false)
      }
      return
    }

    // Dynamic questioning phase
    const updatedHistory = [
      ...conversationHistory,
      {
        questionText: currentQuestion.questionText,
        answerText: finalAnswer,
        options: currentQuestion.options,
      },
    ]
    setConversationHistory(updatedHistory)

    // Map answers into HPI context so doctors and nurses see the notes
    if (currentStepIndex === 0) {
      updateIntake('hpi.character', finalAnswer)
    } else if (currentStepIndex === 1) {
      updateIntake('hpi.timing', finalAnswer)
    } else {
      updateIntake('hpi.associatedSymptoms', finalAnswer)
    }

    // Check if intake is finished (either marked as last question or reached step 2)
    const reachedEnd = currentQuestion.isLastQuestion || currentStepIndex >= 2

    if (reachedEnd) {
      // Compile entire conversational transcript into review notes
      const notes = updatedHistory
        .map((h, i) => `Q${i + 1}: ${h.questionText}\nA: ${h.answerText}`)
        .join('\n\n')
      updateIntake('pastMedicalSurgicalHistory', notes)

      speak(`${getBotReply(data.patient.language)} ${locale.reviewTitle}`, data.patient.language)
      setShowReview(true)
    } else {
      // Fetch next adaptive question based on full history so far
      setLoadingQuestion(true)
      const nextIndex = currentStepIndex + 1

      try {
        const nextQ = await getNextClinicalQuestion({
          apiKey: geminiApiKey,
          patientInfo: data.patient,
          complaint: data.intake.chiefComplaint || conversationHistory[0]?.answerText,
          history: updatedHistory,
          stepIndex: nextIndex,
          language: data.patient.language,
        })

        setCurrentQuestion(nextQ)
        setEngineSource(nextQ.source || 'fallback')
        setCurrentStepIndex(nextIndex)
        setCurrentAnswer('')

        // Speak the dynamic follow-up question
        speak(`${getBotReply(data.patient.language)} ${nextQ.questionText}`, data.patient.language)
      } catch (err) {
        console.error('Error generating follow-up question:', err)
      } finally {
        setLoadingQuestion(false)
      }
    }
  }

  // Back button navigation
  function handleBack() {
    if (phase === 'dynamic') {
      if (currentStepIndex === 0) {
        // Go back to chief complaint
        setPhase('chief')
        setCurrentQuestion({
          questionText: locale.problem,
          helperText: 'Speak or choose what brings you to the hospital today.',
          options: COMMON_CHIEF_COMPLAINTS,
          source: geminiApiKey ? 'ai' : 'fallback',
          modelUsed: 'gemini-3.8-flash',
          isLastQuestion: false,
        })
        const prevAnswer = conversationHistory[0]?.answerText || data.intake.chiefComplaint
        setCurrentAnswer(prevAnswer || '')
        speak(locale.problem, data.patient.language)
      } else {
        // Go back to previous dynamic question
        const prevIndex = currentStepIndex - 1
        setCurrentStepIndex(prevIndex)
        const prevHistoryItem = conversationHistory[prevIndex + 1]
        if (prevHistoryItem) {
          setCurrentAnswer(prevHistoryItem.answerText)
        }
      }
    }
  }

  function toggleReview(key) {
    setReviewItems((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    )
  }

  function finishReview() {
    updateIntake('reviewOfSystems', reviewItems.map((key) => locale[key]).join(', ') || locale.rosNone)
    speak(locale.reviewContinue, data.patient.language)
    onNext?.()
  }

  function submitDraft(event) {
    event.preventDefault()
    if (draft.trim()) {
      recordAnswer(draft.trim())
    }
  }

  if (showReview) {
    return (
      <ReviewOfSystems
        language={data.patient.language}
        selected={reviewItems}
        onToggle={toggleReview}
        onContinue={finishReview}
      />
    )
  }

  // Question progress calculation
  const totalEstimatedSteps = 3
  const progressPercent =
    phase === 'chief'
      ? 15
      : Math.round(((currentStepIndex + 1) / totalEstimatedSteps) * 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
      {/* Red flag high priority alert banner */}
      {data.intake.redFlagTriggered && (
        <RedFlagAlert flags={data.intake.redFlags} language={data.patient.language} />
      )}

      {/* Top Header & Engine Status Pill */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-medi-700 to-medi-500 flex items-center justify-center shrink-0 shadow-md shadow-medi-600/20">
            <Bot size={22} color="white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-medi-700">
                {locale.clinicalIntake}
              </p>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {phase === 'chief'
                  ? 'Step 1: Chief Complaint'
                  : `Question ${currentStepIndex + 1} of ${totalEstimatedSteps}`}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {currentQuestion.questionText}
            </h1>
          </div>
        </div>

        {/* AI Engine Status & Configuration Trigger */}
        <div className="shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            title="Configure AI API Key / Clinical Engine"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border ${
              engineSource === 'ai'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-300'
            }`}
          >
            {engineSource === 'ai' ? (
              <>
                <Sparkles size={13} className="text-emerald-600" />
                <span className="hidden sm:inline">Gemini AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <>
                <Cpu size={13} className="text-sky-600" />
                <span className="hidden sm:inline">Smart Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              </>
            )}
            <Settings size={12} className="ml-0.5 opacity-60 hover:opacity-100" />
          </button>

          <button
            type="button"
            onClick={() => speak(currentQuestion.questionText, data.patient.language)}
            aria-label={locale.readAloud}
            className="w-9 h-9 rounded-full bg-medi-50 text-medi-700 hover:bg-medi-100 flex items-center justify-center transition-colors shadow-xs"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>
            {phase === 'chief'
              ? 'Primary Concern'
              : `Adaptive Question ${currentStepIndex + 1} of ${totalEstimatedSteps}`}
          </span>
          <span className="font-bold text-medi-700">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-medi-600 to-skyclin-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Loading Skeleton / Thinking Indicator */}
      {loadingQuestion ? (
        <div className="rounded-3xl border-2 border-medi-200 bg-white p-8 mb-6 shadow-sm flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-medi-50 flex items-center justify-center text-medi-600 mb-3">
            <Loader2 size={26} className="animate-spin" />
          </div>
          <p className="font-bold text-slate-800 text-base">
            {engineSource === 'ai' ? 'Analyzing with Gemini AI...' : 'Consulting Clinical Engine...'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Formulating the most relevant clinical follow-up question based on your previous answers...
          </p>
        </div>
      ) : (
        <>
          {/* Conversational Question Card */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-medi-100 text-medi-700 flex items-center justify-center shrink-0 mt-1">
                <Bot size={17} />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm max-w-[92%]">
                <p className="text-slate-800 font-semibold text-base leading-relaxed">
                  {currentQuestion.questionText}
                </p>
                {currentQuestion.helperText && (
                  <p className="text-xs text-slate-500 mt-2 font-normal flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-medi-400" />
                    {currentQuestion.helperText}
                  </p>
                )}
              </div>
            </div>

            {/* Display Captured Answer Bubble */}
            {currentAnswer && (
              <div className="flex justify-end animate-fade-in">
                <div className="bg-medi-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] font-medium shadow-md shadow-medi-600/15">
                  {currentAnswer}
                </div>
              </div>
            )}
          </div>

          {/* Voice Input Zone */}
          <div className="rounded-3xl border-2 border-medi-200/80 bg-gradient-to-b from-medi-50/60 to-white p-6 mb-5 shadow-xs">
            <p className="text-center text-sm font-bold text-medi-900 mb-3">
              {locale.speakAnswer}
            </p>
            <div className="flex justify-center">
              <VoiceMic onResult={recordAnswer} label={locale.speakAnswer} />
            </div>

            {currentAnswer ? (
              <div className="mt-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs mb-0.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Captured: &ldquo;{currentAnswer}&rdquo;</span>
                </div>
                <span className="text-[11px] text-emerald-700 block">
                  Click &ldquo;{locale.continue}&rdquo; below to advance, or tap mic to revise.
                </span>
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 mt-3">
                Tap the microphone and speak your answer in your language
              </p>
            )}
          </div>

          {/* Quick-Tap Options (Generated dynamically based on prior responses) */}
          {currentQuestion.options?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
                Quick-Select Answers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentAnswer === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => recordAnswer(option)}
                      className={`min-h-[52px] rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-medi-600 bg-medi-50 text-medi-800 shadow-sm shadow-medi-600/10'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-medi-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <span className="leading-snug">{option}</span>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-medi-600 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Keyboard Manual Typing Option */}
          <div className="text-center mb-5">
            <button
              type="button"
              onClick={() => setTypingOpen((current) => !current)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-medi-700 transition-colors"
            >
              <Keyboard size={17} />
              {typingOpen ? locale.back : locale.typeAnswer}
            </button>
          </div>

          {typingOpen && (
            <form onSubmit={submitDraft} className="flex gap-2 mb-6">
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your response here..."
                className="flex-1 h-14 rounded-2xl border-2 border-slate-200 px-4 focus:outline-none focus:border-medi-500 text-sm font-medium"
              />
              <button
                type="submit"
                aria-label={locale.add}
                className="h-14 w-14 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <Send size={20} />
              </button>
            </form>
          )}

          {/* Navigation Action Bar */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={phase === 'chief'}
              className="h-14 w-14 rounded-2xl border-2 border-slate-200 bg-white text-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shrink-0"
              aria-label={locale.back}
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!currentAnswer && !draft.trim()}
              className="flex-1 h-14 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-base flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md shadow-medi-600/20 transition-all active:scale-[0.99]"
            >
              <span>
                {phase === 'dynamic' && (currentQuestion.isLastQuestion || currentStepIndex >= 2)
                  ? locale.reviewTitle
                  : locale.continue}
              </span>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Optional review of systems footer when finishing */}
          {phase === 'dynamic' && (currentQuestion.isLastQuestion || currentStepIndex >= 2) && (
            <AdditionalHistory
              data={data.intake}
              updateIntake={updateIntake}
              language={data.patient.language}
            />
          )}
        </>
      )}

      {/* AI Configuration Modal */}
      <AiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
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
