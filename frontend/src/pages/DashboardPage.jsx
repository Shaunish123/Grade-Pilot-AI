// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App'; // Import the configured Axios instance
import CourseList from '../components/CourseList';
import AssignmentList from '../components/AssignmentList';
import SubmissionDetail from '../components/SubmissionDetail'; // Make sure this path is correct
import './DashboardPage.css';

function DashboardPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null); // This holds the *full submission object* now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Authentication Check & Logout ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get('/api/courses');
        setCourses(response.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          alert("Session expired or not authenticated. Please log in again.");
          navigate('/'); // Redirect to login page
        } else {
          setError(`Failed to fetch courses: ${err.response?.data?.error || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await API.get('/logout');
      navigate('/');
    } catch (err) {
      setError(`Logout failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // --- Fetch Assignments when Course is Selected ---
  useEffect(() => {
    if (selectedCourse) {
      setLoading(true);
      setError(null);
      setAssignments([]); // Clear previous assignments
      setSelectedAssignment(null); // Clear selected assignment
      setSubmissions([]); // Clear previous submissions
      setSelectedSubmission(null); // Clear selected submission

      const fetchAssignments = async () => {
        try {
          const response = await API.get(`/api/courses/${selectedCourse.id}/assignments`);
          setAssignments(response.data);
        } catch (err) {
          setError(`Failed to fetch assignments: ${err.response?.data?.error || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchAssignments();
    }
  }, [selectedCourse]);

  // --- Fetch Submissions when Assignment is Selected ---
  useEffect(() => {
    if (selectedAssignment) {
      setLoading(true);
      setError(null);
      setSubmissions([]); // Clear previous submissions
      setSelectedSubmission(null); // Clear selected submission

      const fetchSubmissions = async () => {
        try {
          const response = await API.get(`/api/courses/${selectedCourse.id}/assignments/${selectedAssignment.id}/submissions`);
          setSubmissions(response.data);
          // Important: If you want to auto-select the first submission, do it here
          // if (response.data.length > 0) {
          //   setSelectedSubmission(response.data[0]); 
          // }
        } catch (err) {
          setError(`Failed to fetch submissions: ${err.response?.data?.error || err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchSubmissions();
    }
  }, [selectedAssignment, selectedCourse]);


  // --- Render ---
  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>📚 Grade Pilot AI Dashboard</h1>
          <p>Streamline your grading workflow with AI-powered assistance</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      )}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="dismiss-btn">✕</button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>{courses.length}</h3>
            <p>Active Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{assignments.length}</h3>
            <p>Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{submissions.length}</h3>
            <p>Submissions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{submissions.filter(s => s.assignedGrade).length}</h3>
            <p>Graded</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Course List Column */}
        <div className="section-card">
          <div className="section-header">
            <h2>🏫 Your Classes</h2>
            <span className="badge">{courses.length}</span>
          </div>
          <div className="section-content">
            {courses.length > 0 ? (
              <CourseList 
                courses={courses} 
                selectedCourse={selectedCourse} 
                onSelectCourse={setSelectedCourse} 
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <p>No classes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignment List Column */}
        <div className="section-card">
          <div className="section-header">
            <h2>📋 Assignments</h2>
            <span className="badge">{assignments.length}</span>
          </div>
          <div className="section-content">
            {selectedCourse ? (
              assignments.length > 0 ? (
                <AssignmentList 
                  assignments={assignments} 
                  selectedAssignment={selectedAssignment} 
                  onSelectAssignment={setSelectedAssignment} 
                />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No assignments found</p>
                </div>
              )
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👈</div>
                <p>Select a class to see assignments</p>
              </div>
            )}
          </div>
        </div>

        {/* Submission Detail & Grading Column */}
        <div className="section-card section-wide">
          <div className="section-header">
            <h2>👥 Student Submissions</h2>
            <span className="badge">{submissions.length}</span>
          </div>
          <div className="section-content">
            {selectedAssignment ? (
              selectedSubmission ? (
                <SubmissionDetail
                  selectedCourse={selectedCourse}
                  selectedAssignment={selectedAssignment}
                  selectedSubmission={selectedSubmission}
                  onBack={() => setSelectedSubmission(null)}
                  API={API}
                />
              ) : (
                <div className="submissions-list">
                  {submissions.length > 0 ? (
                    <ul>
                      {submissions.map((sub) => (
                        <li 
                          key={sub.id} 
                          className="submission-item" 
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          <div className="submission-info">
                            <span className="student-name">
                              {sub.studentName || `Student ID: ${sub.userId}`}
                            </span>
                            <span className={`status-badge ${sub.state.toLowerCase()}`}>
                              {sub.state}
                            </span>
                          </div>
                          {sub.assignedGrade && (
                            <div className="grade-preview">
                              Grade: {sub.assignedGrade}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👈</div>
                <p>Select an assignment to view submissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;