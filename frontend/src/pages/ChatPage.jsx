import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  Bookmark, 
  HelpCircle, 
  Lightbulb, 
  AlertCircle, 
  Plus, 
  MessageSquare,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import CitationModal from '../components/CitationModal';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState('study_tutor'); // 'study_tutor' or 'exam_prep'
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  
  // Citation Modal state
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadInitialData() {
    try {
      const [convs, resList] = await Promise.all([
        api.getConversations(),
        api.getResources()
      ]);
      setConversations(convs);
      setResources(resList);

      if (convs.length > 0) {
        selectConversation(convs[0].id);
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: "Hello! I am **LearnMate AI**, your personal study companion. Ask me any question about your uploaded textbooks, lecture slides, or transcripts. I will ground every answer strictly in your source materials and provide verified citations.",
            citations: [],
            grounding_type: 'grounded'
          }
        ]);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }

  async function selectConversation(id) {
    setActiveConvId(id);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  const handleStartNewSession = () => {
    setActiveConvId(null);
    setMessages([
      {
        id: 'new_welcome',
        sender: 'assistant',
        content: `Starting a fresh **${tutorMode === 'exam_prep' ? '🎯 Exam Preparation' : '📘 Personalized Tutoring'}** session. What topic from your uploaded materials would you like to explore?`,
        citations: [],
        grounding_type: 'grounded'
      }
    ]);
  };

  const handleSendMessage = async (isHintOnly = false) => {
    const text = inputMessage.trim();
    if (!text && !isHintOnly) return;
    
    const queryToSend = text || (messages.length > 1 ? messages[messages.length - 1].content : "Give me a study hint");

    // Add user message to UI immediately
    if (!isHintOnly) {
      const tempUserMsg = {
        id: 'temp_' + Date.now(),
        sender: 'user',
        content: text,
        citations: []
      };
      setMessages(prev => [...prev, tempUserMsg]);
      setInputMessage('');
    }

    setLoading(true);

    try {
      const res = await api.sendMessage(
        queryToSend,
        activeConvId,
        selectedResourceId ? parseInt(selectedResourceId) : null,
        tutorMode,
        isHintOnly
      );

      setActiveConvId(res.conversation_id);
      setMessages(prev => [...prev, res]);

      // Refresh conversation list titles
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          content: `⚠️ Error retrieving answer: ${err.message}. Please check your connection or try rephrasing.`,
          citations: [],
          grounding_type: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCitation = (cit) => {
    setSelectedCitation(cit);
    setCitationModalOpen(true);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, height: 'calc(100vh - 140px)' }}>
      {/* Sessions Sidebar */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <button className="btn btn-primary btn-sm" onClick={handleStartNewSession} style={{ marginBottom: 16 }}>
          <Plus size={16} /> New Study Chat
        </button>

        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10 }}>
          Study Sessions
        </h4>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {conversations.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No past sessions yet.</p>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  backgroundColor: activeConvId === c.id ? 'var(--primary-light)' : 'transparent',
                  color: activeConvId === c.id ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeConvId === c.id ? 600 : 500,
                  fontSize: '0.85rem'
                }}
              >
                <MessageSquare size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Chat Control Topbar */}
        <div 
          style={{ 
            padding: '12px 20px', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm ${tutorMode === 'study_tutor' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTutorMode('study_tutor')}
            >
              📘 Beginner Tutor
            </button>
            <button
              className={`btn btn-sm ${tutorMode === 'exam_prep' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTutorMode('exam_prep')}
            >
              🎯 Exam Prep
            </button>
          </div>

          {/* Filter Material */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-control"
              style={{ padding: '4px 10px', fontSize: '0.85rem', width: 200 }}
              value={selectedResourceId}
              onChange={e => setSelectedResourceId(e.target.value)}
            >
              <option value="">Search All Materials</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            const isInsufficient = m.grounding_type === 'insufficient_sources';

            return (
              <div 
                key={m.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div 
                  style={{
                    maxWidth: '82%',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    boxShadow: 'var(--card-shadow)',
                    border: isUser ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  {/* Assistant Header Badge */}
                  {!isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        <Sparkles size={12} /> {m.tutor_mode === 'exam_prep' ? 'Exam Prep Assistant' : 'LearnMate Tutor'}
                      </span>
                      {isInsufficient && (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          <AlertCircle size={12} /> Source Info Missing
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div style={{ fontSize: '0.94rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>

                  {/* Traceable Citations Bar */}
                  {!isUser && m.citations && m.citations.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Bookmark size={12} /> VERIFIED CITATIONS:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {m.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              fontSize: '0.78rem', 
                              padding: '3px 8px', 
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--bg-secondary)'
                            }}
                            onClick={() => handleOpenCitation(c)}
                            title="Click to view exact source passage"
                          >
                            <BookOpen size={12} />
                            <span>{c.filename}</span>
                            {c.page_or_slide && <span style={{ opacity: 0.7 }}>(p.{c.page_or_slide})</span>}
                            {c.timestamp_mark && <span style={{ opacity: 0.7 }}>({c.timestamp_mark})</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <Sparkles size={16} className="animate-spin" />
              <span>Retrieving source context & formulating grounded answer...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleSendMessage(true)}
              disabled={loading}
              title="Get a guided hint without revealing the full solution"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Lightbulb size={16} /> Hint
            </button>

            <input
              type="text"
              className="form-control"
              placeholder="Ask a question about your study materials (e.g. 'How does paging work in virtual memory?')..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(false); }}
              disabled={loading}
            />

            <button
              className="btn btn-primary"
              onClick={() => handleSendMessage(false)}
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={16} />
            </button>
          </div>
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
