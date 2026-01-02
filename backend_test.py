#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for MediGenix AI Platform
Tests all 4 modules: Medical Assistant, Mental Health, Diagnosis Support, Patient Care
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple

class MediGenixAPITester:
    def __init__(self, base_url="https://expert-genai-suite.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"
        
    def log_test(self, module: str, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n[{module}] {test_name}: {status}")
        if details:
            print(f"    Details: {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({
                "module": module,
                "test": test_name,
                "details": details
            })

    def make_request(self, method: str, endpoint: str, data: dict = None, expected_status: int = 200) -> Tuple[bool, dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}
        except Exception as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING: HEALTH CHECK & BASIC ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        success, data = self.make_request('GET', '')
        self.log_test("HEALTH", "Root endpoint", success, 
                     f"Response: {data.get('message', 'No message')}" if success else str(data))
        
        # Test health endpoint
        success, data = self.make_request('GET', 'health')
        self.log_test("HEALTH", "Health check", success,
                     f"Status: {data.get('status', 'Unknown')}" if success else str(data))

    def test_medical_assistant(self):
        """Test Medical Assistant module"""
        print("\n" + "="*50)
        print("TESTING: MEDICAL ASSISTANT MODULE")
        print("="*50)
        
        # Test medical chat
        chat_data = {
            "session_id": f"test_session_{int(time.time())}",
            "message": "What are the symptoms of diabetes?"
        }
        success, data = self.make_request('POST', 'medical/chat', chat_data)
        self.log_test("MEDICAL", "AI Medical Chat", success,
                     f"Response length: {len(data.get('response', ''))}" if success else str(data))
        
        # Test symptom checker
        symptom_data = {
            "symptoms": ["headache", "fever", "fatigue"],
            "severity": "moderate",
            "duration": "3 days",
            "additional_info": "Started after stress at work"
        }
        success, data = self.make_request('POST', 'medical/symptoms', symptom_data)
        self.log_test("MEDICAL", "Symptom Checker", success,
                     f"Analysis length: {len(data.get('analysis', ''))}" if success else str(data))
        
        # Test drug interaction checker
        drug_data = {
            "medications": ["Aspirin", "Warfarin", "Ibuprofen"]
        }
        success, data = self.make_request('POST', 'medical/drug-interaction', drug_data)
        self.log_test("MEDICAL", "Drug Interaction Checker", success,
                     f"Analysis length: {len(data.get('analysis', ''))}" if success else str(data))

    def test_mental_health(self):
        """Test Mental Health module"""
        print("\n" + "="*50)
        print("TESTING: MENTAL HEALTH MODULE")
        print("="*50)
        
        # Test mental health chat
        mental_chat_data = {
            "session_id": f"mental_session_{int(time.time())}",
            "message": "I've been feeling anxious lately and having trouble sleeping",
            "mood_context": "anxious"
        }
        success, data = self.make_request('POST', 'mental/chat', mental_chat_data)
        self.log_test("MENTAL", "Mental Health Chat", success,
                     f"Response length: {len(data.get('response', ''))}" if success else str(data))
        
        # Test mood tracking - create mood entry
        mood_data = {
            "user_id": self.test_user_id,
            "mood": "anxious",
            "intensity": 7,
            "notes": "Feeling stressed about work deadlines"
        }
        success, data = self.make_request('POST', 'mental/mood', mood_data)
        self.log_test("MENTAL", "Mood Entry Creation", success,
                     f"Mood ID: {data.get('id', 'No ID')}" if success else str(data))
        
        # Test mood history retrieval
        success, data = self.make_request('GET', f'mental/mood/{self.test_user_id}')
        self.log_test("MENTAL", "Mood History Retrieval", success,
                     f"Entries found: {len(data.get('entries', []))}" if success else str(data))
        
        # Test stress assessment
        assessment_data = {
            "user_id": self.test_user_id,
            "questions_answers": {
                "How often have you felt nervous or anxious in the past week?": "Often, especially during work hours",
                "How well are you sleeping?": "Poorly, waking up multiple times",
                "Do you feel overwhelmed by daily tasks?": "Yes, constantly behind on everything",
                "How often do you feel sad or down?": "Sometimes, mainly in the evenings",
                "Are you able to concentrate on tasks?": "Difficulty focusing, mind wanders"
            }
        }
        success, data = self.make_request('POST', 'mental/assessment', assessment_data)
        self.log_test("MENTAL", "Stress Assessment", success,
                     f"Assessment length: {len(data.get('assessment', ''))}" if success else str(data))
        
        # Test coping strategies
        success, data = self.make_request('GET', 'mental/coping-strategies?mood=anxious&situation=work stress')
        self.log_test("MENTAL", "Coping Strategies", success,
                     f"Strategies length: {len(data.get('strategies', ''))}" if success else str(data))

    def test_diagnosis_support(self):
        """Test Diagnosis Support module"""
        print("\n" + "="*50)
        print("TESTING: DIAGNOSIS SUPPORT MODULE")
        print("="*50)
        
        # Test diagnosis analysis
        diagnosis_data = {
            "patient_info": {
                "age": "45",
                "gender": "male",
                "weight": "80kg"
            },
            "symptoms": ["chest pain", "shortness of breath", "fatigue"],
            "medical_history": "Family history of heart disease, smoker for 20 years"
        }
        success, data = self.make_request('POST', 'diagnosis/analyze', diagnosis_data)
        self.log_test("DIAGNOSIS", "Diagnosis Analysis", success,
                     f"Diagnosis length: {len(data.get('diagnosis', ''))}" if success else str(data))
        
        # Test risk prediction
        risk_data = {
            "patient_data": {
                "Age": "45",
                "Blood Pressure": "140/90",
                "Cholesterol": "240",
                "BMI": "28",
                "Smoking Status": "Current smoker"
            },
            "risk_factors": ["Family history of heart disease", "Sedentary lifestyle", "High stress job"]
        }
        success, data = self.make_request('POST', 'diagnosis/risk-prediction', risk_data)
        self.log_test("DIAGNOSIS", "Risk Prediction", success,
                     f"Risk assessment length: {len(data.get('risk_assessment', ''))}" if success else str(data))
        
        # Test treatment recommendation
        treatment_data = {
            "diagnosis": "Type 2 Diabetes",
            "patient_info": {
                "age": "55",
                "gender": "female",
                "allergies": "Penicillin allergy"
            },
            "severity": "moderate"
        }
        success, data = self.make_request('POST', 'diagnosis/treatment-recommendation', treatment_data)
        self.log_test("DIAGNOSIS", "Treatment Recommendation", success,
                     f"Treatment plan length: {len(data.get('treatment_plan', ''))}" if success else str(data))

    def test_patient_care(self):
        """Test Patient Care module"""
        print("\n" + "="*50)
        print("TESTING: PATIENT CARE MODULE")
        print("="*50)
        
        # Test medication tracking - add medication
        medication_data = {
            "user_id": self.test_user_id,
            "medication_name": "Metformin",
            "dosage": "500mg",
            "frequency": "Twice daily",
            "start_date": "2024-01-15",
            "reminders": ["08:00", "20:00"],
            "notes": "Take with food"
        }
        success, data = self.make_request('POST', 'care/medications', medication_data)
        medication_id = data.get('id') if success else None
        self.log_test("CARE", "Medication Addition", success,
                     f"Medication ID: {medication_id}" if success else str(data))
        
        # Test medication retrieval
        success, data = self.make_request('GET', f'care/medications/{self.test_user_id}')
        self.log_test("CARE", "Medication Retrieval", success,
                     f"Medications found: {len(data.get('medications', []))}" if success else str(data))
        
        # Test health metrics - add vital signs
        metrics_data = [
            {
                "user_id": self.test_user_id,
                "metric_type": "blood_pressure",
                "value": "120/80",
                "unit": "mmHg"
            },
            {
                "user_id": self.test_user_id,
                "metric_type": "heart_rate",
                "value": "72",
                "unit": "bpm"
            },
            {
                "user_id": self.test_user_id,
                "metric_type": "glucose",
                "value": "95",
                "unit": "mg/dL"
            }
        ]
        
        for metric in metrics_data:
            success, data = self.make_request('POST', 'care/health-metrics', metric)
            self.log_test("CARE", f"Health Metric ({metric['metric_type']})", success,
                         f"Metric ID: {data.get('id', 'No ID')}" if success else str(data))
        
        # Test health metrics retrieval
        success, data = self.make_request('GET', f'care/health-metrics/{self.test_user_id}')
        self.log_test("CARE", "Health Metrics Retrieval", success,
                     f"Metrics found: {len(data.get('metrics', []))}" if success else str(data))
        
        # Test dashboard
        success, data = self.make_request('GET', f'care/dashboard/{self.test_user_id}')
        self.log_test("CARE", "Patient Dashboard", success,
                     f"Dashboard data: medications={len(data.get('medications', []))}, metrics={len(data.get('health_metrics', []))}, moods={len(data.get('mood_history', []))}" if success else str(data))
        
        # Test recovery guidance
        recovery_data = {
            "condition": "Type 2 Diabetes",
            "stage": "newly diagnosed"
        }
        success, data = self.make_request('POST', 'care/recovery-guidance', recovery_data)
        self.log_test("CARE", "Recovery Guidance", success,
                     f"Guidance length: {len(data.get('guidance', ''))}" if success else str(data))
        
        # Clean up - delete medication if it was created
        if medication_id:
            success, data = self.make_request('DELETE', f'care/medications/{medication_id}')
            self.log_test("CARE", "Medication Deletion", success,
                         "Medication deleted successfully" if success else str(data))

    def run_all_tests(self):
        """Run all test suites"""
        print("🏥 STARTING MEDIGENIX AI PLATFORM COMPREHENSIVE TESTING")
        print(f"🔗 Testing against: {self.base_url}")
        print(f"👤 Test User ID: {self.test_user_id}")
        
        start_time = time.time()
        
        # Run all test suites
        self.test_health_check()
        self.test_medical_assistant()
        self.test_mental_health()
        self.test_diagnosis_support()
        self.test_patient_care()
        
        # Print final results
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n" + "="*60)
        print("🏁 TESTING COMPLETE - FINAL RESULTS")
        print("="*60)
        print(f"⏱️  Total Duration: {duration:.2f} seconds")
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   [{test['module']}] {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MediGenixAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())