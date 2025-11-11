import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';

const GradingHubPage = () => {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fetch course details
        const courseResponse = await API.get(`/api/courses`);
        const course = courseResponse.data.find(c => c.id === courseId);
        
        // Fetch assignment details
        const assignmentResponse = await API.get(`/api/courses/${courseId}/assignments`);
        const assignment = assignmentResponse.data.find(a => a.id === assignmentId);
        
        setCourseDetails(course);
        setAssignmentDetails(assignment);
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [courseId, assignmentId]);

  const handlePathSelection = (path) => {
    if (path === 'with-key') {
      navigate(`/course/${courseId}/assignment/${assignmentId}/grade-with-key`);
    } else {
      navigate(`/course/${courseId}/assignment/${assignmentId}/grade-without-key`);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '3rem',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '3rem',
        textAlign: 'center'
      }}>
        <button
          onClick={() => navigate(`/course/${courseId}/assignments`)}
          style={{
            position: 'absolute',
            left: '2rem',
            top: '2rem',
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
          <span>←</span> Back to Assignments
        </button>
        
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: '700',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem'
        }}>
          Grading Hub
        </h1>
        <p style={{ 
          fontSize: '1.25rem',
          color: 'var(--secondary-text)',
          marginBottom: '0.5rem'
        }}>
          {courseDetails?.name}
        </p>
        <p style={{ 
          fontSize: '1.5rem',
          color: 'var(--primary)',
          fontWeight: '600'
        }}>
          {assignmentDetails?.title}
        </p>
      </div>

      {/* Path Selection Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginTop: '4rem'
      }}>
        {/* Path 1: Grade with Provided Key */}
        <div
          onClick={() => handlePathSelection('with-key')}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            padding: '3rem',
            border: '2px solid var(--border)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.boxShadow = '0 12px 24px var(--shadow-lg)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'white',
            fontSize: '2.5rem'
          }}>
            📄
          </div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '1rem'
          }}>
            Grade with Provided Key
          </h2>
          <p style={{ 
            fontSize: '1.1rem',
            color: 'var(--secondary-text)',
            lineHeight: '1.6'
          }}>
            Use your own custom ML model with a pre-existing answer key from Google Drive
          </p>
          <div style={{
            marginTop: '2rem',
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '1.1rem',
            display: 'inline-block'
          }}>
            Choose This Path →
          </div>
        </div>

        {/* Path 2: Grade without Provided Key */}
        <div
          onClick={() => handlePathSelection('without-key')}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            padding: '3rem',
            border: '2px solid var(--border)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.borderColor = 'var(--success)';
            e.currentTarget.style.boxShadow = '0 12px 24px var(--shadow-lg)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'white',
            fontSize: '2.5rem'
          }}>
            🤖
          </div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '1rem'
          }}>
            Grade without Provided Key
          </h2>
          <p style={{ 
            fontSize: '1.1rem',
            color: 'var(--secondary-text)',
            lineHeight: '1.6'
          }}>
            Let Gemini AI generate and refine an answer key collaboratively with you
          </p>
          <div style={{
            marginTop: '2rem',
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--success)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '1.1rem',
            display: 'inline-block'
          }}>
            Choose This Path →
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingHubPage;
