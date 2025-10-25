// frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App'; // Import the configured Axios instance
import CourseList from '../components/CourseList';
import AssignmentList from '../components/AssignmentList';
import SubmissionDetail from '../components/SubmissionDetail'; // Make sure this path is correct

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
    <div className="dashboard-container">
      <div className="header">
        <h1>Grade Pilot AI Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      {loading && <div className="loading-message">Loading data...</div>}
      {error && <div className="error-message">Error: {error}</div>}

      <div className="container">
        {/* Course List Column */}
        <div className="column">
          <h3>Your Classes</h3>
          <div className="flex-grow">
            <CourseList 
              courses={courses} 
              selectedCourse={selectedCourse} 
              onSelectCourse={setSelectedCourse} 
            />
          </div>
        </div>

        {/* Assignment List Column */}
        <div className="column">
          <h3>Assignments</h3>
          {selectedCourse ? (
            <div className="flex-grow">
              <AssignmentList 
                assignments={assignments} 
                selectedAssignment={selectedAssignment} 
                onSelectAssignment={setSelectedAssignment} 
              />
            </div>
          ) : (
            <p>Select a class to see assignments.</p>
          )}
        </div>

        {/* Submission Detail & Grading Column */}
        <div className="column column-wide"> {/* Use column-wide for this one */}
          <h3>Student Submissions & Grading</h3>
          {selectedAssignment ? (
            selectedSubmission ? ( // If a specific submission is selected, show its details
              <SubmissionDetail
                selectedCourse={selectedCourse}
                selectedAssignment={selectedAssignment}
                selectedSubmission={selectedSubmission} // Pass the full submission object
                onBack={() => setSelectedSubmission(null)} // Go back to submissions list
                API={API}
              />
            ) : ( // Otherwise, show the list of submissions
              <div className="flex-grow">
                {submissions.length > 0 ? (
                  <ul>
                    {submissions.map((sub) => (
                      <li 
                        key={sub.id} 
                        className="list-item" 
                        onClick={() => setSelectedSubmission(sub)} // Pass the full submission object to state
                      >
                        {/* CHANGE HERE: Use sub.studentName */}
                        Student: {sub.studentName || `ID: ${sub.userId}`} (Status: {sub.state})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No turned-in submissions for this assignment.</p>
                )}
              </div>
            )
          ) : (
            <p>Select an assignment to see student submissions.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;