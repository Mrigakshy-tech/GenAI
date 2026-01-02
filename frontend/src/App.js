import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import "@/App.css";
import axios from "axios";
import { Activity, Brain, Stethoscope, Heart, MessageCircle, Pill, Calendar, TrendingUp, AlertCircle, CheckCircle, Send, Upload, Plus, X, LogOut, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Login from "./components/Login";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const location = useLocation();
  
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {({ user }) => <Dashboard user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function Dashboard({ user }) {
  const [activeModule, setActiveModule] = useState("medical");

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 sm:p-2 rounded-lg">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">MediGenix AI</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Comprehensive AI-Powered Healthcare Solutions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-1">
            {[
              { id: "medical", label: "Medical Assistant", shortLabel: "Medical", icon: Stethoscope, color: "blue" },
              { id: "mental", label: "Mental Health", shortLabel: "Mental", icon: Brain, color: "purple" },
              { id: "diagnosis", label: "Diagnosis Support", shortLabel: "Diagnosis", icon: Activity, color: "green" },
              { id: "care", label: "Patient Care", shortLabel: "Care", icon: Heart, color: "red" }
            ].map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                data-testid={`tab-${module.id}`}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                  activeModule === module.id
                    ? `text-${module.color}-600 border-b-2 border-${module.color}-600 bg-${module.color}-50`
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <module.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{module.label}</span>
                <span className="sm:hidden">{module.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeModule === "medical" && <MedicalAssistant />}
        {activeModule === "mental" && <MentalHealth userId={userId} />}
        {activeModule === "diagnosis" && <DiagnosisSupport />}
        {activeModule === "care" && <PatientCare userId={userId} />}
      </main>
    </div>
  );
}

// ===========================
// MEDICAL ASSISTANT MODULE
// ===========================
function MedicalAssistant() {
  const [activeTab, setActiveTab] = useState("chat");
  
  return (
    <div className="space-y-6" data-testid="medical-assistant-module">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Medical Assistant</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          {["chat", "symptoms", "drugs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`medical-tab-${tab}`}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "drugs" ? "Drug Interactions" : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "chat" && <MedicalChat />}
      {activeTab === "symptoms" && <SymptomChecker />}
      {activeTab === "drugs" && <DrugInteractionChecker />}
    </div>
  );
}

function MedicalChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState("session-" + Math.random().toString(36).substr(2, 9));

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/medical/chat`, {
        session_id: sessionId,
        message: input
      });

      const aiMsg = { role: "assistant", content: response.data.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "error", content: "Failed to get response. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6" data-testid="medical-chat">
      <div className="space-y-4 h-64 sm:h-80 md:h-96 overflow-y-auto mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-12 sm:mt-20">
            <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm sm:text-base">Start a conversation with your AI medical assistant</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-2xl px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : msg.role === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-white border border-gray-200 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about symptoms, conditions, treatments..."
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          data-testid="medical-chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          data-testid="medical-chat-send-btn"
        >
          <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [duration, setDuration] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom("");
    }
  };

  const removeSymptom = (index) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      alert("Please add at least one symptom");
      return;
    }
    
    if (!duration.trim()) {
      alert("Please enter the duration of symptoms");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/medical/symptoms`, {
        symptoms,
        severity,
        duration,
        additional_info: additionalInfo
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="symptom-checker">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Symptoms</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                placeholder="E.g., headache, fever, cough"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="symptom-input"
              />
              <button
                onClick={addSymptom}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="add-symptom-btn"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {symptom}
                  <button onClick={() => removeSymptom(idx)} className="ml-2">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="severity-select"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="E.g., 3 days, 1 week"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="duration-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Any other relevant information..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="additional-info-input"
            />
          </div>

          <button
            onClick={analyzeSymptoms}
            disabled={loading || symptoms.length === 0 || !duration.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            data-testid="analyze-symptoms-btn"
          >
            {loading ? "Analyzing..." : "Analyze Symptoms"}
          </button>
          {symptoms.length === 0 && (
            <p className="text-sm text-red-600 mt-2">⚠️ Please add at least one symptom</p>
          )}
          {symptoms.length > 0 && !duration.trim() && (
            <p className="text-sm text-red-600 mt-2">⚠️ Please enter symptom duration</p>
          )}
        </div>

        <div>
          {analysis ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6" data-testid="symptom-analysis-result">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Analysis Results</h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Activity className="h-16 w-16 mx-auto mb-3" />
                <p>Add symptoms and click analyze to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrugInteractionChecker() {
  const [medications, setMedications] = useState([]);
  const [currentMed, setCurrentMed] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const addMedication = () => {
    if (currentMed.trim()) {
      setMedications([...medications, currentMed.trim()]);
      setCurrentMed("");
    }
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const checkInteractions = async () => {
    if (medications.length < 2) {
      alert("Please add at least 2 medications to check interactions");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/medical/drug-interaction`, {
        medications
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to check interactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="drug-interaction-checker">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Medications</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMed}
                onChange={(e) => setCurrentMed(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addMedication()}
                placeholder="E.g., Aspirin, Ibuprofen"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="medication-input"
              />
              <button
                onClick={addMedication}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="add-medication-btn"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <span className="text-purple-900">{med}</span>
                  <button onClick={() => removeMedication(idx)} className="text-red-600 hover:text-red-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={checkInteractions}
            disabled={loading || medications.length < 2}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            data-testid="check-interactions-btn"
          >
            {loading ? "Checking..." : "Check Interactions"}
          </button>
        </div>

        <div>
          {analysis ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6" data-testid="drug-interaction-result">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Interaction Analysis</h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Pill className="h-16 w-16 mx-auto mb-3" />
                <p>Add at least 2 medications to check for interactions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// MENTAL HEALTH MODULE
// ===========================
function MentalHealth({ userId }) {
  const [activeTab, setActiveTab] = useState("chat");
  
  return (
    <div className="space-y-6" data-testid="mental-health-module">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mental Health Support</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          {["chat", "mood", "assessment"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`mental-tab-${tab}`}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "chat" ? "Counseling Chat" : tab === "mood" ? "Mood Tracker" : "Stress Assessment"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "chat" && <MentalHealthChat />}
      {activeTab === "mood" && <MoodTracker userId={userId} />}
      {activeTab === "assessment" && <StressAssessment userId={userId} />}
    </div>
  );
}

function MentalHealthChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState("mental-session-" + Math.random().toString(36).substr(2, 9));

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/mental/chat`, {
        session_id: sessionId,
        message: input
      });

      const aiMsg = { role: "assistant", content: response.data.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "error", content: "Failed to get response. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="mental-health-chat">
      <div className="space-y-4 h-96 overflow-y-auto mb-4 p-4 bg-purple-50 rounded-lg">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Start a confidential conversation with your AI mental health counselor</p>
            <p className="text-sm text-gray-400 mt-2">This is a safe space to share your thoughts and feelings</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : msg.role === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-white border border-purple-200 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-purple-200 px-4 py-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Share what's on your mind..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          data-testid="mental-chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          data-testid="mental-chat-send-btn"
        >
          <Send className="h-5 w-5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}

function MoodTracker({ userId }) {
  const [mood, setMood] = useState("neutral");
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await axios.get(`${API}/mental/mood/${userId}`);
      setMoodHistory(response.data.entries || []);
    } catch (error) {
      console.error("Error fetching mood history:", error);
    }
  };

  const saveMood = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/mental/mood`, {
        user_id: userId,
        mood,
        intensity,
        notes
      });
      alert("Mood saved successfully!");
      setNotes("");
      fetchMoodHistory();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save mood. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const moodEmojis = {
    happy: "😊",
    sad: "😢",
    anxious: "😰",
    stressed: "😤",
    neutral: "😐"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="mood-tracker">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Log Your Mood</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">How are you feeling?</label>
            <div className="flex justify-start gap-3">
              {Object.entries(moodEmojis).map(([key, emoji]) => (
                <button
                  key={key}
                  onClick={() => setMood(key)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    mood === key ? "bg-purple-100 scale-105" : "hover:bg-gray-100"
                  }`}
                  data-testid={`mood-${key}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-left mt-2 text-sm text-gray-600 capitalize">
              {mood === "stressed" ? <span className="font-bold">{mood}</span> : mood}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intensity: {intensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full"
              data-testid="mood-intensity-slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's happening? How do you feel?"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              data-testid="mood-notes-input"
            />
          </div>

          <button
            onClick={saveMood}
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            data-testid="save-mood-btn"
          >
            {loading ? "Saving..." : "Save Mood Entry"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Mood History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {moodHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No mood entries yet</p>
          ) : (
            moodHistory.map((entry, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                    <div>
                      <p className={`font-medium capitalize ${entry.mood === "stressed" ? "font-bold" : ""}`}>
                        {entry.mood}
                      </p>
                      <p className="text-sm text-gray-500">Intensity: {entry.intensity}/10</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {entry.notes && (
                  <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StressAssessment({ userId }) {
  const [answers, setAnswers] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const questions = [
    "How often have you felt nervous or anxious in the past week?",
    "How well are you sleeping?",
    "Do you feel overwhelmed by daily tasks?",
    "How often do you feel sad or down?",
    "Are you able to concentrate on tasks?"
  ];

  const submitAssessment = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/mental/assessment`, {
        user_id: userId,
        questions_answers: answers
      });
      setAssessment(response.data.assessment);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="stress-assessment">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Stress & Mental Health Assessment</h3>
      
      {!assessment ? (
        <div className="space-y-6">
          {questions.map((question, idx) => (
            <div key={idx} className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {idx + 1}. {question}
              </label>
              <textarea
                value={answers[question] || ""}
                onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Your answer..."
                data-testid={`assessment-question-${idx}`}
              />
            </div>
          ))}
          
          <button
            onClick={submitAssessment}
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            data-testid="submit-assessment-btn"
          >
            {loading ? "Analyzing..." : "Get Assessment"}
          </button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="assessment-result">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-3">Your Assessment</h4>
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{assessment}</ReactMarkdown>
            </div>
          </div>
          <button
            onClick={() => { setAssessment(null); setAnswers({}); }}
            className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Take Another Assessment
          </button>
        </div>
      )}
    </div>
  );
}

// ===========================
// DIAGNOSIS SUPPORT MODULE
// ===========================
function DiagnosisSupport() {
  const [activeTab, setActiveTab] = useState("analyze");
  
  return (
    <div className="space-y-6" data-testid="diagnosis-support-module">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical Diagnosis Support</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          {["analyze", "risk", "treatment"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`diagnosis-tab-${tab}`}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "analyze" ? "Diagnosis Analysis" : tab === "risk" ? "Risk Prediction" : "Treatment Plan"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "analyze" && <DiagnosisAnalysis />}
      {activeTab === "risk" && <RiskPrediction />}
      {activeTab === "treatment" && <TreatmentRecommendation />}
    </div>
  );
}

function DiagnosisAnalysis() {
  const [patientInfo, setPatientInfo] = useState({ age: "", gender: "", weight: "" });
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom("");
    }
  };

  const analyzeDiagnosis = async () => {
    if (symptoms.length === 0) {
      alert("Please add at least one symptom");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/diagnosis/analyze`, {
        patient_info: patientInfo,
        symptoms,
        medical_history: medicalHistory
      });
      setDiagnosis(response.data.diagnosis);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="diagnosis-analysis">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Age"
              value={patientInfo.age}
              onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="patient-age-input"
            />
            <select
              value={patientInfo.gender}
              onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="patient-gender-select"
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Weight (kg)"
              value={patientInfo.weight}
              onChange={(e) => setPatientInfo({ ...patientInfo, weight: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="patient-weight-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSymptom()}
                placeholder="Add symptom"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                data-testid="diagnosis-symptom-input"
              />
              <button
                onClick={addSymptom}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                data-testid="add-diagnosis-symptom-btn"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {symptom}
                  <button onClick={() => setSymptoms(symptoms.filter((_, i) => i !== idx))} className="ml-2">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Previous conditions, surgeries, allergies..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="medical-history-input"
            />
          </div>

          <button
            onClick={analyzeDiagnosis}
            disabled={loading || symptoms.length === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            data-testid="analyze-diagnosis-btn"
          >
            {loading ? "Analyzing..." : "Get Diagnosis Analysis"}
          </button>
        </div>

        <div>
          {diagnosis ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6" data-testid="diagnosis-result">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Diagnosis Analysis</h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Activity className="h-16 w-16 mx-auto mb-3" />
                <p>Fill in patient information and symptoms to get analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskPrediction() {
  const [patientData, setPatientData] = useState({});
  const [riskFactors, setRiskFactors] = useState([]);
  const [currentFactor, setCurrentFactor] = useState("");
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loading, setLoading] = useState(false);

  const dataFields = ["Age", "Blood Pressure", "Cholesterol", "BMI", "Smoking Status"];

  const addRiskFactor = () => {
    if (currentFactor.trim()) {
      setRiskFactors([...riskFactors, currentFactor.trim()]);
      setCurrentFactor("");
    }
  };

  const predictRisk = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/diagnosis/risk-prediction`, {
        patient_data: patientData,
        risk_factors: riskFactors
      });
      setRiskAssessment(response.data.risk_assessment);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to predict risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="risk-prediction">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-3">
            {dataFields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  value={patientData[field] || ""}
                  onChange={(e) => setPatientData({ ...patientData, [field]: e.target.value })}
                  placeholder={`Enter ${field.toLowerCase()}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  data-testid={`risk-${field.toLowerCase().replace(" ", "-")}-input`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Risk Factors</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentFactor}
                onChange={(e) => setCurrentFactor(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addRiskFactor()}
                placeholder="E.g., Family history of diabetes"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                data-testid="risk-factor-input"
              />
              <button
                onClick={addRiskFactor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                data-testid="add-risk-factor-btn"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {riskFactors.map((factor, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  {factor}
                  <button onClick={() => setRiskFactors(riskFactors.filter((_, i) => i !== idx))} className="ml-2">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={predictRisk}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            data-testid="predict-risk-btn"
          >
            {loading ? "Predicting..." : "Predict Disease Risk"}
          </button>
        </div>

        <div>
          {riskAssessment ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6" data-testid="risk-assessment-result">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Risk Assessment</h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{riskAssessment}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 mx-auto mb-3" />
                <p>Enter patient data to predict disease risks</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TreatmentRecommendation() {
  const [diagnosis, setDiagnosis] = useState("");
  const [patientInfo, setPatientInfo] = useState({});
  const [severity, setSeverity] = useState("moderate");
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const getTreatment = async () => {
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/diagnosis/treatment-recommendation`, {
        diagnosis,
        patient_info: patientInfo,
        severity
      });
      setTreatmentPlan(response.data.treatment_plan);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to get treatment recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="treatment-recommendation">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="E.g., Type 2 Diabetes, Hypertension"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="treatment-diagnosis-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={patientInfo.age || ""}
                onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                data-testid="treatment-age-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={patientInfo.gender || ""}
                onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                data-testid="treatment-gender-select"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="treatment-severity-select"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies / Contraindications</label>
            <textarea
              value={patientInfo.allergies || ""}
              onChange={(e) => setPatientInfo({ ...patientInfo, allergies: e.target.value })}
              placeholder="Any allergies or medications to avoid..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="treatment-allergies-input"
            />
          </div>

          <button
            onClick={getTreatment}
            disabled={loading || !diagnosis.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            data-testid="get-treatment-btn"
          >
            {loading ? "Generating..." : "Get Treatment Recommendations"}
          </button>
        </div>

        <div>
          {treatmentPlan ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6" data-testid="treatment-plan-result">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Treatment Plan</h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{treatmentPlan}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-3" />
                <p>Enter diagnosis to get treatment recommendations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// PATIENT CARE MODULE
// ===========================
function PatientCare({ userId }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <div className="space-y-6" data-testid="patient-care-module">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Care & Monitoring</h2>
        <div className="flex space-x-4 border-b border-gray-200">
          {["dashboard", "medications", "vitals"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`care-tab-${tab}`}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" && <CareDashboard userId={userId} />}
      {activeTab === "medications" && <MedicationTracker userId={userId} />}
      {activeTab === "vitals" && <VitalsMonitor userId={userId} />}
    </div>
  );
}

function CareDashboard({ userId }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/care/dashboard/${userId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6" data-testid="care-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <Pill className="h-8 w-8 mb-2" />
          <p className="text-3xl font-bold">{dashboardData?.medications?.length || 0}</p>
          <p className="text-blue-100">Active Medications</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <Activity className="h-8 w-8 mb-2" />
          <p className="text-3xl font-bold">{dashboardData?.health_metrics?.length || 0}</p>
          <p className="text-green-100">Recent Vitals</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <Brain className="h-8 w-8 mb-2" />
          <p className="text-3xl font-bold">{dashboardData?.mood_history?.length || 0}</p>
          <p className="text-purple-100">Mood Entries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Medications</h3>
          <div className="space-y-2">
            {dashboardData?.medications?.slice(0, 5).map((med, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{med.medication_name}</p>
                  <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                </div>
              </div>
            )) || <p className="text-gray-500 text-center py-4">No medications tracked</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Vitals</h3>
          <div className="space-y-2">
            {dashboardData?.health_metrics?.slice(0, 5).map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{metric.metric_type.replace("_", " ")}</p>
                  <p className="text-sm text-gray-600">{metric.value} {metric.unit}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(metric.timestamp).toLocaleDateString()}
                </span>
              </div>
            )) || <p className="text-gray-500 text-center py-4">No vitals recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicationTracker({ userId }) {
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    start_date: "",
    reminders: []
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await axios.get(`${API}/care/medications/${userId}`);
      setMedications(response.data.medications || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  const saveMedication = async () => {
    try {
      await axios.post(`${API}/care/medications`, {
        user_id: userId,
        ...formData
      });
      alert("Medication added successfully!");
      setShowForm(false);
      setFormData({ medication_name: "", dosage: "", frequency: "", start_date: "", reminders: [] });
      fetchMedications();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add medication.");
    }
  };

  const deleteMedication = async (medId) => {
    if (!window.confirm("Delete this medication?")) return;
    
    try {
      await axios.delete(`${API}/care/medications/${medId}`);
      fetchMedications();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="medication-tracker">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">My Medications</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
          data-testid="add-medication-toggle-btn"
        >
          <Plus className="h-5 w-5" />
          <span>Add Medication</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Medication Name"
              value={formData.medication_name}
              onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="new-medication-name-input"
            />
            <input
              type="text"
              placeholder="Dosage (e.g., 500mg)"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="new-medication-dosage-input"
            />
            <input
              type="text"
              placeholder="Frequency (e.g., Twice daily)"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="new-medication-frequency-input"
            />
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="new-medication-start-date-input"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={saveMedication}
              disabled={!formData.medication_name || !formData.dosage}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              data-testid="save-medication-btn"
            >
              Save Medication
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {medications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No medications added yet</p>
        ) : (
          medications.map((med) => (
            <div key={med.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{med.medication_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Dosage: {med.dosage}</p>
                  <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                  <p className="text-sm text-gray-600">Started: {med.start_date}</p>
                </div>
                <button
                  onClick={() => deleteMedication(med.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VitalsMonitor({ userId }) {
  const [metrics, setMetrics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    metric_type: "blood_pressure",
    value: "",
    unit: ""
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API}/care/health-metrics/${userId}`);
      setMetrics(response.data.metrics || []);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const saveMetric = async () => {
    try {
      await axios.post(`${API}/care/health-metrics`, {
        user_id: userId,
        ...formData
      });
      alert("Vital saved successfully!");
      setShowForm(false);
      setFormData({ metric_type: "blood_pressure", value: "", unit: "" });
      fetchMetrics();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save vital.");
    }
  };

  const metricTypes = [
    { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg" },
    { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
    { value: "glucose", label: "Blood Glucose", unit: "mg/dL" },
    { value: "weight", label: "Weight", unit: "kg" },
    { value: "temperature", label: "Temperature", unit: "°C" },
    { value: "oxygen_saturation", label: "Oxygen Saturation", unit: "%" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6" data-testid="vitals-monitor">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Health Vitals</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
          data-testid="add-vital-toggle-btn"
        >
          <Plus className="h-5 w-5" />
          <span>Record Vital</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={formData.metric_type}
              onChange={(e) => {
                const selected = metricTypes.find(m => m.value === e.target.value);
                setFormData({ ...formData, metric_type: e.target.value, unit: selected?.unit || "" });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="metric-type-select"
            >
              {metricTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="metric-value-input"
            />
            <input
              type="text"
              placeholder="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              data-testid="metric-unit-input"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={saveMetric}
              disabled={!formData.value}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              data-testid="save-metric-btn"
            >
              Save Vital
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.length === 0 ? (
          <p className="text-gray-500 text-center py-8 col-span-2">No vitals recorded yet</p>
        ) : (
          metrics.map((metric, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">
                  {metric.metric_type.replace("_", " ")}
                </h4>
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{metric.value} {metric.unit}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(metric.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
