import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Film, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { api } from '../services/api';

export default function UploadPage({ setActivePage }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'youtube'
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    setErrorMsg('');
    setSuccessMsg('');
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      const valid = ['pdf', 'pptx', 'ppt', 'docx', 'doc', 'txt', 'md', 'srt', 'vtt'];
      if (!valid.includes(ext)) {
        setErrorMsg(`Unsupported file type (.${ext}). Supported formats: PDF, PPTX, DOCX, TXT, SRT, VTT`);
        setFile(null);
        return;
      }
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
      }
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a file to upload.");
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const res = await api.uploadResource(file, title);
      setSuccessMsg(`Successfully processed "${res.title}" into ${res.total_chunks} searchable chunks!`);
      setFile(null);
      setTitle('');
    } catch (err) {
      setErrorMsg(err.message || "Failed to process and index file.");
    } finally {
      setUploading(false);
    }
  };

  const handleYoutubeUpload = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) {
      setErrorMsg("Please provide a valid YouTube video URL.");
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const res = await api.addYouTubeResource(youtubeUrl, title, transcript);
      setSuccessMsg(`Successfully indexed video lecture "${res.title}" with ${res.total_chunks} timestamped segments!`);
      setYoutubeUrl('');
      setTranscript('');
      setTitle('');
    } catch (err) {
      setErrorMsg(err.message || "Failed to process YouTube resource.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Upload Mode Selector */}
      <div 
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: 24
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('file'); setErrorMsg(''); setSuccessMsg(''); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.92rem',
            backgroundColor: activeTab === 'file' ? 'var(--bg-secondary)' : 'transparent',
            color: activeTab === 'file' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'file' ? 'var(--card-shadow)' : 'none'
          }}
        >
          <FileText size={18} /> Document & Transcript Files
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('youtube'); setErrorMsg(''); setSuccessMsg(''); }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: '0.92rem',
            backgroundColor: activeTab === 'youtube' ? 'var(--bg-secondary)' : 'transparent',
            color: activeTab === 'youtube' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'youtube' ? 'var(--card-shadow)' : 'none'
          }}
        >
          <Film size={18} /> YouTube Lecture Video URL
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Upload Learning Resource</h3>
              <p className="card-subtitle">
                Supported formats: PDF textbooks, PPTX slides, Word DOCX, Plain text TXT, SRT/VTT subtitles
              </p>
            </div>
            <span className="badge badge-info">Multi-format RAG</span>
          </div>

          <form onSubmit={handleFileUpload}>
            {/* Drag & Drop Zone */}
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-tertiary)',
                marginBottom: 20,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.srt,.vtt"
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <div 
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <UploadCloud size={28} />
              </div>

              {file ? (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {file.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {(file.size / 1024).toFixed(1)} KB — Ready to parse & chunk
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Choose a file or drag & drop here
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    PDF, PPTX, DOCX, TXT, SRT, or VTT up to 25 MB
                  </p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Resource Title (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Operating Systems Chapter 8 — Virtual Memory"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !file}
              style={{ width: '100%', marginTop: 8 }}
            >
              {uploading ? (
                <span>Extracting Text & Partitioning Chunks...</span>
              ) : (
                <>
                  <UploadCloud size={16} /> Process & Index Resource
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* YouTube URL Tab */}
      {activeTab === 'youtube' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Index YouTube Video Lecture</h3>
              <p className="card-subtitle">
                Enter video lecture URL with timestamped captions or lecture notes
              </p>
            </div>
            <span className="badge badge-warning">Video Retrieval</span>
          </div>

          <form onSubmit={handleYoutubeUpload}>
            <div className="form-group">
              <label className="form-label">YouTube Video URL</label>
              <div style={{ position: 'relative' }}>
                <Link2 size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  required
                  className="form-control"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lecture Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MIT 6.004 Lecture 12: Memory Hierarchy & Virtual Memory"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Video Transcript or Lecture Notes (Optional)</label>
              <textarea
                className="form-control"
                rows={6}
                placeholder="Paste video subtitles (SRT/VTT) or speaker notes here to partition into timestamped RAG chunks..."
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !youtubeUrl}
              style={{ width: '100%', marginTop: 8 }}
            >
              {uploading ? 'Processing Video Segments...' : 'Index Video Material'}
            </button>
          </form>
        </div>
      )}

      {/* Quick Navigation Footer */}
      {successMsg && (
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setActivePage('resources')}>
            View My Resources
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage('chat')}>
            Ask Questions in Study Chat <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
