import React, { createContext, useContext, useState, useCallback } from 'react'

const KioskContext = createContext(null)

// Simple keyword => red flag rule table.
// In a real system this would be a clinical rules engine / backend call.
const RED_FLAG_RULES = [
  { keywords: ['chest pain', 'chest tightness', 'chest pressure'], flag: 'Possible cardiac event - chest pain reported' },
  { keywords: ['difficulty breathing', 'shortness of breath', 'breathlessness', 'cant breathe', "can't breathe"], flag: 'Respiratory distress reported' },
  { keywords: ['severe bleeding', 'heavy bleeding'], flag: 'Severe bleeding reported' },
  { keywords: ['suicidal', 'want to die', 'self harm'], flag: 'Mental health crisis - needs immediate attention' },
  { keywords: ['stroke', 'face drooping', 'slurred speech'], flag: 'Possible stroke symptoms' },
  { keywords: ['unconscious', 'fainted', 'passed out'], flag: 'Loss of consciousness reported' },
]

const initialState = {
  patient: {
    abhaId: '',
    consent: {
      hospitalDataSharing: false,
      abhaLinking: false,
    },
    name: 'Ramesh',
    language: 'hi',
    opdType: '',
  },
  intake: {
    chiefComplaint: '',
    hpi: {
      site: '',
      onset: '',
      character: '',
      radiation: '',
      associatedSymptoms: '',
      timing: '',
      exacerbatingRelieving: '',
      severity: '',
    },
    pastMedicalSurgicalHistory: '',
    drugAllergyHistory: {
      medications: [],
      allergies: [],
    },
    familyHistory: '',
    personalHistory: '',
    reviewOfSystems: '',
    ayush: {
      prakriti: '',
      vikriti: '',
      agni: '',
      koshtha: '',
      ahara: [],
      sleepHours: '',
      activityHabits: [],
    },
    documents: {
      currentReview: null,
      timeline: [],
    },
    redFlags: [],
    redFlagTriggered: false,
    redFlagTriggeredAt: null,
  },
  aiSummary: {
    status: 'draft', // 'draft' | 'physician-confirmed'
    audit: {
      createdAt: new Date().toISOString(),
      lastEditedAt: null,
      confirmedAt: null,
      confirmedBy: null,
    },
  },
}

function flattenText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(' ')
  if (value && typeof value === 'object') return Object.values(value).map(flattenText).join(' ')
  return ''
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

      const matches = detectRedFlags(flattenText(next.intake))
      next.intake.redFlags = matches
      next.intake.redFlagTriggered = matches.length > 0
      next.intake.redFlagTriggeredAt = matches.length > 0
        ? (next.intake.redFlagTriggeredAt || new Date().toISOString())
        : null
      next.aiSummary.audit.lastEditedAt = new Date().toISOString()

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
      const redFlags = detectRedFlags(flattenText({ ...prev.intake, chiefComplaint: nextComplaint }))
      return {
        ...prev,
        intake: {
          ...prev.intake,
          chiefComplaint: nextComplaint,
          redFlags,
          redFlagTriggered: redFlags.length > 0,
          redFlagTriggeredAt: redFlags.length > 0
            ? (prev.intake.redFlagTriggeredAt || new Date().toISOString())
            : null,
        },
      }
    })
  }, [])

  const confirmSummary = useCallback(() => {
    setData((prev) => {
      const confirmedAt = new Date().toISOString()
      const payload = {
        resourceType: 'Bundle',
        type: 'document',
        subject: { reference: `Patient/${prev.patient.abhaId || 'walk-in'}` },
        timestamp: confirmedAt,
        source: 'MediKiosk',
        intake: prev.intake,
      }
      console.log('[MediKiosk FHIR / ABDM mock push]', payload)
      return {
        ...prev,
        aiSummary: {
          ...prev.aiSummary,
          status: 'physician-confirmed',
          audit: {
            ...prev.aiSummary.audit,
            confirmedAt,
            confirmedBy: 'Doctor Dashboard',
            lastEditedAt: confirmedAt,
          },
        },
      }
    })
  }, [])

  const resetIntake = useCallback(() => {
    setData(initialState)
  }, [])

  const value = {
    role,
    setRole,
    data,
    sessionData: data,
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
