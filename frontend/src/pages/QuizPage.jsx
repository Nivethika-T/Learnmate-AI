import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Flame, 
  Bookmark,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import CitationModal from '../components/CitationModal';
import QuizResultsPage from './QuizResultsPage';

export default function QuizPage({ initialTopic, setActivePage }) {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [topic, setTopic] = useState(initialTopic || 'Comprehensive Review');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Feedback state per question
  const [feedback, setFeedback] = useState(null);
  const [adaptiveNotice, setAdaptiveNotice] = useState(null);
  const [completedQuizData, setCompletedQuizData] = useState(null);
  
  // Citations
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      try {
        const resList = await api.getResources();
        setResources(resList);
        if (initialTopic) setTopic(initialTopic);
      } catch (err) {
        console.error("Failed to load resources:", err);
      }
    }
    fetchResources();
  }, [initialTopic]);

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setAdaptiveNotice(null);
    setCompletedQuizData(null);
    try {
      const quiz = await api.generateQuiz(
        topic,
        difficulty,
        questionCount,
        selectedResourceId ? parseInt(selectedResourceId) : null
      );
      setActiveQuiz(quiz);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setFeedback(null);
    } catch (err) {
      alert("Failed to create quiz: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || submitting) return;
    setSubmitting(true);

    const currQ = activeQuiz.questions[currentQIndex];
    try {
      const result = await api.submitQuizAnswer(
        activeQuiz.id,
        currQ.id,
        selectedOption,
        15 // approximate 15s per question
      );

      setFeedback(result);

      if (result.difficulty_changed) {
        setAdaptiveNotice({
          message: result.difficulty_message,
          newDifficulty: result.next_difficulty
        });
      }

      // Update local question state
      currQ.user_selected_index = selectedOption;
      currQ.is_correct = result.is_correct;
      currQ.explanation = result.explanation;
      currQ.citation = result.citation;
      currQ.correct_option_index = result.correct_option_index;

      if (result.is_quiz_completed) {
        // Fetch full completed quiz record
        const fullQuiz = await api.getQuiz(activeQuiz.id);
        setCompletedQuizData(fullQuiz);
      }
    } catch (err) {
      alert("Error submitting answer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setFeedback(null);
    setCurrentQIndex(prev => prev + 1);
  };

  // If completed, show comprehensive results page
  if (completedQuizData) {
    return (
      <QuizResultsPage 
        quiz={completedQuizData} 
        onRetake={() => {
          setActiveQuiz(null);
          setCompletedQuizData(null);
          setFeedback(null);
        }}
        setActivePage={setActivePage}
      />
    );
  }

  // Quiz Configuration View
  if (!activeQuiz) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Adaptive Quiz Generator</h3>
              <p className="card-subtitle">
                Dynamically calibrates question difficulty based on your real-time responses
              </p>
            </div>
            <span className="badge badge-info">Adaptive Engine</span>
          </div>

          <form onSubmit={handleStartQuiz}>
            <div className="form-group">
              <label className="form-label">Subject / Resource Material</label>
              <select
                className="form-control"
                value={selectedResourceId}
                onChange={e => {
                  setSelectedResourceId(e.target.value);
                  const found = resources.find(r => r.id === parseInt(e.target.value));
                  if (found) setTopic(found.title);
                }}
              >
                <option value="">All Uploaded Study Materials</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.file_type.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Topic or Chapter</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Virtual Memory Architecture, Neural Networks"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Starting Difficulty</label>
                <select
                  className="form-control"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy (Fundamentals)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Hard">Hard (Advanced / Deep Derivations)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <select
                  className="form-control"
                  value={questionCount}
                  onChange={e => setQuestionCount(parseInt(e.target.value))}
                >
                  <option value={3}>3 Questions (Quick Drill)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div 
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                marginBottom: 20,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>⚙️ How Adaptive Calibration Works:</strong>
              <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                <li>Consistently answering correctly automatically elevates question difficulty.</li>
                <li>Incorrect answers immediately adjust difficulty down and flag weak topics.</li>
                <li>Every question includes an authentic citation linked to your uploaded notes.</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating}
              style={{ width: '100%', padding: '12px 0' }}
            >
              {generating ? 'Generating Grounded Quiz...' : 'Generate & Start Adaptive Quiz'}
              {!generating && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Quiz View
  const currentQ = activeQuiz.questions[currentQIndex];
  const progressPercent = Math.round(((currentQIndex) / activeQuiz.total_questions) * 100);

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Adaptive Progression Alert */}
      {adaptiveNotice && (
        <div 
          className="alert alert-info" 
          style={{ 
            animation: 'fadeIn 0.3s ease',
            border: '1px solid var(--primary)'
          }}
        >
          <Flame size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <strong style={{ display: 'block' }}>Adaptive Difficulty Update:</strong>
            {adaptiveNotice.message}
          </div>
        </div>
      )}

      {/* Quiz Card */}
      <div className="card">
        {/* Top Progress & Difficulty Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-info">
              Question {currentQIndex + 1} of {activeQuiz.total_questions}
            </span>
            <span className={`badge ${currentQ.difficulty === 'Hard' ? 'badge-danger' : currentQ.difficulty === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
              Level: {currentQ.difficulty}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Clock size={16} /> Adaptive Assessment
          </div>
        </div>

        {/* Progress bar */}
        <div 
          style={{ 
            height: 6, 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-full)', 
            overflow: 'hidden',
            marginBottom: 24 
          }}
        >
          <div 
            style={{ 
              height: '100%', 
              width: `${progressPercent}%`, 
              backgroundColor: 'var(--primary)', 
              transition: 'width 0.3s ease' 
            }} 
          />
        </div>

        {/* Question Text */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Topic: {currentQ.topic}
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4, lineHeight: 1.45 }}>
            {currentQ.question_text}
          </h3>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isSubmitted = feedback !== null;
            const isCorrectOption = feedback && idx === feedback.correct_option_index;
            const isWrongSelection = feedback && isSelected && !feedback.is_correct;

            let bgColor = 'var(--bg-tertiary)';
            let borderColor = 'var(--border-color)';
            let textColor = 'var(--text-primary)';

            if (isSubmitted) {
              if (isCorrectOption) {
                bgColor = 'var(--success-bg)';
                borderColor = 'var(--success)';
                textColor = 'var(--success)';
              } else if (isWrongSelection) {
                bgColor = 'var(--danger-bg)';
                borderColor = 'var(--danger)';
                textColor = 'var(--danger)';
              }
            } else if (isSelected) {
              bgColor = 'var(--primary-light)';
              borderColor = 'var(--primary)';
              textColor = 'var(--primary)';
            }

            return (
              <div
                key={idx}
                onClick={() => { if (!feedback) setSelectedOption(idx); }}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  cursor: feedback ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  fontWeight: isSelected || isCorrectOption ? 600 : 500,
                  fontSize: '0.95rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div 
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: `2px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span style={{ flex: 1 }}>{opt}</span>
                {isSubmitted && isCorrectOption && <CheckCircle2 size={20} color="var(--success)" />}
                {isSubmitted && isWrongSelection && <XCircle size={20} color="var(--danger)" />}
              </div>
            );
          })}
        </div>

        {/* Feedback & Citation Box */}
        {feedback && (
          <div 
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: feedback.is_correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${feedback.is_correct ? 'var(--success)' : 'var(--danger)'}`,
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: feedback.is_correct ? 'var(--success)' : 'var(--danger)' }}>
                {feedback.is_correct ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{feedback.is_correct ? "Correct Answer!" : "Incorrect Answer"}</span>
              </div>

              {feedback.citation && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedCitation(feedback.citation);
                    setCitationModalOpen(true);
                  }}
                  style={{ fontSize: '0.78rem' }}
                >
                  <Bookmark size={12} /> Inspect Source Citation
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {feedback.explanation}
            </p>
          </div>
        )}

        {/* Submit or Next Button */}
        <div>
          {!feedback ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null || submitting}
              style={{ width: '100%', padding: '12px 0' }}
            >
              {submitting ? 'Checking Answer...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNextQuestion}
              style={{ width: '100%', padding: '12px 0' }}
            >
              {currentQIndex + 1 >= activeQuiz.total_questions ? 'View Assessment Results' : 'Next Adaptive Question'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={selectedCitation}
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
      />
    </div>
  );
}
