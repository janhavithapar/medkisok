import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocale, getSpeechLocale } from '../i18n.js'

/**
 * VoiceMic — persistent voice input affordance.
 *
 * This is a MOCK of the Web Speech API for prototyping the UX flow.
 * Swap the internals of `startListening` for a real
 * `window.SpeechRecognition` / `webkitSpeechRecognition` implementation,
 * and `speak` for real `window.speechSynthesis` TTS, when wiring up
 * production voice.
 *
 * Props:
 *  - onResult(text): called with a mock transcript when "listening" ends
 *  - label: optional accessible label / helper text
 *  - size: 'sm' | 'lg' (default 'lg') controls tap target size
 */
export default function VoiceMic({
  onResult,
  label = 'Tap to speak',
  size = 'lg',
  autoStart = false,
  onPartialTranscript,
  onListeningChange,
  disabled = false,
}) {
  const { data } = useKiosk()
  const locale = getLocale(data.patient.language)
  const speechLocale = getSpeechLocale(data.patient.language)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const timeoutRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    clearTimeout(timeoutRef.current)
    recognitionRef.current?.abort()
  }, [])

  useEffect(() => {
    if (autoStart && !disabled && !listening) {
      startListening()
    }
  }, [autoStart, disabled, listening])

  const mockTranscripts = [
    locale.voiceChest,
    locale.voiceFever,
    locale.voiceStomach,
    locale.voiceCough,
  ]

  function setListeningState(next) {
    setListening(next)
    onListeningChange?.(next)
  }

  function startListening() {
    if (disabled || listening) return
    setError('')
    setListeningState(true)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLocale
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition

      recognition.onresult = (event) => {
        let interimText = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const current = event.results[i]
          const transcript = current[0]?.transcript?.trim() || ''
          if (transcript) {
            interimText += `${interimText ? ' ' : ''}${transcript}`
          }
          if (current.isFinal) {
            const finalTranscript = interimText.trim()
            setListeningState(false)
            recognitionRef.current = null
            if (finalTranscript) {
              onPartialTranscript?.(finalTranscript)
              onResult?.(finalTranscript)
            }
          }
        }

        if (interimText && !event.results[event.results.length - 1]?.isFinal) {
          onPartialTranscript?.(interimText)
        }
      }
      recognition.onerror = (event) => {
        setListeningState(false)
        recognitionRef.current = null
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission is required')
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError('Voice input was not understood. Please try again.')
        }
      }
      recognition.onend = () => {
        setListeningState(false)
        recognitionRef.current = null
      }
      recognition.start()
      return
    }

    // Fallback for browsers without Web Speech API support.
    timeoutRef.current = setTimeout(() => {
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
      setListeningState(false)
      onPartialTranscript?.(transcript)
      onResult?.(transcript)
    }, 1800)
  }

  function stopListening() {
    clearTimeout(timeoutRef.current)
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListeningState(false)
  }

  const dimension = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'
  const iconSize = size === 'sm' ? 20 : 28

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        aria-pressed={listening}
        aria-label={listening ? locale.listening : label}
        lang={speechLocale}
        className={`${dimension} rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-95
          ${listening
            ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
            : 'bg-skyclin-600 hover:bg-skyclin-700 ring-4 ring-skyclin-100'}
        `}
      >
        {listening ? <MicOff size={iconSize} color="white" /> : <Mic size={iconSize} color="white" />}
      </button>
      <span className="text-xs font-medium text-slate-500 min-h-[16px]">
        {listening ? locale.listening : error || label}
      </span>
    </div>
  )
}

/**
 * speak — mock TTS helper.
 * Replace with `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`
 * for real text-to-speech prompts read aloud to the patient.
 */
export function speak(text, language = 'en', callbacks = {}) {
  if (!('speechSynthesis' in window)) {
    console.log('[MediKiosk TTS unavailable]:', text)
    return
  }

  const speech = window.speechSynthesis
  const speechLocale = getSpeechLocale(language)
  const speakNow = () => {
    speech.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = speech.getVoices()
    const exactVoice = voices.find((voice) => voice.lang.toLowerCase() === speechLocale.toLowerCase())
    const regionalVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(`${speechLocale.slice(0, 2).toLowerCase()}-`))
    utterance.lang = speechLocale
    utterance.voice = exactVoice || regionalVoice || null
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onstart = callbacks.onStart
    utterance.onend = callbacks.onEnd
    utterance.onerror = callbacks.onEnd
    speech.speak(utterance)
  }

  if (speech.getVoices().length > 0) {
    speakNow()
  } else {
    speech.addEventListener('voiceschanged', speakNow, { once: true })
    window.setTimeout(speakNow, 500)
  }
}
