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

export const DEMO_ACCOUNTS = [
  {
    id: 'user-patient-1',
    phone: '9876543210',
    password: 'password123',
    role: 'patient',
    name: 'Ramesh Sharma',
    age: '42',
    gender: 'Male',
    abhaId: '14-1234-5678-9012',
    language: 'hi',
  },
  {
    id: 'user-patient-2',
    phone: '9123456789',
    password: 'password123',
    role: 'patient',
    name: 'Priya Patel',
    age: '29',
    gender: 'Female',
    abhaId: '14-9876-5432-1098',
    language: 'en',
  },
  {
    id: 'user-doctor-1',
    phone: '9811122233',
    password: 'doctor123',
    role: 'doctor',
    name: 'Dr. Sharma',
    specialty: 'General Medicine',
    doctorId: 'dr-sharma',
  },
  {
    id: 'user-nurse-1',
    phone: '9822233344',
    password: 'nurse123',
    role: 'nurse',
    name: 'Sister Anjali',
    hospitalId: 'apollo-clinic',
  },
]

const initialState = {
  selectedHospital: 'apollo-clinic',
  activeDoctorId: 'dr-sharma',
  auth: {
    isAuthenticated: false,
    user: null,
  },
  patient: {
    abhaId: '',
    phone: '',
    consent: {
      hospitalDataSharing: false,
      abhaLinking: false,
    },
    name: 'Ramesh',
    age: '42',
    gender: 'Male',
    language: 'hi',
    opdType: '',
    assignedDoctorId: 'dr-sharma',
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

function detectRedFlags(text, intake = null) {
  if (!text) return []
  const lower = text.toLowerCase()
  const matched = []
  RED_FLAG_RULES.forEach((rule) => {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      matched.push(rule.flag)
    }
  })

  const hpiText = flattenText(intake?.hpi || '').toLowerCase()
  const complaint = String(intake?.chiefComplaint || '').toLowerCase()
  const hasCardiacPattern = /chest|heart|छाती|நெஞ்சு|ఛాతీ|বুক|છાતી|ಎದೆ/.test(complaint)
    && /arm|shoulder|jaw|back|radiat|sweat|nausea|lightheaded|बांह|जबड़ा|पसीना|मळमळ|கை|தாடை|வியர்வை|வாந்தி|చేయి|దవడ|చెమట|వికారం|হাত|চোয়াল|ঘাম|বমি|હાથ|જડબા|પરસેવો|નબળ|ಕೈ|ದವಡೆ|ಬೆವರು/.test(hpiText)
  if (hasCardiacPattern && !matched.includes('Possible cardiac event - chest pain reported')) {
    matched.push('Possible acute coronary syndrome pattern - immediate triage required')
  }

  const hasFastPattern = /stroke|weak|numb|face|speech|vision|कमजोर|सुन्न|चेहरा|बोल|நரம்பு|முகம்|பேச்சு|బలహీన|ముఖం|మాట|দুর্বল|মুখ|কথা|નબળ|ચહેરો|બોલ|ದೌರ್ಬಲ್ಯ|ಮುಖ|ಮಾತು/.test(`${complaint} ${hpiText}`)
    && /sudden|minutes|hours|अचानक|मिनट|घंटे|திடீர்|நிமிடம்|மணி|అకస్మాత్తుగా|నిమిష|గంట|হঠাৎ|মিনিট|ঘণ্টা|અચાનક|મિનિટ|કલાક|ಇದ್ದಕ್ಕಿದ್ದಂತೆ|ನಿಮಿಷ|ಗಂಟೆ/.test(hpiText)
  if (hasFastPattern && !matched.includes('Possible stroke symptoms')) {
    matched.push('Possible FAST stroke pattern - immediate triage required')
  }
  return matched
}

export function KioskProvider({ children }) {
  const [role, setRole] = useState('kiosk') // 'kiosk' | 'doctor'
  const [data, setData] = useState(initialState)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('medikiosk_users')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse saved users', e)
    }
    return DEMO_ACCOUNTS
  })
  const [geminiApiKey, setGeminiApiKeyState] = useState(() => {
    try {
      return (
        localStorage.getItem('medikiosk_gemini_key') ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        ''
      )
    } catch {
      return import.meta.env.VITE_GEMINI_API_KEY || ''
    }
  })

  const setGeminiApiKey = useCallback((newKey) => {
    const clean = (newKey || '').trim()
    setGeminiApiKeyState(clean)
    try {
      if (clean) {
        localStorage.setItem('medikiosk_gemini_key', clean)
      } else {
        localStorage.removeItem('medikiosk_gemini_key')
      }
    } catch (e) {
      console.warn('Failed to save gemini key in localStorage', e)
    }
  }, [])



  const doctors = [
    { id: 'dr-sharma', name: 'Dr. Sharma', specialty: 'General Medicine' },
    { id: 'dr-verma', name: 'Dr. Verma', specialty: 'Cardiology' },
    { id: 'dr-patel', name: 'Dr. Patel', specialty: 'Family Medicine' },
  ]
  const hospitals = [
    { id: 'apollo-clinic', name: 'Apollo Clinic' },
    { id: 'city-general', name: 'City General Hospital' },
    { id: 'aiims', name: 'AIIMS' },
    { id: 'primary-health-center', name: 'Primary Health Center' },
  ]

  const setSelectedHospital = useCallback((selectedHospital) => {
    setData((prev) => ({ ...prev, selectedHospital }))
  }, [])

  const setActiveDoctor = useCallback((activeDoctorId) => {
    setData((prev) => ({ ...prev, activeDoctorId }))
  }, [])

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

      const matches = detectRedFlags(flattenText(next.intake), next.intake)
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
      const nextIntake = { ...prev.intake, chiefComplaint: nextComplaint }
      const redFlags = detectRedFlags(flattenText(nextIntake), nextIntake)
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

  const loginWithPhone = useCallback((phone, password) => {
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    const user = users.find((u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone && u.password === password)
    if (!user) {
      return { success: false, error: 'Invalid mobile number or password.' }
    }
    setData((prev) => {
      const next = {
        ...prev,
        auth: { isAuthenticated: true, user },
      }
      if (user.role === 'patient') {
        next.patient = {
          ...prev.patient,
          name: user.name || prev.patient.name,
          phone: user.phone,
          age: user.age || prev.patient.age,
          gender: user.gender || prev.patient.gender,
          abhaId: user.abhaId || prev.patient.abhaId,
        }
      }
      return next
    })
    if (user.role === 'doctor') {
      setRole('doctor')
      if (user.doctorId) setActiveDoctor(user.doctorId)
    } else if (user.role === 'nurse') {
      setRole('nurse')
    } else {
      setRole('kiosk')
    }
    return { success: true, user }
  }, [users, setActiveDoctor])

  const registerWithPhone = useCallback((accountData) => {
    const { phone, password, name, age, gender, role: userRole = 'patient', abhaId = '' } = accountData
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' }
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' }
    }
    const exists = users.some((u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
    if (exists) {
      return { success: false, error: 'An account with this mobile number already exists. Please sign in.' }
    }

    const newUser = {
      id: `user-${Date.now()}`,
      phone: cleanPhone,
      password,
      name: name || 'Patient',
      age: age || '',
      gender: gender || 'Other',
      role: userRole,
      abhaId,
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    try {
      localStorage.setItem('medikiosk_users', JSON.stringify(updatedUsers))
    } catch (e) {
      console.warn('Failed to save users', e)
    }

    setData((prev) => ({
      ...prev,
      auth: { isAuthenticated: true, user: newUser },
      patient: userRole === 'patient' ? {
        ...prev.patient,
        name: newUser.name,
        phone: newUser.phone,
        age: newUser.age,
        gender: newUser.gender,
        abhaId: newUser.abhaId,
      } : prev.patient,
    }))

    if (userRole === 'doctor') {
      setRole('doctor')
    } else if (userRole === 'nurse') {
      setRole('nurse')
    } else {
      setRole('kiosk')
    }

    return { success: true, user: newUser }
  }, [users])

  const logout = useCallback(() => {
    setData((prev) => ({
      ...prev,
      auth: { isAuthenticated: false, user: null },
    }))
  }, [])

  const value = {
    role,
    setRole,
    data,
    sessionData: data,
    auth: data.auth,
    currentUser: data.auth?.user || null,
    doctors,
    hospitals,
    demoAccounts: DEMO_ACCOUNTS,
    loginWithPhone,
    registerWithPhone,
    logout,
    setSelectedHospital,
    setActiveDoctor,
    updateIntake,
    updatePatient,
    addSymptomTag,
    confirmSummary,
    resetIntake,
    geminiApiKey,
    setGeminiApiKey,
  }

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>
}

export function useKiosk() {
  const ctx = useContext(KioskContext)
  if (!ctx) throw new Error('useKiosk must be used within a KioskProvider')
  return ctx
}
