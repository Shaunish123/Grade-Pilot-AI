import React, { useState, useEffect } from 'react';
import { API } from '../App';

function SubmissionDetail({ courseId, courseName, assignmentId, assignmentTitle, generatedAnswerKey }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingSubmissions, setGradingSubmissions] = useState(new Set());
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState(generatedAnswerKey || '');
  const [gradingResults, setGradingResults] = useState({});
  const [batchGrading, setBatchGrading] = useState(false);
  const [useTextKey, setUseTextKey] = useState(!!generatedAnswerKey); // true if we have a generated key
  const [exportingToSheet, setExportingToSheet] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        
        // Fetch submissions from Google Classroom
        const response = await API.get(
          `/api/courses/${courseId}/assignments/${assignmentId}/submissions`
        );
        setSubmissions(response.data);
        
        // Fetch graded history from MongoDB for this specific assignment
        const historyResponse = await API.get(
          `/api/graded_history?course_id=${courseId}&assignment_id=${assignmentId}`
        );
        const gradedHistory = historyResponse.data;
        
        // Map graded history to submissions by submission_id
        const submissionsWithGrades = {};
        gradedHistory.forEach(gradeRecord => {
          submissionsWithGrades[gradeRecord.submission_id] = {
            assignedGrade: gradeRecord.assignedGrade,
            feedback: gradeRecord.feedback || 'No feedback available',
            grade_justification: gradeRecord.grade_justification || 'No justification available',
            status: 'complete'
          };
        });
        
        setGradingResults(submissionsWithGrades);
        console.log(`✅ Loaded ${Object.keys(submissionsWithGrades).length} graded submissions from MongoDB`);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to load submissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [courseId, assignmentId]);
  
  // Update answer key text when generatedAnswerKey prop changes
  useEffect(() => {
    if (generatedAnswerKey) {
      setAnswerKeyText(generatedAnswerKey);
      setUseTextKey(true);
    }
  }, [generatedAnswerKey]);

  const gradeSubmission = async (submissionId, studentName) => {
    try {
      // Check if we have either URL or text
      if (!useTextKey && !answerKeyUrl) {
        alert("Please provide an Answer Key URL.");
        return false;
      }
      
      if (useTextKey && !answerKeyText) {
        alert("Answer key text is missing.");
        return false;
      }

      setGradingSubmissions(prev => new Set(prev).add(submissionId));
      
      // Prepare payload based on what we have
      const payload = {
        course_id: courseId,
        course_name: courseName,
        assignment_id: assignmentId,
        assignment_title: assignmentTitle,
        submission_id: submissionId,
        student_name: studentName
      };
      
      // Add either answer_key_text or answer_key_url
      if (useTextKey) {
        payload.answer_key_text = answerKeyText;
      } else {
        payload.answer_key_url = answerKeyUrl;
      }
      
      const response = await API.post('/api/grade', payload);
      
      setGradingResults(prev => ({
        ...prev,
        [submissionId]: {
          assignedGrade: response.data.assignedGrade,
          feedback: response.data.feedback,
          grade_justification: response.data.grade_justification,
          status: 'complete'
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error grading submission:', error);
      setGradingResults(prev => ({
        ...prev,
        [submissionId]: {
          status: 'error',
          error: error.response?.data?.error || error.message
        }
      }));
      return false;
    } finally {
      setGradingSubmissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const handleGrade = (submissionId, studentName) => {
    gradeSubmission(submissionId, studentName);
  };

  const handleGradeAll = async () => {
    // Check if we have either URL or text
    if (!useTextKey && !answerKeyUrl) {
      alert("Please provide an Answer Key URL.");
      return;
    }
    
    if (useTextKey && !answerKeyText) {
      alert("Answer key text is missing.");
      return;
    }

    setBatchGrading(true);

    try {
      for (const submission of submissions) {
        // Grade all submissions (allows re-grading)
        await gradeSubmission(submission.id, submission.studentName);
      }
    } finally {
      setBatchGrading(false);
    }
  };

  const handleExportToSheet = async () => {
    // Check if there are any graded submissions
    const gradedSubmissions = Object.entries(gradingResults)
      .filter(([, result]) => result.status === 'complete')
      .map(([submissionId, result]) => {
        const submission = submissions.find(s => s.id === submissionId);
        return {
          student_name: submission?.studentName || 'Unknown Student',
          assignedGrade: result.assignedGrade,
          feedback: result.feedback
        };
      });

    if (gradedSubmissions.length === 0) {
      alert("No graded submissions to export. Please grade some submissions first.");
      return;
    }

    setExportingToSheet(true);
    setExportedSheetUrl(null);

    try {
      const response = await API.post('/api/export-grades-to-sheet', {
        course_name: courseName,
        assignment_title: assignmentTitle,
        graded_submissions: gradedSubmissions
      });

      setExportedSheetUrl(response.data.spreadsheet_url);
      alert(`Successfully exported ${response.data.student_count} graded submissions to Google Sheets!`);
    } catch (error) {
      console.error('Error exporting to sheet:', error);
      alert(error.response?.data?.error || 'Failed to export grades to Google Sheets. Please try again.');
    } finally {
      setExportingToSheet(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '2rem'
      }}>
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: '2rem',
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Left Column - Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '1.5rem'
          }}>
            Grade Control Panel
          </h3>
          <div style={{ marginBottom: '2rem' }}>
            {useTextKey ? (
              <>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--secondary-text)',
                  marginBottom: '0.75rem'
                }}>
                  AI-Generated Answer Key:
                </label>
                <textarea
                  value={answerKeyText}
                  onChange={(e) => setAnswerKeyText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    backgroundColor: 'var(--background)',
                    border: '2px solid var(--success)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    lineHeight: '1.6'
                  }}
                  placeholder="AI-generated answer key"
                />
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--success)',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  ✓ Using AI-generated answer key for grading
                </p>
                <button
                  onClick={() => {
                    setUseTextKey(false);
                    setAnswerKeyText('');
                  }}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--secondary-text)',
                    cursor: 'pointer'
                  }}
                >
                  Switch to URL Input
                </button>
              </>
            ) : (
              <>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: 'var(--secondary-text)',
                  marginBottom: '0.75rem'
                }}>
                  Answer Key URL:
                </label>
                <input
                  type="text"
                  value={answerKeyUrl}
                  onChange={(e) => setAnswerKeyUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--primary-text)',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Paste Google Drive URL"
                />
              </>
            )}
          </div>

          {batchGrading && (
            <div style={{ 
              textAlign: 'center',
              marginBottom: '1rem',
              color: 'var(--secondary-text)'
            }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '0.5rem' }}>Grading all submissions...</p>
            </div>
          )}

          <button
            onClick={handleGradeAll}
            disabled={batchGrading || gradingSubmissions.size > 0 || (!useTextKey && !answerKeyUrl) || (useTextKey && !answerKeyText)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: ((useTextKey && answerKeyText) || (!useTextKey && answerKeyUrl)) ? 'var(--success)' : 'var(--surface)',
              color: ((useTextKey && answerKeyText) || (!useTextKey && answerKeyUrl)) ? '#fff' : 'var(--primary-text)',
              border: `1px solid ${((useTextKey && answerKeyText) || (!useTextKey && answerKeyUrl)) ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: ((useTextKey && answerKeyText) || (!useTextKey && answerKeyUrl)) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: (batchGrading || gradingSubmissions.size > 0) ? '0.7' : '1',
              marginBottom: '1rem'
            }}
          >
            {batchGrading ? 'Grading All...' : 'Grade All Submissions'}
          </button>

          {/* Export to Google Sheets Button */}
          <button
            onClick={handleExportToSheet}
            disabled={exportingToSheet || Object.values(gradingResults).filter(r => r.status === 'complete').length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: Object.values(gradingResults).filter(r => r.status === 'complete').length > 0 ? '#10a37f' : 'var(--surface)',
              color: Object.values(gradingResults).filter(r => r.status === 'complete').length > 0 ? '#fff' : 'var(--primary-text)',
              border: `1px solid ${Object.values(gradingResults).filter(r => r.status === 'complete').length > 0 ? '#10a37f' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: Object.values(gradingResults).filter(r => r.status === 'complete').length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: exportingToSheet ? '0.7' : '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {exportingToSheet ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                Exporting...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export to Google Sheets
                <span style={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {Object.values(gradingResults).filter(r => r.status === 'complete').length}
                </span>
              </>
            )}
          </button>

          {/* Show link to exported sheet if available */}
          {exportedSheetUrl && (
            <a
              href={exportedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem',
                padding: '0.5rem',
                color: '#10a37f',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                backgroundColor: 'rgba(16, 163, 127, 0.1)',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 163, 127, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 163, 127, 0.1)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View Exported Sheet
            </a>
          )}
        </div>
        
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid var(--border)'
        }}>
          <p style={{
            color: 'var(--secondary-text)',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            Total Submissions: <span style={{ color: 'var(--primary-text)', fontWeight: '600' }}>{submissions.length}</span>
          </p>
          <p style={{
            color: 'var(--secondary-text)',
            fontSize: '0.9rem',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}>
            Graded: <span style={{ color: '#10b981', fontWeight: '600' }}>
              {Object.values(gradingResults).filter(r => r.status === 'complete').length}
            </span>
          </p>
        </div>
      </div>

      {/* Right Column - Submissions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {submissions.map((submission) => {
          const gradingResult = gradingResults[submission.id];
          const isGrading = gradingSubmissions.has(submission.id);
          const isGraded = gradingResult?.status === 'complete';
          // Check if answer key is available for grading
          const canGrade = (useTextKey && answerKeyText) || (!useTextKey && answerKeyUrl);

          return (
            <div
              key={submission.id}
              style={{ 
                backgroundColor: isGraded ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: isGraded ? '2px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                borderLeft: `4px solid ${isGraded ? '#10b981' : 'var(--border)'}`,
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                  {isGraded && (
                    <div style={{
                      display: 'inline-block',
                      marginBottom: '0.75rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '0.375rem 0.875rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}>
                      ✓ Already Graded
                    </div>
                  )}
                  <h2 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    marginBottom: '0.75rem', 
                    color: 'var(--primary-text)' 
                  }}>
                    {submission.studentName}
                  </h2>
                  <p style={{ color: 'var(--secondary-text)', marginBottom: '0.5rem' }}>
                    Submitted: {new Date(submission.submissionTime).toLocaleString()}
                  </p>
                  {submission.assignmentSubmission?.attachments?.length > 0 && (
                    <a 
                      href={submission.assignmentSubmission.attachments[0].driveFile.alternateLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--surface-hover)',
                        color: 'var(--primary-text)',
                        borderRadius: '4px',
                        textDecoration: 'none'
                      }}
                    >
                      View Submission
                    </a>
                  )}
                  
                  {/* Grading Results Section */}
                  {gradingResult && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '1.25rem',
                      backgroundColor: gradingResult.status === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-hover)',
                      borderRadius: '12px',
                      border: gradingResult.status === 'complete' ? '2px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)'
                    }}>
                      {gradingResult.status === 'complete' ? (
                        <>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            marginBottom: '1.25rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            <span style={{ 
                              fontSize: '2rem',
                              color: '#10b981'
                            }}>
                              ✓
                            </span>
                            <div>
                              <p style={{ 
                                color: '#10b981', 
                                fontWeight: '700', 
                                fontSize: '1.5rem',
                                marginBottom: '0.25rem'
                              }}>
                                {gradingResult.assignedGrade}/100
                              </p>
                              <p style={{ 
                                color: 'var(--secondary-text)', 
                                fontSize: '0.85rem'
                              }}>
                                Graded and Saved
                              </p>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ fontSize: '1.25rem' }}>📝</span>
                              <strong style={{ 
                                color: 'var(--primary-text)',
                                fontSize: '1.05rem'
                              }}>
                                Grade Justification:
                              </strong>
                            </div>
                            <p style={{ 
                              color: 'var(--secondary-text)', 
                              marginLeft: '2rem',
                              lineHeight: '1.6',
                              backgroundColor: 'var(--surface)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)'
                            }}>
                              {gradingResult.grade_justification}
                            </p>
                          </div>
                          
                          <div>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ fontSize: '1.25rem' }}>💬</span>
                              <strong style={{ 
                                color: 'var(--primary-text)',
                                fontSize: '1.05rem'
                              }}>
                                Student Feedback:
                              </strong>
                            </div>
                            <p style={{ 
                              color: 'var(--secondary-text)', 
                              marginLeft: '2rem',
                              lineHeight: '1.6',
                              backgroundColor: 'var(--surface)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border)'
                            }}>
                              {gradingResult.feedback}
                            </p>
                          </div>
                        </>
                      ) : gradingResult.status === 'error' ? (
                        <div style={{ color: 'var(--error)' }}>
                          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Error during grading:</p>
                          <p>{gradingResult.error}</p>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--secondary-text)' }}>Grading in progress...</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => handleGrade(submission.id, submission.studentName)}
                    disabled={isGrading || batchGrading || !canGrade}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      backgroundColor: isGrading ? 'var(--surface)' : 
                                   isGraded ? '#f59e0b' : 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (isGrading || batchGrading || !canGrade) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: (isGrading || !canGrade) ? '0.7' : '1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '600'
                    }}
                  >
                    {isGrading ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        <span>Grading...</span>
                      </>
                    ) : isGraded ? (
                      '🔄 Re-Grade'
                    ) : (
                      '✓ Grade Submission'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {submissions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--secondary-text)',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            No submissions available for this assignment.
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmissionDetail;