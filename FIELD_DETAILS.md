# Healthcare GenAI Platform - Field Details Documentation

## 📋 Complete Field Breakdown by Module

This document provides comprehensive details about all fields used across the Healthcare GenAI Platform, organized by module and functionality.

---

## 🩺 Module 1: AI Medical Assistant

### 1.1 Medical Chat Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `session_id` | string | Yes | Unique identifier for conversation continuity | "session-abc123" |
| `message` | string | Yes | User's medical question or concern | "What causes high blood pressure?" |

#### Response Fields
| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `response` | string | AI-generated medical guidance | "High blood pressure can be caused by..." |
| `session_id` | string | Session identifier for follow-up | "session-abc123" |

#### Database Storage (medical_chats)
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Unique chat message identifier |
| `session_id` | string | Conversation session ID |
| `message` | string | User's original message |
| `response` | string | AI assistant's response |
| `timestamp` | datetime | When message was sent (ISO format) |

---

### 1.2 Symptom Checker Fields

#### Request Fields
| Field Name | Type | Required | Description | Example | Validation |
|------------|------|----------|-------------|---------|------------|
| `symptoms` | array[string] | Yes | List of symptoms | ["headache", "fever", "fatigue"] | Min 1 symptom |
| `severity` | string | Yes | Symptom severity level | "moderate" | Options: "mild", "moderate", "severe" |
| `duration` | string | Yes | How long symptoms present | "3 days" | Free text |
| `additional_info` | string | No | Extra context | "Started after traveling" | Optional |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `analysis` | string | Comprehensive AI analysis including:<br>- Possible conditions<br>- Likelihood ranking<br>- Recommended actions<br>- Urgency level |

#### Field Details

**symptoms** (array)
- **Purpose**: Capture all patient-reported symptoms
- **Input Method**: Add symptoms one at a time
- **Examples**: 
  - Physical: "headache", "fever", "cough", "chest pain"
  - Digestive: "nausea", "diarrhea", "stomach pain"
  - Respiratory: "shortness of breath", "wheezing"
  - Neurological: "dizziness", "confusion", "numbness"
- **Recommendations**: Be specific (e.g., "sharp chest pain" vs "chest pain")

**severity** (dropdown)
- **Purpose**: Assess symptom intensity
- **Options**:
  - **Mild**: Minor discomfort, doesn't interfere with daily activities
  - **Moderate**: Noticeable discomfort, some impact on activities
  - **Severe**: Significant pain/discomfort, major impact on life
- **Usage**: Helps AI prioritize urgency

**duration** (text)
- **Purpose**: Understand symptom timeline
- **Format**: Free text for flexibility
- **Examples**: 
  - "2 hours", "3 days", "1 week"
  - "Started this morning"
  - "Ongoing for 2 months"
- **Clinical Relevance**: Acute vs chronic determination

**additional_info** (textarea)
- **Purpose**: Capture context AI needs
- **Helpful Information**:
  - Recent travel
  - Exposure to illness
  - New medications
  - Dietary changes
  - Stress events
  - Environmental factors

---

### 1.3 Drug Interaction Checker Fields

#### Request Fields
| Field Name | Type | Required | Description | Example | Validation |
|------------|------|----------|-------------|---------|------------|
| `medications` | array[string] | Yes | List of medications | ["Aspirin", "Warfarin", "Lisinopril"] | Min 2 medications |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `analysis` | string | Interaction analysis including:<br>- Drug interactions found<br>- Severity of interactions<br>- Side effects<br>- Recommendations |

#### Field Details

**medications** (array)
- **Purpose**: Check for dangerous drug combinations
- **Input Format**: 
  - Brand names: "Tylenol", "Advil"
  - Generic names: "acetaminophen", "ibuprofen"
  - Include dosage if known: "Aspirin 81mg"
- **Examples**:
  - ["Warfarin", "Aspirin"] - Blood thinner interaction
  - ["Lisinopril", "Potassium supplements"] - Electrolyte concern
  - ["Metformin", "Alcohol"] - Side effect warning
- **Best Practices**: Include all medications, supplements, and vitamins

---

## 🧠 Module 2: Mental Health Support

