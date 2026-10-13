import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Award, 
  TrendingUp, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { api } from '../services/api';

export default function DashboardPage({ setActivePage, onStartQuizTopic }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your learning analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const COLORS = ['#10b981', '#6366f1', '#94a3b8'];

  return (
    <div>
      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{data?.total_resources || 0}</div>
            <div className="stat-label">Uploaded Resources</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{data?.quizzes_completed || 0}</div>
            <div className="stat-label">Quizzes Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{data?.average_quiz_score || 0}%</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val">{data?.overall_topic_mastery || 0}%</div>
            <div className="stat-label">Topic Mastery</div>
          </div>
        </div>
      </div>

      {/* Priority Action Recommendation Card */}
      {data?.next_recommended_task && (
        <div 
          className="card" 
          style={{ 
            marginBottom: 28, 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04))',
            borderColor: 'rgba(99, 102, 241, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-info">
                  <Sparkles size={12} /> Priority Recommendation
                </span>
                <span className="badge badge-warning">
                  {data.next_recommended_task.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data.next_recommended_task.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 680 }}>
                {data.next_recommended_task.description}
              </p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                if (onStartQuizTopic) {
                  onStartQuizTopic(data.next_recommended_task.topic_name);
                } else {
                  setActivePage('quiz');
                }
              }}
            >
              Start Adaptive Quiz <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Performance Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Quiz Performance Trend</h3>
              <p className="card-subtitle">Accuracy and score progression over recent quizzes</p>
            </div>
            <span className="badge badge-info">Adaptive Tracking</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.quiz_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)'
                  }} 
                />
                <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Mastery Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Topic Mastery Levels</h3>
              <p className="card-subtitle">Count of topics categorized by learning status</p>
            </div>
            <span className="badge badge-success">Rule-based</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topic_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)'
                  }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {(data?.topic_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Knowledge Gaps & Strengths */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Topic Diagnosis</h3>
          
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>
              <CheckCircle2 size={16} /> Strongest Topics
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data?.strongest_topics?.length > 0 ? (
                data.strongest_topics.map((t, idx) => (
                  <span key={idx} className="badge badge-success">{t}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Complete more quizzes to identify strong topics.</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
              <AlertTriangle size={16} /> Topics Needing Attention
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data?.weak_topics?.length > 0 ? (
                data.weak_topics.map((t, idx) => (
                  <span key={idx} className="badge badge-danger">{t}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No critical knowledge gaps detected! Keep practicing.</span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Recent Learning Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data?.recent_activity?.length > 0 ? (
              data.recent_activity.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-color)' }}>
                  <div className="stat-icon" style={{ width: 34, height: 34, flexShrink: 0 }}>
                    <Clock size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.title}
                      </span>
                      {item.badge && <span className="badge badge-info">{item.badge}</span>}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent activity. Upload a resource or take a quiz to get started!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
