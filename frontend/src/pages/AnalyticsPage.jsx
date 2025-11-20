import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AnalyticsPage.css';

function AnalyticsPage({ API }) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // courses, students, student-detail

  const fetchAllAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses first
      const coursesResponse = await API.get('/api/courses');
      const coursesData = coursesResponse.data.courses || [];
      setCourses(coursesData);

      // Fetch graded history for overall stats
      const historyResponse = await API.get('/api/graded_history');
      const history = historyResponse.data;

      if (!history || history.length === 0) {
        setAnalytics({
          total_graded: 0,
          average_grade: 0,
          grade_distribution: { "0-50": 0, "51-70": 0, "71-85": 0, "86-100": 0 },
          course_stats: [],
          recent_activity: []
        });
        setLoading(false);
        return;
      }

      // Calculate analytics
      const calculatedAnalytics = calculateAnalytics(history);
      setAnalytics(calculatedAnalytics);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const calculateAnalytics = (history) => {
    const total = history.length;
    const totalScore = history.reduce((sum, item) => sum + item.assignedGrade, 0);
    const average = total > 0 ? (totalScore / total).toFixed(2) : 0;

    // Grade distribution
    const distribution = { "0-50": 0, "51-70": 0, "71-85": 0, "86-100": 0 };
    history.forEach(item => {
      const grade = item.assignedGrade;
      if (grade <= 50) distribution["0-50"]++;
      else if (grade <= 70) distribution["51-70"]++;
      else if (grade <= 85) distribution["71-85"]++;
      else distribution["86-100"]++;
    });

    // Course stats
    const courseMap = {};
    history.forEach(item => {
      if (!courseMap[item.course_name]) {
        courseMap[item.course_name] = { grades: [], count: 0 };
      }
      courseMap[item.course_name].grades.push(item.assignedGrade);
      courseMap[item.course_name].count++;
    });

    const courseStats = Object.entries(courseMap).map(([name, stats]) => ({
      course_name: name,
      graded_count: stats.count,
      average_grade: (stats.grades.reduce((a, b) => a + b, 0) / stats.count).toFixed(2)
    }));

    // Recent activity
    const recentActivity = [...history]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return {
      total_graded: total,
      average_grade: average,
      grade_distribution: distribution,
      course_stats: courseStats,
      recent_activity: recentActivity
    };
  };

  const handleCourseClick = async (course) => {
    try {
      setLoading(true);
      setSelectedCourse(course);
      
      // Fetch students for this course from graded history
      const historyResponse = await API.get(`/api/graded_history?course_id=${course.id}`);
      const history = historyResponse.data;
      
      // Group by student
      const studentMap = {};
      history.forEach(item => {
        if (!studentMap[item.student_name]) {
          studentMap[item.student_name] = {
            student_name: item.student_name,
            grades: [],
            total_assignments: 0
          };
        }
        studentMap[item.student_name].grades.push(item.assignedGrade);
        studentMap[item.student_name].total_assignments++;
      });

      // Calculate stats for each student
      const studentsData = Object.values(studentMap).map(student => {
        const avg = student.grades.reduce((a, b) => a + b, 0) / student.grades.length;
        return {
          student_name: student.student_name,
          total_assignments: student.total_assignments,
          average_grade: avg.toFixed(2),
          highest_grade: Math.max(...student.grades),
          lowest_grade: Math.min(...student.grades)
        };
      });

      setStudents(studentsData);
      setActiveTab('students');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching course students:', err);
      setError('Failed to load student data for this course');
      setLoading(false);
    }
  };

  const handleStudentClick = async (studentName) => {
    try {
      setLoading(true);
      // Fetch student history for the selected course only
      const response = await API.get(`/api/graded_history?course_id=${selectedCourse.id}&student_name=${encodeURIComponent(studentName)}`);
      const history = response.data;
      
      if (history.length === 0) {
        alert('No grading history found for this student in this course');
        setLoading(false);
        return;
      }

      // Calculate student stats
      const grades = history.map(item => item.assignedGrade);
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      
      const studentData = {
        student_name: studentName,
        course_name: selectedCourse.name,
        average_grade: avg.toFixed(2),
        total_assignments: history.length,
        performance_trend: history.map(item => ({
          assignment: item.assignment_title,
          grade: item.assignedGrade,
          date: item.timestamp
        })),
        grades: history
      };
      
      setSelectedStudent(studentData);
      setActiveTab('student-detail');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student history:', err);
      alert('Failed to load student history');
      setLoading(false);
    }
  };

  const getGradeColor = (range) => {
    const colors = {
      "0-50": "#ef4444",
      "51-70": "#f59e0b",
      "71-85": "#3b82f6",
      "86-100": "#10b981"
    };
    return colors[range] || "#6b7280";
  };

  const getGradeBadgeClass = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return "excellent";
    if (numGrade >= 75) return "good";
    if (numGrade >= 50) return "fair";
    return "poor";
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>{error}</h2>
          <button onClick={fetchAllAnalytics} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data only if analytics exists
  const distributionData = analytics ? Object.entries(analytics.grade_distribution).map(([range, count]) => ({
    range,
    count,
    fill: getGradeColor(range)
  })) : [];

  const pieData = analytics ? Object.entries(analytics.grade_distribution).map(([range, count]) => ({
    name: range,
    value: count
  })) : [];

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Analytics Dashboard</h1>
          <p>Comprehensive insights into grading performance</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/home')} className="btn btn-secondary">
            ← Back to Home
          </button>
          <button onClick={fetchAllAnalytics} className="btn btn-primary">
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('courses');
            setSelectedCourse(null);
            setSelectedStudent(null);
          }}
        >
          📚 Select Course
        </button>
        {selectedCourse && (
          <button
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('students');
              setSelectedStudent(null);
            }}
          >
            👥 Students in {selectedCourse.name}
          </button>
        )}
        {selectedStudent && (
          <button
            className={`tab-btn ${activeTab === 'student-detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('student-detail')}
          >
            📊 {selectedStudent.student_name}
          </button>
        )}
      </div>

      {/* Courses Selection Tab */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          <div className="card">
            <h2>📚 Select a Course to View Analytics</h2>
            <p className="card-description">Choose a course to see student performance and grading analytics</p>
            
            {courses.length > 0 ? (
              <>
                <div className="courses-grid">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="course-card-analytics"
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="course-icon">📖</div>
                      <h3>{course.name}</h3>
                      <p className="course-section">{course.section || 'No section'}</p>
                      <button className="btn btn-primary">
                        View Analytics →
                      </button>
                    </div>
                  ))}
                </div>
                
                {(!analytics || analytics.total_graded === 0) && (
                  <div className="info-banner">
                    <div className="info-icon">💡</div>
                    <div className="info-content">
                      <h4>No Graded Data Yet</h4>
                      <p>Start grading assignments in your courses to see detailed analytics and insights!</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state-small">
                <div className="empty-icon">📚</div>
                <p>No courses found. Please ensure you have courses in Google Classroom.</p>
                <button onClick={() => navigate('/home')} className="btn btn-primary">
                  Go to Courses
                </button>
              </div>
            )}
          </div>

          {/* Overall Summary Stats */}
          {analytics && analytics.total_graded > 0 && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <h3>{analytics.total_graded}</h3>
                    <p>Total Graded (All Courses)</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>{analytics.average_grade}%</h3>
                    <p>Overall Average Grade</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <h3>{courses.length}</h3>
                    <p>Active Courses</p>
                  </div>
                </div>
              </div>

              {/* Course Performance Comparison */}
              <div className="card">
                <h2>📊 Course Performance Overview</h2>
                <div className="table-container">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Course Name</th>
                        <th>Graded Submissions</th>
                        <th>Average Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.course_stats.map((course, index) => (
                        <tr key={index}>
                          <td>{course.course_name}</td>
                          <td>{course.graded_count}</td>
                          <td>
                            <span className={`grade-badge ${getGradeBadgeClass(course.average_grade)}`}>
                              {course.average_grade}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && selectedCourse && (
        <div className="tab-content">
          <div className="card">
            <div className="card-header-with-back">
              <button onClick={() => setActiveTab('courses')} className="btn btn-secondary">
                ← Back to Courses
              </button>
              <div>
                <h2>👥 Students in {selectedCourse.name}</h2>
                <p className="card-description">View individual student performance in this course</p>
              </div>
            </div>
            
            {students.length > 0 ? (
              <div className="table-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Assignments Graded</th>
                      <th>Average Grade</th>
                      <th>Highest</th>
                      <th>Lowest</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={index}>
                        <td><strong>{student.student_name}</strong></td>
                        <td>{student.total_assignments}</td>
                        <td>
                          <span className={`grade-badge ${getGradeBadgeClass(student.average_grade)}`}>
                            {student.average_grade}%
                          </span>
                        </td>
                        <td>{student.highest_grade}%</td>
                        <td>{student.lowest_grade}%</td>
                        <td>
                          <button
                            onClick={() => handleStudentClick(student.student_name)}
                            className="btn btn-small btn-primary"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No graded submissions found for students in this course.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Detail View */}
      {activeTab === 'student-detail' && selectedStudent && (
        <div className="tab-content">
          <button onClick={() => setActiveTab('students')} className="btn btn-secondary mb-2">
            ← Back to Students
          </button>

          <div className="student-detail-header">
            <h2>👤 {selectedStudent.student_name}</h2>
            <p className="course-context">Performance in {selectedStudent.course_name}</p>
            <div className="student-stats">
              <div className="stat-item">
                <span className="label">Average Grade:</span>
                <span className={`value grade-badge ${getGradeBadgeClass(selectedStudent.average_grade)}`}>
                  {selectedStudent.average_grade}%
                </span>
              </div>
              <div className="stat-item">
                <span className="label">Total Assignments:</span>
                <span className="value">{selectedStudent.total_assignments}</span>
              </div>
            </div>
          </div>

          {/* Performance Trend Chart */}
          {selectedStudent.performance_trend && selectedStudent.performance_trend.length > 0 && (
            <div className="chart-card">
              <h3>📈 Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[...selectedStudent.performance_trend].reverse()} key={selectedStudent.student_name}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="assignment" 
                    stroke="var(--secondary-text)" 
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="var(--secondary-text)" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                    labelStyle={{
                      color: 'var(--primary-text)',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}
                    itemStyle={{
                      color: 'var(--primary)',
                      fontWeight: '600'
                    }}
                    formatter={(value, name) => {
                      if (name === 'grade') {
                        return [`${value}/100`, 'Grade'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      return `Assignment: ${label}`;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="grade" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: 'var(--primary)' }} 
                    activeDot={{ r: 8 }}
                    name="Grade"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Complete Grade History */}
          <div className="card">
            <h3>📋 Complete Grade History</h3>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.grades.map((grade, index) => (
                    <tr key={index}>
                      <td>{grade.assignment_title}</td>
                      <td>{grade.course_name}</td>
                      <td>
                        <span className={`grade-badge ${getGradeBadgeClass(grade.assignedGrade)}`}>
                          {grade.assignedGrade}%
                        </span>
                      </td>
                      <td>{new Date(grade.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
