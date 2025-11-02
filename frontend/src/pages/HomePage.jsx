import React from 'react';
import CourseList from '../components/CourseList';

const HomePage = () => {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '600',
          color: 'var(--primary-text)',
          marginBottom: '0.5rem'
        }}>
          My Classes
        </h1>
        <p style={{ color: 'var(--secondary-text)' }}>
          Select a class to view assignments
        </p>
      </div>
      <CourseList />
    </div>
  );
};

export default HomePage;