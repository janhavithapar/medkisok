import React from 'react'
import { CalendarDays, FileText, Pill, TestTube2 } from 'lucide-react'

export default function DocumentTimeline({ records = [] }) {
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Medical timeline</h2>
          <p className="text-sm text-slate-500 mt-1">Your documents in chronological order</p>
        </div>
        <CalendarDays className="text-skyclin-600" size={24} />
      </div>

      {sortedRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          Scanned documents will appear here after review.
        </div>
      ) : (
        <div className="relative ml-3 border-l-2 border-skyclin-100 pl-6 space-y-5">
          {sortedRecords.map((record) => (
            <article key={record.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="absolute -left-[35px] top-5 w-4 h-4 rounded-full bg-skyclin-600 ring-4 ring-skyclin-50" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-skyclin-50 text-skyclin-600 flex items-center justify-center shrink-0">
                  {record.type === 'lab' ? <TestTube2 size={20} /> : record.type === 'prescription' ? <Pill size={20} /> : <FileText size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-bold text-slate-800">{record.title}</h3>
                    <time className="text-sm text-slate-500" dateTime={record.date}>{formatDate(record.date)}</time>
                  </div>
                  {record.summary && <p className="text-sm text-slate-600 mt-1">{record.summary}</p>}
                  {record.alerts?.length > 0 && <p className="text-xs font-semibold text-red-600 mt-2">{record.alerts.length} item(s) need physician review</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