### 2.1 Mental Health Chat Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `session_id` | string | Yes | Counseling session identifier | "mental-session-xyz" |
| `message` | string | Yes | User's thoughts/feelings | "I've been feeling anxious lately" |
| `mood_context` | string | No | Current mood state | "anxious" |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `response` | string | Empathetic AI counselor response |
| `session_id` | string | Session identifier |

---

### 2.2 Mood Tracker Fields

#### Request Fields (Mood Entry)
| Field Name | Type | Required | Description | Example | Validation |
|------------|------|----------|-------------|---------|------------|
| `user_id` | string | Yes | User identifier | "user-123" | Unique user ID |
| `mood` | string | Yes | Mood category | "happy" | Options: "happy", "sad", "anxious", "stressed", "neutral" |
| `intensity` | integer | Yes | Mood intensity | 7 | Range: 1-10 |
| `notes` | string | No | Mood notes/journal | "Had a great day at work" | Free text |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Mood entry identifier |
| `user_id` | string | User who logged mood |
| `mood` | string | Mood category |
| `intensity` | integer | Intensity rating |
| `notes` | string | User's notes |
| `timestamp` | datetime | When logged |

#### Field Details

**mood** (selection)
- **Purpose**: Quick emotional state categorization
- **Options with Visual Indicators**:
  - 😊 **happy**: Positive emotional state
  - 😢 **sad**: Low mood, sadness
  - 😰 **anxious**: Worry, nervousness
  - 😤 **stressed**: Overwhelmed, pressured
  - 😐 **neutral**: Balanced, calm
- **Clinical Use**: Track mood patterns over time

**intensity** (slider: 1-10)
- **Purpose**: Quantify emotional experience
- **Scale**:
  - **1-3**: Mild - Barely noticeable
  - **4-6**: Moderate - Affecting thoughts/behavior
  - **7-9**: Strong - Significantly impacting function
  - **10**: Extreme - Crisis level
- **Tracking Value**: Identify trends and triggers

**notes** (textarea)
- **Purpose**: Provide context for mood
- **Helpful Entries**:
  - What happened today
  - Triggers identified
  - Coping strategies used
  - Physical symptoms
  - Sleep quality
  - Social interactions
- **Therapeutic Value**: Self-reflection, pattern recognition

---

### 2.3 Stress Assessment Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `user_id` | string | Yes | User taking assessment | "user-123" |
| `questions_answers` | object | Yes | Q&A pairs | See below | All questions required |

#### Standard Assessment Questions
| Question | Purpose | Expected Answer Type |
|----------|---------|---------------------|
| "How often have you felt nervous or anxious in the past week?" | Anxiety frequency | "Daily", "3-4 times", "Occasionally" |
| "How well are you sleeping?" | Sleep quality | "Very well", "Poorly", "Can't sleep" |
| "Do you feel overwhelmed by daily tasks?" | Stress level | "Yes, constantly", "Sometimes", "No" |
| "How often do you feel sad or down?" | Depression screening | "Most days", "Few days", "Rarely" |
| "Are you able to concentrate on tasks?" | Cognitive function | "Yes", "Struggling", "No" |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `assessment` | string | Comprehensive analysis including:<br>- Stress level evaluation<br>- Risk factors identified<br>- Coping strategies<br>- Professional help recommendation |
| `user_id` | string | User identifier |

---

## 🔬 Module 3: Medical Diagnosis Support

### 3.1 Diagnosis Analysis Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `patient_info` | object | Yes | Patient demographics | See below |
| `symptoms` | array[string] | Yes | Symptom list | ["fever", "cough", "fatigue"] |
| `medical_history` | string | No | Past conditions | "Hypertension, Type 2 Diabetes" |

#### patient_info Object Structure
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `age` | string | Yes | Patient age | "45" |
| `gender` | string | Yes | Patient gender | "male", "female", "other" |
| `weight` | string | No | Weight in kg | "75" |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `diagnosis` | string | Diagnostic analysis including:<br>- Differential diagnoses<br>- Likelihood rankings<br>- Recommended tests<br>- Next steps |

