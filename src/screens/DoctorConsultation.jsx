import React, { useState } from 'react'
import { Activity, AlertTriangle, ChevronDown, Edit3, FileText, HeartPulse, Languages, Pill, Save, Sparkles, Stethoscope, User } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import DocumentTimeline from './DocumentTimeline.jsx'
import { getLocale } from '../i18n.js'

const HPI_FIELDS = [['site', 'Site'], ['onset', 'Onset'], ['character', 'Character'], ['radiation', 'Radiation'], ['associatedSymptoms', 'Associated symptoms'], ['timing', 'Timing'], ['exacerbatingRelieving', 'Exacerbating / relieving'], ['severity', 'Severity']]
const AYUSH_FIELDS = [['prakriti', 'Prakriti'], ['vikriti', 'Vikriti'], ['agni', 'Agni'], ['koshtha', 'Koshtha'], ['sleepHours', 'Sleep'], ['ahara', 'Ahara'], ['activityHabits', 'Activity']]

export default function DoctorConsultation() {
  const { data, doctors, hospitals, updateIntake, confirmSummary, setActiveDoctor } = useKiosk()
  const { patient, intake, aiSummary } = data
  const [openPanel, setOpenPanel] = useState('hpi')
  const [editing, setEditing] = useState(null)
  const [viewLanguage, setViewLanguage] = useState('selected')
  const activeDoctor = doctors.find((doctor) => doctor.id === data.activeDoctorId)
  const hospital = hospitals.find((item) => item.id === data.selectedHospital)?.name || data.selectedHospital
  const locale = getLocale(viewLanguage === 'selected' ? patient.language : 'en')
  const isConfirmed = aiSummary.status === 'physician-confirmed'

  if (patient.assignedDoctorId !== data.activeDoctorId) return <EmptyScope doctor={activeDoctor} hospital={hospital} />

  function togglePanel(panel) { setOpenPanel((current) => current === panel ? '' : panel) }
  function toggleEdit(panel) { setEditing((current) => current === panel ? null : panel) }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 pb-14 text-base">
      <PatientBar patient={patient} hospital={hospital} activeDoctor={activeDoctor} status={aiSummary.status} doctors={doctors} setActiveDoctor={setActiveDoctor} locale={locale} viewLanguage={viewLanguage} setViewLanguage={setViewLanguage} />
      <div className="mt-4">{intake.redFlags.length > 0 && <RedFlagStrip flags={intake.redFlags} />}</div>
      <ExecutiveSummary intake={intake} locale={locale} />

      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-4 mt-4 items-start">
        <div className="space-y-3">
          <Accordion title="Vitals & SOCRATES HPI" icon={<Activity size={17} />} open={openPanel === 'hpi'} onToggle={() => togglePanel('hpi')} onEdit={() => toggleEdit('hpi')} editing={editing === 'hpi'} editLabel={locale.edit} doneLabel={locale.done}>
            {editing === 'hpi' ? <FieldGrid values={intake.hpi} fields={HPI_FIELDS} onSave={(key, value) => updateIntake(`hpi.${key}`, value)} /> : <CompactGrid values={intake.hpi} fields={HPI_FIELDS} />}
          </Accordion>
          <Accordion title="Past Medical & Surgical History" icon={<FileText size={17} />} open={openPanel === 'history'} onToggle={() => togglePanel('history')} onEdit={() => toggleEdit('history')} editing={editing === 'history'} editLabel={locale.edit} doneLabel={locale.done}>
            {editing === 'history' ? <HistoryEditor intake={intake} updateIntake={updateIntake} /> : <HistoryGrid intake={intake} />}
          </Accordion>
          <Accordion title="Meds & Drug Allergies" icon={<Pill size={17} />} open={openPanel === 'medications'} onToggle={() => togglePanel('medications')} onEdit={() => toggleEdit('medications')} editing={editing === 'medications'} editLabel={locale.edit} doneLabel={locale.done}>
            {editing === 'medications' ? <MedicationEditor intake={intake} updateIntake={updateIntake} /> : <MedicationSummary intake={intake} />}
          </Accordion>
        </div>
        <div className="space-y-3">
          <Accordion title="Family, Personal & AYUSH" icon={<Sparkles size={17} />} open={openPanel === 'ayush'} onToggle={() => togglePanel('ayush')} onEdit={() => toggleEdit('ayush')} editing={editing === 'ayush'} editLabel={locale.edit} doneLabel={locale.done}>
            {editing === 'ayush' ? <FieldGrid values={intake.ayush} fields={AYUSH_FIELDS} onSave={(key, value) => updateIntake(`ayush.${key}`, value)} /> : <><CompactGrid values={intake.ayush} fields={AYUSH_FIELDS} /><div className="grid grid-cols-2 gap-2 mt-3"><InfoCell label="Family history" value={intake.familyHistory} /><InfoCell label="Personal history" value={intake.personalHistory} /></div></>}
          </Accordion>
          <Accordion title="Scanned Documents & Labs" icon={<FileText size={17} />} open={openPanel === 'documents'} onToggle={() => togglePanel('documents')} onEdit={() => toggleEdit('documents')} editing={editing === 'documents'} editLabel={locale.edit} doneLabel={locale.done}>
            <DocumentTimeline records={intake.documents.timeline} />
            <p className="text-[11px] text-slate-400 mt-3">For physician review - not a diagnosis. Lab badges support decision-making and do not replace clinical judgment.</p>
          </Accordion>
        </div>
      </div>

      <footer className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4 text-white flex flex-col sm:flex-row sm:items-center gap-4"><div className="flex-1"><p className="font-bold">Ready to sign this record?</p><AuditLine audit={aiSummary.audit} /></div><button type="button" onClick={confirmSummary} disabled={isConfirmed} className="min-h-14 sm:min-w-64 rounded-xl bg-emerald-500 px-5 font-bold text-white flex items-center justify-center gap-2 disabled:bg-emerald-900 disabled:text-emerald-200"><Save size={18} />{isConfirmed ? 'Physician-confirmed' : 'Confirm & Save to Record'}</button></footer>
    </div>
  )
}

