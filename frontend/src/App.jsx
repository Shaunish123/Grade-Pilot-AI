// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
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
        <Route path="/dashboard" element={<DashboardPage API={API} />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
export { API }; // Export the configured Axios instance