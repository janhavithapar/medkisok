/**
 * AI Intake Service
 * Provides dynamic, context-aware clinical questions based on patient's chief complaint
 * and prior answers. Supports Google Gemini API with seamless built-in smart engine fallback.
 */

// Comprehensive clinical taxonomy covering a wide range of patient complaints.
const MEDICAL_COMPLAINT_PATTERNS = [
  { category: 'cardiac', matcher: /chest pain|chest discomfort|chest tightness|heart|palpitation|heartbeat|flutter|pressure in chest|pain in chest|shortness of breath|breathlessness|difficulty breathing|arm pain|jaw pain|back pain with chest|छाती|हृदय|धड़कन|सांस फूलना|धड़कना/ },
  { category: 'respiratory', matcher: /cough|cold|fever|flu|sneeze|runny nose|congestion|wheeze|asthma|bronchitis|pneumonia|phlegm|breathing issue|shortness of breath|खांसी|जुकाम|बुखार|सांस|कफ|दमा|सांस लेने में परेशानी/ },
  { category: 'neurological', matcher: /headache|migraine|dizzy|dizziness|vertigo|faint|fainting|numb|numbness|tingling|weakness|seizure|speech change|balance issue|sudden severe headache|चक्कर|सिरदर्द|माथा|बेहोशी|सुन्न|कमजोरी|बोलने में|संतुलन|तंत्रिका/ },
  { category: 'abdominal', matcher: /stomach pain|abdominal pain|belly pain|vomit|nausea|diarrhea|constipation|gas|acid|indigestion|loose motion|bloating|gastro|appendicitis|पेट दर्द|उल्टी|मतली|दस्त|कब्ज|गैस|अम्ल|पेट फूलना|पाचन/ },
  { category: 'musculoskeletal', matcher: /knee pain|joint pain|back pain|shoulder pain|ankle pain|sprain|fracture|bone pain|hip pain|neck pain|swollen joint|muscle pain|leg pain|arm pain|घुटना|जोड़|कमर|हाथ|पैर|मांसपेशी|आंत्र / },
  { category: 'dental', matcher: /tooth pain|gum pain|jaw pain|mouth pain|dental|teeth|wisdom tooth|gum swelling|दांत|मसूड़े|जबड़ा|मुंह|मौखिक/ },
  { category: 'dermatology', matcher: /rash|allergy|itch|itching|skin|boil|pimple|spots|hives|urticaria|dry skin|redness|blisters|त्वचा|खुजली|दाने|फोड़ा|रैश|शरीर पर लालपन/ },
  { category: 'ophthalmology', matcher: /eye pain|red eye|blurred vision|vision problem|glasses|specs|contact lens|watering eye|eye irritation|double vision|blind spot|आंख दर्द|आंख लाल|धुंधली दृष्टि|चश्मा|आंख|दृष्टि/ },
  { category: 'ent', matcher: /ear pain|hearing issue|sore throat|voice change|sinus|tonsil|swallow pain|nasal blockage|runny nose|cough with throat pain|कान दर्द|गला दर्द|नाक बंद|साइनस|स्वर|गला|सिर से/ },
  { category: 'endocrine', matcher: /thyroid|diabetes|blood sugar|weight gain|weight loss|fatigue|excess thirst|urination|polyuria|high sugar|sugar issue|शुगर|थायरॉइड|तनाव|प्यास|उपवास|वजन/ },
  { category: 'urology', matcher: /urinary pain|burning urine|frequent urination|blood in urine|UTI|pelvic pain|urine infection|pain while urinating|पेशाब दर्द|पेशाब करते समय जलन|बार-बार पेशाब|मूत्र|यूरीन/ },
  { category: 'gynecology', matcher: /period pain|menstrual pain|pregnancy|abdominal pain in lower abdomen|vaginal discharge|bleeding|pcos|ovarian pain|महिलाओं|माहवारी|गर्भावस्था|प्रेग्नेंसी|योनि|रक्तस्राव/ },
  { category: 'psychiatric', matcher: /anxiety|panic|depression|sadness|insomnia|sleep problem|stress|panic attack|mental health|low mood|घबराहट|चिंता|अवसाद|नींद|मानसिक|तनाव/ },
  { category: 'infectious', matcher: /fever|chills|body ache|sweating|cold|flu|sore throat|infection|high temperature|bacterial|viral|बुखार|ठंड|सर्दी|शरीर दर्द|पसीना|संक्रमण/ },
  { category: 'pediatric', matcher: /child|baby|kid|infant|fever in child|vomiting child|rash in child|pediatric|बच्चा|शिशु|किड|दादा|दादी/ },
  { category: 'geriatric', matcher: /elderly|aged parent|old age|weakness in old age|fall|memory loss|confusion|geriatric|वरिष्ठ|बुजुर्ग|मेमोरी|भूलना|गिरना/ },
  { category: 'general', matcher: /fatigue|tired|weak|low energy|sleepiness|exhaustion|feeling unwell|general weakness|thirst|body ache|overall discomfort|थकान|कमजोरी|अस्वस्थ|सारी ऊर्जा कम|शरीर दर्द/ },
]

