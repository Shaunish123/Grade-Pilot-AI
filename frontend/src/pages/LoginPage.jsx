// frontend/src/pages/LoginPage.jsx
import React from 'react';

function LoginPage() {
  return (
    <div className="login-container" style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to Grade Pilot AI</h1>
      <p>Automate your Google Classroom grading with Gemini AI.</p>
      <a 
        href="http://localhost:8000/login" 
        style={{
          display: 'inline-block',
          backgroundColor: '#4285F4', /* Google Blue */
          color: 'white',
          padding: '12px 25px',
          borderRadius: '5px',
          textDecoration: 'none',
          fontSize: '1.2rem',
          marginTop: '20px'
        }}
      >
        Login with Google
      </a>
    </div>
  );
}

export default LoginPage;