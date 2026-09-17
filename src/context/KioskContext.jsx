import React, { createContext, useContext, useState, useCallback } from 'react'

const KioskContext = createContext(null)

// Simple keyword => red flag rule table.
// In a real system this would be a clinical rules engine / backend call.
const RED_FLAG_RULES = [
  { keywords: ['chest pain', 'chest tightness', 'chest pressure'], flag: 'Possible cardiac event — chest pain reported' },
  { keywords: ['difficulty breathing', 'shortness of breath', 'cant breathe', "can't breathe"], flag: 'Respiratory distress reported' },
  { keywords: ['severe bleeding', 'heavy bleeding'], flag: 'Severe bleeding reported' },
  { keywords: ['suicidal', 'want to die', 'self harm'], flag: 'Mental health crisis — needs immediate attention' },
  { keywords: ['stroke', 'face drooping', 'slurred speech'], flag: 'Possible stroke symptoms' },
  { keywords: ['unconscious', 'fainted', 'passed out'], flag: 'Loss of consciousness reported' },
]

const initialState = {
  patient: {
    abhaId: '',
    name: 'Ramesh',
    language: 'hi',
  },
  intake: {
    chiefComplaint: '',
    hpi: {
      site: '',
      onset: '',
      character: '',
      severity: '',
    },
    drugAllergyHistory: {
      medications: [],
      allergies: [],
    },
    redFlags: [],
  },
  aiSummary: {
    status: 'draft', // 'draft' | 'confirmed'
  },
}

function detectRedFlags(text) {
  if (!text) return []
  const lower = text.toLowerCase()
  const matched = []
  RED_FLAG_RULES.forEach((rule) => {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      matched.push(rule.flag)
    }
  })
  return matched
}

export function KioskProvider({ children }) {
  const [role, setRole] = useState('kiosk') // 'kiosk' | 'doctor'
  const [data, setData] = useState(initialState)

  // Generic dotted-path setter, e.g. updateIntake('hpi.site', 'Left knee')
  // or updateIntake('chiefComplaint', 'Chest pain since morning')
  const updateIntake = useCallback((key, value) => {
    setData((prev) => {
      const next = structuredClone(prev)
      const parts = key.split('.')
      let cursor = next.intake
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]]
      }
      cursor[parts[parts.length - 1]] = value

      // Re-run red flag detection whenever chiefComplaint or hpi text changes
      const textToScan = [
        next.intake.chiefComplaint,
        next.intake.hpi?.site,
        next.intake.hpi?.onset,
        next.intake.hpi?.character,
        next.intake.hpi?.severity,
      ].filter(Boolean).join(' ')

      next.intake.redFlags = detectRedFlags(textToScan)

      return next
    })
  }, [])

  const updatePatient = useCallback((key, value) => {
    setData((prev) => ({
      ...prev,
      patient: { ...prev.patient, [key]: value },
    }))
  }, [])

  const addSymptomTag = useCallback((symptom) => {
    setData((prev) => {
      const current = prev.intake.chiefComplaint
      const nextComplaint = current ? `${current}, ${symptom}` : symptom
      const redFlags = detectRedFlags(nextComplaint)
      return {
        ...prev,
        intake: {
          ...prev.intake,
          chiefComplaint: nextComplaint,
          redFlags,
        },
      }
    })
  }, [])

  const confirmSummary = useCallback(() => {
    setData((prev) => ({
      ...prev,
      aiSummary: { ...prev.aiSummary, status: 'confirmed' },
    }))
  }, [])

  const resetIntake = useCallback(() => {
    setData(initialState)
  }, [])

  const value = {
    role,
    setRole,
    data,
    updateIntake,
    updatePatient,
    addSymptomTag,
    confirmSummary,
    resetIntake,
  }

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>
}

export function useKiosk() {
  const ctx = useContext(KioskContext)
  if (!ctx) throw new Error('useKiosk must be used within a KioskProvider')
  return ctx
}