#### Database Storage (diagnoses)
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Diagnosis record ID |
| `patient_info` | object | Patient demographics |
| `symptoms` | array | Symptoms analyzed |
| `analysis` | string | AI diagnosis result |
| `timestamp` | datetime | Analysis date |

---

### 3.2 Risk Prediction Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `patient_data` | object | Yes | Health metrics | See below |
| `risk_factors` | array[string] | Yes | Known risk factors | ["smoking", "family history"] |

#### patient_data Object Fields
| Field | Purpose | Example | Clinical Significance |
|-------|---------|---------|----------------------|
| `Age` | Age-related risk | "55" | Increases with age |
| `Blood Pressure` | Cardiovascular risk | "140/90" | Hypertension marker |
| `Cholesterol` | Heart disease risk | "220 mg/dL" | Lipid profile |
| `BMI` | Obesity-related risk | "28.5" | Weight status |
| `Smoking Status` | Lifestyle risk | "Former smoker" | Lung/heart risk |

#### risk_factors (array)
- **Purpose**: Additional risk considerations
- **Examples**:
  - **Genetic**: "Family history of heart disease"
  - **Lifestyle**: "Sedentary lifestyle", "High alcohol consumption"
  - **Medical**: "Prediabetes", "Sleep apnea"
  - **Environmental**: "High stress job", "Poor diet"

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `risk_assessment` | string | Comprehensive risk analysis:<br>- Disease risk percentages<br>- Contributing factors<br>- Preventive measures<br>- Lifestyle recommendations |

---

### 3.3 Treatment Recommendation Fields

#### Request Fields
| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `diagnosis` | string | Yes | Medical diagnosis | "Type 2 Diabetes" |
| `patient_info` | object | Yes | Patient details | See below |
| `severity` | string | Yes | Condition severity | "moderate" |

#### patient_info for Treatment
| Field | Purpose | Example |
|-------|---------|---------|
| `age` | Age-appropriate treatment | "45" |
| `gender` | Gender-specific considerations | "female" |
| `allergies` | Drug contraindications | "Penicillin allergy" |

#### severity Options
| Level | Definition | Treatment Approach |
|-------|------------|-------------------|
| **mild** | Early stage, manageable | Lifestyle changes first |
| **moderate** | Established condition | Medication + lifestyle |
| **severe** | Advanced, complications | Aggressive treatment |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `treatment_plan` | string | Comprehensive treatment recommendations:<br>- First-line medications<br>- Dosage guidelines<br>- Lifestyle modifications<br>- Follow-up schedule<br>- Monitoring requirements |

---

## ❤️ Module 4: Patient Care & Monitoring

### 4.1 Medication Tracker Fields

#### Request Fields (Add Medication)
| Field Name | Type | Required | Description | Example | Format |
|------------|------|----------|-------------|---------|--------|
| `user_id` | string | Yes | Patient identifier | "user-123" | UUID |
| `medication_name` | string | Yes | Drug name | "Metformin" | Brand or generic |
| `dosage` | string | Yes | Dose amount | "500mg" | Include unit |
| `frequency` | string | Yes | How often taken | "Twice daily" | Free text |
| `start_date` | string | Yes | When started | "2026-01-01" | YYYY-MM-DD |
| `end_date` | string | No | When to stop | "2026-02-01" | YYYY-MM-DD |
| `reminders` | array[string] | No | Reminder times | ["08:00", "20:00"] | HH:MM format |
| `notes` | string | No | Additional info | "Take with food" | Free text |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Medication record ID |
| All request fields | - | Echoed back |

#### Field Details

**medication_name**
- **Purpose**: Identify the medication
- **Best Practices**:
  - Use exact name from prescription
  - Include brand or generic
  - Can include strength in name
- **Examples**: 
  - "Metformin 500mg"
  - "Lisinopril"
  - "Atorvastatin (Lipitor)"

**dosage**
- **Purpose**: Precise dose tracking
- **Format**: Amount + Unit
- **Examples**:
  - "500mg", "10mg", "25mcg"
  - "1 tablet", "2 pills"
  - "5ml", "1 puff"
- **Clinical Importance**: Prevents over/under-dosing

