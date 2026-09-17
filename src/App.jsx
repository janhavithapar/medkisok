import React, { useState } from 'react'
import Header from './components/Header.jsx'
import LanguageSelect from './screens/LanguageSelect.jsx'
import IntakeScreen from './screens/IntakeScreen.jsx'
import DoctorDashboard from './screens/DoctorDashboard.jsx'
import { useKiosk } from './context/KioskContext.jsx'

// Mock "router" for the patient kiosk flow — replace with react-router
// if/when the app grows past a handful of linear screens.
const KIOSK_STEPS = ['language', 'intake', 'placeholder']

export default function App() {
  const { role } = useKiosk()
  const [stepIndex, setStepIndex] = useState(0)

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, KIOSK_STEPS.length - 1))
  }

  const currentStep = KIOSK_STEPS[stepIndex]

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        {role === 'kiosk' && (
          <>
            {currentStep === 'language' && <LanguageSelect onNext={goNext} />}
            {currentStep === 'intake' && <IntakeScreen onNext={goNext} />}
            {currentStep === 'placeholder' && <PlaceholderScreen />}
          </>
        )}

        {role === 'doctor' && <DoctorDashboard />}
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
