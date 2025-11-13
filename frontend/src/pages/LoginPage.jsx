// frontend/src/pages/LoginPage.jsx
import React, { useEffect, useState } from 'react';
import './LoginPage.css';

function LoginPage() {
  const [floatingItems, setFloatingItems] = useState([]);

  useEffect(() => {
    // Generate random floating study items
    const items = [];
    const icons = ['📚', '✏️', '📝', '🎓', '📖', '🖊️', '📐', '🧮', '🔬', '🌟', '💡', '🏆'];
    for (let i = 0; i < 15; i++) {
      items.push({
        id: i,
        icon: icons[Math.floor(Math.random() * icons.length)],
        left: Math.random() * 100,
        animationDuration: 15 + Math.random() * 15,
        size: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 5
      });
    }
    setFloatingItems(items);
  }, []);

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="background-pattern"></div>
      
      {/* Floating Study Items */}
      <div className="floating-items">
        {floatingItems.map(item => (
          <div
            key={item.id}
            className="floating-item"
            style={{
              left: `${item.left}%`,
              animationDuration: `${item.animationDuration}s`,
              fontSize: `${item.size}rem`,
              animationDelay: `${item.delay}s`
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="login-container">
        {/* Left Side - Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="logo-animation">
              <div className="chalkboard">
                <div className="chalkboard-text">
                  <span className="grade-text">Grade</span>
                  <span className="pilot-text">Pilot</span>
                  <span className="ai-badge">AI</span>
                </div>
              </div>
            </div>

            <h1 className="hero-title">
              Transform Your <span className="highlight">Classroom</span>
            </h1>
            
            <p className="hero-subtitle">
              Automate grading with AI-powered intelligence. Save time, provide better feedback, and focus on what matters most—teaching.
            </p>

            {/* Feature Cards */}
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">🤖</div>
                <div className="feature-text">
                  <h3>AI-Powered Grading</h3>
                  <p>Gemini 2.5 Flash for accurate assessment</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">
                  <h3>Lightning Fast</h3>
                  <p>Grade entire classes in minutes</p>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <div className="feature-text">
                  <h3>Smart Analytics</h3>
                  <p>Track progress with detailed insights</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Time Saved</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">10x</div>
                <div className="stat-label">Faster Grading</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Accurate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="login-section">
          <div className="login-card">
            <div className="login-header">
              <div className="welcome-badge">Welcome Back!</div>
              <h2>Get Started</h2>
              <p>Sign in with your Google account to access your classroom</p>
            </div>

            <div className="login-benefits">
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <span>Seamless Google Classroom integration</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <span>Secure OAuth 2.0 authentication</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-check">✓</span>
                <span>Absolutely Free !!!</span>
              </div>
            </div>

            <a 
              href="http://localhost:8000/login" 
              className="google-login-btn"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </a>

            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span>Secure and Reliable</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🛡️</span>
                <span>Trusted by teachers</span>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="decorative-book book-1">📚</div>
          <div className="decorative-book book-2">📖</div>
          <div className="decorative-pencil">✏️</div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="wave-container">
        <svg className="wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </div>
  );
}

export default LoginPage;