**frequency**
- **Purpose**: Schedule adherence
- **Common Patterns**:
  - **Daily**: "Once daily", "Every morning"
  - **Multiple**: "Twice daily (BID)", "Three times daily (TID)"
  - **As needed**: "As needed for pain (PRN)"
  - **Specific**: "Every 6 hours", "Before meals"
- **Flexibility**: Accepts natural language

**reminders**
- **Purpose**: Improve medication adherence
- **Format**: Array of time strings ["HH:MM"]
- **Examples**:
  - Morning dose: ["08:00"]
  - Twice daily: ["08:00", "20:00"]
  - Three times: ["08:00", "14:00", "20:00"]
- **Future Enhancement**: Push notifications

**notes**
- **Purpose**: Important medication instructions
- **Common Entries**:
  - "Take with food"
  - "Do not take with dairy"
  - "May cause drowsiness"
  - "Take 30 minutes before meals"
  - "Do not crush or chew"

---

### 4.2 Health Metrics (Vitals) Fields

#### Request Fields (Log Vital)
| Field Name | Type | Required | Description | Example | Validation |
|------------|------|----------|-------------|---------|------------|
| `user_id` | string | Yes | Patient ID | "user-123" | UUID |
| `metric_type` | string | Yes | Type of measurement | "blood_pressure" | See options below |
| `value` | string | Yes | Measured value | "120/80" | Format varies by type |
| `unit` | string | Yes | Unit of measurement | "mmHg" | Appropriate for type |

#### metric_type Options
| Type | Description | Value Format | Unit | Normal Range |
|------|-------------|--------------|------|--------------|
| `blood_pressure` | Blood pressure | "120/80" | mmHg | 90/60 - 120/80 |
| `heart_rate` | Pulse rate | "72" | bpm | 60-100 |
| `glucose` | Blood sugar | "95" | mg/dL | 70-100 (fasting) |
| `weight` | Body weight | "75.5" | kg | Varies by height |
| `temperature` | Body temp | "37.0" | °C | 36.1-37.2 |
| `oxygen_saturation` | SpO2 level | "98" | % | 95-100 |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | UUID | Metric record ID |
| All request fields | - | Echoed back |
| `timestamp` | datetime | When recorded |

#### Field Details by Metric Type

**blood_pressure**
- **Format**: "Systolic/Diastolic"
- **Example**: "120/80"
- **Units**: mmHg (millimeters of mercury)
- **Interpretation**:
  - Normal: <120/<80
  - Elevated: 120-129/<80
  - High (Stage 1): 130-139/80-89
  - High (Stage 2): ≥140/≥90
- **Best Practices**: 
  - Measure at same time daily
  - Rest 5 minutes before
  - Avoid caffeine 30min prior

**heart_rate**
- **Format**: Whole number
- **Example**: "72"
- **Units**: bpm (beats per minute)
- **Interpretation**:
  - Resting normal: 60-100
  - Athletic: 40-60
  - Tachycardia: >100
  - Bradycardia: <60
- **Context**: Note if at rest or after activity

**glucose**
- **Format**: Decimal number
- **Example**: "95", "120.5"
- **Units**: mg/dL or mmol/L
- **Interpretation**:
  - Normal (fasting): 70-100 mg/dL
  - Prediabetes: 100-125
  - Diabetes: ≥126
  - Hypoglycemia: <70
- **Important**: Note if fasting or post-meal

**weight**
- **Format**: Decimal number
- **Example**: "75.5"
- **Units**: kg or lbs
- **Tracking**: Monitor trends over time
- **Clinical Use**: 
  - Medication dosing
  - Fluid retention
  - Nutritional status

**temperature**
- **Format**: Decimal number
- **Example**: "37.0", "98.6"
- **Units**: °C or °F
- **Interpretation**:
  - Normal: 36.1-37.2°C (97-99°F)
  - Low-grade fever: 37.3-38°C
  - Fever: >38°C (100.4°F)
  - High fever: >39.4°C (103°F)
- **Context**: Note measurement site (oral, ear, forehead)

**oxygen_saturation**
- **Format**: Whole number
- **Example**: "98"
- **Units**: % (percentage)
- **Interpretation**:
  - Normal: 95-100%
  - Mild hypoxemia: 90-94%
  - Moderate: 85-89%
  - Severe: <85%
