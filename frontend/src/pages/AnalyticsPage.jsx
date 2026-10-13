import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Flame,
  PieChart as PieIcon,
  Layers
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [learningPathData, setLearningPathData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [dash, lp, hist] = await Promise.all([
          api.getDashboard(),
          api.getLearningPath(),
          api.getQuizHistory()
        ]);
        setDashboardData(dash);
        setLearningPathData(lp);
        setQuizHistory(hist);
      } catch (err) {
        setError(err.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Calculating performance metrics & rendering charts...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const topicChartData = (learningPathData?.topics || []).map(t => ({
    name: t.topic_name.length > 18 ? t.topic_name.slice(0, 16) + '..' : t.topic_name,
    fullName: t.topic_name,
    mastery: t.mastery_score,
    attempts: t.total_attempts
  }));

  const pieData = [
    { name: 'Mastered', value: learningPathData?.mastered_count || 0, color: '#10b981' },
    { name: 'In Progress', value: learningPathData?.in_progress_count || 0, color: '#6366f1' },
    { name: 'Not Started', value: learningPathData?.not_started_count || 0, color: '#94a3b8' }
  ];

  return (
    <div>
      {/* Analytics KPI Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{dashboardData?.average_quiz_score || 0}%</div>
            <div className="stat-label">Average Accuracy</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val">{learningPathData?.overall_mastery_percentage || 0}%</div>
            <div className="stat-label">Syllabus Mastery</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{quizHistory.length}</div>
            <div className="stat-label">Total Assessments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
            <Flame size={24} />
          </div>
          <div>
            <div className="stat-val">{dashboardData?.streak_count || 1} Days</div>
            <div className="stat-label">Study Streak</div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Topic Mastery Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Topic-wise Mastery Breakdown</h3>
              <p className="card-subtitle">Calculated score per extracted knowledge topic</p>
            </div>
            <span className="badge badge-info">Normalized %</span>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  angle={-25} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Mastery Score']}
                  labelFormatter={(name, item) => item[0]?.payload?.fullName || name}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }} 
                />
                <Bar dataKey="mastery" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Mastery Status Distribution</h3>
              <p className="card-subtitle">Breakdown of topics by learning status</p>
            </div>
            <span className="badge badge-success">Syllabus Health</span>
          </div>

          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-md)'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quiz History Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Completed Assessment Records</h3>
            <p className="card-subtitle">Comprehensive history of adaptive quizzes taken</p>
          </div>
          <span className="badge badge-info">{quizHistory.length} Attempts</span>
        </div>

        {quizHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No quizzes completed yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Topic</th>
                  <th style={{ padding: '10px 12px' }}>Score</th>
                  <th style={{ padding: '10px 12px' }}>Difficulty</th>
                  <th style={{ padding: '10px 12px' }}>Questions</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {quizHistory.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.title}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${q.score >= 70 ? 'badge-success' : 'badge-warning'}`}>
                        {q.score}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-info">{q.current_difficulty}</span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {q.correct_count} / {q.total_questions}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
