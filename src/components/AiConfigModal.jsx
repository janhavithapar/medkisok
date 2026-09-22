import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, Key, CheckCircle, AlertCircle, Cpu, RefreshCw } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function AiConfigModal({ isOpen, onClose }) {
  const { geminiApiKey, setGeminiApiKey } = useKiosk()
  const [keyInput, setKeyInput] = useState(geminiApiKey || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

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

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black">AI Intake Configuration</h2>
              <p className="text-xs text-emerald-50">Adaptive Question Generation Settings</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/20 min-h-0">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Current Engine</span>
              {geminiApiKey ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  Gemini AI active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                  <Cpu size={13} />
                  Smart Engine
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {geminiApiKey
                ? 'Context-aware questions generated dynamically via Google Gemini API with automatic fallback.'
                : 'Built-in clinical decision engine generating adaptive questions for 20+ complaint categories.'}
            </p>
          </div>

          {testResult && (
            <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium ${testResult.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {testResult.success ? <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Google Gemini API Key
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">
                <input
                  type="password"
                  placeholder="AIzaSy... or AQ.Ab8..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 text-xs font-mono tracking-wide text-slate-900 outline-none"
                />
                <div className="pr-3 text-slate-400"><Key size={18} /></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={handleTestKey} disabled={testing} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:opacity-70">
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
              {keyInput && (
                <button type="button" onClick={handleClear} className="h-11 rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 min-h-0">
                  Clear Key
                </button>
              )}
            </div>

            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-sm font-black text-white shadow-[0_18px_28px_rgba(16,185,129,0.2)] transition hover:brightness-105">
              Save &amp; Continue
            </button>
          </form>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Both options are active. If an API call ever fails, MediKiosk instantly switches to the built-in clinical smart engine with zero disruption.
          </p>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
