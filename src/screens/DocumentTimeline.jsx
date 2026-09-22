import React, { useState } from 'react'
import { CalendarDays, FileText, Pill, TestTube2, ScanLine, Eye, X, Download } from 'lucide-react'

export default function DocumentTimeline({ records = [] }) {
  const [lightboxImage, setLightboxImage] = useState(null)
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
          {sortedRecords.map((record) => {
            const isXray = record.type === 'xray'
            const isLab = record.type === 'lab'
            const isPrescription = record.type === 'prescription'

            return (
              <article key={record.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <span className={`absolute -left-[35px] top-5 w-4 h-4 rounded-full ring-4 ${
                  isXray ? 'bg-indigo-600 ring-indigo-50' : isLab ? 'bg-skyclin-600 ring-skyclin-50' : 'bg-emerald-600 ring-emerald-50'
                }`} />

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isXray ? 'bg-indigo-50 text-indigo-700' : isLab ? 'bg-skyclin-50 text-skyclin-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {isXray ? <ScanLine size={20} /> : isLab ? <TestTube2 size={20} /> : isPrescription ? <Pill size={20} /> : <FileText size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-base">{record.title}</h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isXray ? 'bg-indigo-100 text-indigo-800' : isLab ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isXray ? '🩻 X-ray / Imaging' : isLab ? '🩸 Blood Test / Lab' : '💊 Prescription'}
                        </span>
                      </div>
                      <time className="text-xs font-semibold text-slate-500" dateTime={record.date}>
                        {formatDate(record.date)}
                      </time>
                    </div>

                    {record.summary && (
                      <p className="text-sm text-slate-600 mt-1 font-medium">{record.summary}</p>
                    )}

                    {record.details?.labs?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {record.details.labs.map((lab) => <span key={`${record.id}-${lab.name}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${lab.status === 'High' ? 'bg-red-100 text-red-700' : lab.status === 'Low' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{lab.name}: {lab.status}</span>)}
                      </div>
                    )}

                    {record.fileDataUrl && (
                      <a href={record.fileDataUrl} target="_blank" rel="noreferrer" download={record.fileName || record.title} className="inline-flex items-center gap-2 mt-3 rounded-lg bg-skyclin-50 px-3 py-2 text-xs font-bold text-skyclin-700 hover:bg-skyclin-100"><Download size={15} /> View / download uploaded file</a>
                    )}

                    {/* Patient Notes */}
                    {record.patientNotes && (
                      <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">💬 Patient Note: </span>
                        <span>&ldquo;{record.patientNotes}&rdquo;</span>
                      </div>
                    )}

                    {/* Image Preview Thumbnail */}
                    {record.previewUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setLightboxImage(record.previewUrl)}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 h-16 w-20 bg-slate-900 flex items-center justify-center cursor-pointer"
                        >
                          <img
                            src={record.previewUrl}
                            alt={record.title}
                            className="object-cover h-full w-full group-hover:opacity-75 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-white transition-opacity">
                            <Eye size={16} />
                          </div>
                        </button>
                        <span className="text-xs text-slate-500 font-medium">Click image to enlarge</span>
                      </div>
                    )}

                    {/* Review Alerts for Labs */}
                    {record.alerts?.length > 0 && (
                      <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 inline-block">
                        ⚠️ {record.alerts.length} item(s) flagged for physician review
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X size={18} />
            </button>
            <img src={lightboxImage} alt="Enlarged document" className="object-contain max-h-[80vh] w-auto mx-auto rounded-lg" />
          </div>
        </div>
      )}
    </section>
  )
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  } catch {
    return value
  }
}
