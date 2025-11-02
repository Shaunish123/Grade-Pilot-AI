import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';

function SubmissionDetail({ courseId, courseName, assignmentId, assignmentTitle }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradingSubmissions, setGradingSubmissions] = useState(new Set());
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [gradingResults, setGradingResults] = useState({});
  const [batchGrading, setBatchGrading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          `/api/courses/${courseId}/assignments/${assignmentId}/submissions`
        );
        setSubmissions(response.data);
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

  const gradeSubmission = async (submissionId, studentName) => {
    try {
      if (!answerKeyUrl) {
        alert("Please provide an Answer Key URL.");
        return false;
      }

      setGradingSubmissions(prev => new Set(prev).add(submissionId));
      
      const response = await API.post('/api/grade', {
        course_id: courseId,
        course_name: courseName,
        assignment_id: assignmentId,
        assignment_title: assignmentTitle,
        submission_id: submissionId,
        student_name: studentName,
        answer_key_url: answerKeyUrl
      });
      
      // Store the grading results
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
    if (!answerKeyUrl) {
      alert("Please provide an Answer Key URL.");
      return;
    }

    setBatchGrading(true);

    try {
      for (const submission of submissions) {
        // Skip already graded submissions
        if (gradingResults[submission.id]?.status !== 'complete') {
          await gradeSubmission(submission.id, submission.studentName);
        }
      }
    } finally {
      setBatchGrading(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/course/${courseId}/assignments`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
            disabled={batchGrading || gradingSubmissions.size > 0 || !answerKeyUrl}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: answerKeyUrl ? 'var(--success)' : 'var(--surface)',
              color: answerKeyUrl ? '#fff' : 'var(--primary-text)',
              border: `1px solid ${answerKeyUrl ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: '6px',
              cursor: answerKeyUrl ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: (batchGrading || gradingSubmissions.size > 0) ? '0.7' : '1'
            }}
          >
            {batchGrading ? 'Grading All...' : 'Grade All Submissions'}
          </button>
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
        </div>
      </div>

      {/* Right Column - Submissions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {submissions.map((submission) => {
          const gradingResult = gradingResults[submission.id];
          const isGrading = gradingSubmissions.has(submission.id);

          return (
            <div
              key={submission.id}
              style={{ 
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${gradingResult?.status === 'complete' ? 'var(--success)' : 'var(--border)}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
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
                      className="btn"
                      style={{ display: 'inline-block', marginTop: '0.5rem' }}
                    >
                      View Submission
                    </a>
                  )}
                  
                  {/* Grading Results Section */}
                  {gradingResult && (
                    <div className="card" style={{ 
                      marginTop: '1rem',
                      backgroundColor: 'var(--surface-hover)',
                      border: 'none'
                    }}>
                      {gradingResult.status === 'complete' ? (
                        <>
                          <p style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '1rem' }}>
                            Grade: {gradingResult.assignedGrade}/100
                          </p>
                          <div style={{ marginBottom: '1rem' }}>
                            <strong style={{ color: 'var(--primary-text)' }}>Justification:</strong>
                            <p style={{ color: 'var(--secondary-text)', marginTop: '0.25rem' }}>
                              {gradingResult.grade_justification}
                            </p>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--primary-text)' }}>Feedback:</strong>
                            <p style={{ color: 'var(--secondary-text)', marginTop: '0.25rem' }}>
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
                    disabled={isGrading || batchGrading || !answerKeyUrl}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      backgroundColor: isGrading ? 'var(--surface)' : 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isGrading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isGrading ? '0.7' : '1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isGrading ? (
                      <>
                        <div className="loading-spinner-small" />
                        Grading...
                      </>
                    ) : (
                      'Grade Submission'
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SubmissionDetail;