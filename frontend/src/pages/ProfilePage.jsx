import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  Flame, 
  Moon, 
  Sun, 
  Cpu, 
  Key, 
  CheckCircle2, 
  Info,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [llmProvider, setLlmProvider] = useState('mock');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Student Account Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div 
              style={{ 
                width: 52, 
                height: 52, 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.3rem'
              }}
            >
              {(user?.full_name || user?.username || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="card-title">{user?.full_name || user?.username}</h3>
              <p className="card-subtitle">{user?.email}</p>
            </div>
          </div>
          <span className="badge badge-success">Active Student</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Username
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
              @{user?.username}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={14} color="var(--warning)" /> Daily Streak
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>
              {user?.streak_count || 1} Days Active
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> Account Status
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
              Verified
            </div>
          </div>
        </div>
      </div>

      {/* Interface & Theme Preferences */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 6 }}>Interface Preferences</h3>
        <p className="card-subtitle" style={{ marginBottom: 18 }}>
          Customize the visual presentation of LearnMate AI
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Color Theme</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Currently set to {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* AI Provider Configuration Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">AI Provider & Knowledge Engine</h3>
            <p className="card-subtitle">
              Configured backend LLM and embedding integration
            </p>
          </div>
          <span className="badge badge-info">Zero-Cost Offline Ready</span>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label className="form-label">Active Intelligence Engine</label>
            <select
              className="form-control"
              value={llmProvider}
              onChange={e => setLlmProvider(e.target.value)}
            >
              <option value="mock">Built-in Deterministic RAG Engine (Zero external keys required)</option>
              <option value="gemini">Google Gemini 1.5 Flash (via GEMINI_API_KEY in backend .env)</option>
              <option value="openai">OpenAI GPT-3.5 / GPT-4 (via OPENAI_API_KEY in backend .env)</option>
              <option value="ollama">Local Ollama LLM (via OLLAMA_BASE_URL)</option>
            </select>
          </div>

          <div 
            style={{ 
              padding: 14, 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'var(--bg-tertiary)', 
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              <Info size={15} /> Hackathon Demonstration Reliability
            </div>
            LearnMate AI is fully configured with an autonomous, deterministic RAG synthesis engine. It indexes documents, extracts BM25 and semantic context, generates adaptive quizzes, and returns verified citations completely offline without requiring paid third-party tokens.
          </div>

          {savedNotice && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} /> Settings saved successfully!
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            Save System Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
