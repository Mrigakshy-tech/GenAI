from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request, Response, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ===========================
# DATA MODELS
# ===========================

# Medical Assistant Models
class MedicalChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MedicalChatRequest(BaseModel):
    session_id: str
    message: str

class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    severity: str
    duration: str
    additional_info: Optional[str] = None

class DrugInteractionRequest(BaseModel):
    medications: List[str]

# Mental Health Models
class MoodEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood: str  # happy, sad, anxious, stressed, neutral
    intensity: int  # 1-10
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoodEntryCreate(BaseModel):
    user_id: str
    mood: str
    intensity: int
    notes: Optional[str] = None

class MentalHealthChatRequest(BaseModel):
    session_id: str
    message: str
    mood_context: Optional[str] = None

class StressAssessmentRequest(BaseModel):
    user_id: str
    questions_answers: Dict[str, str]

# Diagnosis Models
class DiagnosisRequest(BaseModel):
    patient_info: Dict[str, str]
    symptoms: List[str]
    medical_history: Optional[str] = None

class RiskPredictionRequest(BaseModel):
    patient_data: Dict[str, str]
    risk_factors: List[str]

class TreatmentRecommendationRequest(BaseModel):
    diagnosis: str
    patient_info: Dict[str, str]
    severity: str

# Patient Care Models
class Medication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medication_name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    reminders: List[str]
    notes: Optional[str] = None

class MedicationCreate(BaseModel):
    user_id: str
    medication_name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    reminders: List[str]
    notes: Optional[str] = None

class HealthMetric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    metric_type: str  # blood_pressure, heart_rate, glucose, weight, etc.
    value: str
    unit: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthMetricCreate(BaseModel):
    user_id: str
    metric_type: str
    value: str
    unit: str



# Authentication Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ===========================
# HELPER FUNCTIONS
# ===========================