const RANDOM_CHAT_PATTERNS = [
  /hello|hi there|hey|good morning|good evening|what is the weather|weather forecast|how are you|who are you|what's up|joke|funny|random|hello world|bye|thank you|thanks|play music|what time|what's the time|tell me a joke|i am bored|i am fine|not feeling well/,
  /weather|temperature outside|rain today|sunny|cloudy|storm|traffic|news|football|movie|song|game|math|programming|computer|why is the sky|who won/,
]

const MEDICAL_REDIRECT_TEXT = {
  en: 'I can only assist with medical symptoms and hospital intake. Please tell me what health issue or pain you are experiencing today.',
  hi: 'मैं केवल मेडिकल लक्षणों और अस्पताल की intake में मदद कर सकता हूँ। कृपया बताएं कि आज आपको कौन सी स्वास्थ्य समस्या या दर्द है।',
  mr: 'मी फक्त वैद्यकीय लक्षणे आणि हॉस्पिटल इनटेकमध्ये मदत करू शकतो. कृपया सांगा आज तुम्हाला कोणती आरोग्य समस्या किंवा वेदना आहे.',
  ta: 'மருத்துவ அறிகுறிகள் மற்றும் மருத்துவமனை intakeக்கு மட்டுமே நான் உதவ முடியும். இன்று உங்களுக்கு என்ன உடல்நலப் பிரச்சனை அல்லது வலி இருக்கிறது என்று சொல்லுங்கள்.',
  te: 'నేను వైద్య లక్షణాలు మరియు ఆసుపత్రి intakeకు మాత్రమే సహాయపడగలను. మీరు今日 ఏ ఆరోగ్య సమస్య లేదా నొప్పిని అనుభవిస్తున్నారు? చెప్పండి.',
  bn: 'আমি কেবল মেডিকেল উপসর্গ ও হাসপাতাল ইন্টেক-এ সাহায্য করতে পারি। দয়া করে বলুন আজ আপনার কোন স্বাস্থ্য সমস্যা বা ব্যথা হচ্ছে।',
  gu: 'હું ફક્ત તબીબી લક્ષણો અને હૉસ્પિટલ ઈન્ટેકમાં મદદ કરી શકું છું. કૃપા કરીને કહો કે આજે તમને કઈ આરોગ્ય સમસ્યા અથવા દુખાવો છે.',
  kn: 'ನಾನು ಮಾತ್ರ ವೈದ್ಯಕೀಯ ಲಕ್ಷಣಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆ intakeಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ದಯವಿಟ್ಟು ತಿಳಿಸಿ ನೀವು ಇಂದು ಯಾವ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಅಥವಾ ನೋವು ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ.',
}

