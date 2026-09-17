import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'

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
export default function VoiceMic({ onResult, label = 'Tap to speak', size = 'lg' }) {
  const [listening, setListening] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const mockTranscripts = [
    'Chest pain since this morning',
    'Fever and headache for two days',
    'Stomach pain after eating',
    'Cough and cold since yesterday',
  ]

  function startListening() {
    if (listening) return
    setListening(true)

    // Mock: simulate ~1.8s of "listening" then return a canned transcript.
    // Replace with real SpeechRecognition.start() + onresult handler.
    timeoutRef.current = setTimeout(() => {
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
      setListening(false)
      onResult?.(transcript)
    }, 1800)
  }

  function stopListening() {
    clearTimeout(timeoutRef.current)
    setListening(false)
  }

  const dimension = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'
  const iconSize = size === 'sm' ? 20 : 28

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        aria-pressed={listening}
        aria-label={listening ? 'Stop listening' : label}
        className={`${dimension} rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-95
          ${listening
            ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
            : 'bg-skyclin-600 hover:bg-skyclin-700 ring-4 ring-skyclin-100'}
        `}
      >
        {listening ? <MicOff size={iconSize} color="white" /> : <Mic size={iconSize} color="white" />}
      </button>
      <span className="text-xs font-medium text-slate-500 min-h-[16px]">
        {listening ? 'Listening…' : label}
      </span>
    </div>
  )
}

/**
 * speak — mock TTS helper.
 * Replace with `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`
 * for real text-to-speech prompts read aloud to the patient.
 */
export function speak(text) {
  console.log('[MediKiosk TTS mock]:', text)
}
