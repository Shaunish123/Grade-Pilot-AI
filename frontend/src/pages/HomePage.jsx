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
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">AI-Powered Grading Platform</span>
          </div>
          <h1>
            Welcome to Grade Pilot AI
          </h1>
          <p className="hero-description">
            Transform your grading workflow with intelligent AI assistance. 
            Grade faster, provide better feedback, and focus on what matters most—teaching.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-icon">⚡</div>
              <h3>90%</h3>
              <p>Time Saved</p>
            </div>
            <div className="hero-stat">
              <div className="stat-icon">🤖</div>
              <h3>AI</h3>
              <p>Powered</p>
            </div>
            <div className="hero-stat">
              <div className="stat-icon">🌐</div>
              <h3>24/7</h3>
              <p>Available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Analytics Card */}
        <div className="analytics-spotlight" onClick={() => navigate('/analytics')}>
          <div className="spotlight-header">
            <div className="spotlight-icon">
              <span>📊</span>
            </div>
            <div className="spotlight-badge">
              <span>NEW</span>
            </div>
          </div>
          <h3>Analytics Dashboard</h3>
          <p>Track student progress, analyze performance trends, and gain insights into grading patterns with interactive charts.</p>
          <div className="spotlight-features">
            <div className="feature-tag">
              <span>📈</span> Performance Trends
            </div>
            <div className="feature-tag">
              <span>👥</span> Student Insights
            </div>
            <div className="feature-tag">
              <span>📉</span> Grade Distribution
            </div>
          </div>
          <button className="spotlight-btn">
            View Analytics
            <span className="btn-arrow">→</span>
          </button>
        </div>

        {/* Classes Section */}
        <div className="classes-section">
          <div className="section-header">
            <h2>
              <span className="header-icon">📚</span>
              Your Classes
            </h2>
            <div className="section-badge">
              <span className="pulse-dot"></span>
              Active
            </div>
          </div>
          <div className="classes-container">
            <CourseList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;