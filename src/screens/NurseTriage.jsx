import React, { useEffect, useState } from 'react'
import { AlertTriangle, Clock3, HeartPulse, Timer, UserRound } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function NurseTriage() {
  const { data, patientQueue, setRole } = useKiosk()
  const [now, setNow] = useState(Date.now())
  const { patient, intake } = data

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const queue = patientQueue.map((record) => ({ id: record.id, name: record.patient.name, symptomSummary: record.intake.chiefComplaint || 'Intake in progress', redFlag: record.intake.redFlags?.length > 0, triggeredAt: record.patient.arrivalAt, status: record.patient.consultationStatus || 'Waiting for triage' })).sort((a, b) => Number(b.redFlag) - Number(a.redFlag) || new Date(a.triggeredAt) - new Date(b.triggeredAt))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-2 text-amber-700"><HeartPulse size={18} /><p className="text-sm font-bold uppercase tracking-[0.16em]">Nurse station</p></div>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Live triage queue</h1>
          <p className="text-slate-500 mt-1">Monitor arrivals and respond to urgent patients first.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live updates</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <QueueStat label="In queue" value={queue.length} icon={<UserRound size={18} />} tone="slate" />
        <QueueStat label="Priority" value={queue.filter((item) => item.redFlag).length} icon={<AlertTriangle size={18} />} tone="red" />
        <QueueStat label="Waiting" value={queue.filter((item) => !item.redFlag).length} icon={<Timer size={18} />} tone="amber" />
        <QueueStat label="Station" value="Ready" icon={<HeartPulse size={18} />} tone="green" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/70 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pb-3"><h2 className="font-bold text-slate-800">Patients awaiting attention</h2><span className="text-xs font-semibold text-slate-400">Oldest first</span></div>
        <div className="space-y-3">
          {queue.map((item) => <QueueCard key={item.id} item={item} now={now} onOpen={() => setRole('doctor')} />)}
        </div>
      </div>
    </div>
  )
}

function QueueStat({ label, value, icon, tone }) {
  const tones = { slate: 'bg-slate-50 text-slate-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div><p className="text-2xl font-bold text-slate-900 mt-3">{value}</p><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-1">{label}</p></div>
}

function QueueCard({ item, now, onOpen }) {
  const elapsedFrom = item.triggeredAt || item.queuedAt
  return (
    <article className={`rounded-2xl border bg-white p-4 sm:p-5 transition-shadow hover:shadow-md ${item.redFlag ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.redFlag ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
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
        <button type="button" onClick={onOpen} className="min-h-11 rounded-xl bg-skyclin-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-skyclin-700">Open chart</button>
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
