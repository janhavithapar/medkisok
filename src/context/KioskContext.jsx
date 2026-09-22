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
    id: 'user-doctor-1',
    phone: '9811122233',
    password: 'doctor123',
    role: 'doctor',
    name: 'Dr. Sharma',
    specialty: 'General Medicine',
    doctorId: 'dr-sharma',
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
    name: '',
    age: '',
    gender: 'Male',
    language: 'en',
    opdType: '',
    assignedDoctorId: 'dr-sharma',
    arrivalAt: new Date().toISOString(),
    consultationStatus: 'Waiting for Doctor',
    nurseTriage: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      spo2: '',
      weight: '',
      notes: '',
    },
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
  activityLog: [
    {
      id: 'visit-demo',
      type: 'visit',
      title: 'MediKiosk intake started',
      detail: 'Patient profile created for kiosk use.',
      timestamp: new Date().toISOString(),
      status: 'Pending Review',
    },
  ],
  patientQueue: [
    {
      id: 'queue-meena', patient: { name: 'Meena S.', age: '36', gender: 'Female', abhaId: '14-5555-2222-1111', language: 'hi', assignedDoctorId: 'dr-sharma', arrivalAt: new Date(Date.now() - 7 * 60000).toISOString(), consultationStatus: 'Waiting for Doctor' },
      intake: { chiefComplaint: 'Fever and headache for two days', hpi: { site: 'Head', onset: '2 days ago', character: 'Dull', radiation: '', associatedSymptoms: 'Body aches', timing: '', exacerbatingRelieving: '', severity: 'Moderate' }, nurseTriage: { bloodPressure: '118/76 mmHg', heartRate: '88 bpm', temperature: '38.2 C', spo2: '98%', weight: '58 kg', notes: 'Alert and oriented.' }, redFlags: [], documents: { timeline: [] } },
    },
    {
      id: 'queue-arjun', patient: { name: 'Arjun K.', age: '51', gender: 'Male', abhaId: '14-7777-3333-2222', language: 'en', assignedDoctorId: 'dr-sharma', arrivalAt: new Date(Date.now() - 3 * 60000).toISOString(), consultationStatus: 'Completed' },
      intake: { chiefComplaint: 'Follow-up consultation', hpi: { site: '', onset: '', character: '', radiation: '', associatedSymptoms: '', timing: '', exacerbatingRelieving: '', severity: '' }, nurseTriage: { bloodPressure: '126/82 mmHg', heartRate: '76 bpm', temperature: '36.8 C', spo2: '99%', weight: '72 kg', notes: 'Routine follow-up.' }, redFlags: [], documents: { timeline: [] } },
    },
  ],
  patientHistory: [
    {
      id: 'history-ramesh-jan-2025',
      patient: { name: 'Ramesh Sharma', age: '42', gender: 'Male', abhaId: '14-1234-5678-9012' },
      hospitalName: 'Apollo Clinic',
      doctorName: 'Dr. Sharma',
      visitDate: '2025-01-18T09:30:00.000Z',
      complaint: 'Persistent fever and fatigue',
      diagnosis: 'Viral fever with mild dehydration',
      notes: 'Symptoms improved after oral rehydration and rest. Review if fever persists for more than 48 hours.',
      medications: ['Paracetamol 650 mg', 'ORS sachets'],
      treatmentPlan: 'Hydration and symptomatic care; follow-up review in 48 hours.',
      uploadedReports: [{ title: 'CBC report', summary: 'Mild leukocytosis noted.' }],
    },
    {
      id: 'history-priya-sep-2025',
      patient: { name: 'Priya Patel', age: '29', gender: 'Female', abhaId: '14-9876-5432-1098' },
      hospitalName: 'Apollo Clinic',
      doctorName: 'Dr. Sharma',
      visitDate: '2025-09-12T11:15:00.000Z',
      complaint: 'Severe migraine and nausea',
      diagnosis: 'Migraine without aura',
      notes: 'Headache triggered by stress and screen fatigue. Reassured and advised hydration and sleep routine.',
      medications: ['Sumatriptan 50 mg as needed', 'Vitamin B complex'],
      treatmentPlan: 'Avoid triggers, maintain hydration, and report recurring episodes.',
      uploadedReports: [{ title: 'Neurology consult note', summary: 'No red flags noted on review.' }],
    },
  ],
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
  const [patientView, setPatientView] = useState('kiosk')
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

  const patientQueue = [
    {
      id: 'current-patient',
      patient: data.patient,
      intake: data.intake,
    },
    ...data.patientQueue,
  ].filter((record) => record.patient?.assignedDoctorId === data.activeDoctorId)

  const selectPatient = useCallback((patientId) => {
    setData((prev) => ({ ...prev, selectedPatientId: patientId }))
  }, [])

  const updatePatientQueueStatus = useCallback((patientId, consultationStatus) => {
    setData((prev) => {
      if (patientId === 'current-patient') {
        return { ...prev, patient: { ...prev.patient, consultationStatus } }
      }
      return { ...prev, patientQueue: prev.patientQueue.map((record) => record.id === patientId ? { ...record, patient: { ...record.patient, consultationStatus } } : record) }
    })
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

      const confirmRecord = {
        id: `visit-${Date.now()}`,
        patient: {
          name: prev.patient.name,
          abhaId: prev.patient.abhaId,
          age: prev.patient.age,
          gender: prev.patient.gender,
        },
        hospitalName: prev.selectedHospital || 'Apollo Clinic',
        doctorName: prev.activeDoctorId ? doctors.find((doc) => doc.id === prev.activeDoctorId)?.name || 'Dr. Sharma' : 'Dr. Sharma',
        visitDate: confirmedAt,
        complaint: prev.intake?.chiefComplaint || 'No complaint captured',
        diagnosis: 'Assessment completed by physician',
        notes: 'Clinical consultation completed; summary confirmed by the doctor.',
        medications: ['Follow physician-prescribed treatment plan'],
        treatmentPlan: 'Continue follow-up care and repeat review if symptoms recur.',
        uploadedReports: Array.isArray(prev.intake?.documents?.timeline)
          ? prev.intake.documents.timeline.map((doc) => ({
              title: doc.title || 'Uploaded report',
              summary: doc.summary || 'Document reviewed during consultation',
            }))
          : [],
      }

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
        patientHistory: [confirmRecord, ...(prev.patientHistory || [])],
      }
    })
  }, [doctors])

  const resetIntake = useCallback(() => {
    setData(initialState)
  }, [])

  const recordPatientVisit = useCallback((visit) => {
    setData((prev) => {
      const nextVisit = {
        id: visit.id || `visit-${Date.now()}`,
        patient: {
          ...(prev.patient || {}),
          ...(visit.patient || {}),
          name: visit.patient?.name || prev.patient?.name || 'Patient',
          abhaId: visit.patient?.abhaId || prev.patient?.abhaId || '',
          age: visit.patient?.age || prev.patient?.age || '',
          gender: visit.patient?.gender || prev.patient?.gender || '',
        },
        hospitalName: visit.hospitalName || prev.selectedHospital || 'Apollo Clinic',
        doctorName: visit.doctorName || 'Dr. Sharma',
        visitDate: visit.visitDate || new Date().toISOString(),
        complaint: visit.complaint || prev.intake?.chiefComplaint || 'No complaint captured',
        diagnosis: visit.diagnosis || 'Assessment in progress',
        notes: visit.notes || 'No doctor notes recorded.',
        medications: Array.isArray(visit.medications) ? visit.medications : [],
        treatmentPlan: visit.treatmentPlan || 'Continue monitoring and scheduled review.',
        uploadedReports: Array.isArray(visit.uploadedReports)
          ? visit.uploadedReports
          : (Array.isArray(prev.intake?.documents?.timeline) ? prev.intake.documents.timeline.map((doc) => ({
              title: doc.title || 'Uploaded report',
              summary: doc.summary || 'Report uploaded during consultation',
            })) : []),
      }

      return {
        ...prev,
        patientHistory: [nextVisit, ...(prev.patientHistory || [])],
      }
    })
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
        patient: {
          ...prev.patient,
          language: user.role === 'doctor' || user.role === 'nurse' ? 'en' : prev.patient.language,
        },
      }
      if (user.role === 'patient') {
        next.patient = {
          ...next.patient,
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
      setPatientView('kiosk')
      if (user.doctorId) setActiveDoctor(user.doctorId)
    } else if (user.role === 'nurse') {
      setRole('nurse')
      setPatientView('kiosk')
    } else {
      setRole('kiosk')
      setPatientView('profile')
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
      setPatientView('profile')
    }

    return { success: true, user: newUser }
  }, [users])

  const logout = useCallback(() => {
    setData((prev) => ({
      ...initialState,
      selectedHospital: prev.selectedHospital,
      activeDoctorId: prev.activeDoctorId,
      auth: { isAuthenticated: false, user: null },
      patient: {
        ...initialState.patient,
        language: prev.patient?.language || 'en',
      },
      intake: {
        ...initialState.intake,
        documents: {
          currentReview: null,
          timeline: [],
        },
      },
    }))
    setRole('kiosk')
  }, [])

  const currentUserRole = data.auth?.user?.role || 'patient'

  const value = {
    role,
    setRole,
    data,
    sessionData: data,
    auth: data.auth,
    currentUser: data.auth?.user || null,
    currentUserRole,
    patientView,
    setPatientView,
    doctors,
    hospitals,
    demoAccounts: DEMO_ACCOUNTS,
    loginWithPhone,
    registerWithPhone,
    logout,
    setSelectedHospital,
    setActiveDoctor,
    patientQueue,
    patientHistory: data.patientHistory || [],
    selectedPatientId: data.selectedPatientId || 'current-patient',
    selectPatient,
    updatePatientQueueStatus,
    updateIntake,
    updatePatient,
    addSymptomTag,
    confirmSummary,
    recordPatientVisit,
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
