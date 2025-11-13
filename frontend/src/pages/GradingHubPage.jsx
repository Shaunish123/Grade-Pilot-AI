import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import './GradingHubPage.css';

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
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading assignment details...</p>
      </div>
    );
  }

  return (
    <div className="grading-hub-page">
      <div className="hub-container">
        {/* Header */}
        <div className="hub-header">
          <button
            onClick={() => navigate(`/course/${courseId}/assignments`)}
            className="back-btn"
          >
            <span>←</span> Back to Assignments
          </button>
          
          <h1 className="hub-title">
            ⚡ Grading Hub
          </h1>
          <p className="hub-course-name">
            {courseDetails?.name}
          </p>
          <p className="hub-assignment-name">
            {assignmentDetails?.title}
          </p>
        </div>

        {/* Path Selection Cards */}
        <div className="path-cards">
          {/* Path 1: Grade with Provided Key */}
          <div
            onClick={() => handlePathSelection('with-key')}
            className="path-card primary-card"
          >
            <div className="path-icon">
              📄
            </div>
            <h2>Grade with Provided Key</h2>
            <p>
              Use your own custom ML model with a pre-existing answer key from Google Drive
            </p>
            <div className="path-features">
              <ul>
                <li>Upload answer key from Drive</li>
                <li>Use custom grading criteria</li>
                <li>Batch process submissions</li>
              </ul>
            </div>
            <div className="path-action">
              Choose This Path <span>→</span>
            </div>
          </div>

          {/* Path 2: Grade without Provided Key */}
          <div
            onClick={() => handlePathSelection('without-key')}
            className="path-card success-card"
          >
            <span className="recommended-badge">✨ AI-Powered</span>
            <div className="path-icon">
              🤖
            </div>
            <h2>Grade without Provided Key</h2>
            <p>
              Let Gemini AI generate and refine an answer key collaboratively with you
            </p>
            <div className="path-features">
              <ul>
                <li>AI generates answer key</li>
                <li>Collaborative refinement</li>
                <li>Smart grading assistance</li>
              </ul>
            </div>
            <div className="path-action">
              Choose This Path <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingHubPage;
