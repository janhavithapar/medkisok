import React, { useState, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import LanguageSelect from './screens/LanguageSelect.jsx'
import Screen2Identify from './screens/Screen2Identify.jsx'
import IntakeChoice from './screens/IntakeChoice.jsx'
import Screen3Intake from './screens/Screen3Intake.jsx'
import Screen4Ayush from './screens/Screen4Ayush.jsx'
import Screen5DocumentScan from './screens/Screen5DocumentScan.jsx'
import NurseTriage from './screens/NurseTriage.jsx'
import DoctorConsultation from './screens/DoctorConsultation.jsx'
import PatientProfile from './screens/PatientProfile.jsx'
import { useKiosk } from './context/KioskContext.jsx'
import { CheckCircle2, RotateCcw, Stethoscope } from 'lucide-react'

const KIOSK_STEPS = ['language', 'identify', 'choice', 'intake', 'opd', 'ayush', 'documents', 'complete']

function getSecureStaffRouteRole() {
  try {
    const params = new URLSearchParams(window.location.search)
    const role = params.get('role')
    return role === 'doctor' || role === 'nurse' ? role : null
  } catch {
    return null
  }
}

export default function App() {
  const { role, data, updatePatient, resetIntake, logout, currentUserRole, patientView } = useKiosk()
  const [stepIndex, setStepIndex] = useState(0)
  const [intakeMode, setIntakeMode] = useState('full')
  const secureStaffRouteRole = getSecureStaffRouteRole()
  const staffRole = currentUserRole === 'doctor' || currentUserRole === 'nurse' ? currentUserRole : null
  const isAuthorizedSecureStaffRoute = !secureStaffRouteRole || (staffRole === secureStaffRouteRole)
  const effectiveRole = staffRole || 'patient'

  const prevAuthRef = useRef(data.auth?.isAuthenticated)
  useEffect(() => {
    if (prevAuthRef.current && !data.auth?.isAuthenticated) {
      setStepIndex(1)
      setIntakeMode('full')
    }
    prevAuthRef.current = data.auth?.isAuthenticated
  }, [data.auth?.isAuthenticated])

  function handleSignOut() {
    logout()
    setIntakeMode('full')
    setStepIndex(1)
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, KIOSK_STEPS.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function goToStep(stepName) {
    const idx = KIOSK_STEPS.indexOf(stepName)
    if (idx !== -1) setStepIndex(idx)
  }

  function handleSelectFull() {
    setIntakeMode('full')
    goToStep('intake')
  }

  function handleSelectUpload() {
    setIntakeMode('upload-only')
    goToStep('documents')
  }

  function handleRestart() {
    resetIntake()
    setIntakeMode('full')
    setStepIndex(0)
  }

  const currentStep = KIOSK_STEPS[stepIndex]

  return (
    <div className="min-h-screen bg-transparent">
      <Header onSignOut={handleSignOut} />

      <main className="kiosk-shell">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          {effectiveRole === 'patient' && patientView === 'kiosk' && (
            <>
              {currentStep === 'language' && <LanguageSelect onNext={goNext} />}
              {currentStep === 'identify' && <Screen2Identify onNext={goNext} onBack={goBack} />}
              {currentStep === 'choice' && (
                <IntakeChoice
                  onSelectFull={handleSelectFull}
                  onSelectUpload={handleSelectUpload}
                  onBack={() => goToStep('identify')}
                />
              )}
              {currentStep === 'intake' && <Screen3Intake onNext={goNext} />}
              {currentStep === 'opd' && <OpdSelect onSelect={goNext} updatePatient={updatePatient} />}
              {currentStep === 'ayush' && (
                data.patient.opdType === 'ayurvedic'
                  ? <Screen4Ayush onNext={goNext} onBack={goBack} />
                  : <SkipAyush onNext={goNext} />
              )}
              {currentStep === 'documents' && (
                <Screen5DocumentScan
                  onNext={goNext}
                  onBack={() => (intakeMode === 'upload-only' ? goToStep('choice') : (data.patient.opdType === 'ayurvedic' ? goToStep('ayush') : goToStep('opd')))}
                />
              )}
              {currentStep === 'complete' && (
                <IntakeCompletion
                  intakeMode={intakeMode}
                  patientName={data.patient.name}
                  onStartFull={handleSelectFull}
                  onRestart={handleRestart}
                />
              )}
            </>
          )}

          {effectiveRole === 'patient' && patientView === 'profile' && <PatientProfile />}
          {isAuthorizedSecureStaffRoute && effectiveRole === 'nurse' && <NurseTriage />}
          {isAuthorizedSecureStaffRoute && effectiveRole === 'doctor' && <DoctorConsultation />}
        </div>
      </main>
    </div>
  )
}

function IntakeCompletion({ intakeMode, patientName, onStartFull, onRestart }) {
  const isUploadOnly = intakeMode === 'upload-only'

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
        <CheckCircle2 size={44} />
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
        {patientName ? `Patient: ${patientName}` : 'Patient Checked In'}
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
        {isUploadOnly ? 'Medical History Uploaded Successfully!' : 'Intake & History Completed!'}
      </h1>

      <p className="text-slate-500 mt-2.5 max-w-md mx-auto text-sm sm:text-base">
        {isUploadOnly
          ? 'Your medical documents and lab records have been processed and added to your timeline for physician review.'
          : 'Your consultation intake answers and medical documents have been saved and assigned to the care team.'}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        {isUploadOnly && (
          <button
            type="button"
            onClick={onStartFull}
            className="h-14 px-6 rounded-2xl bg-medi-600 hover:bg-medi-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-medi-600/20 transition-all"
          >
            <Stethoscope size={20} />
            <span>Answer Consultation Questions</span>
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className="h-14 px-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={18} />
          <span>Done / Finish</span>
        </button>
      </div>
    </div>
  )
}

function OpdSelect({ onSelect, updatePatient }) {
  function choose(opdType) {
    updatePatient('opdType', opdType)
    onSelect?.()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Choose your OPD</h1>
        <p className="text-slate-500 mt-2">Select the type of care you are visiting for today.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <button type="button" onClick={() => choose('general')} className="min-h-[120px] rounded-2xl border-2 border-slate-200 bg-white p-5 text-left hover:border-medi-300">
          <span className="block text-lg font-bold text-slate-800">General OPD</span>
          <span className="block text-sm text-slate-500 mt-2">Modern clinical consultation</span>
        </button>
        <button type="button" onClick={() => choose('ayurvedic')} className="min-h-[120px] rounded-2xl border-2 border-medi-200 bg-medi-50 p-5 text-left hover:border-medi-500">
          <span className="block text-lg font-bold text-medi-700">Ayurvedic OPD</span>
          <span className="block text-sm text-slate-600 mt-2">AYUSH history and constitution assessment</span>
        </button>
      </div>
    </div>
  )
}

function SkipAyush({ onNext }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-slate-600 mb-5">Ayurveda history is not required for General OPD.</p>
      <button type="button" onClick={onNext} className="h-14 px-8 rounded-2xl bg-medi-600 text-white font-bold">Continue</button>
    </div>
  )
}
