import React, { useState } from 'react'
import { Stethoscope, LayoutDashboard, HeartPulse, LogOut } from 'lucide-react'
import { useKiosk } from '../context/KioskContext.jsx'
import AuthModal from './AuthModal.jsx'

export default function Header({ onSignOut }) {
  const { role, setRole, data, hospitals, setSelectedHospital, currentUser, currentUserRole, patientView, setPatientView, logout } = useKiosk()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authPreferredRole, setAuthPreferredRole] = useState('patient')
  const effectiveRole = currentUserRole || 'patient'

  const openAuthModal = (roleType = 'patient') => {
    setAuthPreferredRole(roleType)
    setIsAuthOpen(true)
  }

  function handleSignOutClick() {
    logout()
    onSignOut?.()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1280px] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-[0_16px_28px_rgba(31,167,106,0.28)]">
              <Stethoscope size={18} color="white" />
            </div>
            <div>
              <div className="text-[1.9rem] font-black leading-none tracking-[-0.06em] text-slate-900">MediKiosk</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Care starts here</div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 overflow-hidden">
            <select
              value={data.selectedHospital}
              onChange={(event) => setSelectedHospital(event.target.value)}
              aria-label="Select hospital"
              className="hidden h-12 min-w-[180px] rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-base font-semibold text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 md:block"
            >
              {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
            </select>

            {effectiveRole === 'patient' ? (
              <div className="flex items-center rounded-2xl bg-slate-100 p-1 shadow-inner ring-1 ring-slate-200">
                <button
                  type="button"
                  onClick={() => setPatientView('kiosk')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition sm:text-base ${patientView === 'kiosk' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_24px_rgba(31,167,106,0.2)]' : 'text-slate-700'}`}
                >
                  Patient Kiosk
                </button>
                <button
                  type="button"
                  onClick={() => setPatientView('profile')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition sm:text-base ${patientView === 'profile' ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-[0_10px_24px_rgba(14,165,233,0.2)]' : 'text-slate-700'}`}
                >
                  My Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 shadow-inner ring-1 ring-slate-200">
                {effectiveRole === 'nurse' && (
                  <button
                    onClick={() => setRole('nurse')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap ${role === 'nurse' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_12px_20px_rgba(245,158,11,0.28)]' : 'text-slate-700'}`}
                  >
                    <HeartPulse size={16} /> Nurse Triage
                  </button>
                )}
                {effectiveRole === 'doctor' && (
                  <button
                    onClick={() => setRole('doctor')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap ${role === 'doctor' ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-[0_12px_20px_rgba(14,165,233,0.28)]' : 'text-slate-700'}`}
                  >
                    <LayoutDashboard size={16} /> Doctor Dashboard
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => openAuthModal('doctor')}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_rgba(14,165,233,0.25)] transition hover:brightness-105 sm:text-base"
            >
              <Stethoscope size={18} />
              <span>Doctor Portal / Sign In</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-2 py-1.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">{currentUser.name?.[0] || 'U'}</div>
                <span className="hidden text-sm font-bold text-slate-800 sm:inline">{currentUser.name}</span>
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  className="rounded-full p-1.5 text-slate-500 transition hover:text-red-600"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} preferredRole={authPreferredRole} onClose={() => setIsAuthOpen(false)} />
    </header>
  )
}
