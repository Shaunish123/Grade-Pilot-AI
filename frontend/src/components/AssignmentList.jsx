import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';

// Define card colors for variety - work well in both dark and light modes
const cardColors = [
  { bg: '#2C3E50', hover: '#34495E', light: '#3498DB', lightHover: '#2980B9' }, // Blue
  { bg: '#8E44AD', hover: '#9B59B6', light: '#9B59B6', lightHover: '#8E44AD' }, // Purple
  { bg: '#2980B9', hover: '#3498DB', light: '#3498DB', lightHover: '#2980B9' }, // Light Blue
  { bg: '#16A085', hover: '#1ABC9C', light: '#1ABC9C', lightHover: '#16A085' }, // Turquoise
  { bg: '#27AE60', hover: '#2ECC71', light: '#2ECC71', lightHover: '#27AE60' }, // Green
  { bg: '#D35400', hover: '#E67E22', light: '#E67E22', lightHover: '#D35400' }  // Orange
];

function AssignmentList({ courseId }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  useEffect(() => {
    // Detect theme
    const detectTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    };
    
    detectTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/courses/${courseId}/assignments`);
        setAssignments(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseId]);

  const handleAssignmentClick = (assignmentId) => {
    navigate(`/course/${courseId}/assignment/${assignmentId}/grade`);
  };

  const handleBackClick = () => {
    navigate('/home');
  };

  if (loading) {
    return (
      <div className="card" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '3rem'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          fontWeight: '700',
          color: 'var(--primary-text)',
          margin: '0'
        }}>
          Course Assignments
        </h1>
        <button
          onClick={handleBackClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--primary-text)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>←</span> Back to Courses
        </button>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '2rem',
        padding: '1rem'
      }}>
        {assignments.map((assignment, index) => {
          const colorIndex = index % cardColors.length;
          const color = cardColors[colorIndex];
          const isLightMode = theme === 'light';
          const bgColor = isLightMode ? color.light : color.bg;
          const hoverColor = isLightMode ? color.lightHover : color.hover;
          
          return (
            <div
              key={assignment.id}
              onClick={() => handleAssignmentClick(assignment.id)}
              style={{
                backgroundColor: bgColor,
                borderRadius: '12px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                boxShadow: isLightMode 
                  ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
                  : '0 4px 6px rgba(0, 0, 0, 0.1)',
                color: '#fff'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = isLightMode
                  ? '0 8px 20px rgba(0, 0, 0, 0.15)'
                  : '0 8px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = bgColor;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isLightMode
                  ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                  : '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                {assignment.title}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                opacity: '0.9'
              }}>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </p>
              <p style={{
                fontSize: '1rem',
                opacity: '0.8',
                lineHeight: '1.5'
              }}>
                {assignment.description}
              </p>
            </div>
          );
        })}
      </div>
      
      {assignments.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No assignments found for this course.
        </div>
      )}
    </div>
  );
}

export default AssignmentList;