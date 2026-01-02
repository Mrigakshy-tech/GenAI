# Symptom Checker - User Guide

## ✅ How to Use the Analyze Symptoms Feature

### Step-by-Step Instructions:

**1. Add Symptoms**
   - Type a symptom in the input field (e.g., "headache", "fever", "cough")
   - Click the blue **+** button OR press **Enter** to add it
   - Your symptom will appear as a blue tag below
   - Add multiple symptoms by repeating this process
   - To remove a symptom, click the **X** on its tag

**2. Select Severity**
   - Choose from the dropdown: **Mild**, **Moderate**, or **Severe**
   - Default is set to "Moderate"

**3. Enter Duration** ⚠️ **REQUIRED**
   - Type how long you've had these symptoms
   - Examples: "2 days", "1 week", "3 hours", "Started yesterday"
   - This field is **required** for analysis

**4. Additional Information (Optional)**
   - Add any extra context that might be helpful
   - Examples:
     - "Started after eating seafood"
     - "Have been traveling"
     - "Exposed to sick person"
     - "Taking new medication"

**5. Click "Analyze Symptoms"**
   - Button will be **disabled** (grayed out) if:
     - ❌ No symptoms added
     - ❌ Duration field is empty
   - Button will be **enabled** (blue) when:
     - ✅ At least 1 symptom added
     - ✅ Duration field filled
   - Click the button to get AI analysis

**6. View Results**
   - Analysis appears in the right panel
   - Results include:
     - Possible conditions (ranked by likelihood)
     - Severity assessment
     - Recommended actions
     - When to seek immediate medical attention

---

## 🔍 Troubleshooting

### Button Not Working?

**Check these requirements:**

1. ✅ **At least 1 symptom added**
   - You should see blue symptom tags below the input field
   - If not, type a symptom and click the + button

2. ✅ **Duration field filled**
   - The "Duration" field must have text
   - Type something like "2 days" or "1 week"

3. ✅ **Helper messages**
   - If requirements not met, you'll see a red warning message:
     - "⚠️ Please add at least one symptom"
     - "⚠️ Please enter symptom duration"

4. ✅ **Loading state**
   - Once clicked, button shows "Analyzing..."
   - Wait for AI response (takes 15-30 seconds)
   - Don't click multiple times

---

## 💡 Example Usage

### Example 1: Common Cold
```
Symptoms: fever, cough, runny nose
Severity: Mild
Duration: 3 days
Additional Info: Started after being around sick coworkers
```

### Example 2: Migraine
```
Symptoms: severe headache, nausea, light sensitivity
Severity: Severe
Duration: 6 hours
Additional Info: Happens frequently, worse with stress
```

### Example 3: Flu Symptoms
```
Symptoms: high fever, body aches, fatigue, sore throat
Severity: Moderate
Duration: 2 days
Additional Info: Started suddenly yesterday morning
```

---

## ⚡ Quick Tips

✅ **Be specific** with symptom names (e.g., "sharp chest pain" vs "pain")

✅ **Add multiple symptoms** for better analysis

✅ **Include timing** in duration (hours, days, weeks)

✅ **Use additional info** for context (travel, exposure, diet)

✅ **Wait for response** - AI analysis takes 15-30 seconds

✅ **Read full analysis** - includes important safety information

---

## ⚠️ Important Notes

- This is an **AI-powered tool** for information only
- **Not a replacement** for professional medical advice
- For **emergencies**, call 911 immediately
- For **urgent concerns**, contact your healthcare provider
- AI may recommend seeking medical attention based on symptoms

---

## 🔄 Backend API Status

The symptom analysis API is **fully operational** and tested:
- ✅ Endpoint: `POST /api/medical/symptoms`
- ✅ AI Model: OpenAI GPT-5.2
- ✅ Response Time: 15-30 seconds
- ✅ Database: Saves analysis for reference

**Test Confirmation:** Backend API successfully analyzed test symptoms and returned comprehensive medical analysis.

---

## 📱 Mobile Usage

- All fields work on mobile devices
- Touch-friendly buttons
- Responsive layout
- Same functionality as desktop

---

## 🆘 Still Having Issues?

If the button still doesn't work after following these steps:

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Clear browser cache**
3. **Check console** (F12 → Console tab) for errors
4. **Verify** symptoms are added (blue tags visible)
5. **Verify** duration is filled (text in the field)
6. **Try a different browser**

---

**Last Updated:** January 2026  
**Status:** ✅ Fully Functional
