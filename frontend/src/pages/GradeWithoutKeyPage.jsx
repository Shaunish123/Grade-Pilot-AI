import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';

const GradeWithoutKeyPage = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [step, setStep] = useState('initial'); // initial, review
  const [answerKey, setAnswerKey] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/api/generate-initial-key', {
        course_id: courseId,
        assignment_id: assignmentId
      });

      setAnswerKey(response.data.answer_key);
      setStep('review');
    } catch (err) {
      console.error('Error generating answer key:', err);
      setError(err.response?.data?.error || 'Failed to generate answer key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!feedback.trim()) {
      setError('Please provide feedback for refinement');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/api/refine-key', {
        course_id: courseId,
        assignment_id: assignmentId,
        current_key: answerKey,
        feedback: feedback
      });

      setAnswerKey(response.data.refined_key);
      setFeedback(''); // Clear feedback after successful refinement
    } catch (err) {
      console.error('Error refining answer key:', err);
      setError(err.response?.data?.error || 'Failed to refine answer key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndGrade = async () => {
    // Navigate to submissions page with the generated answer key
    navigate(`/course/${courseId}/assignment/${assignmentId}/submissions`, {
      state: { generatedAnswerKey: answerKey }
    });
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '3rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}/grade`)}
          disabled={loading}
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--primary-text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: loading ? 0.5 : 1
          }}
        >
          <span>←</span> Back to Grading Hub
        </button>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem'
        }}>
          Grade without Provided Key
        </h1>
        <p style={{ 
          fontSize: '1.1rem',
          color: 'var(--secondary-text)',
          lineHeight: '1.6'
        }}>
          Collaborate with Gemini AI to generate and refine an answer key
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '3rem',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: step === 'initial' ? 'var(--primary)' : 'var(--success)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            {step !== 'initial' ? '✓' : '1'}
          </div>
          <span style={{ fontWeight: '500', color: 'var(--primary-text)' }}>Generate Key</span>
        </div>
        
        <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--border)' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: step === 'review' ? 'var(--primary)' : 'var(--border)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            2
          </div>
          <span style={{ fontWeight: '500', color: 'var(--primary-text)' }}>Review & Approve</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'var(--error)',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      {/* Step 1: Generate Initial Key */}
      {step === 'initial' && (
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          padding: '3rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '1.5rem'
          }}>
            Step 1: Generate Answer Key
          </h2>
          
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--primary)',
              marginBottom: '0.75rem'
            }}>
              ℹ️ How it works
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              color: 'var(--secondary-text)',
              lineHeight: '1.8'
            }}>
              <li>The questionnaire attached to this assignment will be automatically extracted</li>
              <li>Gemini AI will analyze the questions and generate a comprehensive answer key</li>
              <li>You can then review, edit, or refine the generated answer key</li>
              <li>Once approved, it will be used to grade all student submissions</li>
            </ul>
          </div>

          <button
            onClick={handleGenerateKey}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1.25rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              backgroundColor: loading ? 'var(--border)' : 'var(--success)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                Generating Answer Key...
              </>
            ) : (
              <>
                <span>🤖</span>
                Generate Answer Key with Gemini AI
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Review and Refine Key */}
      {step === 'review' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '2rem'
        }}>
          {/* Left: Answer Key */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--primary-text)',
              marginBottom: '1rem'
            }}>
              Answer Key
            </h2>
            <textarea
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '500px',
                padding: '1rem',
                fontSize: '1rem',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--background)',
                color: 'var(--primary-text)',
                fontFamily: 'monospace',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Right: Refinement Panel */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--primary-text)'
            }}>
              Refinement
            </h2>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'var(--primary-text)'
              }}>
                Your Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., 'Question 3 answer should be more specific about...' or 'Add partial credit criteria for...'"
                disabled={loading}
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '1rem',
                  fontSize: '0.95rem',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--primary-text)',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <button
              onClick={handleRegenerateKey}
              disabled={loading || !feedback.trim()}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                backgroundColor: loading || !feedback.trim() ? 'var(--border)' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !feedback.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', display: 'inline-block', marginRight: '0.5rem' }}></div>
                  Regenerating...
                </>
              ) : (
                '🔄 Regenerate with Feedback'
              )}
            </button>

            <div style={{ height: '1px', backgroundColor: 'var(--border)' }}></div>

            <button
              onClick={handleApproveAndGrade}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.25rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                backgroundColor: loading ? 'var(--border)' : 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ✓ Approve and Continue to Grading
            </button>

            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: 'var(--secondary-text)',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: 'var(--primary)' }}>💡 Tip:</strong> You can manually edit the answer key or use the feedback box to have Gemini refine it for you.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeWithoutKeyPage;