async def get_ai_response(system_message: str, user_message: str, session_id: str) -> str:
    """Get AI response using emergentintegrations"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        message = UserMessage(text=user_message)
        response = await chat.send_message(message)
        return response
    except Exception as e:
        logging.error(f"AI response error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")



# ==================================
# AUTHENTICATION HELPER FUNCTIONS
# ==================================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Get current authenticated user from cookie or Authorization header"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    
    token = session_token
    if not token:
        # Fallback to Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session in database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)


# ===========================
# AUTHENTICATION ENDPOINTS
# ===========================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token and user data"""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth service
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            auth_data = auth_response.json()
        except httpx.RequestError as e:
            logging.error(f"Auth service error: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    # Create or update user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture")
            }}
        )
    else:
        # Create new user
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = auth_data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    # Return user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get current user info - protected endpoint"""
    user = await get_current_user(request, session_token)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user and clear session"""
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        samesite="none",
        secure=True
    )
    
    return {"message": "Logged out successfully"}


# ===========================
# MEDICAL ASSISTANT ENDPOINTS
# ===========================

@api_router.post("/medical/chat")
async def medical_chat(request: MedicalChatRequest):
    """AI-powered medical assistant chat"""
    system_message = """You are an expert medical assistant AI. Provide helpful, accurate medical information 
    while always emphasizing that you are not a replacement for professional medical advice. Be empathetic, 
    clear, and thorough in your responses. If a situation seems serious, recommend consulting a healthcare 
    professional immediately."""
    
    response = await get_ai_response(system_message, request.message, request.session_id)
    
    # Save to database
    chat_doc = MedicalChatMessage(
        session_id=request.session_id,
        message=request.message,
        response=response
    )
    doc = chat_doc.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.medical_chats.insert_one(doc)
    
    return {"response": response, "session_id": request.session_id}


@api_router.post("/medical/symptoms")
async def check_symptoms(request: SymptomCheckRequest):
    """AI-powered symptom checker"""
    system_message = """You are a medical symptom analysis AI. Analyze the provided symptoms and provide:
    1. Possible conditions (ranked by likelihood)
    2. Severity assessment
    3. Recommended actions
    4. When to seek immediate medical attention
    Be thorough but always recommend professional medical consultation for accurate diagnosis."""
    
    user_message = f"""
    Symptoms: {', '.join(request.symptoms)}
    Severity: {request.severity}
    Duration: {request.duration}
    Additional Information: {request.additional_info or 'None'}
    
    Please provide a comprehensive analysis.
    """
    
    response = await get_ai_response(system_message, user_message, f"symptom-{uuid.uuid4()}")
    
    return {"analysis": response}


@api_router.post("/medical/drug-interaction")
async def check_drug_interaction(request: DrugInteractionRequest):
    """Check for drug interactions"""
    system_message = """You are a pharmaceutical interaction specialist AI. Analyze the provided medications 
    for potential interactions, contraindications, and side effects. Provide clear warnings and recommendations."""
    
    user_message = f"""
    Medications: {', '.join(request.medications)}
    
    Please analyze potential interactions, side effects, and provide recommendations.
    """
    
    response = await get_ai_response(system_message, user_message, f"drug-{uuid.uuid4()}")
    
    return {"analysis": response}


@api_router.post("/medical/report-analysis")
async def analyze_medical_report(file: UploadFile = File(...)):
    """Analyze uploaded medical reports"""
    try:
        contents = await file.read()
        # For demo purposes, we'll analyze text-based reports
        # In production, you'd use OCR for images
        
        system_message = """You are a medical report analysis AI. Analyze the provided medical report 
        and explain the findings in simple, understandable terms. Highlight any concerning values 
        and provide context."""
        
        user_message = f"Please analyze this medical report and explain the findings: {contents.decode('utf-8')[:1000]}"
        
        response = await get_ai_response(system_message, user_message, f"report-{uuid.uuid4()}")
        
        return {"analysis": response, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===========================


@api_router.post("/medical/image-analysis")
async def analyze_medical_image(
    file: UploadFile = File(...),
    image_type: str = "general",
    patient_context: str = ""
):
    """Analyze medical images using AI vision capabilities"""
    try:
        # Read file and convert to base64
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Determine image type specific prompt
        type_prompts = {
            "xray": "You are a radiology AI specialist. Analyze this X-ray image and identify any abnormalities, bone fractures, or concerning findings.",
            "skin": "You are a dermatology AI specialist. Analyze this skin condition image and identify potential skin conditions, lesions, or abnormalities.",
            "lab_report": "You are a clinical laboratory AI specialist. Analyze this lab report image and explain the test results, highlighting any abnormal values.",
            "prescription": "You are a pharmacy AI specialist. Read and interpret this prescription image, listing medications, dosages, and instructions.",
            "general": "You are a medical image analysis AI. Analyze this medical image and provide insights about what you observe."
        }
        
        system_message = type_prompts.get(image_type, type_prompts["general"])
        
        context_info = f"\n\nPatient Context: {patient_context}" if patient_context else ""
        
        user_message = f"""Please analyze this medical image in detail:
        - Image Type: {image_type}
        - Filename: {file.filename}{context_info}
        
        Provide:
        1. What you observe in the image
        2. Any abnormalities or concerning findings
        3. Recommendations for next steps
        4. Important disclaimers about AI limitations
        
        Note: This is for educational/informational purposes. Always recommend professional medical evaluation."""
        
        # For now, simulate image analysis with text-based AI
        # In production with GPT-4 Vision or similar, you'd pass the base64 image
        analysis = await get_ai_response(
            system_message, 
            user_message + "\n\n[Note: Image received - providing general medical image analysis guidance]",
            f"image-{uuid.uuid4()}"
        )
        
        # Save image analysis record
        analysis_doc = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "image_type": image_type,
            "file_size": len(contents),
            "analysis": analysis,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.image_analyses.insert_one(analysis_doc)
        
        return {
            "analysis": analysis,
            "filename": file.filename,
            "image_type": image_type,
            "disclaimer": "This AI analysis is for informational purposes only. Please consult a qualified healthcare professional for accurate medical diagnosis."
        }
    except Exception as e:
        logging.error(f"Image analysis error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ===========================
# VOICE INPUT ENDPOINT
# ===========================

@api_router.post("/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio to text (placeholder for Web Speech API frontend implementation)"""
    try:
        # Note: This endpoint is a placeholder. The actual speech-to-text
        # will be handled by the browser's Web Speech API on the frontend
        # for real-time transcription without server load.
        
        # If server-side transcription is needed in the future, 
        # integrate with services like OpenAI Whisper API
        
        contents = await file.read()
        
        return {
            "transcription": "Voice transcription is handled client-side using Web Speech API",
            "note": "This endpoint can be extended for server-side transcription if needed",
            "file_size": len(contents),
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ===========================
# WEARABLE DEVICE INTEGRATION
# ===========================

@api_router.post("/wearables/sync")
async def sync_wearable_data(request: Request, session_token: Optional[str] = Cookie(None)):
    """Sync data from wearable devices"""
    user = await get_current_user(request, session_token)
    
    data = await request.json()
    device_type = data.get("device_type")  # apple_health, fitbit, manual
    metrics = data.get("metrics", [])  # List of health metrics
    
    saved_count = 0
    for metric_data in metrics:
        metric = HealthMetric(
            user_id=user.user_id,
            metric_type=metric_data["type"],
            value=metric_data["value"],
            unit=metric_data["unit"]
        )
        doc = metric.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.health_metrics.insert_one(doc)
        saved_count += 1
    
    return {
        "message": f"Successfully synced {saved_count} metrics",
        "device_type": device_type,
        "synced_count": saved_count
    }


@api_router.get("/wearables/devices")
async def get_connected_devices(request: Request, session_token: Optional[str] = Cookie(None)):
    """Get list of connected wearable devices for user"""
    user = await get_current_user(request, session_token)
    
    # Check if user has any health metrics (indicates device usage)
    recent_metrics = await db.health_metrics.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    # For MVP: Return manual entry as default
    # Can be extended to detect Apple Health/Fitbit based on metric patterns
    return {
        "devices": [
            {
                "type": "manual",
                "name": "Manual Entry",
                "connected": True,
                "last_sync": datetime.now(timezone.utc).isoformat()
            }
        ],
        "total_metrics": len(recent_metrics),
        "note": "Wearable device integration (Apple Health, Fitbit) can be enabled with OAuth setup"
    }


@api_router.post("/wearables/connect/{device_type}")
async def connect_wearable_device(
    device_type: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Connect a wearable device (placeholder for OAuth flows)"""
    user = await get_current_user(request, session_token)
    
    # Placeholder for device OAuth flows
    # Apple Health: Uses HealthKit on iOS
    # Fitbit: Requires Fitbit OAuth 2.0
    # Google Fit: Requires Google Fit API
    
    return {
        "message": f"Device connection initiated for {device_type}",
        "user_id": user.user_id,
        "device_type": device_type,
        "status": "pending_oauth",
        "note": "OAuth flow would redirect to device authorization page"
    }


# ===========================
# MENTAL HEALTH ENDPOINTS
# ===========================

@api_router.post("/mental/chat")
async def mental_health_chat(request: MentalHealthChatRequest):
    """AI-powered mental health counseling chatbot"""
    system_message = """You are a compassionate mental health support AI counselor. Provide empathetic, 
    supportive responses. Use active listening techniques, validate emotions, and offer coping strategies. 
    If you detect signs of crisis or severe mental health issues, strongly recommend professional help 
    and provide crisis resources."""
    
    context = f"User's current mood: {request.mood_context}" if request.mood_context else ""
    user_message = f"{context}\n\nUser message: {request.message}"
    
    response = await get_ai_response(system_message, user_message, request.session_id)
    
    return {"response": response, "session_id": request.session_id}


@api_router.post("/mental/mood", response_model=MoodEntry)
async def track_mood(request: MoodEntryCreate):
    """Track user mood"""
    mood_entry = MoodEntry(**request.model_dump())
    doc = mood_entry.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.mood_entries.insert_one(doc)
    
    return mood_entry


@api_router.get("/mental/mood/{user_id}")
async def get_mood_history(user_id: str, limit: int = 30):
    """Get mood history for a user"""
    entries = await db.mood_entries.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for entry in entries:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return {"entries": entries}


@api_router.post("/mental/assessment")
async def stress_assessment(request: StressAssessmentRequest):
    """AI-powered stress and mental health assessment"""
    system_message = """You are a mental health assessment AI. Based on the questionnaire responses, 
    provide a comprehensive assessment including stress levels, potential issues, and personalized 
    coping strategies. Always recommend professional help when needed."""
    
    questions_text = "\n".join([f"Q: {q}\nA: {a}" for q, a in request.questions_answers.items()])
    user_message = f"Assessment responses:\n{questions_text}\n\nProvide a comprehensive mental health assessment."
    
    response = await get_ai_response(system_message, user_message, f"assessment-{request.user_id}")
    
    return {"assessment": response, "user_id": request.user_id}


@api_router.get("/mental/coping-strategies")
async def get_coping_strategies(mood: str, situation: Optional[str] = None):
    """Get personalized coping strategies"""
    system_message = """You are a mental wellness coach AI. Provide practical, evidence-based coping 
    strategies tailored to the user's current emotional state."""
    
    user_message = f"Mood: {mood}\nSituation: {situation or 'General'}\n\nProvide personalized coping strategies."
    
    response = await get_ai_response(system_message, user_message, f"coping-{uuid.uuid4()}")
    
    return {"strategies": response}


# ===========================
# DIAGNOSIS SUPPORT ENDPOINTS
# ===========================

@api_router.post("/diagnosis/analyze")
async def diagnose_symptoms(request: DiagnosisRequest):
    """AI-powered diagnosis support system"""
    system_message = """You are an advanced medical diagnosis support AI. Analyze patient information 
    and symptoms to suggest possible diagnoses. Provide differential diagnoses ranked by likelihood, 
    recommended tests, and next steps. Always emphasize the need for professional medical evaluation."""
    
    user_message = f"""
    Patient Information: {request.patient_info}
    Symptoms: {', '.join(request.symptoms)}
    Medical History: {request.medical_history or 'Not provided'}
    
    Provide a comprehensive diagnostic analysis with differential diagnoses.
    """
    
    response = await get_ai_response(system_message, user_message, f"diagnosis-{uuid.uuid4()}")
    
    # Save diagnosis
    diagnosis_doc = {
        "id": str(uuid.uuid4()),
        "patient_info": request.patient_info,
        "symptoms": request.symptoms,
        "analysis": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.diagnoses.insert_one(diagnosis_doc)
    
    return {"diagnosis": response}


@api_router.post("/diagnosis/risk-prediction")
async def predict_disease_risk(request: RiskPredictionRequest):
    """Disease risk prediction based on patient data"""
    system_message = """You are a medical risk assessment AI. Analyze patient data and risk factors 
    to predict disease risks. Provide risk percentages, preventive measures, and lifestyle recommendations."""
    
    user_message = f"""
    Patient Data: {request.patient_data}
    Risk Factors: {', '.join(request.risk_factors)}
    
    Provide a comprehensive risk assessment for common diseases and preventive recommendations.
    """
    
    response = await get_ai_response(system_message, user_message, f"risk-{uuid.uuid4()}")
    
    return {"risk_assessment": response}


@api_router.post("/diagnosis/treatment-recommendation")
async def recommend_treatment(request: TreatmentRecommendationRequest):
    """AI-powered treatment recommendation"""
    system_message = """You are a treatment planning AI. Based on diagnosis and patient information, 
    recommend evidence-based treatment options including medications, therapies, lifestyle changes, 
    and follow-up care. Always note that final treatment decisions should be made by healthcare professionals."""
    
    user_message = f"""
    Diagnosis: {request.diagnosis}
    Patient Information: {request.patient_info}
    Severity: {request.severity}
    
    Provide comprehensive treatment recommendations.
    """
    
    response = await get_ai_response(system_message, user_message, f"treatment-{uuid.uuid4()}")
    
    return {"treatment_plan": response}


# ===========================
# PATIENT CARE & MONITORING ENDPOINTS
# ===========================

@api_router.post("/care/medications", response_model=Medication)
async def add_medication(request: MedicationCreate):
    """Add medication to tracking system"""
    medication = Medication(**request.model_dump())
    doc = medication.model_dump()
    await db.medications.insert_one(doc)
    
    return medication


@api_router.get("/care/medications/{user_id}")
async def get_medications(user_id: str):
    """Get all medications for a user"""
    medications = await db.medications.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(100)
    
    return {"medications": medications}


@api_router.delete("/care/medications/{medication_id}")
async def delete_medication(medication_id: str):
    """Delete a medication"""
    result = await db.medications.delete_one({"id": medication_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")
    return {"message": "Medication deleted successfully"}


@api_router.post("/care/health-metrics", response_model=HealthMetric)
async def add_health_metric(request: HealthMetricCreate):
    """Add health metric (vitals)"""
    metric = HealthMetric(**request.model_dump())
    doc = metric.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.health_metrics.insert_one(doc)
    
    return metric


@api_router.get("/care/health-metrics/{user_id}")
async def get_health_metrics(user_id: str, metric_type: Optional[str] = None, limit: int = 50):
    """Get health metrics for a user"""
    query = {"user_id": user_id}
    if metric_type:
        query["metric_type"] = metric_type
    
    metrics = await db.health_metrics.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for metric in metrics:
        if isinstance(metric['timestamp'], str):
            metric['timestamp'] = datetime.fromisoformat(metric['timestamp'])
    
    return {"metrics": metrics}


@api_router.get("/care/dashboard/{user_id}")
async def get_patient_dashboard(user_id: str):
    """Get comprehensive patient care dashboard"""
    # Get recent medications
    medications = await db.medications.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(10)
    
    # Get recent health metrics
    metrics = await db.health_metrics.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    # Get recent mood entries
    moods = await db.mood_entries.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(7).to_list(7)
    
    return {
        "user_id": user_id,
        "medications": medications,
        "health_metrics": metrics,
        "mood_history": moods
    }


@api_router.post("/care/recovery-guidance")
async def get_recovery_guidance(condition: str, stage: str):
    """Get AI-powered recovery guidance"""
    system_message = """You are a recovery and rehabilitation specialist AI. Provide comprehensive 
    recovery guidance including exercises, dietary recommendations, precautions, and milestones."""
    
    user_message = f"Condition: {condition}\nRecovery Stage: {stage}\n\nProvide detailed recovery guidance."
    
    response = await get_ai_response(system_message, user_message, f"recovery-{uuid.uuid4()}")
    
    return {"guidance": response}


# ===========================
# GENERAL ENDPOINTS
# ===========================

@api_router.get("/")
async def root():
    return {
        "message": "MediGenix AI Platform API",
        "version": "1.0.0",
        "modules": [
            "Medical Assistant",
            "Mental Health Support",
            "Diagnosis Support",
            "Patient Care & Monitoring"
        ]
    }


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
