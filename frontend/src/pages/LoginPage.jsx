// frontend/src/pages/LoginPage.jsx
import React from 'react';

function LoginPage() {
  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        padding: '3rem'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: 'var(--primary-text)',
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Welcome to Grade Pilot AI
        </h1>
        <p style={{
          color: 'var(--secondary-text)',
          fontSize: '1.1rem',
          marginBottom: '2rem'
        }}>
          Automate your Google Classroom grading with Gemini AI.
        </p>
        <a 
          href="http://localhost:8000/login" 
          className="btn btn-primary"
          style={{
            fontSize: '1.1rem',
            padding: '0.8rem 2rem'
          }}
        >
          Login with Google
        </a>
      </div>
    </div>
  );
}

export default LoginPage;