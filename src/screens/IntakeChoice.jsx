import React from 'react'
import {
  ClipboardList,
  UploadCloud,
  ChevronRight,
  ArrowLeft,
  FileText,
  Sparkles,
  Stethoscope,
  Clock,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import { getLocale } from '../i18n.js'

export default function IntakeChoice({ onSelectFull, onSelectUpload, onBack }) {
  const { data } = useKiosk()
  const locale = getLocale(data.patient.language)
  const patientName = data.patient.name ? data.patient.name : 'Patient'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors min-h-0 py-1"
        >
          <ArrowLeft size={18} />
          <span>{locale.back || 'Back'}</span>
        </button>
      )}

      {/* Screen Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-medi-100 text-medi-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} className="text-medi-600" />
          Welcome, {patientName}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {locale.choiceTitle || 'How would you like to proceed today?'}
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm sm:text-base">
          {locale.choiceSubtitle || 'Select whether to complete a guided consultation intake or directly upload past medical records.'}
        </p>
      </div>

      {/* The 2 Options Cards */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {/* OPTION 1: Answer medical situation & upload medical history */}
        <div
          onClick={onSelectFull}
          className="group relative rounded-3xl border-2 border-medi-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-medi-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-medi-50 border border-medi-200/80 flex items-center justify-center text-medi-600 group-hover:scale-110 transition-transform">
                <Stethoscope size={28} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-medi-100 text-medi-800">
                {locale.optionFullBadge || 'Doctor Consultation'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-medi-700 transition-colors">
              {locale.optionFullTitle || 'Answer current medical situation & upload medical history'}
            </h2>

            <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
              {locale.optionFullDesc || 'Answer guided questions about what brings you in today using voice or typing, choose your OPD care, and scan your past medical records.'}
            </p>

            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medi-600"></span>
                <span>Voice or text symptom questions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medi-600"></span>
                <span>OPD &amp; Ayurveda constitution options</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medi-600"></span>
                <span>Upload past lab reports &amp; prescriptions</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-medi-700 font-bold text-sm">
            <span>{locale.optionFullBtn || 'Start Guided Intake'}</span>
            <div className="w-9 h-9 rounded-full bg-medi-50 group-hover:bg-medi-600 group-hover:text-white flex items-center justify-center transition-all">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* OPTION 2: Just upload your medical history */}
        <div
          onClick={onSelectUpload}
          className="group relative rounded-3xl border-2 border-skyclin-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-skyclin-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-skyclin-50 border border-skyclin-200/80 flex items-center justify-center text-skyclin-600 group-hover:scale-110 transition-transform">
                <UploadCloud size={28} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-skyclin-100 text-skyclin-800">
                {locale.optionUploadBadge || 'Direct Upload'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-skyclin-700 transition-colors">
              {locale.optionUploadTitle || 'Just upload your medical history'}
            </h2>

            <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
              {locale.optionUploadDesc || 'Skip the symptom intake questions. Directly scan or upload your past prescriptions, lab tests, and discharge records into your medical timeline.'}
            </p>

            <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-skyclin-600"></span>
                <span>Fast-track: Skips all intake questions</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-skyclin-600"></span>
                <span>Camera scan or PDF file upload</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-skyclin-600"></span>
                <span>Instant OCR &amp; timeline extraction</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-skyclin-700 font-bold text-sm">
            <span>{locale.optionUploadBtn || 'Direct Document Upload'}</span>
            <div className="w-9 h-9 rounded-full bg-skyclin-50 group-hover:bg-skyclin-600 group-hover:text-white flex items-center justify-center transition-all">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