- **Equipment**: Pulse oximeter
- **Note**: Critical for respiratory conditions

---

### 4.3 Care Dashboard Fields

#### Request
| Field Name | Type | Description |
|------------|------|-------------|
| `user_id` | string | Patient to get dashboard for |

#### Response Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `user_id` | string | Patient identifier |
| `medications` | array | Active medications list |
| `health_metrics` | array | Recent vitals (last 10) |
| `mood_history` | array | Recent mood entries (last 7) |
| `ai_summary` | string | AI-generated health summary and recommendations |

**ai_summary**
- **Purpose**: Comprehensive health overview
- **Content Includes**:
  - Overall health status
  - Medication adherence notes
  - Vital sign trends
  - Mental health status
  - Personalized recommendations
  - Areas of concern
  - Positive progress recognition

---

## 📊 Data Type Specifications

### UUID Format
- **Structure**: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
- **Example**: "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789"
- **Purpose**: Unique identifiers for all records

### DateTime Format
- **Standard**: ISO 8601
- **Format**: "YYYY-MM-DDTHH:MM:SS.mmmZ"
- **Example**: "2026-01-15T14:30:00.000Z"
- **Timezone**: UTC

### Array Format
- **Structure**: ["item1", "item2", "item3"]
- **Empty**: []
- **Single item**: ["item1"]

### Object Format
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

---

## 🔒 Field Validation Rules

### Required Fields
- Cannot be null or empty
- Must meet format requirements
- Validated before database storage

### Optional Fields
- Can be null or empty
- Provide additional context
- Enhance AI response quality

### String Fields
- Max length: 10,000 characters (text)
- Max length: 500 characters (short text)
- Trimmed of whitespace

### Numeric Fields
- Integer: Whole numbers only
- Float: Decimal precision to 2 places
- Range validation where applicable

### Date Fields
- Must be valid date format
- Cannot be future dates (for historical data)
- Default to UTC timezone

---

## 📈 Field Usage Statistics

### Most Critical Fields (Must Fill)
1. **user_id** - Required for all personalized features
2. **symptom lists** - Core diagnostic input
3. **medications** - Safety-critical information
4. **vital values** - Health monitoring data
5. **mood state** - Mental health tracking

### Optional but Valuable Fields
1. **notes/additional_info** - Context improves AI accuracy
2. **reminders** - Enhances medication adherence
3. **medical_history** - Improves diagnostic precision
4. **mood_notes** - Therapeutic journaling value

---

## 🎯 Field Best Practices

### For Patients
1. **Be Specific**: "Sharp chest pain" > "chest pain"
2. **Include Context**: When, where, what makes it better/worse
3. **Regular Tracking**: Daily vitals and mood for trends
4. **Honest Reporting**: AI needs accurate information
5. **Update Changes**: New symptoms, medication changes

### For Healthcare Providers
1. **Verify Information**: Cross-check patient entries
2. **Complete Profiles**: More data = better AI insights
3. **Monitor Trends**: Use historical data for patterns
4. **Flag Concerns**: Note critical values for review
5. **Educate Patients**: Teach proper measurement techniques

---

## 🔄 Field Update Frequency

| Field Type | Recommended Update Frequency |
|------------|----------------------------|
| **Vitals** | Daily or as directed |
| **Mood** | Daily (preferably same time) |
| **Medications** | When changed by provider |
| **Symptoms** | When new/changed symptoms appear |
| **Weight** | Weekly |
| **Blood Pressure** | Daily if hypertensive |
| **Glucose** | Per diabetic care plan |

---

## 📱 Mobile Optimization

All fields are designed for:
- Touch-friendly input
- Auto-complete where possible
- Dropdown menus for consistency
- Large touch targets
- Clear error messages
- Progress indicators

---

## 🌐 Future Field Enhancements

### Planned Additions
- **Voice Input**: Dictate symptoms and notes
- **Photo Upload**: Skin conditions, wounds
- **Device Integration**: Auto-import from wearables
- **Barcode Scan**: Medication verification
- **Multilingual**: Support 50+ languages
- **PDF Reports**: Export field data

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Healthcare GenAI Platform Team
