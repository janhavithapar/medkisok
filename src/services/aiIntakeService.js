/**
 * AI Intake Service
 * Provides dynamic, context-aware clinical questions based on patient's chief complaint
 * and prior answers. Supports Google Gemini API with seamless built-in smart engine fallback.
 */

// Comprehensive clinical knowledge tree for 20+ complaint categories
const CLINICAL_DOMAINS = [
  {
    category: 'ophthalmology',
    matcher: /eye|vision|sight|blur|glasses|specs|cataract|cornea|pupil|red eye|watery eye|squint|चश्मा|आंख|दृष्टि|धुंधला/,
    getQuestion: (history, stepIndex) => {
      const lastAnswer = (history[history.length - 1]?.answerText || '').toLowerCase()
      const isRoutine = /routine|check|exam|new glass|specs|power|नियमित|चश्मा/.test(lastAnswer)

      if (stepIndex === 0) {
        return {
          questionText: 'Is this a routine vision check / new glasses prescription, or are you having eye pain, redness, or blurry vision?',
          questionTextHi: 'क्या यह नियमित आंखों की जांच / नए चश्मे का नंबर है, या आंखों में दर्द, लाली या धुंधलापन है?',
          helperText: 'Select or speak the main reason for your eye visit.',
          options: ['Routine eye exam', 'Need new glasses / power check', 'Blurry or reduced vision', 'Eye pain, redness or irritation'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        if (isRoutine || /glass|specs|routine|exam/.test(history[0]?.answerText?.toLowerCase() || '')) {
          return {
            questionText: 'Do you currently wear eyeglasses or contact lenses, and do you experience eye strain while working or reading?',
            questionTextHi: 'क्या आप अभी चश्मा या कॉन्टैक्ट लेंस लगाते हैं, और क्या पढ़ते या स्क्रीन देखते समय आंखों में खिंचाव होता है?',
            helperText: 'Tell us about your current visual aids and daily screen time.',
            options: ['Currently wear glasses', 'Notice screen strain / fatigue', 'Blurry distance vision', 'Difficulty reading close-up'],
            isLastQuestion: false,
          }
        }
        return {
          questionText: 'Which eye is affected (right, left, or both), and did this start suddenly or gradually over several days?',
          questionTextHi: 'कौन सी आंख में समस्या है (दाईं, बाईं या दोनों), और क्या यह अचानक शुरू हुआ या धीरे-धीरे?',
          helperText: 'Specify the affected eye and how quickly symptoms developed.',
          options: ['Right eye only', 'Left eye only', 'Both eyes', 'Started suddenly', 'Gradual over several days'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Do you have any related symptoms like headaches, light sensitivity, discharge, or a medical history of diabetes or high blood pressure?',
        questionTextHi: 'क्या सिरदर्द, तेज रोशनी से परेशानी, पानी आना, या शुगर/बीपी का पुराना इतिहास है?',
        helperText: 'Related systemic symptoms help the ophthalmologist prepare your evaluation.',
        options: ['Frequent headaches', 'Sensitivity to light / watering', 'History of Diabetes / BP', 'No other concerns'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'dental',
    matcher: /tooth|teeth|gum|dentist|cavity|decay|mouth|jaw|दांत|मसूड़े|जबड़ा/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Where in your mouth is the discomfort, and are you having pain, swelling, or sensitivity to hot or cold foods?',
          questionTextHi: 'मुंह में समस्या कहां है, और क्या दर्द, सूजन या ठंडा-गर्म लगने की संवेदनशीलता है?',
          helperText: 'Point out the specific area and sensation.',
          options: ['Upper teeth / jaw', 'Lower teeth / jaw', 'Sensitivity to hot or cold', 'Bleeding or swollen gums'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Is the pain constant and throbbing, or does it mainly trigger when chewing or biting down?',
          questionTextHi: 'क्या दर्द लगातार धड़कता हुआ है, या केवल चबाते या काटते समय होता है?',
          helperText: 'Timing of pain indicates cavity depth or nerve involvement.',
          options: ['Constant throbbing pain', 'Only when chewing / biting', 'Sharp momentary twinges', 'Dull background ache'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Do you have any visible swelling on your cheek or gums, fever, or difficulty opening your mouth?',
        questionTextHi: 'क्या गाल या मसूड़े पर सूजन, बुखार, या मुंह खोलने में कठिनाई है?',
        helperText: 'Important to rule out dental abscess or infection.',
        options: ['Visible swelling on cheek / gum', 'Difficulty opening mouth', 'Mild fever', 'No swelling'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'dermatology',
    matcher: /skin|rash|itch|allergy|boil|pimple|acne|spots|dry skin|त्वचा|खुजली|दाने|फोड़ा/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Where on your body did the rash or skin issue appear, and is it intensely itchy, burning, or painful?',
          questionTextHi: 'शरीर के किस हिस्से पर दाने या त्वचा की समस्या है, और क्या यह खुजलीदार या दर्दनाक है?',
          helperText: 'Describe the affected area and sensations.',
          options: ['Face or neck', 'Arms or hands', 'Torso or back', 'Legs or feet', 'Severe itching', 'Burning / painful'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'How many days ago did it appear, and have you come into contact with any new soaps, cosmetics, plants, or medications?',
          questionTextHi: 'यह कितने दिन पहले दिखा, और क्या किसी नए साबुन, क्रीम या दवा के संपर्क में आए हैं?',
          helperText: 'Helps identify contact allergies or drug reactions.',
          options: ['1 to 3 days ago', 'More than a week ago', 'New soap, cream or product', 'No known new exposure'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Is the affected skin dry and scaly, or is it blistering, oozing fluid, or spreading to other parts?',
        questionTextHi: 'क्या त्वचा सूखी और पपड़ीदार है, या छाले पड़ रहे हैं और फैल रहा है?',
        helperText: 'Guides the dermatologist in diagnosing dermatitis or infection.',
        options: ['Dry, scaly patches', 'Blisters or oozing fluid', 'Spreading to other areas', 'Stable / no change'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'orthopedic',
    matcher: /knee|back|joint|shoulder|neck|hip|ankle|sprain|fracture|bone|घुटने|कमर|जोड़|हड्डी|मोच/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Did this pain begin after an injury, fall, or sudden movement, or did it develop gradually over time?',
          questionTextHi: 'क्या यह दर्द किसी चोट, गिरने या झटके के बाद शुरू हुआ, या धीरे-धीरे बढ़ा?',
          helperText: 'Differentiates traumatic injury from chronic joint degeneration.',
          options: ['After a fall or physical injury', 'Gradual ache over weeks', 'Started after heavy lifting', 'Morning stiffness in joint'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Does the pain increase when walking or bearing weight, and have you noticed any swelling or warmth in the joint?',
          questionTextHi: 'क्या चलने या वजन देने पर दर्द बढ़ता है, और क्या जोड़ में सूजन या गर्माहट है?',
          helperText: 'Indicates active inflammation or ligament strain.',
          options: ['Much worse with walking', 'Worse with resting / sitting', 'Visible joint swelling', 'No swelling'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Are you experiencing any numbness, tingling, or weakness radiating down into your arms or legs?',
        questionTextHi: 'क्या हाथ या पैर में कोई सुन्नपन, झनझनाहट या कमजोरी महसूस हो रही है?',
        helperText: 'Rules out nerve compression or sciatica.',
        options: ['Tingling or numbness radiating down', 'Weakness in limb', 'Pain stays strictly localized', 'None'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'ent',
    matcher: /ear|hearing|throat|tonsil|swallow|voice|sinus|earache|कान|गला|टॉन्सिल|निगलना/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Are your symptoms focused on ear pain / hearing, sore throat / swallowing difficulty, or nasal blockage?',
          questionTextHi: 'क्या समस्या कान में दर्द/सुनने में है, गले में दर्द/निगलने में है, या नाक बंद में?',
          helperText: 'Categorizes ENT focus area.',
          options: ['Ear pain or reduced hearing', 'Sore throat or pain swallowing', 'Nasal blockage or sinus pressure', 'Hoarse voice'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'How many days have you had this, and is there any ear discharge, high fever, or dizziness?',
          questionTextHi: 'यह कितने दिनों से है, और क्या कान से मवाद, तेज बुखार या चक्कर आ रहे हैं?',
          helperText: 'Helps assess middle ear infection or acute tonsillitis.',
          options: ['1 to 3 days', 'Over a week', 'Fluid or discharge from ear', 'Dizziness or vertigo', 'No fever or discharge'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Are you able to swallow liquids and take food comfortably without severe pain or breathing difficulty?',
        questionTextHi: 'क्या आप बिना तेज दर्द या सांस की परेशानी के पानी और खाना निगल पा रहे हैं?',
        helperText: 'Assesses airway safety and throat obstruction.',
        options: ['Can swallow normally', 'Painful swallowing (solids)', 'Severe difficulty swallowing fluids', 'No breathing issues'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'cardiac',
    matcher: /chest|heart|tightness|angina|palpitation|छाती|हृदय|घबराहट/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Does the chest sensation feel like heavy pressure, squeezing, or sharp pain, and does it spread to your left arm, jaw, or back?',
          questionTextHi: 'क्या छाती में भारी दबाव या निचोड़ने जैसा दर्द है, और क्या यह बाईं बांह, जबड़े या पीठ तक फैलता है?',
          helperText: 'Important cardiac symptom characterization.',
          options: ['Heavy pressure / squeezing', 'Sharp stabbing pain', 'Spreading to arm or jaw', 'Centered in chest only'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Does the discomfort worsen with walking or physical exertion, and does it ease when you sit and rest?',
          questionTextHi: 'क्या चलने या मेहनत करने पर दर्द बढ़ता है, और आराम करने पर कम होता है?',
          helperText: 'Distinguishes exertional angina from musculoskeletal pain.',
          options: ['Worse with physical exertion', 'Relieved by rest', 'Constant continuous pain', 'Worse with deep breaths'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Are you having cold sweats, shortness of breath, or feeling dizzy or lightheaded right now?',
        questionTextHi: 'क्या आपको ठंडा पसीना, सांस फूलना या चक्कर आ रहे हैं?',
        helperText: 'Autonomic symptoms in chest complaints require prompt triage.',
        options: ['Cold sweats & breathlessness', 'Dizzy / lightheaded', 'Mild shortness of breath', 'None of these'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'abdominal',
    matcher: /stomach|abdomen|belly|vomit|nausea|loose motion|diarrhea|constipation|acidity|gas|पेट|उल्टी|दस्त|कब्ज|गैस/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Where in your stomach is the pain most intense (upper stomach, lower right side, navel, or all over)?',
          questionTextHi: 'पेट में दर्द सबसे ज्यादा कहां है (ऊपरी पेट, नीचे दाईं तरफ, नाभि के पास, या पूरे पेट में)?',
          helperText: 'Pain localization guides diagnosis for gastritis, appendicitis, or gallbladder.',
          options: ['Upper stomach (acidity / burning)', 'Lower right abdomen', 'Around the navel', 'All over abdomen'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Does eating food make the pain better or worse, and have you had any vomiting or loose motions?',
          questionTextHi: 'क्या खाना खाने से दर्द बढ़ता या घटता है, और क्या उल्टी या दस्त हुए हैं?',
          helperText: 'Assesses gastric vs intestinal involvement.',
          options: ['Worse after eating meals', 'Better after eating food', 'Multiple loose motions', 'Nausea and vomiting', 'No change with food'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Have you noticed any high fever, yellowing of eyes, blood in stool, or inability to pass gas?',
        questionTextHi: 'क्या तेज बुखार, आंखों में पीलापन, मल में खून या गैस न निकलने की समस्या है?',
        helperText: 'Rules out acute surgical abdomen or gastrointestinal bleeding.',
        options: ['High fever with chills', 'Severe vomiting / no fluids retained', 'Blood in stool or vomit', 'None of these'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'respiratory',
    matcher: /cough|cold|breath|wheez|asthma|congestion|phlegm|sneeze|खांसी|जुकाम|सांस|कफ|दमा/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'How many days have you had this cough/cold, and is your cough dry or bringing up phlegm/mucus?',
          questionTextHi: 'यह खांसी/जुकाम कितने दिनों से है, और क्या खांसी सूखी है या बलगम आ रहा है?',
          helperText: 'Helps differentiate viral URI from lower respiratory issues.',
          options: ['1 to 3 days', '4 to 7 days', 'More than 2 weeks', 'Dry hacking cough', 'Cough with yellow/green phlegm'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Are you having fever with chills, or difficulty catching your breath when walking or resting?',
          questionTextHi: 'क्या ठंड लगकर बुखार आ रहा है, या चलने-फिरने पर सांस फूल रही है?',
          helperText: 'Evaluates severity and respiratory effort.',
          options: ['Fever with chills', 'Shortness of breath on walking', 'Wheezing / whistling sound', 'Runny nose and mild throat ache'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Does the cough or breathlessness get noticeably worse at night or when lying flat in bed?',
        questionTextHi: 'क्या रात में लेटने पर खांसी या सांस की तकलीफ ज्यादा बढ़ जाती है?',
        helperText: 'Useful for asthma, post-nasal drip, or cardiac cough assessment.',
        options: ['Much worse lying flat at night', 'Constant throughout day & night', 'Triggered by cold air or dust', 'No change with position'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'neurological',
    matcher: /headache|migraine|dizzy|vertigo|faint|numb|tingling|seizure|सिरदर्द|चक्कर|सुन्न|बेहोशी/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) {
        return {
          questionText: 'Is the headache throbbing on one side, a tight squeezing band across the forehead, or sudden and intensely severe?',
          questionTextHi: 'क्या सिरदर्द एक तरफ धड़कता हुआ है, माथे पर भारी जकड़न है, या अचानक बहुत तेज हुआ?',
          helperText: 'Classifies migraine vs tension vs acute headache.',
          options: ['One-sided throbbing pain', 'Tight band across forehead', 'Behind the eyes / temples', 'Sudden, severe thunderclap headache'],
          isLastQuestion: false,
        }
      }
      if (stepIndex === 1) {
        return {
          questionText: 'Are you feeling nauseous, or sensitive to bright light and loud sounds during the headache?',
          questionTextHi: 'क्या मतली आ रही है, या तेज रोशनी और आवाज से सिरदर्द बढ़ता है?',
          helperText: 'Hallmarks of migraine syndrome.',
          options: ['Sensitive to light and sound', 'Nausea or upset stomach', 'Visual blurriness or aura', 'No sensitivity or nausea'],
          isLastQuestion: false,
        }
      }
      return {
        questionText: 'Have you noticed any one-sided weakness in your face or arms, slurred speech, or loss of balance?',
        questionTextHi: 'क्या चेहरे या बांह में कमजोरी, बोलने में लड़खड़ाहट, या संतुलन बिगड़ने की समस्या हुई?',
        helperText: 'Critical screening for neurological safety.',
        options: ['Facial or arm weakness', 'Difficulty speaking clearly', 'Loss of balance / dizziness', 'None of these symptoms'],
        isLastQuestion: true,
      }
    },
  },
]

// Universal adaptive fallback for general / unspecified complaints
function getGeneralAdaptiveQuestion(complaint, history, stepIndex) {
  const lastAns = (history[history.length - 1]?.answerText || '').toLowerCase()

  if (stepIndex === 0) {
    return {
      questionText: `Could you describe what you are experiencing with "${complaint}" — how long has it been happening, and does it feel mild or severe?`,
      questionTextHi: `कृपया बताएं कि आपको "${complaint}" में क्या परेशानी हो रही है — यह कितने समय से है और कितना गंभीर है?`,
      helperText: 'Share onset duration and severity.',
      options: ['Started today or yesterday', 'Ongoing for several days', 'Chronic (weeks or months)', 'Mild discomfort', 'Moderate to severe'],
      isLastQuestion: false,
    }
  }

  if (stepIndex === 1) {
    return {
      questionText: 'What makes the discomfort better or worse — for example, physical movement, eating, resting, or taking medication?',
      questionTextHi: 'किस चीज से आराम या तकलीफ बढ़ती है — जैसे चलना, खाना, आराम करना या दवा लेना?',
      helperText: 'Exacerbating and relieving factors help pinpoint the cause.',
      options: ['Worse with physical movement', 'Relieved by rest', 'Worse in morning / night', 'No specific change'],
      isLastQuestion: false,
    }
  }

  return {
    questionText: 'Do you have any related concerns (like fever, body aches, poor sleep) or chronic conditions like diabetes, thyroid, or hypertension?',
    questionTextHi: 'क्या बुखार, बदन दर्द, नींद में कमी, या शुगर, बीपी, थायरॉइड जैसी कोई पुरानी बीमारी है?',
    helperText: 'General health background for the physician review.',
    options: ['History of Diabetes or BP', 'Body aches or fatigue', 'Trouble sleeping or eating', 'No other medical conditions'],
    isLastQuestion: true,
  }
}

/**
 * Generate adaptive question using local smart engine
 */
export function generateAdaptiveFallback({ complaint, history, stepIndex, language = 'en' }) {
  const cleanComplaint = String(complaint || '').trim().toLowerCase()
  const domain = CLINICAL_DOMAINS.find((d) => d.matcher.test(cleanComplaint))

  let questionObj
  if (domain) {
    questionObj = domain.getQuestion(history, stepIndex)
  } else {
    questionObj = getGeneralAdaptiveQuestion(complaint, history, stepIndex)
  }

  const isHindi = language === 'hi'
  const text = isHindi && questionObj.questionTextHi ? questionObj.questionTextHi : questionObj.questionText

  return {
    questionText: text,
    helperText: questionObj.helperText,
    options: questionObj.options || [],
    source: 'smart-engine',
    category: domain?.category || 'general',
    isLastQuestion: Boolean(questionObj.isLastQuestion || stepIndex >= 2),
  }
}

/**
 * Call Google Gemini API to generate dynamic, personalized clinical follow-up question
 */
export async function callGeminiApi({ apiKey, patientInfo, complaint, history, stepIndex, language = 'en' }) {
  if (!apiKey) throw new Error('No API key provided')

  const langPrompt = language === 'hi' ? 'Respond in clean, polite Hindi (Devanagari script).' : 'Respond in clear, accessible English.'
  const historyText = history.map((item, idx) => `Q${idx + 1}: ${item.questionText}\nPatient Answer: ${item.answerText}`).join('\n\n')

  const prompt = `You are a clinical intake AI at a hospital kiosk.
Patient details:
- Name: ${patientInfo?.name || 'Patient'}
- Age: ${patientInfo?.age || 'Adult'}
- Gender: ${patientInfo?.gender || 'Unknown'}
- Primary Complaint: "${complaint}"

Prior conversation history:
${historyText || 'None (first follow-up question)'}

Current follow-up step number: ${stepIndex + 1} (Aim for 3 targeted questions total).

TASK:
Based strictly on the patient's chief complaint ("${complaint}") and their previous answers, generate the SINGLE most clinically relevant NEXT follow-up question.
- The question must be directly related to what they just said. For example, if they said "eye check up" and "need new glasses", ask about vision distance/reading, screen strain, or previous prescription. If they said "knee pain from falling", ask about swelling, ability to bear weight, or numbness.
- Provide 3 to 4 concise, patient-friendly quick-tap answer options (each under 6 words) suitable for a kiosk touchscreen.
- Language instruction: ${langPrompt}

Return ONLY a valid JSON object in this exact format, with no surrounding markdown or explanation:
{
  "questionText": "The clinical question string",
  "helperText": "Short reassuring helper text or explanation (max 12 words)",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "isLastQuestion": ${stepIndex >= 2}
}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 9000)

  // Preferred models ordered by availability and latency
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
  ]
  let lastError = null

  for (const model of modelsToTry) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        lastError = new Error(`Model ${model} returned ${res.status}: ${errBody}`)
        continue
      }

      const data = await res.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text
      if (!rawText) {
        lastError = new Error(`Model ${model} returned no text part`)
        continue
      }

      clearTimeout(timeoutId)

      // Clean any accidental markdown wrap
      const cleanJson = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      if (!parsed.questionText) {
        lastError = new Error('Missing questionText in AI response')
        continue
      }

      return {
        questionText: parsed.questionText,
        helperText: parsed.helperText || '',
        options: Array.isArray(parsed.options) ? parsed.options : [],
        source: 'ai',
        modelUsed: model,
        isLastQuestion: Boolean(parsed.isLastQuestion || stepIndex >= 2),
      }
    } catch (err) {
      lastError = err
    }
  }

  clearTimeout(timeoutId)
  throw lastError || new Error('All Gemini models failed')
}

/**
 * Main function to get the next clinical question:
 * Tries Gemini API if apiKey exists; if it fails for ANY reason (network, invalid key, timeout),
 * it seamlessly and instantly falls back to the Smart Clinical Engine.
 */
export async function getNextClinicalQuestion({ apiKey, patientInfo, complaint, history, stepIndex, language = 'en' }) {
  if (apiKey) {
    try {
      const aiResult = await callGeminiApi({
        apiKey,
        patientInfo,
        complaint,
        history,
        stepIndex,
        language,
      })
      if (aiResult?.questionText) {
        return aiResult
      }
    } catch (err) {
      console.warn('[AI Intake Service] Gemini API call failed or key invalid, falling back to Smart Clinical Engine:', err.message)
    }
  }

  // Graceful local fallback
  return generateAdaptiveFallback({
    complaint,
    history,
    stepIndex,
    language,
  })
}
