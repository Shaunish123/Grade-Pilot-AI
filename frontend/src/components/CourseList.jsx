// frontend/src/components/CourseList.jsx
import React from 'react';

function CourseList({ courses, selectedCourse, onSelectCourse }) {
  return (
    <ul>
      {courses.map((course) => (
        <li
          key={course.id}
          className={`list-item ${selectedCourse && selectedCourse.id === course.id ? 'selected' : ''}`}
          onClick={() => onSelectCourse(course)}
        >
          {course.name} ({course.section})
        </li>
      ))}
    </ul>
  );
}

export default CourseList;