import React from 'react';
import { useParams } from 'react-router-dom';
import AssignmentList from '../components/AssignmentList';

const AssignmentsPage = () => {
  const { courseId } = useParams();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: '2rem'
    }}>
      <AssignmentList courseId={courseId} />
    </div>
  );
};

export default AssignmentsPage;