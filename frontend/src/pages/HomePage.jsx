import React from 'react';
import { useNavigate } from 'react-router-dom';
import CourseList from '../components/CourseList';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-content">
          <h1>
            <span>🎓</span>
            Welcome to Grade Pilot AI
          </h1>
          <p>
            Transform your grading workflow with AI-powered assistance. 
            Grade assignments faster, provide better feedback, and spend more time teaching.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <h3>50%</h3>
              <p>Time Saved</p>
            </div>
            <div className="hero-stat">
              <h3>AI</h3>
              <p>Powered</p>
            </div>
            <div className="hero-stat">
              <h3>24/7</h3>
              <p>Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate('/grading-hub')}>
          <div className="action-icon">⚡</div>
          <div className="action-content">
            <h3>Quick Grade</h3>
            <p>Start grading with or without an answer key using AI assistance</p>
          </div>
        </div>
        <div className="action-card" onClick={() => navigate('/dashboard')}>
          <div className="action-icon">📊</div>
          <div className="action-content">
            <h3>View Dashboard</h3>
            <p>See all your classes, assignments, and submissions in one place</p>
          </div>
        </div>
        <div className="action-card" onClick={() => navigate('/dashboard')}>
          <div className="action-icon">📈</div>
          <div className="action-content">
            <h3>Analytics</h3>
            <p>Track student progress and analyze grading patterns</p>
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="classes-section">
        <div className="section-header">
          <h2>
            <span>📚</span>
            Your Classes
          </h2>
        </div>
        <div className="classes-container">
          <CourseList />
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="feature-highlights">
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h4>AI-Powered Grading</h4>
          <p>Let AI help you grade assignments quickly and consistently</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h4>Smart Feedback</h4>
          <p>Generate detailed, constructive feedback for students</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h4>Export Reports</h4>
          <p>Export grades to Google Sheets with one click</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h4>Secure & Private</h4>
          <p>Your data is protected with Google Classroom integration</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;