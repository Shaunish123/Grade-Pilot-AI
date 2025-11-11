# Workflow Redesign - Grade Without Key

## Summary
Redesigned the "Grade without Key" workflow to:
1. Generate an AI answer key with Gemini
2. Navigate to the original two-column submissions page
3. Use the AI-generated answer key for individual submission grading

This replaces the previous batch grading approach with individual grading using the existing UI.

---

## Changes Made

### 1. Backend Changes (`backend/app.py`)

#### Modified `/api/grade` Endpoint
- **Added Parameter**: `answer_key_text` (optional string)
- **Logic Update**: 
  ```python
  answer_key_url = data.get('answer_key_url')
  answer_key_text = data.get('answer_key_text')
  
  if answer_key_text:
      answer_key_content = answer_key_text  # Use text directly
  else:
      # Download from URL (original behavior)
      answer_key_content = download_drive_file_content(...)
  ```
- **Purpose**: Accept answer key as either URL or direct text content

---

### 2. Frontend Changes

#### A. `SubmissionsPage.jsx`
**Added Navigation State Reception:**
```javascript
import { useLocation } from 'react-router-dom';

const location = useLocation();
const generatedAnswerKey = location.state?.generatedAnswerKey || null;
```

**Passed to SubmissionDetail:**
```javascript
<SubmissionDetail 
  generatedAnswerKey={generatedAnswerKey}
  // ... other props
/>
```

---

#### B. `SubmissionDetail.jsx` (Major Updates)

**1. New State Management:**
```javascript
const [answerKeyText, setAnswerKeyText] = useState(generatedAnswerKey || '');
const [useTextKey, setUseTextKey] = useState(!!generatedAnswerKey);
```

**2. Updated `gradeSubmission` Function:**
```javascript
const payload = {
  course_id: courseId,
  assignment_id: assignmentId,
  submission_id: submissionId
};

if (useTextKey) {
  payload.answer_key_text = answerKeyText;
} else {
  payload.answer_key_url = answerKeyUrl;
}
```

**3. New UI - Dual Mode Display:**

**When using AI-generated key (`useTextKey=true`):**
- Shows editable textarea with answer key text
- Green border indicating AI-generated content
- Success message: "✓ Using AI-generated answer key for grading"
- "Switch to URL Input" button to revert to URL mode

**When using URL (`useTextKey=false`):**
- Shows original URL input field
- Standard border styling
- Placeholder: "Paste Google Drive URL"

**4. Updated "Grade All" Button Logic:**
```javascript
disabled={
  batchGrading || 
  gradingSubmissions.size > 0 || 
  (!useTextKey && !answerKeyUrl) || 
  (useTextKey && !answerKeyText)
}
```

---

#### C. `GradeWithoutKeyPage.jsx`

**1. Simplified State:**
```javascript
// Removed: gradingResults state
// Removed: 'grading' and 'complete' from step enum
const [step, setStep] = useState('initial'); // Now: initial, review only
```

**2. Updated `handleApproveAndGrade` Function:**
```javascript
const handleApproveAndGrade = async () => {
  // Navigate to submissions page with generated answer key
  navigate(`/course/${courseId}/assignment/${assignmentId}/submissions`, {
    state: { generatedAnswerKey: answerKey }
  });
};
```

**3. Removed Unnecessary Code:**
- ❌ Deleted `handleViewResults` function
- ❌ Removed "Step 3: Grading in Progress" UI section
- ❌ Removed "Step 4: Complete" UI section
- ❌ Removed batch grading API call

**4. Updated Step Indicator:**
- Changed from 3 steps to 2 steps:
  1. **Generate Key** (initial step)
  2. **Review & Approve** (review step)
- Removed "Grade" step (now handled on submissions page)

**5. Updated Button Label:**
- Changed from: `"✓ Approve and Grade All"`
- Changed to: `"✓ Approve and Continue to Grading"`

---

## User Flow

### New Workflow:
1. **Generate Answer Key** (GradeWithoutKeyPage)
   - Click "Generate Answer Key with AI"
   - Gemini analyzes assignment materials and generates key

2. **Review & Refine** (GradeWithoutKeyPage)
   - View generated answer key
   - Optionally edit manually or provide feedback for AI refinement
   - Click "Regenerate with Feedback" if needed

3. **Approve & Navigate** (GradeWithoutKeyPage)
   - Click "Approve and Continue to Grading"
   - **Navigates to SubmissionsPage** with answer key in state

4. **Individual Grading** (SubmissionsPage)
   - See two-column layout with answer key displayed on left
   - Answer key shown in editable textarea with green border
   - Grade submissions individually by clicking cards
   - OR use "Grade All Submissions" to batch grade

---

## Technical Details

### Navigation State Passing
```javascript
// From GradeWithoutKeyPage
navigate(`/course/${courseId}/assignment/${assignmentId}/submissions`, {
  state: { generatedAnswerKey: answerKey }
});

// To SubmissionsPage
const location = useLocation();
const generatedAnswerKey = location.state?.generatedAnswerKey || null;
```

### API Payload Switching
```javascript
// URL Mode
{
  "course_id": "12345",
  "assignment_id": "67890",
  "submission_id": "111",
  "answer_key_url": "https://drive.google.com/..."
}

// Text Mode (NEW)
{
  "course_id": "12345",
  "assignment_id": "67890",
  "submission_id": "111",
  "answer_key_text": "1. A\n2. B\n3. C\n..."
}
```

---

## Benefits

1. **Unified UI**: Reuses existing two-column submissions interface
2. **Flexibility**: Teachers can edit AI-generated key before grading
3. **Individual Control**: Grade submissions one-by-one or batch
4. **Visual Feedback**: Green border and checkmark indicate AI key usage
5. **Mode Switching**: Can switch between AI-generated and URL-based keys
6. **Backward Compatible**: Original URL workflow still works

---

## Testing Checklist

- [ ] Generate answer key in GradeWithoutKeyPage
- [ ] Verify navigation to SubmissionsPage with key
- [ ] Confirm answer key displays in textarea with green border
- [ ] Test editing answer key text
- [ ] Grade individual submission with AI key
- [ ] Test "Grade All" with AI key
- [ ] Switch from text mode to URL mode
- [ ] Verify URL mode still works
- [ ] Check error handling for missing answer key
- [ ] Test regenerate with feedback workflow

---

## Files Modified

1. `backend/app.py` - Added `answer_key_text` parameter support
2. `frontend/src/pages/SubmissionsPage.jsx` - Added navigation state reception
3. `frontend/src/components/SubmissionDetail.jsx` - Dual-mode UI and logic
4. `frontend/src/pages/GradeWithoutKeyPage.jsx` - Navigation instead of batch grading

---

## Notes

- The AI-generated answer key can be edited before grading
- The "Switch to URL Input" button allows reverting to URL-based workflow
- Grade All button validates presence of either URL or text key
- Backend automatically detects which parameter is provided
