import React from 'react'
import { Stethoscope, User, LayoutDashboard, HeartPulse } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function Header() {
  const { role, setRole } = useKiosk()

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-medi-600 flex items-center justify-center">
            <Stethoscope size={18} color="white" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">MediKiosk</span>
        </div>

        <div className="flex items-center bg-slate-100 rounded-full p-1">
          <button
            onClick={() => setRole('kiosk')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-0
              ${role === 'kiosk' ? 'bg-medi-600 text-white shadow' : 'text-slate-600'}`}
          >
            <User size={16} /> Patient Kiosk
          </button>
          <button
            onClick={() => setRole('nurse')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-0
              ${role === 'nurse' ? 'bg-amber-500 text-white shadow' : 'text-slate-600'}`}
          >
            <HeartPulse size={16} /> Nurse Triage
          </button>
          <button
            onClick={() => setRole('doctor')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-0
              ${role === 'doctor' ? 'bg-skyclin-600 text-white shadow' : 'text-slate-600'}`}
          >
            <LayoutDashboard size={16} /> Doctor Dashboard
          </button>
        </div>
      </div>
    </header>
  )
}
