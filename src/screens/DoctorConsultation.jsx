import React, { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Edit3, FileText, HeartPulse, Menu, Pill, Save, Stethoscope, User, X } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import DocumentTimeline from './DocumentTimeline.jsx'

export default function DoctorConsultation() {
  const { patientQueue, selectedPatientId, selectPatient, updatePatientQueueStatus, confirmSummary, updateIntake } = useKiosk()
  const [queueOpen, setQueueOpen] = useState(true)
  const activeRecord = patientQueue.find((record) => record.id === selectedPatientId) || patientQueue[0]

  if (!activeRecord) return <EmptyState />
  const { patient, intake } = activeRecord
  const status = patient.consultationStatus || 'Waiting for Doctor'
  const isLivePatient = activeRecord.id === 'current-patient'
  const updateField = (key, value) => { if (isLivePatient) updateIntake(key, value) }

  function startConsultation() { updatePatientQueueStatus(activeRecord.id, 'In Consultation') }
  function completeConsultation() { updatePatientQueueStatus(activeRecord.id, 'Completed'); if (isLivePatient) confirmSummary() }

  return (
    <div className="max-w-[1500px] mx-auto px-3 sm:px-5 py-4 pb-12">
      <div className="flex items-center justify-between mb-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-skyclin-700">Doctor workspace</p><h1 className="text-2xl font-bold text-slate-900 mt-1">Consultation queue</h1></div><button type="button" onClick={() => setQueueOpen((open) => !open)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 flex items-center gap-2"><Menu size={18} /> {queueOpen ? 'Hide queue' : 'Show queue'}</button></div>
      <div className={`grid gap-4 ${queueOpen ? 'lg:grid-cols-[320px_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
        {queueOpen && <QueueSidebar records={patientQueue} selectedId={activeRecord.id} onSelect={selectPatient} />}
        <main className="min-w-0">
          <PatientHeader patient={patient} status={status} onStart={startConsultation} onComplete={completeConsultation} />
          {intake.redFlags?.length > 0 && <RedFlagStrip flags={intake.redFlags} />}
          <AtAGlance patient={patient} intake={intake} />
          <NurseTriageSection triage={patient.nurseTriage || intake.nurseTriage} />
          <ClinicalPanels intake={intake} updateIntake={updateField} />
          <DocumentPanel records={intake.documents?.timeline || []} />
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={completeConsultation} className="min-h-14 rounded-xl bg-emerald-600 px-5 text-white font-bold flex items-center gap-2"><CheckCircle2 size={18} /> Mark Consultation Complete</button><button type="button" onClick={() => isLivePatient && confirmSummary()} className="min-h-14 rounded-xl border-2 border-skyclin-200 bg-white px-5 text-skyclin-700 font-bold flex items-center gap-2"><Save size={18} /> Save Prescription & Notes</button></div>
        </main>
      </div>
    </div>
  )
}

function QueueSidebar({ records, selectedId, onSelect }) {
  return <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 h-fit lg:sticky lg:top-24"><div className="flex items-center justify-between px-2 pb-3"><div><h2 className="font-bold text-slate-900">My patient queue</h2><p className="text-xs text-slate-500 mt-1">{records.length} assigned records</p></div><Clock3 className="text-skyclin-600" size={19} /></div><div className="space-y-2">{records.map((record) => <QueueCard key={record.id} record={record} selected={record.id === selectedId} onClick={() => onSelect(record.id)} />)}</div></aside>
}

function QueueCard({ record, selected, onClick }) {
  const { patient, intake } = record
  const status = patient.consultationStatus || 'Waiting for Doctor'
  const tone = status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : status === 'In Consultation' ? 'bg-skyclin-100 text-skyclin-700' : 'bg-amber-100 text-amber-700'
  return <button type="button" onClick={onClick} className={`w-full text-left rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-skyclin-500 bg-skyclin-50/60 shadow-sm' : 'border-slate-200 bg-white'}`}><div className="flex items-start gap-2"><div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><User size={17} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="font-bold text-slate-800 truncate">{patient.name}</p><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${tone}`}>{status}</span></div><p className="text-xs text-slate-500 mt-1">{patient.age || '—'}y / {patient.gender || '—'} <span className="mx-1">•</span> {patient.abhaId || 'No ABHA'}</p><p className="text-xs text-slate-700 mt-2 truncate">{intake.chiefComplaint || 'No complaint captured'}</p><p className="text-[11px] text-slate-400 mt-1">Arrived {formatTime(patient.arrivalAt)}</p></div></div></button>
}

function PatientHeader({ patient, status, onStart, onComplete }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-4"><div className="flex flex-col xl:flex-row xl:items-center gap-4"><div className="flex items-center gap-3 flex-1"><div className="w-12 h-12 rounded-xl bg-skyclin-50 text-skyclin-600 flex items-center justify-center"><User size={23} /></div><div><h2 className="text-xl font-bold text-slate-900">{patient.name}</h2><p className="text-sm text-slate-500 mt-1">{patient.age || '—'} years <span className="mx-1">•</span> {patient.gender || '—'} <span className="mx-1">•</span> ABHA {patient.abhaId || 'Not linked'}</p></div></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">{status}</span>{status === 'Waiting for Doctor' && <button type="button" onClick={onStart} className="min-h-12 rounded-xl bg-skyclin-600 px-4 text-white font-bold">Start Consultation</button>}{status === 'In Consultation' && <button type="button" onClick={onComplete} className="min-h-12 rounded-xl bg-emerald-600 px-4 text-white font-bold">Mark Complete</button>}</div></div></div>
}

function AtAGlance({ patient, intake }) {
  const summaryValue = (value, fallback = 'Not captured yet') => {
    if (value === null || value === undefined || value === '') return fallback
    if (Array.isArray(value)) return value.filter(Boolean).length ? value.join(', ') : fallback
    const rendered = String(value).trim()
    return rendered || fallback
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 mb-4">
      <div className="flex items-center gap-2 text-emerald-800"><HeartPulse size={19} /><h2 className="font-bold">At-a-glance clinical summary</h2></div>
      <p className="text-xl font-bold text-slate-900 mt-3">{summaryValue(intake.chiefComplaint, 'No chief complaint recorded yet')}</p>
      <div className="flex flex-wrap gap-2 mt-3">{[['Site', intake.hpi?.site], ['Onset', intake.hpi?.onset], ['Character', intake.hpi?.character], ['Severity', intake.hpi?.severity]].map(([label, value]) => <span key={label} className="rounded-lg bg-white/80 px-3 py-2"><b className="block text-[10px] uppercase text-slate-400">{label}</b><span className="text-sm font-semibold text-slate-700">{summaryValue(value)}</span></span>)}</div>
    </section>
  )
}

function RedFlagStrip({ flags }) { return <div className="rounded-xl border border-red-300 bg-red-50 p-3 mb-4 flex items-start gap-2 text-red-700"><AlertTriangle size={19} /><div><b>Priority triage alerts</b><div className="flex flex-wrap gap-2 mt-1">{flags.map((flag) => <span key={flag} className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold">{flag}</span>)}</div></div></div> }

function NurseTriageSection({ triage = {} }) {
  const fields = [['Blood Pressure', triage.bloodPressure], ['Heart Rate', triage.heartRate], ['Temperature', triage.temperature], ['SpO2', triage.spo2], ['Weight', triage.weight]]
  const summaryValue = (value, fallback = 'Not captured yet') => {
    if (value === null || value === undefined || value === '') return fallback
    const rendered = String(value).trim()
    return rendered || fallback
  }

  return <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 mb-4"><div className="flex items-center gap-2 text-amber-800 mb-3"><HeartPulse size={19} /><h2 className="font-bold">Nurse triage</h2><span className="text-xs font-semibold ml-auto">Pre-consultation metrics</span></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl bg-white border border-amber-100 p-3"><p className="text-[11px] font-bold uppercase text-slate-400">{label}</p><p className="text-sm font-bold text-slate-800 mt-1">{summaryValue(value)}</p></div>)}</div><div className="mt-3 rounded-xl bg-white border border-amber-100 p-3"><p className="text-[11px] font-bold uppercase text-slate-400">Triage notes</p><p className="text-sm text-slate-700 mt-1">{summaryValue(triage.notes, 'No nurse notes recorded yet.')}</p></div></section>
}

function ClinicalPanels({ intake, updateIntake }) {
  const summaryValue = (value, fallback = 'Not captured yet') => {
    if (value === null || value === undefined || value === '') return fallback
    const rendered = String(value).trim()
    return rendered || fallback
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-4"><div className="flex items-center gap-2 mb-3"><Activity size={18} className="text-skyclin-600" /><h2 className="font-bold text-slate-900">SOCRATES HPI</h2><button type="button" onClick={() => updateIntake('pastMedicalSurgicalHistory', intake.pastMedicalSurgicalHistory || '')} className="ml-auto min-h-10 rounded-lg px-3 text-xs font-bold text-skyclin-700"><Edit3 size={15} /></button></div><div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">{[['Site', 'site'], ['Onset', 'onset'], ['Character', 'character'], ['Radiation', 'radiation'], ['Associated symptoms', 'associatedSymptoms'], ['Timing', 'timing'], ['Exacerbating / relieving', 'exacerbatingRelieving'], ['Severity', 'severity']].map(([label, key]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] uppercase font-bold text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-700 mt-1">{summaryValue(intake.hpi?.[key])}</p></div>)}</div></section>
}

function DocumentPanel({ records }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 mb-4"><div className="flex items-center gap-2"><FileText size={18} className="text-skyclin-600" /><h2 className="font-bold text-slate-900">Uploaded documents & lab timeline</h2></div><DocumentTimeline records={records} /><p className="text-xs text-slate-400 mt-3">For physician review - not a diagnosis. Lab results support decision-making and do not replace clinical judgment.</p></section> }

function EmptyState() { return <div className="max-w-xl mx-auto px-4 py-16 text-center"><Stethoscope className="mx-auto text-skyclin-600" size={36} /><h1 className="text-2xl font-bold text-slate-800 mt-4">No assigned patients</h1><p className="text-slate-500 mt-2">Your assigned patient queue is currently empty.</p></div> }
function formatTime(value) { return value ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '—' }