export function detectPrimaryComplaint(text = '') {
  const clean = String(text || '').trim().toLowerCase()
  if (!clean) return null

  const normalized = clean.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const matched = MEDICAL_COMPLAINT_PATTERNS.find(({ matcher }) => matcher.test(clean))
  if (!matched) return { category: 'general', complaint: normalized.slice(0, 80) || 'general health concern' }

  const conditions = [
    { pattern: /headache|migraine|sudden severe headache|सिरदर्द|माथा/, category: 'neurological', complaint: 'headache' },
    { pattern: /chest pain|chest discomfort|chest tightness|pressure in chest|heart|palpitation|shortness of breath|breathlessness|छाती|हृदय|सांस फूलना|धड़कन/, category: 'cardiac', complaint: 'chest pain' },
    { pattern: /cough|cold|fever|flu|sneeze|runny nose|congestion|wheeze|phlegm|खांसी|जुकाम|बुखार|कफ|सांस/, category: 'respiratory', complaint: 'cough or respiratory symptoms' },
    { pattern: /stomach pain|abdominal pain|belly pain|vomit|nausea|diarrhea|constipation|gas|acid|indigestion|loose motion|pyloric|पेट दर्द|उल्टी|मतली|दस्त|कब्ज|गैस|अम्ल/, category: 'abdominal', complaint: 'abdominal pain' },
    { pattern: /knee pain|joint pain|back pain|shoulder pain|ankle pain|sprain|fracture|hip pain|neck pain|muscle pain|leg pain|arm pain|घुटना|कमर|जोड़|हड्डी|मांसपेशी/, category: 'musculoskeletal', complaint: 'musculoskeletal pain' },
    { pattern: /tooth pain|gum pain|jaw pain|mouth pain|dental|teeth|wisdom|दांत|मसूड़े|जबड़ा|मुंह/, category: 'dental', complaint: 'dental pain' },
    { pattern: /rash|allergy|itch|itching|skin|boil|pimple|spots|hives|urticaria|dry skin|blisters|त्वचा|खुजली|दाने|फोड़ा|रैश/, category: 'dermatology', complaint: 'skin complaint' },
    { pattern: /eye pain|red eye|blurred vision|vision problem|glasses|specs|contact lens|watering eye|eye irritation|double vision|आंख दर्द|धुंधली दृष्टि|चश्मा|आंख/, category: 'ophthalmology', complaint: 'eye complaint' },
    { pattern: /ear pain|hearing issue|sore throat|voice change|sinus|tonsil|swallow pain|nasal blockage|runny nose|कान दर्द|गला दर्द|नाक बंद|साइनस|गला/, category: 'ent', complaint: 'ENT complaint' },
    { pattern: /fatigue|tired|weak|low energy|sleepiness|exhaustion|feeling unwell|general weakness|thirst|overall discomfort|थकान|कमजोरी|अस्वस्थ|शरीर दर्द/, category: 'general', complaint: 'general fatigue or weakness' },
    { pattern: /dizziness|vertigo|faint|fainting|numbness|tingling|weakness|balance issue|जंग|चक्कर|बेहोशी|सुन्न|संतुलन/, category: 'neurological', complaint: 'dizziness or neurological symptoms' },
    { pattern: /pregnancy|menstrual pain|period pain|vaginal discharge|bleeding|pcos|ovarian|गर्भावस्था|माहवारी|योनि|रक्तस्राव/, category: 'gynecology', complaint: 'women health concern' },
    { pattern: /urinary|burning urine|frequent urination|blood in urine|uti|pain while urinating|पेशाब|मूत्र/, category: 'urology', complaint: 'urinary complaint' },
    { pattern: /anxiety|stress|panic|depression|sadness|insomnia|sleep problem|mental health|घबराहट|चिंता|अवसाद|नींद/, category: 'psychiatric', complaint: 'mental health concern' },
  ]

  const match = conditions.find(({ pattern }) => pattern.test(clean))
  if (match) return { category: match.category, complaint: match.complaint }

  return { category: matched.category, complaint: normalized.slice(0, 80) }
}

