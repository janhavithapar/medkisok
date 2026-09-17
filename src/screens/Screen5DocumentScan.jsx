import React, { useRef, useState } from 'react'
import { AlertTriangle, Camera, Check, FileText, LoaderCircle, Plus, ScanLine, Trash2, Upload } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import DocumentTimeline from './DocumentTimeline.jsx'

const MOCK_DOCUMENT = {
  type: 'lab',
  title: 'Community Clinic Lab Report',
  date: '2026-09-10',
  diagnoses: ['Anemia', 'Type 2 diabetes - under review'],
  medicines: [
    { name: 'Metformin', dosage: '500 mg twice daily' },
    { name: 'Ibuprofen', dosage: '400 mg as needed' },
  ],
  labs: [
    { name: 'Hemoglobin', value: '9.8 g/dL', status: 'Low', reference: '12-16 g/dL' },
    { name: 'Fasting glucose', value: '168 mg/dL', status: 'High', reference: '70-140 mg/dL' },
    { name: 'Creatinine', value: '0.9 mg/dL', status: 'Normal', reference: '0.6-1.2 mg/dL' },
  ],
}

export default function Screen5DocumentScan({ onNext }) {
  const { sessionData, updateIntake } = useKiosk()
  const fileRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [review, setReview] = useState(sessionData.intake.documents.currentReview)
  const [saved, setSaved] = useState(Boolean(sessionData.intake.documents.timeline.length))

  function processDocument() {
    if (processing) return
    setProcessing(true)
    setTimeout(() => {
      setReview(structuredClone(MOCK_DOCUMENT))
      setProcessing(false)
      setSaved(false)
    }, 1200)
  }

  function handleUpload(event) {
    if (event.target.files?.length) processDocument()
  }

  function updateReview(key, value) {
    setReview((current) => ({ ...current, [key]: value }))
  }

  function updateMedicine(index, key, value) {
    setReview((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, itemIndex) => itemIndex === index ? { ...medicine, [key]: value } : medicine),
    }))
  }

  function updateLab(index, key, value) {
    setReview((current) => ({
      ...current,
      labs: current.labs.map((lab, itemIndex) => itemIndex === index ? { ...lab, [key]: value } : lab),
    }))
  }

  function saveReview() {
    if (!review) return
    const alerts = getAlerts(review)
    const record = {
      id: `${Date.now()}`,
      type: review.type,
      title: review.title,
      date: review.date,
      summary: `${review.diagnoses.length} diagnosis(es), ${review.medicines.length} medicine(s), ${review.labs.length} lab value(s)`,
      alerts,
    }
    const documents = sessionData.intake.documents
    updateIntake('documents', {
      currentReview: review,
      timeline: [...documents.timeline, record],
    })
    setSaved(true)
  }

  const alerts = review ? getAlerts(review) : []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-skyclin-50 flex items-center justify-center mx-auto mb-3">
          <FileText className="text-skyclin-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Scan medical documents</h1>
        <p className="text-slate-500 mt-2">Bring old prescriptions and lab reports into your medical timeline.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <button type="button" onClick={processDocument} disabled={processing} className="h-16 rounded-2xl bg-skyclin-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {processing ? <LoaderCircle className="animate-spin" size={22} /> : <Camera size={22} />}
          {processing ? 'Processing...' : 'Scan Document'}
        </button>
        <label className="h-16 rounded-2xl border-2 border-skyclin-200 bg-white text-skyclin-700 font-bold flex items-center justify-center gap-2 cursor-pointer">
          <Upload size={22} /> Upload document
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="sr-only" onChange={handleUpload} />
        </label>
      </div>

      {processing && <div className="rounded-2xl bg-skyclin-50 border border-skyclin-100 p-5 text-center text-skyclin-700 mb-6"><ScanLine className="mx-auto animate-pulse mb-2" size={28} /><p className="font-semibold">OCR processing...</p><p className="text-sm mt-1">Reading diagnoses, medicines, and lab values.</p></div>}

      {review && !processing && <ReviewCard review={review} alerts={alerts} onUpdate={updateReview} onMedicineUpdate={updateMedicine} onLabUpdate={updateLab} onSave={saveReview} saved={saved} />}

      <DocumentTimeline records={sessionData.intake.documents.timeline} />

      <div className="mt-8 border-t border-slate-200 pt-5">
        <p className="text-xs text-slate-500 text-center">For physician review - not a diagnosis.</p>
        <button type="button" onClick={onNext} className="w-full mt-4 h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2">Continue <Check size={20} /></button>
      </div>
    </div>
  )
}

