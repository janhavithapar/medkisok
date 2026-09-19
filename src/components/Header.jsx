import React from 'react'
import { Stethoscope, User, LayoutDashboard, HeartPulse } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'

export default function Header() {
  const { role, setRole, data, hospitals, doctors, setSelectedHospital, setActiveDoctor } = useKiosk()

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-medi-600 flex items-center justify-center shadow-sm">
            <Stethoscope size={18} color="white" />
          </div>
          <div>
            <span className="block font-bold text-slate-800 text-lg leading-none tracking-tight">MediKiosk</span>
            <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mt-1">Care starts here</span>
          </div>
        </div>

        <div className="flex items-center gap-2 max-w-full overflow-x-auto">
          <select value={data.selectedHospital} onChange={(event) => setSelectedHospital(event.target.value)} aria-label="Select hospital" className="hidden md:block h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
            {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
          </select>
          {role === 'doctor' && <select value={data.activeDoctorId} onChange={(event) => setActiveDoctor(event.target.value)} aria-label="Select doctor" className="hidden lg:block h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
          </select>}
        <div className="flex items-center bg-slate-100 rounded-2xl sm:rounded-full p-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setRole('kiosk')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors min-h-0
              ${role === 'kiosk' ? 'bg-medi-600 text-white shadow' : 'text-slate-600'}`}
          >
            <User size={16} /> Patient Kiosk
          </button>
          <button
            onClick={() => setRole('nurse')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors min-h-0
              ${role === 'nurse' ? 'bg-amber-500 text-white shadow' : 'text-slate-600'}`}
          >
            <HeartPulse size={16} /> Nurse Triage
          </button>
          <button
            onClick={() => setRole('doctor')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors min-h-0
              ${role === 'doctor' ? 'bg-skyclin-600 text-white shadow' : 'text-slate-600'}`}
          >
            <LayoutDashboard size={16} /> Doctor Dashboard
          </button>
        </div>
        </div>
      </div>
    </header>
  )
}
