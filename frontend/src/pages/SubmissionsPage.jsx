import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import SubmissionDetail from '../components/SubmissionDetail';
import { API } from '../App';

const SubmissionsPage = () => {
  const { courseId, assignmentId } = useParams();
  const location = useLocation();
  const [courseDetails, setCourseDetails] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get the generated answer key from navigation state (if coming from Grade Without Key workflow)
  const generatedAnswerKey = location.state?.generatedAnswerKey || null;

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

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--secondary-text)' }}>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1800px', 
      margin: '0 auto', 
      padding: '2rem',
      minHeight: '100vh'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '3rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700',
          color: 'var(--primary-text)',
          margin: 0
        }}>
          {assignmentDetails?.title}
        </h1>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--primary-text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>←</span> Back to Assignments
        </button>
      </div>
      <SubmissionDetail 
        courseId={courseId}
        courseName={courseDetails?.name}
        assignmentId={assignmentId}
        assignmentTitle={assignmentDetails?.title}
        generatedAnswerKey={generatedAnswerKey}
      />
    </div>
  );
};

export default SubmissionsPage;