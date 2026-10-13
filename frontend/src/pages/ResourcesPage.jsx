import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Presentation, 
  Film, 
  Trash2, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Layers,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function ResourcesPage({ setActivePage }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      setError(err.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this resource and its knowledge chunks?")) return;
    try {
      await api.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Error deleting resource: " + err.message);
    }
  }

  async function handleInspectChunks(res) {
    setSelectedResource(res);
    setChunksLoading(true);
    try {
      const chunkData = await api.getResourceChunks(res.id);
      setChunks(chunkData);
    } catch (err) {
      alert("Failed to load chunks: " + err.message);
    } finally {
      setChunksLoading(false);
    }
  }

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText size={20} color="#ef4444" />;
      case 'pptx':
      case 'ppt': return <Presentation size={20} color="#f59e0b" />;
      case 'docx':
      case 'doc': return <BookOpen size={20} color="#3b82f6" />;
      case 'srt':
      case 'vtt':
      case 'youtube': return <Film size={20} color="#8b5cf6" />;
      default: return <FileText size={20} color="#10b981" />;
    }
  };

  const filtered = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search resources by title or filename..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setActivePage('upload')}>
          <Plus size={16} /> Upload New Material
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading study materials...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>No Resources Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto 20px', fontSize: '0.9rem' }}>
            {searchTerm ? "No materials match your search query." : "Upload textbooks, PowerPoint slides, notes, or video transcripts to start asking questions and taking adaptive quizzes."}
          </p>
          <button className="btn btn-primary" onClick={() => setActivePage('upload')}>
            <Plus size={16} /> Upload Learning Material
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(res => (
            <div key={res.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="stat-icon" style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)' }}>
                      {getFileIcon(res.file_type)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {res.title}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {res.original_filename}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${res.status === 'processed' ? 'badge-success' : 'badge-warning'}`}>
                    {res.status === 'processed' ? 'Indexed' : res.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                  <p style={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    lineHeight: 1.5,
                    fontStyle: 'italic'
                  }}>
                    "{res.sample_preview || 'Text processed into searchable chunks.'}"
                  </p>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12, marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Layers size={14} /> {res.total_chunks} Chunks
                  </span>
                  <span>{res.page_or_slide_count} {res.file_type.includes('ppt') ? 'Slides' : 'Pages'}</span>
                  <span>{(res.file_size_bytes / 1024).toFixed(0)} KB</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleInspectChunks(res)}
                  >
                    <Eye size={14} /> Inspect Chunks
                  </button>
                  <button 
                    className="btn btn-icon btn-sm" 
                    onClick={() => handleDelete(res.id)}
                    title="Delete Resource"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Knowledge Chunks Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" style={{ maxWidth: 750 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Knowledge Chunks: {selectedResource.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total {chunks.length} semantically partitioned chunks with source citations
                </p>
              </div>
              <button className="btn-icon" onClick={() => setSelectedResource(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh' }}>
              {chunksLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading extracted chunks...</p>
              ) : chunks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No chunks available for this resource.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chunks.map((ch, idx) => (
                    <div 
                      key={ch.id} 
                      style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="badge badge-info">Chunk #{idx + 1}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {ch.page_or_slide_num && (
                            <span className="badge badge-warning">Page/Slide {ch.page_or_slide_num}</span>
                          )}
                          {ch.timestamp_mark && (
                            <span className="badge badge-warning">{ch.timestamp_mark}</span>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>
                        {ch.text_content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedResource(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
