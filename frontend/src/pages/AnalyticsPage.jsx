import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
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
  const [courseStats, setCourseStats] = useState([]);
  const [allGradesData, setAllGradesData] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  // Calculate comprehensive statistics (mean, median, std dev)
  const calculateStats = (grades) => {
    if (!grades || grades.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, count: 0 };
    }

    const sorted = [...grades].sort((a, b) => a - b);
    const mean = grades.reduce((a, b) => a + b, 0) / grades.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const variance = grades.reduce((sum, grade) => sum + Math.pow(grade - mean, 2), 0) / grades.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      min: Math.min(...grades),
      max: Math.max(...grades),
      count: grades.length
    };
  };

  const fetchAllAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses first
      const coursesResponse = await API.get('/api/courses');
      console.log('📚 Courses response:', coursesResponse.data);
      
      // Handle different response structures
      const coursesData = Array.isArray(coursesResponse.data) 
        ? coursesResponse.data 
        : (coursesResponse.data.courses || []);
      
      setCourses(coursesData);
      console.log('📚 Loaded courses:', coursesData);

      // Check database status
      try {
        const dbStatusResponse = await API.get('/api/db_status');
        setDbStatus(dbStatusResponse.data);
        console.log('📊 Database Status:', dbStatusResponse.data);
      } catch (err) {
        console.error('Failed to fetch DB status:', err);
      }

      // Fetch graded history for overall stats
      const historyResponse = await API.get('/api/graded_history');
      const history = historyResponse.data;
      setAllGradesData(history || []);
      console.log('📊 Loaded graded history:', history?.length || 0, 'records');

      if (!history || history.length === 0) {
        setAnalytics({
          total_graded: 0,
          average_grade: 0,
          grade_distribution: { "0-50": 0, "51-70": 0, "71-85": 0, "86-100": 0 },
          course_stats: [],
          recent_activity: []
        });
        setCourseStats([]);
        setLoading(false);
        return;
      }

      // Calculate analytics
      const calculatedAnalytics = calculateAnalytics(history);
      setAnalytics(calculatedAnalytics);

      // Calculate detailed course statistics
      const courseMap = {};
      history.forEach(grade => {
        const courseId = grade.course_id;
        if (!courseMap[courseId]) {
          courseMap[courseId] = {
            course_id: courseId,
            course_name: grade.course_name,
            grades: [],
            students: new Set()
          };
        }
        courseMap[courseId].grades.push(grade.assignedGrade);
        courseMap[courseId].students.add(grade.student_name);
      });

      const courseStatsArray = Object.values(courseMap).map(course => {
        const stats = calculateStats(course.grades);
        return {
          course_id: course.course_id,
          course_name: course.course_name,
          total_submissions: course.grades.length,
          unique_students: course.students.size,
          ...stats
        };
      });

      setCourseStats(courseStatsArray);

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
      
      console.log('🎯 Selected course:', course);
      console.log('📊 All grades data:', allGradesData);
      
      // Filter grades for this course from already loaded data
      // Support both 'id' and 'courseId' field names from Google Classroom API
      const courseIdToMatch = course.id || course.courseId;
      console.log('🔍 Matching course ID:', courseIdToMatch);
      
      const courseGrades = allGradesData.filter(g => {
        const matches = g.course_id === courseIdToMatch;
        if (matches) {
          console.log('✅ Found matching grade:', g);
        }
        return matches;
      });
      
      console.log(`📝 Found ${courseGrades.length} grades for course ${course.name}`);
      
      // Group by student
      const studentMap = {};
      courseGrades.forEach(grade => {
        const studentName = grade.student_name;
        if (!studentMap[studentName]) {
          studentMap[studentName] = {
            student_name: studentName,
            grades: [],
            assignments: []
          };
        }
        studentMap[studentName].grades.push(grade.assignedGrade);
        studentMap[studentName].assignments.push({
          title: grade.assignment_title,
          grade: grade.assignedGrade,
          date: grade.timestamp
        });
      });

      // Calculate comprehensive stats for each student
      const studentsData = Object.values(studentMap).map(student => {
        const stats = calculateStats(student.grades);
        return {
          student_name: student.student_name,
          total_assignments: student.grades.length,
          assignments: student.assignments.sort((a, b) => new Date(a.date) - new Date(b.date)), // Sort by date
          ...stats
        };
      }).sort((a, b) => b.mean - a.mean); // Sort students by mean grade descending

      console.log('👥 Processed students:', studentsData);
      setStudents(studentsData);
      setActiveTab('students');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching course students:', err);
      setError('Failed to load student data for this course');
      setLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setActiveTab('student-detail');
  };

  const getGradeBadgeClass = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return "excellent";
    if (numGrade >= 75) return "good";
    if (numGrade >= 50) return "fair";
    return "poor";
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

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

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Analytics Dashboard</h1>
          <p>Comprehensive insights into grading performance</p>
          {dbStatus && (
            <div className={`db-status-badge ${dbStatus.mongodb_connected ? 'connected' : 'disconnected'}`}>
              {dbStatus.mongodb_connected ? '🟢 MongoDB Connected' : '🟡 Using In-Memory Storage'}
            </div>
          )}
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
            <h2>📚 Select a Course to View Detailed Analytics</h2>
            <p className="card-description">Click on any course to see student performance and grading analytics</p>
            
            {courses.length > 0 ? (
              <div className="courses-grid">
                {courses.map((course) => {
                  // Find stats for this course if available
                  const stats = courseStats.find(cs => cs.course_id === (course.id || course.courseId));
                  
                  return (
                    <div
                      key={course.id || course.courseId}
                      className="course-card-analytics"
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="course-icon">📖</div>
                      <h3>{course.name}</h3>
                      <p className="course-section">{course.section || 'No section'}</p>
                      
                      {stats && (
                        <div className="course-quick-stats">
                          <div className="quick-stat">
                            <span className="stat-label">Students:</span>
                            <span className="stat-value">{stats.unique_students}</span>
                          </div>
                          <div className="quick-stat">
                            <span className="stat-label">Avg Grade:</span>
                            <span className={`stat-value grade-badge ${getGradeBadgeClass(stats.mean)}`}>
                              {stats.mean}%
                            </span>
                          </div>
                          <div className="quick-stat">
                            <span className="stat-label">Submissions:</span>
                            <span className="stat-value">{stats.total_submissions}</span>
                          </div>
                        </div>
                      )}
                      
                      <button className="btn btn-primary">
                        View Students →
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-small">
                <div className="empty-icon">📚</div>
                <p>No courses found. Please ensure you have courses in Google Classroom.</p>
                <button onClick={() => navigate('/home')} className="btn btn-primary">
                  Go to Home
                </button>
              </div>
            )}
            
            {(!analytics || analytics.total_graded === 0) && (
              <div className="info-banner">
                <div className="info-icon">💡</div>
                <div className="info-content">
                  <h4>No Graded Data Yet</h4>
                  <p>Start grading assignments in your courses to see detailed analytics and insights!</p>
                </div>
              </div>
            )}
          </div>

          {/* Grade Distribution and Charts */}
          {analytics && analytics.total_graded > 0 && (
            <>
              {/* Grade Distribution Pie Chart */}
              <div className="card">
                <h2>🥧 Overall Grade Distribution</h2>
                <p className="card-description">How grades are distributed across all courses</p>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.grade_distribution).map(([range, count]) => ({
                        range,
                        count,
                        percentage: allGradesData.length > 0 ? ((count / allGradesData.length) * 100).toFixed(1) : 0
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.range}: ${entry.count} (${entry.percentage}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {Object.entries(analytics.grade_distribution).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Course Performance Comparison */}
              {courseStats.length > 0 && (
                <>
                  <div className="card">
                    <h2>📊 Course Performance Comparison</h2>
                    <p className="card-description">Statistical breakdown by course</p>
                    <div className="table-container">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Course Name</th>
                            <th>Students</th>
                            <th>Submissions</th>
                            <th>Mean</th>
                            <th>Median</th>
                            <th>Std Dev</th>
                            <th>Min</th>
                            <th>Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseStats.map((course, index) => (
                            <tr key={index}>
                              <td><strong>{course.course_name}</strong></td>
                              <td>{course.unique_students}</td>
                              <td>{course.total_submissions}</td>
                              <td>
                                <span className={`grade-badge ${getGradeBadgeClass(course.mean)}`}>
                                  {course.mean}%
                                </span>
                              </td>
                              <td>{course.median}%</td>
                              <td>±{course.stdDev}%</td>
                              <td>{course.min}%</td>
                              <td>{course.max}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Course Comparison Bar Chart */}
                  <div className="card">
                    <h2>📈 Average Grades Across Courses</h2>
                    <p className="card-description">Visual comparison of course performance</p>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={courseStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis 
                          dataKey="course_name" 
                          stroke="var(--secondary-text)"
                          angle={-15}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="var(--secondary-text)" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="mean" fill="#3b82f6" name="Mean Grade" />
                        <Bar dataKey="median" fill="#10b981" name="Median Grade" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
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
              <>
                {/* Student Performance Statistics */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>{students.length}</h3>
                      <p>Total Students</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <h3>{calculateStats(students.map(s => s.mean)).mean}%</h3>
                      <p>Class Average</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <h3>±{calculateStats(students.map(s => s.mean)).stdDev}%</h3>
                      <p>Standard Deviation</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <h3>{Math.max(...students.map(s => s.max))}%</h3>
                      <p>Highest Score</p>
                    </div>
                  </div>
                </div>

                <div className="table-container">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Assignments</th>
                        <th>Mean</th>
                        <th>Median</th>
                        <th>Std Dev</th>
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
                            <span className={`grade-badge ${getGradeBadgeClass(student.mean)}`}>
                              {student.mean}%
                            </span>
                          </td>
                          <td>{student.median}%</td>
                          <td>±{student.stdDev}%</td>
                          <td>{student.max}%</td>
                          <td>{student.min}%</td>
                          <td>
                            <button
                              onClick={() => handleStudentClick(student)}
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

                {/* Student Performance Bar Chart */}
                <div className="card">
                  <h2>📊 Student Performance Comparison</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={students}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis 
                        dataKey="student_name" 
                        stroke="var(--secondary-text)"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                      />
                      <YAxis stroke="var(--secondary-text)" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="mean" fill="#3b82f6" name="Mean Grade" />
                      <Bar dataKey="max" fill="#10b981" name="Highest Grade" />
                      <Bar dataKey="min" fill="#ef4444" name="Lowest Grade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="empty-state-small">
                <div className="empty-icon">📝</div>
                <h3>No Graded Submissions Yet</h3>
                <p>No students have been graded in this course yet.</p>
                <p>Start grading assignments to see student performance analytics!</p>
                <button onClick={() => navigate('/home')} className="btn btn-primary">
                  Go to Assignments
                </button>
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
            <p className="course-context">Performance in {selectedCourse.name}</p>
          </div>

          {/* Student Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>{selectedStudent.total_assignments}</h3>
                <p>Total Assignments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3 className={getGradeBadgeClass(selectedStudent.mean)}>{selectedStudent.mean}%</h3>
                <p>Mean Grade</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{selectedStudent.median}%</h3>
                <p>Median Grade</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>±{selectedStudent.stdDev}%</h3>
                <p>Standard Deviation</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <h3>{selectedStudent.max}%</h3>
                <p>Highest Grade</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <h3>{selectedStudent.min}%</h3>
                <p>Lowest Grade</p>
              </div>
            </div>
          </div>

          {/* Performance Trend Chart */}
          {selectedStudent.assignments && selectedStudent.assignments.length > 0 && (
            <div className="card">
              <h2>📈 Performance Over Time</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={selectedStudent.assignments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="title" 
                    stroke="var(--secondary-text)" 
                    angle={-15}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="var(--secondary-text)" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="grade" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 6, fill: '#3b82f6' }}
                    activeDot={{ r: 8 }}
                    name="Grade"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => selectedStudent.mean} 
                    stroke="#10b981" 
                    strokeDasharray="5 5"
                    name="Average"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Assignment History Table */}
          <div className="card">
            <h2>📋 Complete Assignment History</h2>
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Assignment Title</th>
                    <th>Grade</th>
                    <th>Deviation from Mean</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.assignments.map((assignment, index) => {
                    const deviation = (assignment.grade - selectedStudent.mean).toFixed(2);
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{assignment.title}</td>
                        <td>
                          <span className={`grade-badge ${getGradeBadgeClass(assignment.grade)}`}>
                            {assignment.grade}%
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: deviation > 0 ? '#10b981' : deviation < 0 ? '#ef4444' : '#6b7280',
                            fontWeight: 'bold'
                          }}>
                            {deviation > 0 ? '+' : ''}{deviation}%
                          </span>
                        </td>
                        <td>{new Date(assignment.date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="card">
            <h2>💡 Performance Insights</h2>
            <div className="insights-grid">
              <div className="insight-card">
                <h4>Consistency</h4>
                <p>
                  {selectedStudent.stdDev < 10 
                    ? '🟢 Very consistent performance' 
                    : selectedStudent.stdDev < 20 
                    ? '🟡 Moderate consistency' 
                    : '🔴 High variability in performance'}
                </p>
                <small>Standard deviation: ±{selectedStudent.stdDev}%</small>
              </div>
              <div className="insight-card">
                <h4>Trend</h4>
                <p>
                  {selectedStudent.assignments.length >= 2 && 
                   selectedStudent.assignments[selectedStudent.assignments.length - 1].grade > 
                   selectedStudent.assignments[0].grade
                    ? '📈 Improving over time'
                    : selectedStudent.assignments.length >= 2 &&
                      selectedStudent.assignments[selectedStudent.assignments.length - 1].grade < 
                      selectedStudent.assignments[0].grade
                    ? '📉 Declining performance'
                    : '➡️ Stable performance'}
                </p>
              </div>
              <div className="insight-card">
                <h4>Grade Range</h4>
                <p>Performance varies by {selectedStudent.max - selectedStudent.min} points</p>
                <small>From {selectedStudent.min}% to {selectedStudent.max}%</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
