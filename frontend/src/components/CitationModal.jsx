import React from 'react';
import { X, FileText, CheckCircle2, Bookmark } from 'lucide-react';

export default function CitationModal({ citation, isOpen, onClose }) {
  if (!isOpen || !citation) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon" style={{ width: 36, height: 36 }}>
              <Bookmark size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Verified Source Citation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Extracted from your uploaded learning materials
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <span className="badge badge-info">
              <FileText size={12} /> {citation.filename || 'Source Document'}
            </span>
            {citation.page_or_slide && (
              <span className="badge badge-warning">
                Page / Slide {citation.page_or_slide}
              </span>
            )}
            {citation.timestamp_mark && (
              <span className="badge badge-warning">
                ⏱ {citation.timestamp_mark}
              </span>
            )}
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> Grounded Relevance: {Math.round((citation.relevance_score || 0.9) * 100)}%
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Section Title:
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {citation.source_title || 'General Chapter Notes'}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Verbatim Extracted Passage:
            </span>
            <div 
              style={{
                marginTop: 6,
                padding: 16,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                whiteSpace: 'pre-wrap'
              }}
            >
              "{citation.excerpt}"
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close Citation
          </button>
        </div>
      </div>
    </div>
  );
}