function PatientBar({ patient, hospital, activeDoctor, status, doctors, setActiveDoctor, locale, viewLanguage, setViewLanguage }) {
  return <div className="sticky top-[72px] z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm p-4"><div className="flex flex-col xl:flex-row xl:items-center gap-4"><div className="flex items-center gap-4 flex-1 min-w-0"><div className="w-12 h-12 rounded-2xl bg-skyclin-50 text-skyclin-600 flex items-center justify-center shrink-0"><User size={23} /></div><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h1 className="text-lg font-bold text-slate-900">{patient.name}</h1><span className="text-sm text-slate-500">{patient.age || '—'}y / {patient.gender || '—'}</span><StatusBadge confirmed={status === 'physician-confirmed'} /></div><p className="text-sm text-slate-600 truncate mt-1">ABHA: {patient.abhaId || 'Not linked'} <span className="mx-1">•</span> {hospital} <span className="mx-1">•</span> {patient.language?.toUpperCase()}</p></div></div><div className="flex flex-wrap items-center gap-2"><select value={activeDoctor?.id || ''} onChange={(event) => setActiveDoctor(event.target.value)} aria-label="Doctor profile" className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select><button type="button" onClick={() => document.getElementById('hpi-panel')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 flex items-center gap-2"><Edit3 size={17} /> {locale.edit} summary</button><div className="flex h-12 items-center rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setViewLanguage('selected')} className={`h-10 rounded-lg px-3 text-sm font-bold ${viewLanguage === 'selected' ? 'bg-white text-skyclin-700 shadow-sm' : 'text-slate-500'}`}>{locale.doctorPatientLanguage}</button><button type="button" onClick={() => setViewLanguage('english')} className={`h-10 rounded-lg px-3 text-sm font-bold ${viewLanguage === 'english' ? 'bg-white text-skyclin-700 shadow-sm' : 'text-slate-500'}`}>English</button></div><span className="hidden md:flex h-12 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-semibold text-slate-600"><Languages size={17} /> {locale.viewLanguage}</span></div></div></div>
}

