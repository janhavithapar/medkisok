import React, { useState } from 'react'
import Header from './components/Header.jsx'
import LanguageSelect from './screens/LanguageSelect.jsx'
import Screen2Identify from './screens/Screen2Identify.jsx'
import Screen3Intake from './screens/Screen3Intake.jsx'
import Screen4Ayush from './screens/Screen4Ayush.jsx'
import Screen5DocumentScan from './screens/Screen5DocumentScan.jsx'
import DoctorDashboard from './screens/DoctorDashboard.jsx'
import NurseTriage from './screens/NurseTriage.jsx'
import DoctorConsultation from './screens/DoctorConsultation.jsx'
import { useKiosk } from './context/KioskContext.jsx'

// Mock "router" for the patient kiosk flow — replace with react-router
// if/when the app grows past a handful of linear screens.
const KIOSK_STEPS = ['language', 'identify', 'intake', 'opd', 'ayush', 'documents', 'placeholder']

export default function App() {
  const { role, data, updatePatient } = useKiosk()
  const [stepIndex, setStepIndex] = useState(0)

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, KIOSK_STEPS.length - 1))
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const currentStep = KIOSK_STEPS[stepIndex]

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        {role === 'kiosk' && (
          <>
            {currentStep === 'language' && <LanguageSelect onNext={goNext} />}
            {currentStep === 'identify' && <Screen2Identify onNext={goNext} />}
            {currentStep === 'intake' && <Screen3Intake onNext={goNext} />}
            {currentStep === 'opd' && <OpdSelect onSelect={goNext} updatePatient={updatePatient} />}
            {currentStep === 'ayush' && (data.patient.opdType === 'ayurvedic' ? <Screen4Ayush onNext={goNext} onBack={goBack} /> : <SkipAyush onNext={goNext} />)}
            {currentStep === 'documents' && <Screen5DocumentScan onNext={goNext} />}
            {currentStep === 'placeholder' && <PlaceholderScreen />}
          </>
        )}

        {role === 'nurse' && <NurseTriage />}
        {role === 'doctor' && <DoctorConsultation />}
      </main>
    </div>
  )
}

// TODO: Build out remaining intake screens here, e.g.:
// - HPI detail capture (site / onset / character / severity)
// - Drug & allergy history capture
// - Vitals capture
// - Review & submit to doctor
function PlaceholderScreen() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-slate-400 font-medium">
        [Placeholder] Next intake step goes here — e.g. HPI details, drug &amp;
        allergy history, vitals, review &amp; submit.
      </p>
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
