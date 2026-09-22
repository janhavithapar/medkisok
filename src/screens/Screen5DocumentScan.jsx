import React, { useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  ScanLine,
  Trash2,
  Upload,
  ArrowLeft,
  TestTube2,
  Pill,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Filter,
  MessageSquare,
  Eye,
  Activity,
  Calendar,
} from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import DocumentTimeline from './DocumentTimeline.jsx'
import VoiceMic from '../components/VoiceMic.jsx'
import { getLocale } from '../i18n.js'
import { processMedicalDocument, generateLocalOcrResult } from '../services/medicalOcrService.js'
import { extractTextFromPdf } from '../services/pdfTextExtractor.js'

export default function Screen5DocumentScan({ onNext, onBack }) {
  const { sessionData, updateIntake, geminiApiKey } = useKiosk()
  const locale = getLocale(sessionData.patient.language)
  const fileRef = useRef(null)

  const [processing, setProcessing] = useState(false)
  const [review, setReview] = useState(sessionData.intake.documents.currentReview || null)
  const [saved, setSaved] = useState(Boolean(sessionData.intake.documents.timeline.length))
  const [timelineOpen, setTimelineOpen] = useState(false)

  // Handle file selection from file input
  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    await processSelectedFile(file)
  }

  // Read and process file with Gemini Vision or Smart Clinical OCR
  async function processSelectedFile(file) {
    if (processing) return
    setProcessing(true)
    setSaved(false)

    // Generate local preview URL
    const previewUrl = URL.createObjectURL(file)

    // If PDF, extract actual text directly from the PDF pages
    let extractedText = ''
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (isPdf) {
      try {
        extractedText = await extractTextFromPdf(file)
      } catch (err) {
        console.warn('PDF text extraction error:', err)
      }
    }

    // Attempt base64 read for Gemini multimodal API
    let base64Data = null
    try {
      base64Data = await readFileAsBase64(file)
    } catch (e) {
      console.warn('Could not encode file to base64', e)
    }

    try {
      const extracted = await processMedicalDocument({
        file,
        fileName: file.name,
        previewUrl,
        base64Data,
        extractedText,
        mimeType: file.type || 'image/jpeg',
        apiKey: geminiApiKey,
      })
      setReview({
        ...extracted,
        extractedText: extracted.extractedText || extractedText,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileDataUrl: base64Data ? `data:${file.type || 'application/octet-stream'};base64,${base64Data}` : previewUrl,
      })
    } catch (err) {
      console.error('Error during document processing:', err)
      setReview({
        ...generateLocalOcrResult({ fileName: file.name, previewUrl, extractedText }),
        extractedText,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileDataUrl: base64Data ? `data:${file.type || 'application/octet-stream'};base64,${base64Data}` : previewUrl,
      })
    } finally {
      setProcessing(false)
    }
  }

  // Quick sample loaders for testing
  function loadSampleChestXray() {
    setProcessing(true)
    setSaved(false)
    setTimeout(() => {
      const sample = generateLocalOcrResult({
        fileName: 'chest_xray_pa_view.png',
        manualType: 'xray',
        previewUrl: null,
      })
      setReview(sample)
      setProcessing(false)
    }, 500)
  }

  function loadSampleBloodReport() {
    setProcessing(true)
    setSaved(false)
    setTimeout(() => {
      const sample = {
        type: 'lab',
        title: 'Comprehensive Health & Lab Report (Mr. Tarun Thapar)',
        date: '2026-09-04',
        diagnoses: ['Borderline Elevated LDL Cholesterol', 'Trace Proteinuria (Under review)'],
        medicines: [],
        labs: [
          { name: 'Hemoglobin', value: '15.2 g/dL', status: 'Normal', reference: '13.0 - 17.5 g/dL' },
          { name: 'Total RBC', value: '4.89 10^6/µL', status: 'Normal', reference: '4.1 - 6.0 10^6/µL' },
          { name: 'Total Leucocytes (WBC)', value: '6.7 10^3/µL', status: 'Normal', reference: '4.4 - 11.0 10^3/µL' },
          { name: 'Platelet Count', value: '222.0 10^3/µL', status: 'Normal', reference: '150 - 450 10^3/µL' },
          { name: 'Glucose (Fasting)', value: '80.7 mg/dL', status: 'Normal', reference: '70 - 100 mg/dL' },
          { name: 'HbA1c', value: '5.5 %', status: 'Normal', reference: '4.0 - 6.0 %' },
          { name: 'Creatinine', value: '0.88 mg/dL', status: 'Normal', reference: '0.5 - 1.3 mg/dL' },
          { name: 'Total Protein', value: '6.32 g/dL', status: 'Low', reference: '6.4 - 8.2 g/dL' },
          { name: 'Total Cholesterol', value: '194.8 mg/dL', status: 'Normal', reference: '< 200 mg/dL' },
          { name: 'LDL Cholesterol', value: '135.0 mg/dL', status: 'High', reference: '< 100 mg/dL' },
          { name: 'Urine Protein', value: 'Positive (Trace)', status: 'High', reference: 'Negative' },
          { name: 'Vitamin B12', value: '333.0 pg/ml', status: 'Normal', reference: '120 - 807 pg/ml' },
          { name: 'Vitamin D3', value: '49.97 ng/mL', status: 'Normal', reference: '30 - 100 ng/mL' },
          { name: 'TSH (Thyroid)', value: '2.334 µIU/ml', status: 'Normal', reference: '0.35 - 5.5 µIU/ml' },
        ],
        alerts: [
          'Total protein is slightly low (6.32 g/dL)',
          'LDL cholesterol is borderline high (135.0 mg/dL)',
          'Urine protein trace detected',
        ],
        patientNotes: '',
        previewUrl: null,
      }
      setReview(sample)
      setProcessing(false)
    }, 500)
  }

  // Switch document category manually
  function handleTypeSwitch(newType) {
    if (!review || review.type === newType) return
    const updated = generateLocalOcrResult({
      fileName: review.title,
      manualType: newType,
      previewUrl: review.previewUrl,
    })
    updated.patientNotes = review.patientNotes || ''
    setReview(updated)
    setSaved(false)
  }

  function updateReview(key, value) {
    setReview((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function updateMedicine(index, key, value) {
    setReview((current) => ({
      ...current,
      medicines: current.medicines.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    }))
    setSaved(false)
  }

  function updateLab(index, key, value) {
    setReview((current) => ({
      ...current,
      labs: current.labs.map((lab, i) => (i === index ? { ...lab, [key]: value } : lab)),
    }))
    setSaved(false)
  }

  function addLabItem() {
    setReview((current) => ({
      ...current,
      labs: [
        { name: 'New Parameter', value: '1.0', status: 'Normal', reference: '0.0 - 2.0' },
        ...(current.labs || []),
      ],
    }))
    setSaved(false)
  }

  function removeLabItem(index) {
    setReview((current) => ({
      ...current,
      labs: current.labs.filter((_, i) => i !== index),
    }))
    setSaved(false)
  }

  function saveReview() {
    if (!review) return
    const isXray = review.type === 'xray'
    const alerts = isXray ? [] : getAlerts(review)
    const summary = isXray
      ? (review.shortSummary || `X-ray of ${review.bodyPart || 'chest'} attached for physician review.`)
      : `${review.diagnoses?.length || 0} diagnosis(es), ${review.medicines?.length || 0} medicine(s), ${review.labs?.length || 0} lab value(s)`

    const record = {
      id: `${Date.now()}`,
      type: review.type,
      title: review.title,
      date: review.date || new Date().toISOString().slice(0, 10),
      bodyPart: review.bodyPart,
      summary,
      patientNotes: review.patientNotes || '',
      previewUrl: review.previewUrl,
      alerts,
      details: structuredClone(review),
      fileName: review.fileName || review.title,
      mimeType: review.mimeType || 'application/octet-stream',
      fileDataUrl: review.fileDataUrl || review.previewUrl || null,
      extractedText: review.extractedText || '',
    }

    const documents = sessionData.intake.documents
    updateIntake('documents', {
      currentReview: { ...review, savedAt: new Date().toISOString() },
      timeline: [...documents.timeline, record],
    })
    setSaved(true)
  }

  const alerts = review && review.type !== 'xray' ? getAlerts(review) : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-10">
      {/* Top Header & Compact Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
              title={locale.back || 'Back'}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-skyclin-50 text-skyclin-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Document Scan & OCR</h1>
            <p className="text-xs text-slate-500">Upload reports, prescriptions, or X-rays</p>
          </div>
        </div>

        {/* Inline Scan & Upload Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="h-10 px-3.5 rounded-xl bg-skyclin-600 hover:bg-skyclin-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            {processing ? <LoaderCircle className="animate-spin" size={15} /> : <Camera size={15} />}
            <span>{processing ? 'Processing...' : 'Scan / Camera'}</span>
          </button>

          <label className="h-10 px-3.5 rounded-xl border border-skyclin-300 hover:bg-skyclin-50 bg-white text-skyclin-700 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition">
            <Upload size={15} />
            <span>Upload PDF/Image</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              onChange={handleUpload}
            />
          </label>

          {/* Instant Sample Test Chips */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={loadSampleChestXray}
              disabled={processing}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition"
              title="Test with Chest X-ray"
            >
              🩻 Chest X-Ray
            </button>
            <button
              type="button"
              onClick={loadSampleBloodReport}
              disabled={processing}
              className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold border border-sky-200 transition"
              title="Test with Blood Test Report"
            >
              🩸 Blood Report
            </button>
          </div>
        </div>
      </div>

      {/* Processing Animation */}
      {processing && (
        <div className="rounded-2xl bg-skyclin-50 border border-skyclin-100 p-4 text-center text-skyclin-700 mb-4 animate-pulse">
          <ScanLine className="mx-auto mb-1 text-skyclin-600" size={24} />
          <p className="font-bold text-sm">Processing & Extracting Document...</p>
          <p className="text-[11px] text-skyclin-600 mt-0.5">Extracting actual clinical values and categorizing...</p>
        </div>
      )}

      {/* Compact OCR Review Workspace */}
      {review && !processing && (
        <CompactReviewCard
          review={review}
          alerts={alerts}
          onUpdate={updateReview}
          onMedicineUpdate={updateMedicine}
          onLabUpdate={updateLab}
          onAddLab={addLabItem}
          onRemoveLab={removeLabItem}
          onTypeSwitch={handleTypeSwitch}
          onSave={saveReview}
          saved={saved}
          onNext={onNext}
        />
      )}

      {/* Collapsible Timeline to save vertical space */}
      {sessionData.intake.documents.timeline?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setTimelineOpen((prev) => !prev)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition"
          >
            <span className="flex items-center gap-2">
              <Activity size={15} className="text-skyclin-600" />
              <span>Medical Timeline ({sessionData.intake.documents.timeline.length} document(s) attached)</span>
            </span>
            {timelineOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {timelineOpen && (
            <div className="p-4 border-t border-slate-100">
              <DocumentTimeline records={sessionData.intake.documents.timeline} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Compact, space-efficient Review Card arranged into high-density modular tabs
 */
function CompactReviewCard({
  review,
  alerts,
  onUpdate,
  onMedicineUpdate,
  onLabUpdate,
  onAddLab,
  onRemoveLab,
  onTypeSwitch,
  onSave,
  saved,
  onNext,
}) {
  const isXray = review.type === 'xray'
  const isLab = review.type === 'lab'
  const isPrescription = review.type === 'prescription'

  // Sub-tabs for lab documents to keep GUI small & organized
  const [activeTab, setActiveTab] = useState('labs') // 'labs' | 'alerts' | 'diagnoses' | 'notes'
  const [labFilter, setLabFilter] = useState('all') // 'all' | 'abnormal' | 'normal'

  const labs = review.labs || []
  const abnormalCount = labs.filter((l) => l.status !== 'Normal').length
  const normalCount = labs.filter((l) => l.status === 'Normal').length

  const filteredLabs = labs.filter((l) => {
    if (labFilter === 'abnormal') return l.status !== 'Normal'
    if (labFilter === 'normal') return l.status === 'Normal'
    return true
  })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Top Header: Title + Category Tabs in a single compact row */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex-1 min-w-[220px]">
          <input
            value={review.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Report title..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-medi-500 shadow-2xs"
          />
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onTypeSwitch('xray')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isXray ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🩻 X-ray / Scan</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeSwitch('lab')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isLab ? 'bg-skyclin-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>🩸 Blood / Lab</span>
          </button>
          <button
            type="button"
            onClick={() => onTypeSwitch('prescription')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              isPrescription ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>💊 Prescription</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: X-RAY / IMAGING (Compact 2-Column Grid)                           */}
      {/* ========================================================================= */}
      {isXray ? (
        <div className="p-4 grid md:grid-cols-2 gap-4">
          {/* Left: Image Attachment / Preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-2.5 flex flex-col justify-center items-center text-center">
            {review.previewUrl ? (
              <div className="relative group w-full h-48 flex items-center justify-center overflow-hidden rounded-lg bg-black/40">
                <img
                  src={review.previewUrl}
                  alt="X-ray preview"
                  className="object-contain max-h-48 w-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="py-8 text-white/70">
                <ScanLine className="mx-auto mb-2 text-indigo-400" size={32} />
                <p className="text-xs font-bold">Chest X-ray Image Attached</p>
                <p className="text-[10px] text-white/50 mt-0.5">Transmitted for physician review</p>
              </div>
            )}
            <div className="mt-2 w-full flex items-center justify-between text-[11px] text-white/80 font-bold px-1">
              <span>Region: {review.bodyPart || 'Chest'}</span>
              <span>Modality: {review.modality || 'X-Ray'}</span>
            </div>
          </div>

          {/* Right: Doctor Summary & Patient Notes */}
          <div className="flex flex-col justify-between space-y-3">
            {/* Short Summary for Doctor */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs mb-1">
                <Stethoscope size={14} className="text-indigo-600" />
                <span>Doctor Summary (Only needed info for X-ray)</span>
              </div>
              <textarea
                value={
                  review.shortSummary ||
                  review.doctorSummary ||
                  `X-ray of ${review.bodyPart || 'chest'} (PA view) attached for doctor review.`
                }
                onChange={(e) => onUpdate('shortSummary', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-indigo-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Patient Notes Input */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-slate-800">Your Notes / Symptoms (Optional)</span>
                <VoiceMic
                  size="sm"
                  onResult={(spokenText) => {
                    const prev = review.patientNotes ? `${review.patientNotes} ` : ''
                    onUpdate('patientNotes', `${prev}${spokenText}`)
                  }}
                  label="Speak note"
                />
              </div>
              <textarea
                value={review.patientNotes || ''}
                onChange={(e) => onUpdate('patientNotes', e.target.value)}
                rows={2}
                placeholder="e.g. Cough for 2 weeks, follow-up after pneumonia..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-medi-500"
              />
            </div>

            {/* Action Save Button */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onSave}
                disabled={saved}
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:bg-emerald-100 disabled:text-emerald-800 transition"
              >
                {saved ? <CheckCircle2 size={16} /> : null}
                <span>{saved ? 'Saved to Timeline' : 'Save X-ray to Timeline'}</span>
              </button>
              <button
                type="button"
                onClick={onNext}
                className="h-11 px-4 rounded-xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>Continue</span>
                <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: BLOOD TEST / LAB REPORT (Compact High-Density Dashboard)          */
        /* ========================================================================= */
        <div className="p-3.5 space-y-3">
          {/* Quick Metrics & Sub-Tab Switcher Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            {/* Sub Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('labs')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'labs'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TestTube2 size={14} className="text-skyclin-600" />
                <span>Lab Values ({labs.length})</span>
              </button>

              {alerts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'alerts'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-700 hover:bg-amber-100/60'
                  }`}
                >
                  <AlertTriangle size={14} />
                  <span>Alerts ({alerts.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('diagnoses')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'diagnoses'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText size={14} className="text-emerald-600" />
                <span>Diagnoses ({review.diagnoses?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare size={14} className="text-medi-600" />
                <span>Patient Notes</span>
              </button>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Total: <strong>{labs.length}</strong>
              </span>
              {abnormalCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  {abnormalCount} Attention
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {normalCount} Normal
              </span>
            </div>
          </div>

          {/* TAB CONTENT 1: LAB VALUES (Compact Fixed-Height 2-Column Scroll Grid) */}
          {activeTab === 'labs' && (
            <div>
              {/* Filter controls & Add button */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Filter size={12} />
                  <span>Filter:</span>
                  <button
                    type="button"
                    onClick={() => setLabFilter('all')}
                    className={`px-2 py-0.5 rounded-md ${labFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    All ({labs.length})
                  </button>
                  {abnormalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setLabFilter('abnormal')}
                      className={`px-2 py-0.5 rounded-md ${labFilter === 'abnormal' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      Abnormal ({abnormalCount})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLabFilter('normal')}
                    className={`px-2 py-0.5 rounded-md ${labFilter === 'normal' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    Normal ({normalCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onAddLab}
                  className="text-skyclin-700 hover:text-skyclin-800 text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Parameter
                </button>
              </div>

              {/* Ultra-compact 2-Column Scrollable Grid (Fits in ~280px height without expanding page!) */}
              <div className="grid sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredLabs.map((lab, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 transition ${
                      lab.status === 'High'
                        ? 'border-red-200 bg-red-50/40'
                        : lab.status === 'Low'
                        ? 'border-blue-200 bg-blue-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <input
                        value={lab.name}
                        onChange={(e) => onLabUpdate(index, 'name', e.target.value)}
                        className="w-full bg-transparent font-bold text-slate-800 text-xs truncate focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 truncate">Ref: {lab.reference}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        value={lab.value}
                        onChange={(e) => onLabUpdate(index, 'value', e.target.value)}
                        className="w-20 h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs font-semibold text-slate-800 text-right focus:outline-none focus:border-medi-500"
                      />
                      <StatusBadge status={lab.status} />
                      <button
                        type="button"
                        onClick={() => onRemoveLab(index)}
                        className="text-slate-300 hover:text-red-500 p-0.5 transition"
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 max-h-[280px] overflow-y-auto">
              <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-700" />
                Parameters Requiring Clinical Attention:
              </p>
              <ul className="space-y-1.5">
                {alerts.map((alert, i) => (
                  <li key={i} className="text-xs text-amber-950 font-semibold flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* TAB CONTENT 3: DIAGNOSES & MEDICATIONS */}
          {activeTab === 'diagnoses' && (
            <div className="space-y-3 max-h-[280px] overflow-y-auto p-1">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Diagnoses & Findings</span>
                  <button
                    type="button"
                    onClick={() => onUpdate('diagnoses', [...(review.diagnoses || []), ''])}
                    className="text-skyclin-700 text-xs font-bold flex items-center gap-0.5"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                {review.diagnoses?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-lg">No abnormal diagnoses recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {review.diagnoses.map((diag, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          value={diag}
                          onChange={(e) => {
                            const copy = [...review.diagnoses]
                            copy[i] = e.target.value
                            onUpdate('diagnoses', copy)
                          }}
                          className="flex-1 h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium"
                          placeholder="Diagnosis / Finding"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdate('diagnoses', review.diagnoses.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500 px-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medicines if any */}
              {review.medicines?.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Prescribed Medicines</span>
                  <div className="space-y-1.5">
                    {review.medicines.map((med, i) => (
                      <div key={i} className="grid grid-cols-2 gap-1.5">
                        <input
                          value={med.name}
                          onChange={(e) => onMedicineUpdate(i, 'name', e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium"
                          placeholder="Medicine"
                        />
                        <input
                          value={med.dosage}
                          onChange={(e) => onMedicineUpdate(i, 'dosage', e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium"
                          placeholder="Dosage"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 4: PATIENT NOTES */}
          {activeTab === 'notes' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-slate-800">Patient Notes on this Report</span>
                <VoiceMic
                  size="sm"
                  onResult={(spokenText) => {
                    const prev = review.patientNotes ? `${review.patientNotes} ` : ''
                    onUpdate('patientNotes', `${prev}${spokenText}`)
                  }}
                  label="Speak note"
                />
              </div>
              <textarea
                value={review.patientNotes || ''}
                onChange={(e) => onUpdate('patientNotes', e.target.value)}
                rows={3}
                placeholder="Write or speak any symptoms, fasting status, or comments for the doctor..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-medi-500"
              />
            </div>
          )}

          {/* Action Row: Save + Continue */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onSave}
              disabled={saved}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:bg-emerald-100 disabled:text-emerald-800 transition"
            >
              {saved ? <CheckCircle2 size={16} /> : null}
              <span>{saved ? 'Saved to Medical Timeline' : 'Review complete and save'}</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="h-11 px-5 rounded-xl bg-medi-600 hover:bg-medi-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Continue</span>
              <Check size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function StatusBadge({ status }) {
  const style =
    status === 'High'
      ? 'bg-red-100 text-red-700 border border-red-200'
      : status === 'Low'
      ? 'bg-blue-100 text-blue-700 border border-blue-200'
      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${style}`}>{status}</span>
}

function getAlerts(review) {
  if (!review?.labs) return []
  const alerts = review.labs
    .filter((lab) => lab.status !== 'Normal')
    .map((lab) => `${lab.name}: ${lab.status} (${lab.value})`)

  const medicineNames = (review.medicines || []).map((m) => m.name.toLowerCase())
  if (
    medicineNames.some((name) => name.includes('warfarin')) &&
    medicineNames.some((name) => name.includes('ibuprofen'))
  ) {
    alerts.push('Potential interaction: warfarin and ibuprofen may increase bleeding risk.')
  }
  if (
    medicineNames.some((name) => name.includes('metformin')) &&
    review.labs.some((lab) => lab.name.toLowerCase().includes('creatinine') && lab.status === 'High')
  ) {
    alerts.push('Potential medication concern: metformin with elevated creatinine needs physician review.')
  }
  return alerts
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = String(result).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
