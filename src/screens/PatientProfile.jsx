import React from 'react'
import { Download, FileText, History, Hospital, Languages, ShieldCheck, UserRound, CalendarDays, Stethoscope, Pill, ClipboardList } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function PatientProfile() {
  const { data, currentUser, hospitals } = useKiosk()
  const { patient, intake, aiSummary } = data
  const hospital = hospitals.find((item) => item.id === data.selectedHospital)?.name || data.selectedHospital
  const patientMatchesHistory = (entry) => {
    const expectedAbha = (patient.abhaId || '').replace(/\s+/g, '').toLowerCase()
    const recordAbha = (entry?.patient?.abhaId || '').replace(/\s+/g, '').toLowerCase()
    const nameMatch = entry?.patient?.name && patient.name && entry.patient.name.toLowerCase() === patient.name.toLowerCase()
    return expectedAbha ? recordAbha === expectedAbha : Boolean(nameMatch)
  }

  const historyEntries = (data.patientHistory || []).filter((entry) => patientMatchesHistory(entry))
  const activities = [
    ...(data.activityLog || []),
    ...(intake.chiefComplaint ? [{ id: 'current-intake', type: 'intake', title: 'Symptom intake submitted', detail: intake.chiefComplaint, timestamp: aiSummary.audit.lastEditedAt || new Date().toISOString(), status: aiSummary.status === 'physician-confirmed' ? 'Physician-Confirmed' : 'Pending Review' }] : []),
    ...(intake.documents.timeline || []).map((record) => ({ id: record.id, type: 'document', title: record.title, detail: record.summary, timestamp: record.date, status: record.alerts?.length ? 'Needs Review' : 'Uploaded' })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  function downloadSummary() {
    const summary = {
      patient: { name: patient.name, age: patient.age, gender: patient.gender, abhaId: patient.abhaId || 'Not linked', language: patient.language, hospital },
      consultationStatus: aiSummary.status === 'physician-confirmed' ? 'Physician-Confirmed' : 'Pending Review',
      chiefComplaint: intake.chiefComplaint || 'Not captured',
      hpi: intake.hpi,
      documents: intake.documents.timeline,
      priorVisits: historyEntries,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${patient.name.replace(/\s+/g, '-').toLowerCase()}-health-summary.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-medi-700">Patient profile</p><h1 className="text-3xl font-bold text-slate-900 mt-2">Welcome, {patient.name}</h1><p className="text-slate-500 mt-1">Your private activity and medical history.</p></div>
        <button type="button" onClick={downloadSummary} className="min-h-14 rounded-2xl bg-medi-600 px-5 text-white font-bold flex items-center justify-center gap-2"><Download size={19} /> Export health summary</button>
      </div>

      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm mb-5">
        <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl bg-white text-medi-700 flex items-center justify-center"><UserRound size={24} /></div><div><h2 className="text-xl font-bold text-slate-900">Personal details</h2><p className="text-sm text-slate-500">Visible only in your patient session</p></div><ShieldCheck className="ml-auto text-medi-700" size={22} /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"><Detail label="Name" value={patient.name} /><Detail label="Age / Gender" value={`${patient.age || '—'} / ${patient.gender || '—'}`} /><Detail label="ABHA ID" value={patient.abhaId || 'Not linked'} /><Detail label="Preferred language" value={patient.language?.toUpperCase()} icon={<Languages size={15} />} /><Detail label="Selected hospital" value={hospital} icon={<Hospital size={15} />} /><Detail label="Account" value={currentUser?.phone || 'Walk-in'} /></div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm mb-5">
        <div className="flex items-center gap-3 mb-5"><CalendarDays className="text-violet-600" size={22} /><div><h2 className="text-xl font-bold text-slate-900">Past Appointments & Consultations</h2><p className="text-sm text-slate-500">Chronological visits tied to your ABHA-linked record.</p></div></div>
        {historyEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No prior appointments are linked to this patient record yet. Your future visits will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {historyEntries.map((visit) => (
              <article key={visit.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{formatDate(visit.visitDate)}</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{visit.hospitalName}</h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Completed Visit</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Stethoscope size={15} className="text-skyclin-600" />Primary complaint</p>
                    <p>{visit.complaint || 'No complaint provided'}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-2"><ClipboardList size={15} className="text-violet-600" />Doctor</p>
                    <p>{visit.doctorName || 'Doctor not listed'} • {visit.diagnosis || 'Diagnosis pending'}</p>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-bold text-slate-900 mb-2">Doctor Diagnosis & Notes</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{visit.notes || 'No clinical notes available.'}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Pill size={15} className="text-amber-600" />Medications & Treatment plan</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {(visit.medications && visit.medications.length ? visit.medications : ['No medications prescribed']).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Plan:</span> {visit.treatmentPlan || 'No treatment plan recorded.'}</p>
                  </div>
                </div>
                {(visit.uploadedReports && visit.uploadedReports.length > 0) && (
                  <div className="mt-4 rounded-xl bg-white border border-slate-200 p-3">
                    <p className="font-bold text-slate-900 mb-2">Uploaded reports / scans</p>
                    <ul className="space-y-2">
                      {visit.uploadedReports.map((report) => (
                        <li key={`${visit.id}-${report.title}`} className="flex items-start gap-2 text-sm text-slate-700">
                          <FileText size={15} className="text-skyclin-600 mt-0.5" />
                          <span><span className="font-semibold">{report.title}</span> — {report.summary || 'Report linked to this visit.'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 mb-5"><History className="text-skyclin-600" size={22} /><div><h2 className="text-xl font-bold text-slate-900">Activity & Medical History</h2><p className="text-sm text-slate-500">Your kiosk visits, symptom intakes, documents, and consultation status.</p></div></div><div className="space-y-3">{activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}</div></section>
    </div>
  )
}

function Detail({ label, value, icon }) { return <div className="rounded-2xl bg-white/80 border border-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mt-1">{icon}{value || 'Not captured'}</p></div> }
function ActivityItem({ activity }) { return <article className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="w-10 h-10 rounded-xl bg-white text-skyclin-600 flex items-center justify-center shrink-0"><FileText size={19} /></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-800">{activity.title}</h3><span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">{activity.status}</span></div><p className="text-sm text-slate-600 mt-1">{activity.detail || 'No additional details'}</p><time className="block text-xs text-slate-400 mt-2">{formatDate(activity.timestamp)}</time></div></article> }
function formatDate(value) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
