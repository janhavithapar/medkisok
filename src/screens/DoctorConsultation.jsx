import React, { useState } from 'react'
import { Activity, CheckCircle2, ClipboardList, Edit3, FileText, Pill, Save, Sparkles, User } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import DocumentTimeline from './DocumentTimeline.jsx'

const HPI_FIELDS = [
  ['site', 'Site'],
  ['onset', 'Onset'],
  ['character', 'Character'],
  ['radiation', 'Radiation'],
  ['associatedSymptoms', 'Associated symptoms'],
  ['timing', 'Timing'],
  ['exacerbatingRelieving', 'Exacerbating / relieving'],
  ['severity', 'Severity'],
]

export default function DoctorConsultation() {
  const { data, updateIntake, confirmSummary } = useKiosk()
  const { patient, intake, aiSummary } = data
  const [editing, setEditing] = useState(null)
  const isConfirmed = aiSummary.status === 'physician-confirmed'

  function toggleEdit(section) {
    setEditing((current) => current === section ? null : section)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-7 pb-14">
      <PatientHeader patient={patient} status={aiSummary.status} />
      {intake.redFlags.length > 0 && <RedFlagSummary flags={intake.redFlags} />}

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-skyclin-600" size={20} />
        <h1 className="text-xl font-bold text-slate-800">AI-Generated Clinical Summary</h1>
      </div>

      <SummarySection title="Chief Complaint" icon={<Activity size={17} />} editing={editing === 'complaint'} onEdit={() => toggleEdit('complaint')}>
        {editing === 'complaint' ? <EditableText value={intake.chiefComplaint} onSave={(value) => updateIntake('chiefComplaint', value)} /> : <SummaryText value={intake.chiefComplaint} />}
      </SummarySection>

      <SummarySection title="SOCRATES HPI" icon={<Activity size={17} />} editing={editing === 'hpi'} onEdit={() => toggleEdit('hpi')}>
        {editing === 'hpi' ? <FieldGrid values={intake.hpi} fields={HPI_FIELDS} onSave={(key, value) => updateIntake(`hpi.${key}`, value)} /> : <ReadOnlyGrid values={intake.hpi} fields={HPI_FIELDS} />}
      </SummarySection>

      <SummarySection title="Past History" icon={<ClipboardList size={17} />} editing={editing === 'history'} onEdit={() => toggleEdit('history')}>
        {editing === 'history' ? <HistoryEditor intake={intake} updateIntake={updateIntake} /> : <HistorySummary intake={intake} />}
      </SummarySection>

      <SummarySection title="Allergies and Medications" icon={<Pill size={17} />} editing={editing === 'medications'} onEdit={() => toggleEdit('medications')}>
        {editing === 'medications' ? <ListEditor intake={intake} updateIntake={updateIntake} /> : <ListSummary intake={intake} />}
      </SummarySection>

      <SummarySection title="AYUSH Parameters" icon={<Sparkles size={17} />} editing={editing === 'ayush'} onEdit={() => toggleEdit('ayush')}>
        {editing === 'ayush' ? <FieldGrid values={intake.ayush} fields={AYUSH_FIELDS} onSave={(key, value) => updateIntake(`ayush.${key}`, value)} /> : <ReadOnlyGrid values={intake.ayush} fields={AYUSH_FIELDS} />}
      </SummarySection>

      <SummarySection title="Scanned Document Timeline" icon={<FileText size={17} />} editing={editing === 'documents'} onEdit={() => toggleEdit('documents')}>
        <DocumentTimeline records={intake.documents.timeline} />
        {editing === 'documents' && <p className="text-xs text-slate-500 mt-3">Document edits can be made from the document scan review screen.</p>}
      </SummarySection>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 mt-6">
        <button type="button" onClick={confirmSummary} disabled={isConfirmed} className="w-full h-14 rounded-2xl bg-medi-600 text-white font-bold flex items-center justify-center gap-2 disabled:bg-medi-100 disabled:text-medi-700">
          {isConfirmed ? <CheckCircle2 size={20} /> : <Save size={20} />}
          {isConfirmed ? 'Physician-confirmed and saved' : 'Confirm & Save to Record'}
        </button>
        <p className="text-xs text-slate-500 text-center mt-3">Confirmation logs a mock FHIR / ABDM push payload for audit testing.</p>
        <AuditLine audit={aiSummary.audit} />
      </div>
    </div>
  )
}

function PatientHeader({ patient, status }) {
  return <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"><div className="w-12 h-12 rounded-full bg-skyclin-100 flex items-center justify-center"><User className="text-skyclin-600" size={24} /></div><div className="flex-1"><p className="font-bold text-slate-800 text-lg">{patient.name}</p><p className="text-sm text-slate-500">ABHA ID: {patient.abhaId || 'Not linked'} | OPD: {patient.opdType || 'General'}</p></div><span className={`text-xs font-bold px-3 py-1.5 rounded-full ${status === 'physician-confirmed' ? 'bg-medi-100 text-medi-700' : 'bg-amber-100 text-amber-700'}`}>{status === 'physician-confirmed' ? 'Physician-confirmed' : 'Draft'}</span></div>
}

