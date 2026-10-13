import React, { useState, useEffect } from 'react';
import { 
  Map, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  TrendingUp,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function LearningPathPage({ setActivePage, onStartQuizTopic }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLearningPath();
  }, []);

  async function loadLearningPath() {
    try {
      const res = await api.getLearningPath();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load learning path");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRec(id) {
    try {
      await api.completeRecommendation(id);
      setData(prev => ({
        ...prev,
        recommendations: prev.recommendations.filter(r => r.id !== id)
      }));
    } catch (err) {
      alert("Failed to update recommendation: " + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Assembling your personalized study path...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const mastered = (data?.topics || []).filter(t => t.mastery_level === 'Mastered');
  const inProgress = (data?.topics || []).filter(t => t.mastery_level === 'In Progress');
  const notStarted = (data?.topics || []).filter(t => t.mastery_level === 'Not Started');

  return (
    <div>
      {/* Overview Metric Banner */}
      <div 
        className="card" 
        style={{ 
          marginBottom: 28, 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05))',
          borderColor: 'rgba(99, 102, 241, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: 6 }}>
              <Sparkles size={12} /> Transparent Rule-based Roadmap
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Overall Syllabus Mastery: {data?.overall_mastery_percentage || 0}%
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Tracking {data?.total_topics || 0} extracted subject topics based on verified quiz performance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{data?.mastered_count || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MASTERED</div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{data?.in_progress_count || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN PROGRESS</div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-muted)' }}>{data?.not_started_count || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>NOT STARTED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized Study Action Tasks */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Prioritized Next Steps</h3>
            <p className="card-subtitle">Recommended study tasks sorted by prerequisite priority and knowledge gaps</p>
          </div>
          <span className="badge badge-warning">Action Items</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(!data?.recommendations || data.recommendations.length === 0) ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              No outstanding recommendations. Take a quiz to generate new targeted study paths!
            </p>
          ) : (
            data.recommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${rec.priority === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${rec.priority === 'high' ? 'badge-danger' : rec.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {rec.topic_name}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rec.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {rec.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (onStartQuizTopic) {
                        onStartQuizTopic(rec.topic_name);
                      } else {
                        setActivePage('quiz');
                      }
                    }}
                  >
                    <HelpCircle size={14} /> Practice Quiz
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCompleteRec(rec.id)}
                    title="Mark task completed"
                  >
                    <Check size={14} /> Done
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Roadmap Topic Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Mastered Column */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 700 }}>
              <CheckCircle2 size={20} /> Mastered Topics (≥80%)
            </div>
            <span className="badge badge-success">{mastered.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mastered.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score ≥80% on at least 3 questions in a topic to achieve mastery.</p>
            ) : (
              mastered.map(t => (
                <div key={t.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.topic_name}</span>
                    <span className="badge badge-success">{t.mastery_score}%</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.mastery_score}%`, height: '100%', backgroundColor: 'var(--success)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {t.correct_attempts}/{t.total_attempts} correct attempts
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
              <TrendingUp size={20} /> In Progress Topics
            </div>
            <span className="badge badge-info">{inProgress.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inProgress.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No topics currently in progress.</p>
            ) : (
              inProgress.map(t => (
                <div key={t.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.topic_name}</span>
                    <span className="badge badge-info">{t.mastery_score}%</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.mastery_score}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.correct_attempts}/{t.total_attempts} correct
                    </span>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => onStartQuizTopic ? onStartQuizTopic(t.topic_name) : setActivePage('quiz')}
                    >
                      Drill Topic
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Not Started Column */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontWeight: 700 }}>
              <Clock size={20} /> Not Started
            </div>
            <span className="badge badge-secondary">{notStarted.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notStarted.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All tracked topics have been practiced!</p>
            ) : (
              notStarted.map(t => (
                <div key={t.id} style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.topic_name}</span>
                    <span className="badge badge-secondary">0%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 attempts</span>
                    <button 
                      className="btn btn-primary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={() => onStartQuizTopic ? onStartQuizTopic(t.topic_name) : setActivePage('quiz')}
                    >
                      Start Topic
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