export function validateMedicalIntent(text = '', language = 'en') {
  const clean = String(text || '').trim()
  if (!clean) return { valid: false, reason: 'empty', complaint: null }

  const lower = clean.toLowerCase()
  if (RANDOM_CHAT_PATTERNS.some((pattern) => pattern.test(lower))) {
    return { valid: false, reason: 'random', complaint: null, redirect: MEDICAL_REDIRECT_TEXT[language] || MEDICAL_REDIRECT_TEXT.en }
  }

  const matched = detectPrimaryComplaint(lower)
  if (!matched) {
    return { valid: false, reason: 'not-medical', complaint: null, redirect: MEDICAL_REDIRECT_TEXT[language] || MEDICAL_REDIRECT_TEXT.en }
  }

  return { valid: true, reason: 'medical-intent', complaint: matched.complaint, category: matched.category }
}

const CLINICAL_DOMAINS = [
  {
    category: 'cardiac',
    matcher: /chest|heart|tightness|palpitation|angina|pressure|breathlessness|shortness of breath|sweat|jaw|arm pain|छाती|हृदय|धड़कन|सांस फूलना/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Does the chest discomfort feel like pressure, squeezing, or sharp pain, and does it spread to the arm, jaw, or back?',
        questionTextHi: 'क्या छाती में दबाव, निचोड़ने जैसा दर्द, या तेज दर्द है, और यह हाथ, जबड़े या पीठ तक फैलता है?',
        helperText: 'Chest pain quality and radiation are key cardiac clues.',
        options: ['Pressure / squeezing', 'Sharp stabbing pain', 'Spreads to arm or jaw', 'Localized chest pain'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Is it worse with walking or exertion, or does it happen at rest? Are you short of breath or dizzy?',
        questionTextHi: 'क्या यह चलने या मेहनत करने पर ज्यादा है, या आराम में भी है? सांस फूल रही है या चक्कर आ रहे हैं?',
        helperText: 'Exertional symptoms and dizziness matter for urgent assessment.',
        options: ['Worse with activity', 'At rest / persistent', 'Shortness of breath', 'Dizzy / lightheaded'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Any sweating, nausea, or history of high blood pressure or diabetes?',
        questionTextHi: 'क्या ठंडा पसीना, मतली, या शुगर/बीपी का इतिहास है?',
        helperText: 'Associated symptoms guide urgent triage.',
        options: ['Sweating', 'Nausea', 'High blood pressure', 'Diabetes'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'respiratory',
    matcher: /cough|cold|breath|wheeze|asthma|congestion|phlegm|sneeze|nose|throat|fever|खांसी|जुकाम|सांस|कफ|दमा|नाक/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'How long have the respiratory symptoms been going on, and is the cough dry or productive with mucus?',
        questionTextHi: 'सांस/खांसी की परेशानी कितने दिनों से है, और खांसी सूखी है या बलगम के साथ है?',
        helperText: 'Duration and sputum help determine urgency and cause.',
        options: ['1 to 3 days', '4 to 7 days', 'More than 2 weeks', 'Dry cough', 'Mucus / phlegm'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Do you also have fever, wheezing, chest tightness, or shortness of breath?',
        questionTextHi: 'क्या साथ में बुखार, सीने में tightness, खांसी के साथ सांस फूलना या सीटी जैसी आवाज है?',
        helperText: 'Systemic and airway symptoms matter for respiratory triage.',
        options: ['Fever', 'Wheezing', 'Shortness of breath', 'No other symptoms'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Is it worse at night, with exercise, or after exposure to dust, smoke, or cold air?',
        questionTextHi: 'क्या यह रात में, व्यायाम के बाद, या धूल/धुएं/ठंडी हवा से ज्यादा खराब होता है?',
        helperText: 'Trigger pattern helps separate asthma and infection.',
        options: ['Nighttime', 'Exercise', 'Dust/smoke', 'No trigger'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'neurological',
    matcher: /headache|migraine|dizzy|vertigo|faint|numb|tingling|weakness|speech|balance|chest pain|सिरदर्द|चक्कर|बेहोशी|सुन्न|कमजोरी|संतुलन|बोलने/,
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Is the headache or dizziness one-sided, throbbing, or sudden and severe?',
        questionTextHi: 'क्या सिरदर्द या चक्कर एक तरफ है, धड़कता है, या अचानक बहुत तेज है?',
        helperText: 'Pattern helps separate migraine, tension, or dangerous acute headache.',
        options: ['One-sided throbbing', 'Pressure around forehead', 'Sudden severe', 'Lightheadedness only'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Any nausea, sensitivity to light/sound, weakness, face drooping, or speech change?',
        questionTextHi: 'क्या मतली, रोशनी/आवाज से परेशानी, कमजोरी, चेहरे की विकृति, या बोलने में समस्या है?',
        helperText: 'Neurological red flags need urgent attention.',
        options: ['Nausea', 'Light sensitivity', 'Weakness', 'Speech change'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Have you had any loss of balance, fainting, or numbness in the face or limbs?',
        questionTextHi: 'क्या संतुलन खराब, बेहोशी, या चेहरे/हाथ-पैर में सुन्नपन हुआ?',
        helperText: 'Neurological safety screening is essential.',
        options: ['Lost balance', 'Fainted', 'Numbness', 'None'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'abdominal',
    matcher: /stomach|abdomen|belly|nausea|vomit|diarrhea|constipation|gas|acid|indigestion|bloating|pain after eating|पेट|उल्टी|दस्त|कब्ज|गैस|अम्ल/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Where exactly is the abdominal pain, and is it constant or cramping?',
        questionTextHi: 'पेट दर्द बिल्कुल कहां है, और यह लगातार है या ऐंठा हुआ है?',
        helperText: 'Pain location and character guide GI assessment.',
        options: ['Upper abdomen', 'Lower right side', 'Around navel', 'All over'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Have you had vomiting, loose stools, fever, or pain after eating?',
        questionTextHi: 'क्या उल्टी, दस्त, बुखार, या खाने के बाद दर्द हुआ?',
        helperText: 'GI infection and gastric irritation can show these patterns.',
        options: ['Vomiting', 'Loose stools', 'Fever', 'Worse after meals'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Any blood in vomit or stool, black stools, or trouble passing gas?',
        questionTextHi: 'क्या उल्टी या मल में खून है, काला मल है, या गैस नहीं निकल रही?',
        helperText: 'Red flags of gastrointestinal bleeding or obstruction.',
        options: ['Blood in stool', 'Blood in vomit', 'No gas', 'None'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'musculoskeletal',
    matcher: /knee|joint|back|shoulder|neck|leg|arm|ankle|hip|muscle|bone|sprain|fracture|pain with movement|घुटना|जोड़|कमर|हाथ|पैर|मांसपेशी|हड्डी/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Did the pain begin after a fall, injury, or sudden movement, or did it come on gradually?',
        questionTextHi: 'क्या दर्द गिरने, चोट, या sudden movement के बाद शुरू हुआ, या धीरे-धीरे बढ़ा?',
        helperText: 'Recent injury vs chronic wear-and-tear matters.',
        options: ['After injury', 'Gradual', 'Heavy lifting', 'Morning stiffness'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Is the pain worse with moving the limb, walking, or bearing weight?',
        questionTextHi: 'क्या दर्द हाथ/पैर चलाने, चलने, या वजन उठाने पर बढ़ता है?',
        helperText: 'Movement pattern helps localize musculoskeletal pain.',
        options: ['Walking', 'Lifting', 'Resting', 'No change'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Any swelling, redness, warmth, locking, or numbness around the joint?',
        questionTextHi: 'क्या जोड़ में सूजन, लालपन, गर्माहट, locking, या सुन्नपन है?',
        helperText: 'Swelling and neuro symptoms suggest inflammation or strain.',
        options: ['Swelling', 'Redness', 'Numbness', 'None'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'dermatology',
    matcher: /rash|itch|itching|hives|skin|boil|pimple|blister|urticaria|redness|allergy|त्वचा|खुजली|दाने|फोड़ा|रैश/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Where is the rash or skin issue, and is it itchy, painful, or burning?',
        questionTextHi: 'रैश या त्वचा की समस्या कहाँ है, और क्या यह खुजली, दर्द, या जलन जैसा है?',
        helperText: 'Location and sensation guide skin diagnosis.',
        options: ['Face', 'Arms', 'Torso', 'Legs', 'Itchy', 'Painful'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Did it start after a new soap, food, medicine, or insect bite?',
        questionTextHi: 'क्या यह नए साबुन, भोजन, दवा, या कीट काटने के बाद शुरू हुआ?',
        helperText: 'Exposure history differentiates allergy from infection.',
        options: ['New medicine', 'Food', 'Soap / cream', 'Insect bite'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Is the skin dry and flaky, or is there blistering, oozing, or spreading?',
        questionTextHi: 'क्या त्वचा सूखी और फटी हुई है, या छाले, पानी, या फैलाव है?',
        helperText: 'Blistering and spreading matter for urgent skin care review.',
        options: ['Dry / flaky', 'Blisters', 'Oozing', 'Spreading'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'ophthalmology',
    matcher: /eye|vision|blur|glasses|red eye|watering|contact lens|sight|आंख|दृष्टि|चश्मा|धुंधला/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Is it a routine vision check or are you having pain, redness, blurry vision, or floaters?',
        questionTextHi: 'क्या यह सामान्य दृष्टि जाँच है या आंख में दर्द, लाली, धुंधलापन या floaters हैं?',
        helperText: 'It distinguishes refractive needs from acute eye symptoms.',
        options: ['Routine exam', 'Blurred vision', 'Eye pain', 'Redness'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Which eye is affected, and did it start suddenly or gradually over days?',
        questionTextHi: 'कौन सी आंख प्रभावित है, और यह अचानक शुरू हुआ या दिनों में धीरे-धीरे?',
        helperText: 'Laterality and onset matter for eye emergencies.',
        options: ['Right eye', 'Left eye', 'Both eyes', 'Sudden'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Any headache, light sensitivity, discharge, or history of diabetes or high blood pressure?',
        questionTextHi: 'क्या सिरदर्द, रोशनी से परेशानी, पानी, या शुगर/बीपी का इतिहास है?',
        helperText: 'Systemic symptoms can influence eye evaluation.',
        options: ['Headache', 'Light sensitivity', 'Diabetes', 'No other symptoms'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'dental',
    matcher: /tooth|teeth|gum|dental|jaw|mouth|wisdom|दांत|मसूड़े|जबड़ा|मुंह/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'Where is the dental pain, and is it worse with hot-cold food or chewing?',
        questionTextHi: 'दांत का दर्द कहाँ है, और गर्म-कठोर भोजन या चबाने पर ज्यादा है?',
        helperText: 'Pain pattern helps identify tooth or gum origin.',
        options: ['Upper tooth', 'Lower tooth', 'Gum pain', 'Chewing pain'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Any swelling, gum bleeding, fever, or visible pus?',
        questionTextHi: 'क्या सूजन, मसूड़ों से खून, बुखार, या pus दिखाई दे रहा है?',
        helperText: 'Swelling and fever suggest infection or abscess.',
        options: ['Swelling', 'Bleeding', 'Fever', 'No symptoms'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Is it difficult to open your mouth or bite properly?',
        questionTextHi: 'क्या मुंह खोलने या काटने में परेशानी है?',
        helperText: 'Jaw movement issues amplify dental urgency.',
        options: ['Hard to open', 'Hard to bite', 'No issue'],
        isLastQuestion: true,
      }
    },
  },
  {
    category: 'general',
    matcher: /fatigue|weak|tired|feeling unwell|body ache|weight loss|weight gain|sleepy|general discomfort|थकान|कमजोरी|अस्वस्थ|शरीर दर्द/, 
    getQuestion: (history, stepIndex) => {
      if (stepIndex === 0) return {
        questionText: 'When did this usually begin, and how severe is it on a 0 to 10 scale?',
        questionTextHi: 'यह सामान्यतः कब से शुरू हुआ, और 0 से 10 में कितना गंभीर है?',
        helperText: 'Duration and severity help decide urgency.',
        options: ['Today', 'Few days', 'Weeks', 'Mild', 'Moderate', 'Severe'],
        isLastQuestion: false,
      }
      if (stepIndex === 1) return {
        questionText: 'Any associated fever, weight change, poor appetite, or dizziness?',
        questionTextHi: 'क्या साथ में बुखार, वजन परिवर्तन, भूख कम, या चक्कर है?',
        helperText: 'These clues guide full-body review.',
        options: ['Fever', 'Weight loss', 'Poor appetite', 'Dizziness'],
        isLastQuestion: false,
      }
      return {
        questionText: 'Do you have any chronic conditions or medicines like diabetes, blood pressure, thyroid, or antidepressants?',
        questionTextHi: 'क्या शुगर, बीपी, थायरॉइड, या एंटी-डिप्रेसेंट जैसी पुरानी बीमारी या दवाएं हैं?',
        helperText: 'Medical history changes how the physician evaluates the problem.',
        options: ['Diabetes', 'Blood pressure', 'Thyroid', 'No conditions'],
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
      questionText: `Could you describe the problem with "${complaint}" — when it started, how long it has lasted, and whether it feels mild, moderate, or severe?`,
      questionTextHi: `कृपया बताएं कि "${complaint}" में क्या परेशानी है — यह कब शुरू हुआ, कितने समय से है और कितनी तीव्रता है?`,
      helperText: 'Share onset, duration, and severity.',
      options: ['Started today', 'Few days', 'Weeks', 'Mild', 'Moderate', 'Severe'],
      isLastQuestion: false,
    }
  }

  if (stepIndex === 1) {
    return {
      questionText: 'What makes it worse or better — movement, eating, rest, sleep, or medicines?',
      questionTextHi: 'क्या यह चलने, खाने, आराम, नींद, या दवा से ज्यादा खराब/अच्छा होता है?',
      helperText: 'Pattern helps narrow down the likely cause.',
      options: ['Movement makes worse', 'Rest helps', 'Food triggers it', 'Medicine helps'],
      isLastQuestion: false,
    }
  }

  if (stepIndex === 2) {
    return {
      questionText: 'Are you having any associated fever, dizziness, nausea, shortness of breath, or weight change?',
      questionTextHi: 'क्या साथ में बुखार, चक्कर, मतली, सांस फूलना, या वजन में बदलाव है?',
      helperText: 'Associated symptoms determine urgency and next steps.',
      options: ['Fever', 'Dizziness', 'Nausea', 'Shortness of breath'],
      isLastQuestion: false,
    }
  }

  return {
    questionText: 'Do you have any chronic conditions or medications such as diabetes, high blood pressure, thyroid issues, or recent antibiotics?',
    questionTextHi: 'क्या शुगर, बीपी, थायरॉइड, या हाल की दवाओं/एंटीबायोटिक का इतिहास है?',
    helperText: 'Background history supports safe medical triage.',
    options: ['Diabetes', 'Blood pressure', 'Thyroid', 'No chronic issues'],
    isLastQuestion: true,
  }
}

/**
 * Generate adaptive question using local smart engine
 */
export function generateAdaptiveFallback({ complaint, history, stepIndex, language = 'en' }) {
  const cleanComplaint = String(complaint || '').trim().toLowerCase()
  const domain = CLINICAL_DOMAINS.find((d) => d.matcher.test(cleanComplaint)) || CLINICAL_DOMAINS.find((d) => d.category === 'general')

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
    isLastQuestion: Boolean(questionObj.isLastQuestion || stepIndex >= 3),
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
