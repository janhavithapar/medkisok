import React, { useState } from 'react'
import { X, Sparkles, Key, CheckCircle, AlertCircle, Cpu, ExternalLink, RefreshCw } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function AiConfigModal({ isOpen, onClose }) {
  const { geminiApiKey, setGeminiApiKey } = useKiosk()
  const [keyInput, setKeyInput] = useState(geminiApiKey || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // { success: boolean, message: string }

  if (!isOpen) return null

  async function handleTestKey() {
    if (!keyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key to test.' })
      return
    }
    setTesting(true)
    setTestResult(null)

    try {
      let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${encodeURIComponent(keyInput.trim())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with OK' }] }],
        }),
      })

      if (!res.ok && res.status === 503) {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(keyInput.trim())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK' }] }],
          }),
        })
      }

      if (res.ok) {
        setTestResult({ success: true, message: 'API key verified! Gemini Flash AI is active.' })
        setGeminiApiKey(keyInput.trim())
      } else {
        const errText = await res.text()
        setTestResult({ success: false, message: `Verification failed (${res.status}). Falling back to Smart Engine.` })
      }
    } catch (err) {
      setTestResult({ success: false, message: `Connection error: ${err.message}. Smart Engine will be used.` })
    } finally {
      setTesting(false)
    }
  }

  function handleSave(e) {
    e?.preventDefault()
    setGeminiApiKey(keyInput.trim())
    onClose()
  }

  function handleClear() {
    setKeyInput('')
    setGeminiApiKey('')
    setTestResult({ success: true, message: 'API key cleared. System will use built-in Smart Clinical Engine.' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-medi-600 to-skyclin-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Intake Configuration</h2>
              <p className="text-xs text-white/80">Adaptive Question Generation Settings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors min-h-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Indicator */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Engine</span>
              {geminiApiKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Gemini AI Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-skyclin-100 text-skyclin-800 text-xs font-bold">
                  <Cpu size={13} />
                  Smart Engine (Built-in)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {geminiApiKey
                ? 'Context-aware questions generated dynamically via Google Gemini API with automatic fallback.'
                : 'Built-in clinical decision engine generating adaptive questions for 20+ complaint categories.'}
            </p>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`rounded-xl p-3 flex items-start gap-2 text-xs font-medium ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">optional</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 focus-within:border-medi-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-medi-100 transition-all">
                <input
                  type="password"
                  placeholder="AIzaSy... or AQ.Ab8..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-3 bg-transparent text-slate-900 font-mono text-xs outline-none tracking-wide"
                />
                <div className="pr-3 text-slate-400">
                  <Key size={18} />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing}
                className="flex-1 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition min-h-0"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
              {keyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 h-11 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition min-h-0"
                >
                  Clear Key
                </button>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-sm shadow-md shadow-medi-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              Save &amp; Continue
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Both options are active. If an API call ever fails, MediKiosk instantly switches to the built-in clinical smart engine with zero disruption.
          </p>
        </div>
      </div>
    </div>
  )
}