function StatusBadge({ confirmed }) { return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{confirmed ? 'Physician-Confirmed' : 'AI Draft - Pending Review'}</span> }
function RedFlagStrip({ flags }) { return <div className="rounded-xl border border-red-300 bg-red-50 p-3 flex items-start gap-3 text-red-800 shadow-sm"><AlertTriangle size={19} className="shrink-0 mt-0.5" /><div><p className="font-bold">Active red-flag alerts</p><div className="flex flex-wrap gap-2 mt-1">{flags.map((flag) => <span key={flag} className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold">{flag}</span>)}</div></div></div> }
function ExecutiveSummary({ intake, locale }) { return <section className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm"><div className="flex items-center gap-3 text-emerald-800 mb-4"><HeartPulse size={21} /><h2 className="text-lg font-bold">At-a-glance clinical summary</h2><span className="ml-auto hidden sm:block text-sm font-semibold text-emerald-700">{locale.doctorTitle}</span></div><div className="grid md:grid-cols-[1.2fr_2fr] gap-5"><div><p className="text-xs uppercase tracking-wide font-bold text-emerald-700">{locale.chiefComplaint}</p><p className="text-xl font-bold text-slate-900 mt-2">{intake.chiefComplaint || 'Not captured'}</p><span className="inline-flex mt-3 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-slate-700">Severity: {intake.hpi.severity || 'Not recorded'}</span></div><div className="flex flex-wrap content-start gap-3">{[['Site', intake.hpi.site], ['Onset', intake.hpi.onset], ['Character', intake.hpi.character], ['Radiation', intake.hpi.radiation]].map(([label, value]) => <span key={label} className="rounded-xl border border-white/80 bg-white/75 px-4 py-3"><span className="block text-xs uppercase font-bold text-slate-400">{label}</span><span className="text-sm font-semibold text-slate-700">{value || '—'}</span></span>)}</div></div></section> }
function Accordion({ title, icon, open, onToggle, onEdit, editing, editLabel, doneLabel, children }) { return <section id={title.startsWith('Vitals') ? 'hpi-panel' : undefined} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"><div className="flex items-center gap-2 px-4 py-3"><span className="w-8 h-8 rounded-lg bg-skyclin-50 text-skyclin-600 flex items-center justify-center">{icon}</span><h2 className="font-bold text-slate-800 flex-1">{title}</h2><button type="button" onClick={onEdit} aria-label={editing ? doneLabel : editLabel} className="min-h-10 rounded-lg px-2 text-xs font-bold text-skyclin-700 hover:bg-skyclin-50"><Edit3 size={15} /></button><button type="button" onClick={onToggle} aria-expanded={open} className="w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center justify-center"><ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} size={18} /></button></div>{open && <div className="border-t border-slate-100 p-4">{children}</div>}</section> }
function CompactGrid({ values, fields }) { return <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{fields.map(([key, label]) => <InfoCell key={key} label={label} value={values[key]} />)}</div> }
function InfoCell({ label, value }) { return <div className="rounded-lg bg-slate-50 px-3 py-3"><p className="text-xs uppercase tracking-wide font-bold text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-700 mt-1">{formatValue(value)}</p></div> }
function FieldGrid({ values, fields, onSave }) { return <div className="grid sm:grid-cols-2 gap-3">{fields.map(([key, label]) => <label key={key} className="block"><span className="block text-xs font-bold text-slate-500 mb-1">{label}</span><input defaultValue={formatValue(values[key])} onBlur={(event) => onSave(key, event.target.value)} className="w-full h-11 rounded-lg border border-slate-200 px-3 focus:outline-none focus:border-skyclin-500" /></label>)}</div> }
function HistoryGrid({ intake }) { return <div className="grid sm:grid-cols-3 gap-2"><InfoCell label="Medical / surgical" value={intake.pastMedicalSurgicalHistory} /><InfoCell label="Family" value={intake.familyHistory} /><InfoCell label="Personal" value={intake.personalHistory} /></div> }
function HistoryEditor({ intake, updateIntake }) { return <div className="space-y-3"><EditableText value={intake.pastMedicalSurgicalHistory} onSave={(value) => updateIntake('pastMedicalSurgicalHistory', value)} /><EditableText value={intake.familyHistory} onSave={(value) => updateIntake('familyHistory', value)} /><EditableText value={intake.personalHistory} onSave={(value) => updateIntake('personalHistory', value)} /></div> }
function MedicationSummary({ intake }) { return <div className="grid sm:grid-cols-2 gap-3"><TagGroup title="Current medicines" items={intake.drugAllergyHistory.medications} tone="slate" /><TagGroup title="Known allergies" items={intake.drugAllergyHistory.allergies} tone="red" /></div> }
function MedicationEditor({ intake, updateIntake }) { return <div className="grid sm:grid-cols-2 gap-3"><label className="block text-xs font-bold text-slate-500">Medicines<textarea defaultValue={intake.drugAllergyHistory.medications.join(', ')} onBlur={(event) => updateIntake('drugAllergyHistory.medications', splitList(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label><label className="block text-xs font-bold text-slate-500">Allergies<textarea defaultValue={intake.drugAllergyHistory.allergies.join(', ')} onBlur={(event) => updateIntake('drugAllergyHistory.allergies', splitList(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label></div> }
function TagGroup({ title, items, tone }) { return <div><p className="text-[11px] uppercase tracking-wide font-bold text-slate-400 mb-2">{title}</p><div className="flex flex-wrap gap-2">{items?.length ? items.map((item) => <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone === 'red' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{item}</span>) : <span className="text-xs text-slate-400">None recorded</span>}</div></div> }
function EditableText({ value, onSave }) { return <textarea defaultValue={value} onBlur={(event) => onSave(event.target.value)} rows="3" className="w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:border-skyclin-500" /> }
function AuditLine({ audit }) { return <div className="text-[11px] text-slate-400 mt-2"><span>AI generated: {formatTimestamp(audit.createdAt)}</span>{audit.confirmedAt && <span className="ml-3">Physician signed: {formatTimestamp(audit.confirmedAt)}</span>}</div> }
function EmptyScope({ doctor, hospital }) { return <div className="max-w-2xl mx-auto px-4 py-16"><div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><Stethoscope className="mx-auto text-skyclin-600" size={34} /><h1 className="text-2xl font-bold text-slate-800 mt-4">No assigned patients</h1><p className="text-slate-500 mt-2">{doctor?.name || 'This doctor'} has no records assigned at {hospital}.</p></div></div> }
function formatValue(value) { return Array.isArray(value) ? value.join(', ') || 'Not captured' : value || 'Not captured' }
function splitList(value) { return value.split(',').map((item) => item.trim()).filter(Boolean) }
function formatTimestamp(value) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded' }
