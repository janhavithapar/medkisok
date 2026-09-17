import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock3, UserRound } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function NurseTriage() {
  const { data, setRole } = useKiosk()
  const [now, setNow] = useState(Date.now())
  const { patient, intake } = data

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentPatient = {
    id: 'current-patient',
    name: patient.name,
    symptomSummary: intake.chiefComplaint || 'Intake in progress',
    redFlag: intake.redFlagTriggered,
    triggeredAt: intake.redFlagTriggeredAt,
    status: intake.redFlagTriggered ? 'Needs immediate review' : 'Waiting for triage',
  }
  const queue = [currentPatient, ...MOCK_QUEUE].sort((a, b) => Number(b.redFlag) - Number(a.redFlag) || new Date(a.triggeredAt || a.queuedAt) - new Date(b.triggeredAt || b.queuedAt))

  return (
    <div className="max-w-3xl mx-auto px-4 py-7 pb-12">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Nurse station</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Live triage queue</h1>
          <p className="text-slate-500 mt-1">Priority cases stay pinned at the top.</p>
        </div>
        <span className="px-3 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-bold">{queue.length} patients</span>
      </div>

      <div className="space-y-3">
        {queue.map((item) => <QueueCard key={item.id} item={item} now={now} onOpen={() => setRole('doctor')} />)}
      </div>
    </div>
  )
}

function QueueCard({ item, now, onOpen }) {
  const elapsedFrom = item.triggeredAt || item.queuedAt
  return (
    <article className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${item.redFlag ? 'border-red-300' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.redFlag ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          {item.redFlag ? <AlertTriangle size={22} /> : <UserRound size={22} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-slate-800">{item.name}</h2>
            {item.redFlag && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Priority</span>}
          </div>
          <p className="text-sm text-slate-700 mt-2">{item.symptomSummary}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-3">
            <span className="flex items-center gap-1"><Clock3 size={14} /> {item.redFlag ? `${formatElapsed(now - new Date(elapsedFrom).getTime())} since trigger` : `${formatElapsed(now - new Date(elapsedFrom).getTime())} waiting`}</span>
            <span>{item.status}</span>
          </div>
        </div>
        <button type="button" onClick={onOpen} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-skyclin-700">Open</button>
      </div>
    </article>
  )
}

function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

const MOCK_QUEUE = [
  {
    id: 'queue-1',
    name: 'Meena S.',
    symptomSummary: 'Fever and headache for two days',
    redFlag: false,
    queuedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    status: 'Waiting for triage',
  },
  {
    id: 'queue-2',
    name: 'Arjun K.',
    symptomSummary: 'Follow-up consultation',
    redFlag: false,
    queuedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'Waiting for triage',
  },
]
