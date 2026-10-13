import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Bookmark,
  TrendingUp,
  MapPin
} from 'lucide-react';
import CitationModal from '../components/CitationModal';

export default function QuizResultsPage({ quiz, onRetake, setActivePage }) {
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  const score = quiz.score || 0;
  const isPassing = score >= 70;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Score Summary Card */}
      <div 
        className="card" 
        style={{ 
          textAlign: 'center', 
          padding: 36, 
          marginBottom: 28,
          background: isPassing 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(99, 102, 241, 0.05))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.05))',
          borderColor: isPassing ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
        }}
      >
        <div 
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: isPassing ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: isPassing ? 'var(--success)' : 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <Award size={36} />
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {isPassing ? 'Outstanding Performance!' : 'Assessment Complete — Keep Practicing!'}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          {quiz.title} ({quiz.topic})
        </p>

        {/* Big Score Stats */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 40, 
            marginTop: 24, 
            paddingTop: 24, 
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: isPassing ? 'var(--success)' : 'var(--warning)' }}>
              {score}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FINAL ACCURACY</div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {quiz.correct_count} / {quiz.total_questions}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CORRECT ANSWERS</div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)' }}>
              {quiz.current_difficulty}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FINAL DIFFICULTY REACHED</div>
          </div>

          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
              {quiz.time_spent_seconds || 45}s
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME SPENT</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onRetake}>
            <RotateCcw size={16} /> Retake Assessment
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage('learning-path')}>
            View Updated Learning Path <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Weak Topics Diagnosis */}
      {quiz.weak_topics && quiz.weak_topics.length > 0 && (
        <div className="card" style={{ marginBottom: 28, borderColor: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Diagnosed Knowledge Gaps</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Based on your answers, our rule-based engine flagged the following weak areas for revision:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quiz.weak_topics.map((t, idx) => (
              <span key={idx} className="badge badge-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Question Review */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 20 }}>Detailed Question Review</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {quiz.questions.map((q, idx) => {
            const isCorrect = q.is_correct;
            return (
              <div 
                key={q.id || idx}
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-info">Q{idx + 1}</span>
                    <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    <span className="badge badge-warning">Level: {q.difficulty}</span>
                  </div>

                  {q.citation && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedCitation(q.citation);
                        setCitationModalOpen(true);
                      }}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Bookmark size={12} /> Source Passage
                    </button>
                  )}
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {q.question_text}
                </h4>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {q.options.map((opt, oIdx) => {
                    const isSelected = q.user_selected_index === oIdx;
                    const isTheCorrectOne = q.correct_option_index === oIdx;

                    let bg = 'var(--bg-secondary)';
                    let border = 'var(--border-color)';
                    let textCol = 'var(--text-secondary)';

                    if (isTheCorrectOne) {
                      bg = 'var(--success-bg)';
                      border = 'var(--success)';
                      textCol = 'var(--success)';
                    } else if (isSelected && !isCorrect) {
                      bg = 'var(--danger-bg)';
                      border = 'var(--danger)';
                      textCol = 'var(--danger)';
                    }

                    return (
                      <div 
                        key={oIdx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${border}`,
                          backgroundColor: bg,
                          color: textCol,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + oIdx)}.</span>
                        <span>{opt}</span>
                        {isTheCorrectOne && <CheckCircle2 size={16} style={{ marginLeft: 'auto' }} />}
                        {isSelected && !isCorrect && <XCircle size={16} style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Explanation: </strong>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CitationModal
        citation={selectedCitation}
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
      />
    </div>
  );
}
