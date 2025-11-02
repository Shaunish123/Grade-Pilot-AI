// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AssignmentsPage from './pages/AssignmentsPage';
import SubmissionsPage from './pages/SubmissionsPage';
import { useEffect } from 'react';
import axios from 'axios';

// Axios instance for handling cookies (sessions)
const API = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Crucial for sending/receiving session cookies
});

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage API={API} />} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/course/:courseId/assignments" element={<AssignmentsPage API={API} />} />
        <Route path="/course/:courseId/assignment/:assignmentId/submissions" element={<SubmissionsPage API={API} />} />
      </Routes>
    </Router>
  );
}

export default App;
export { API }; // Export the configured Axios instance