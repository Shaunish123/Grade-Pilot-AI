// frontend/src/components/SubmissionDetail.jsx
import React, { useState } from 'react';

function SubmissionDetail({ selectedCourse, selectedAssignment, selectedSubmission, onBack, API }) {
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [gradingStatus, setGradingStatus] = useState(null); // To show messages like 'Grading...' or 'Grade Complete!'
  const [gradeResult, setGradeResult] = useState(null); // To store the AI's grade and feedback
  const [gradedHistory, setGradedHistory] = useState([]); // To store the history of graded items

  const handleGradeSubmission = async () => {
    if (!answerKeyUrl) {
      alert("Please provide an Answer Key URL.");
      return;
    }

    setGradingStatus('Grading with AI...');
    setGradeResult(null); // Clear previous results
    try {
      const response = await API.post('/api/grade', {
        course_id: selectedCourse.id,
        course_name: selectedCourse.name, // Pass name for history
        assignment_id: selectedAssignment.id,
        assignment_title: selectedAssignment.title, // Pass title for history
        submission_id: selectedSubmission.id,
        student_name: selectedSubmission.studentName, // Pass student name for history
        answer_key_url: answerKeyUrl,
      });
      setGradingStatus('Grading complete!');
      setGradeResult(response.data);
      setGradedHistory(response.data.graded_history); // Update history from backend response
    } catch (err) {
      console.error("Error grading submission:", err);
      setGradingStatus(`Grading failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // When the component mounts, or selectedSubmission changes, maybe fetch previous grade?
  // Or if you only want to display grades after they're generated, this is fine.
  // For now, let's keep it simple and just show new grades.

  return (
    <div className="submission-detail-card">
      <button onClick={onBack} className="back-button">← Back to Submissions</button>
      
      {/* THIS IS THE PART FROM YOUR SCREENSHOT */}
      <div className="submission-info">
        <p><span className="label">Student:</span> <span className="value student-name">{selectedSubmission.studentName || selectedSubmission.userId}</span></p>
        <p><span className="label">Submission ID:</span> <span className="value">{selectedSubmission.id}</span></p>
        <p><span className="label">Status:</span> <span className="value">{selectedSubmission.state}</span></p>
        {selectedSubmission.assignmentSubmission?.attachments?.length > 0 && (
          <p>
            <span className="label">Student's Document:</span>
            <a 
              href={selectedSubmission.assignmentSubmission.attachments[0].driveFile.alternateLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="view-document-link"
            >
              View Document
            </a>
          </p>
        )}
      </div>

      <div className="grading-section">
        <h4 className="grading-header">Provide Answer Key URL:</h4>
        <input
          type="text"
          className="answer-key-input"
          placeholder="Paste Google Drive Answer Key URL here"
          value={answerKeyUrl}
          onChange={(e) => setAnswerKeyUrl(e.target.value)}
        />
        <button 
          onClick={handleGradeSubmission} 
          className="grade-button"
          disabled={!answerKeyUrl || gradingStatus === 'Grading with AI...'}
        >
          Grade with AI
        </button>
        {gradingStatus && <p className="grading-status-message">{gradingStatus}</p>}
      </div>

      {gradeResult && (
        <div className="grade-results">
          <h4 className="results-header">AI Grading Results:</h4>
          <p><span className="label">Grade:</span> <span className="grade-score">{gradeResult.assignedGrade}/100</span></p>
          <p><span className="label">Justification:</span> {gradeResult.grade_justification}</p>
          <p><span className="label">Feedback:</span></p>
          <div className="feedback-content" dangerouslySetInnerHTML={{ __html: gradeResult.feedback.replace(/\n/g, '<br/>') }}></div>
        </div>
      )}

      {/* You could add a section here to display gradedHistory if desired */}
      {/* {gradedHistory.length > 0 && (
        <div className="graded-history-section mt-8">
          <h4 className="text-xl font-semibold mb-2">Recent Graded Items:</h4>
          <ul>
            {gradedHistory.map((item, index) => (
              <li key={index} className="mb-1 text-sm text-gray-700">
                {item.timestamp}: {item.student_name} - {item.assignment_title} - Grade: {item.assignedGrade}/100
              </li>
            ))}
          </ul>
        </div>
      )}
      */}
    </div>
  );
}

export default SubmissionDetail;