function RedFlagSummary({ flags }) {
  return <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 p-4"><p className="font-bold text-red-700 mb-2">Red Flags Detected</p><ul className="list-disc list-inside text-sm text-red-700">{flags.map((flag) => <li key={flag}>{flag}</li>)}</ul></div>
}

function SummarySection({ title, icon, editing, onEdit, children }) {
  return <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden"><div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200"><span className="text-skyclin-600">{icon}</span><h2 className="font-bold text-slate-800 flex-1">{title}</h2><button type="button" onClick={onEdit} className="min-h-10 px-3 rounded-xl text-sm font-bold text-skyclin-700 flex items-center gap-1 hover:bg-skyclin-50"><Edit3 size={15} /> {editing ? 'Done' : 'Edit'}</button></div><div className="p-4">{children}</div></section>
}

function SummaryText({ value }) { return <p className="text-slate-800">{value || <span className="text-slate-400">Not captured</span>}</p> }

function ReadOnlyGrid({ values, fields }) { return <div className="grid sm:grid-cols-2 gap-2">{fields.map(([key, label]) => <div key={key} className="bg-slate-50 rounded-xl px-3 py-2"><p className="text-xs text-slate-400 font-medium">{label}</p><p className="text-slate-700">{formatValue(values[key])}</p></div>)}</div> }

function FieldGrid({ values, fields, onSave }) { return <div className="grid sm:grid-cols-2 gap-3">{fields.map(([key, label]) => <label key={key} className="block"><span className="block text-xs font-semibold text-slate-500 mb-1">{label}</span><input defaultValue={formatValue(values[key])} onBlur={(event) => onSave(key, event.target.value)} className="w-full h-11 rounded-xl border-2 border-slate-200 px-3 focus:outline-none focus:border-skyclin-500" /></label>)}</div> }

function EditableText({ value, onSave }) { return <textarea defaultValue={value} onBlur={(event) => onSave(event.target.value)} rows="3" className="w-full rounded-xl border-2 border-slate-200 p-3 focus:outline-none focus:border-skyclin-500" /> }

function HistoryEditor({ intake, updateIntake }) { return <div className="space-y-3"><EditableText value={intake.pastMedicalSurgicalHistory} onSave={(value) => updateIntake('pastMedicalSurgicalHistory', value)} /><EditableText value={intake.familyHistory} onSave={(value) => updateIntake('familyHistory', value)} /><EditableText value={intake.personalHistory} onSave={(value) => updateIntake('personalHistory', value)} /></div> }

function HistorySummary({ intake }) { return <div className="grid sm:grid-cols-3 gap-2"><SummaryText value={intake.pastMedicalSurgicalHistory} /><SummaryText value={intake.familyHistory} /><SummaryText value={intake.personalHistory} /></div> }

function ListEditor({ intake, updateIntake }) { return <div className="grid sm:grid-cols-2 gap-3"><label className="block"><span className="block text-xs font-semibold text-slate-500 mb-1">Medications</span><textarea defaultValue={intake.drugAllergyHistory.medications.join(', ')} onBlur={(event) => updateIntake('drugAllergyHistory.medications', splitList(event.target.value))} className="w-full rounded-xl border-2 border-slate-200 p-3" /></label><label className="block"><span className="block text-xs font-semibold text-slate-500 mb-1">Allergies</span><textarea defaultValue={intake.drugAllergyHistory.allergies.join(', ')} onBlur={(event) => updateIntake('drugAllergyHistory.allergies', splitList(event.target.value))} className="w-full rounded-xl border-2 border-slate-200 p-3" /></label></div> }

function ListSummary({ intake }) { return <div className="grid sm:grid-cols-2 gap-2"><SummaryText value={intake.drugAllergyHistory.medications.join(', ')} /><SummaryText value={intake.drugAllergyHistory.allergies.join(', ')} /></div> }

function AuditLine({ audit }) { return <div className="text-xs text-slate-400 text-center mt-4 space-y-1"><p>Created: {formatTimestamp(audit.createdAt)}</p>{audit.confirmedAt && <p>Confirmed: {formatTimestamp(audit.confirmedAt)} by {audit.confirmedBy}</p>}</div> }

function formatValue(value) { return Array.isArray(value) ? value.join(', ') || 'Not captured' : value || 'Not captured' }
function splitList(value) { return value.split(',').map((item) => item.trim()).filter(Boolean) }
function formatTimestamp(value) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded' }

const AYUSH_FIELDS = [['prakriti', 'Prakriti'], ['vikriti', 'Vikriti'], ['agni', 'Agni'], ['koshtha', 'Koshtha'], ['sleepHours', 'Sleep hours'], ['ahara', 'Ahara'], ['activityHabits', 'Activity habits']]
