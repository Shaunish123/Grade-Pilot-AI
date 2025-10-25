// frontend/src/components/AssignmentList.jsx
import React from 'react';

function AssignmentList({ assignments, selectedAssignment, onSelectAssignment }) {
  return (
    <ul>
      {assignments.map((assignment) => (
        <li
          key={assignment.id}
          className={`list-item ${selectedAssignment && selectedAssignment.id === assignment.id ? 'selected' : ''}`}
          onClick={() => onSelectAssignment(assignment)}
        >
          {assignment.title} ({assignment.maxPoints || 100} pts)
        </li>
      ))}
    </ul>
  );
}

export default AssignmentList;