function ReviewCard({ review, alerts, onUpdate, onMedicineUpdate, onLabUpdate, onSave, saved }) {
  return (
    <section className="rounded-2xl border-2 border-skyclin-100 bg-white overflow-hidden">
      <div className="px-5 py-4 bg-skyclin-50 border-b border-skyclin-100 flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-skyclin-700">OCR review</p><h2 className="text-lg font-bold text-slate-800 mt-1">Check extracted information</h2></div>
        <ScanLine className="text-skyclin-600" size={24} />
      </div>
      <div className="p-5 space-y-6">
        <label className="block"><span className="block text-sm font-bold text-slate-600 mb-1">Document title</span><input value={review.title} onChange={(event) => onUpdate('title', event.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 px-3" /></label>
        <EditableList title="Diagnoses" values={review.diagnoses} onChange={(values) => onUpdate('diagnoses', values)} />
        <MedicineList medicines={review.medicines} onUpdate={onMedicineUpdate} />
        <LabList labs={review.labs} onUpdate={onLabUpdate} />
        {alerts.length > 0 && <AlertBox alerts={alerts} />}
        <button type="button" onClick={onSave} disabled={saved} className="w-full h-14 rounded-2xl bg-medi-600 text-white font-bold disabled:bg-medi-100 disabled:text-medi-700">{saved ? 'Saved to medical timeline' : 'Review complete and save'}</button>
      </div>
    </section>
  )
}

function EditableList({ title, values, onChange }) {
  function update(index, value) {
    onChange(values.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  return <div><div className="flex justify-between items-center mb-2"><h3 className="font-bold text-slate-700">{title}</h3><button type="button" onClick={() => onChange([...values, ''])} className="text-skyclin-700 text-sm font-semibold flex items-center gap-1"><Plus size={16} /> Add</button></div>{values.map((value, index) => <div key={index} className="flex gap-2 mb-2"><input value={value} onChange={(event) => update(index, event.target.value)} className="flex-1 h-11 rounded-xl border-2 border-slate-200 px-3" /><button type="button" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${title} item`} className="w-11 h-11 rounded-xl text-slate-500 flex items-center justify-center"><Trash2 size={18} /></button></div>)}</div>
}

function MedicineList({ medicines, onUpdate }) {
  return <div><h3 className="font-bold text-slate-700 mb-2">Medicines and dosages</h3>{medicines.map((medicine, index) => <div key={index} className="grid sm:grid-cols-2 gap-2 mb-2"><input value={medicine.name} onChange={(event) => onUpdate(index, 'name', event.target.value)} aria-label="Medicine name" className="h-11 rounded-xl border-2 border-slate-200 px-3" /><input value={medicine.dosage} onChange={(event) => onUpdate(index, 'dosage', event.target.value)} aria-label="Medicine dosage" className="h-11 rounded-xl border-2 border-slate-200 px-3" /></div>)}</div>
}

function LabList({ labs, onUpdate }) {
  return <div><h3 className="font-bold text-slate-700 mb-2">Lab values</h3><div className="space-y-2">{labs.map((lab, index) => <div key={index} className="grid grid-cols-[1fr_auto] gap-2 items-center rounded-xl bg-slate-50 p-3"><div><input value={lab.name} onChange={(event) => onUpdate(index, 'name', event.target.value)} aria-label="Lab name" className="w-full bg-transparent font-semibold text-slate-700" /><p className="text-xs text-slate-500">Reference: {lab.reference}</p></div><div className="flex items-center gap-2"><input value={lab.value} onChange={(event) => onUpdate(index, 'value', event.target.value)} aria-label="Lab value" className="w-28 h-10 rounded-lg border border-slate-200 px-2" /><StatusBadge status={lab.status} /></div></div>)}</div></div>
}

function StatusBadge({ status }) {
  const style = status === 'High' ? 'bg-red-100 text-red-700' : status === 'Low' ? 'bg-blue-100 text-blue-700' : 'bg-medi-100 text-medi-700'
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${style}`}>{status}</span>
}

function AlertBox({ alerts }) {
  return <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-800 font-bold mb-2"><AlertTriangle size={19} /> Review alerts</div><ul className="list-disc list-inside text-sm text-amber-900 space-y-1">{alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul></div>
}

function getAlerts(review) {
  const alerts = review.labs.filter((lab) => lab.status !== 'Normal').map((lab) => `${lab.name}: ${lab.status} (${lab.value})`)
  const medicineNames = review.medicines.map((medicine) => medicine.name.toLowerCase())
  if (medicineNames.some((name) => name.includes('warfarin')) && medicineNames.some((name) => name.includes('ibuprofen'))) alerts.push('Potential interaction: warfarin and ibuprofen may increase bleeding risk.')
  if (medicineNames.some((name) => name.includes('metformin')) && review.labs.some((lab) => lab.name.toLowerCase().includes('creatinine') && lab.status === 'High')) alerts.push('Potential medication concern: metformin with elevated creatinine needs physician review.')
  return alerts
}
