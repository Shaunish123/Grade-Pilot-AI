import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';

const GradeWithKeyPage = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [answerKeyUrl, setAnswerKeyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGradeAll = async () => {
    if (!answerKeyUrl.trim()) {
      setError('Please provide an answer key URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Navigate to submissions page with answer key URL
      // Individual submissions will be graded there using /api/grade endpoint
      navigate(`/course/${courseId}/assignment/${assignmentId}/submissions`, {
        state: { 
          answerKeyUrl: answerKeyUrl,
          useAnswerKey: true
        }
      });
    } catch (err) {
      console.error('Error navigating:', err);
      setError('Failed to proceed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '3rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <button
          onClick={() => navigate(`/course/${courseId}/assignment/${assignmentId}/grade`)}
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--primary-text)',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
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
          Grade with Provided Key
        </h1>
        <p style={{ 
          fontSize: '1.1rem',
          color: 'var(--secondary-text)',
          lineHeight: '1.6'
        }}>
          Provide an answer key from Google Drive to grade all submissions with your custom ML model
        </p>
      </div>

      {/* Main Content Card */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '12px',
        padding: '3rem',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.75rem',
            fontSize: '1.1rem',
            fontWeight: '500',
            color: 'var(--primary-text)'
          }}>
            Answer Key URL (Google Drive)
          </label>
          <input
            type="text"
            value={answerKeyUrl}
            onChange={(e) => setAnswerKeyUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              border: '2px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'var(--background)',
              color: 'var(--primary-text)',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--secondary-text)'
          }}>
            Paste the Google Drive URL of your answer key document
          </p>
        </div>

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

        <button
          onClick={handleGradeAll}
          disabled={loading || !answerKeyUrl.trim()}
          style={{
            width: '100%',
            padding: '1.25rem',
            fontSize: '1.2rem',
            fontWeight: '600',
            backgroundColor: loading || !answerKeyUrl.trim() ? 'var(--border)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !answerKeyUrl.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
          onMouseOver={(e) => {
            if (!loading && answerKeyUrl.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
              Grading All Submissions...
            </>
          ) : (
            <>
              <span>✓</span>
              Grade All Submissions
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px'
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
          <li>Your custom ML model will be used for grading</li>
          <li>The answer key will be downloaded from Google Drive</li>
          <li>All student submissions will be graded automatically</li>
          <li>Results will be displayed with detailed feedback</li>
        </ul>
      </div>
    </div>
  );
};

export default GradeWithKeyPage;
