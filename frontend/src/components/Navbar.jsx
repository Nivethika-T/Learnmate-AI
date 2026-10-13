import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Flame, ShieldCheck } from 'lucide-react';

export default function Navbar({ title, onActionClick }) {
  const { user } = useAuth();
  const isDemo = user?.username === 'demo_student';

  return (
    <header className="navbar">
      <h1 className="nav-page-title">{title}</h1>

      <div className="nav-actions">
        {isDemo && (
          <span className="badge badge-info" title="Running in pre-seeded Hackathon demonstration mode">
            <ShieldCheck size={14} /> Demo Mode
          </span>
        )}

        <div className="badge badge-warning">
          <Flame size={14} /> {user?.streak_count || 1} Days Active
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {(user?.full_name || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
