import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await API.get('/api/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}/assignments`);
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {courses.map((course) => (
        <div
          key={course.id}
          className="card"
          onClick={() => handleCourseClick(course.id)}
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <h2 style={{ 
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--primary-text)',
            marginBottom: '0.5rem'
          }}>
            {course.name}
          </h2>
          <p style={{ color: 'var(--secondary-text)' }}>
            Section: {course.section}
          </p>
          <div style={{ 
            marginTop: '1rem',
            padding: '0.5rem',
            borderRadius: '6px',
            backgroundColor: 'var(--surface-hover)',
            color: 'var(--secondary-text)',
            fontSize: '0.9rem'
          }}>
            Click to view assignments
          </div>
        </div>
      ))}
      {courses.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--secondary-text)' }}>No courses found</p>
        </div>
      )}
    </div>
  );
}

export default CourseList;