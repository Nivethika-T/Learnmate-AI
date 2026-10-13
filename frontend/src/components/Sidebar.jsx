import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  UploadCloud, 
  MessageSquare, 
  HelpCircle, 
  Map, 
  BarChart3, 
  User, 
  LogOut, 
  Flame, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resources', label: 'My Resources', icon: BookOpen },
    { id: 'upload', label: 'Upload Materials', icon: UploadCloud },
    { id: 'chat', label: 'AI Study Assistant', icon: MessageSquare },
    { id: 'quiz', label: 'Adaptive Quiz', icon: HelpCircle },
    { id: 'learning-path', label: 'Learning Path', icon: Map },
    { id: 'analytics', label: 'Progress Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <span className="brand-title">LearnMate AI</span>
          <span className="brand-badge" style={{ marginLeft: 6 }}>Pro</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-streak-banner">
          <Flame size={16} />
          <span>{user?.streak_count || 1} Day Study Streak!</span>
        </div>

        <div className="user-mini-card">
          <div className="user-info-text">
            <span className="user-name">{user?.full_name || user?.username || 'Student'}</span>
            <span className="user-role">{user?.email || 'Student Account'}</span>
          </div>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle Dark/Light Mode">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={logout} style={{ width: '100%' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
