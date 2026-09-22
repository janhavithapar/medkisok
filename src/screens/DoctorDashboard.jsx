import React from 'react'
import {
  AlertTriangle, CheckCircle2, ClipboardList, Sparkles,
  User, Pill, Activity,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function DoctorDashboard() {
  const { data, confirmSummary } = useKiosk()
  const { patient, intake, aiSummary } = data
  const hasRedFlags = intake.redFlags.length > 0
  const isConfirmed = aiSummary.status === 'confirmed'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      {/* Patient header */}
      <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-skyclin-100 flex items-center justify-center">
          <User className="text-skyclin-600" size={24} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-lg">{patient.name}</p>
          <p className="text-sm text-slate-500">
            ABHA ID: {patient.abhaId || 'Not linked'} · Language: {patient.language?.toUpperCase()}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full
          ${isConfirmed ? 'bg-medi-100 text-medi-700' : 'bg-amber-100 text-amber-700'}`}
        >
          {isConfirmed ? 'Confirmed' : 'Draft'}
        </span>
      </div>

      {/* Red flag alert banner */}
      {hasRedFlags && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={22} />
            <h2 className="font-bold text-red-700">Red Flags Detected</h2>
          </div>
          <ul className="space-y-1">
            {intake.redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI-Generated Clinical Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <Sparkles className="text-skyclin-600" size={18} />
          <h2 className="font-bold text-slate-800">AI-Generated Clinical Summary</h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Chief Complaint
            </p>
            <p className="text-slate-800">
              {intake.chiefComplaint || <span className="text-slate-400">Not captured</span>}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Activity size={14} /> History of Present Illness
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <SummaryField label="Site" value={intake.hpi.site} />
              <SummaryField label="Onset" value={intake.hpi.onset} />
              <SummaryField label="Character" value={intake.hpi.character} />
              <SummaryField label="Severity" value={intake.hpi.severity} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Pill size={14} /> Drug & Allergy History
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <SummaryList label="Current Medications" items={intake.drugAllergyHistory.medications} />
              <SummaryList label="Known Allergies" items={intake.drugAllergyHistory.allergies} />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm & Save */}
      <button
        onClick={confirmSummary}
        disabled={isConfirmed}
        className="w-full h-14 rounded-2xl bg-medi-600 disabled:bg-medi-100 disabled:text-medi-500
          text-white font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <CheckCircle2 size={20} />
        {isConfirmed ? 'Summary Confirmed' : 'Confirm & Save'}
      </button>

      <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
        <ClipboardList size={14} /> This summary is AI-generated from patient intake and should be
        clinically verified.
      </p>
    </div>
  )
}

function SummaryField({ label, value }) {
  const summaryValue = (input, fallback = 'Not captured yet') => {
    if (input === null || input === undefined || input === '') return fallback
    const rendered = String(input).trim()
    return rendered || fallback
  }

  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      <p className="text-slate-700">{summaryValue(value)}</p>
    </div>
  )
}

function SummaryList({ label, items }) {
  const summaryValue = (input, fallback = 'Not captured yet') => {
    if (!input || (Array.isArray(input) && input.length === 0)) return fallback
    return input
  }

  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      {items && items.length > 0 ? (
        <ul className="text-slate-700 list-disc list-inside">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      ) : (
        <p className="text-slate-700">{summaryValue(items)}</p>
      )}
    </div>
  )
}
