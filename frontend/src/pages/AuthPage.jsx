import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, BookOpen, Brain, Zap } from 'lucide-react';

export default function AuthPage() {
  const { login, register, demoLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (!email) throw new Error("Email is required");
        await register(username, email, password, fullName);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError("Demo login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: 20
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--modal-shadow)',
          padding: 36
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div 
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            LearnMate AI
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Personalized Tutoring & Adaptive Learning Platform
          </p>
        </div>

        {/* 1-Click Instant Demo Button */}
        <div 
          style={{
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 24,
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
            <Zap size={16} /> Instant Evaluator Access
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Explore pre-loaded study resources, adaptive quizzes, and knowledge graphs with 1-click.
          </p>
          <button 
            type="button" 
            className="btn btn-primary btn-sm" 
            onClick={handleDemoLogin}
            disabled={loading}
            style={{ width: '100%', fontWeight: 700 }}
          >
            <UserCheck size={16} /> Launch Demo Student Experience
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
          <span style={{ padding: '0 12px' }}>or continue with credentials</span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Tab Toggle */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 4,
            marginBottom: 20
          }}
        >
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: isLogin ? 'var(--bg-secondary)' : 'transparent',
              color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: isLogin ? 'var(--card-shadow)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: !isLogin ? 'var(--bg-secondary)' : 'transparent',
              color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: !isLogin ? 'var(--card-shadow)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alex Chen"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. alex_chen"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="alex@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 10, padding: '12px 0' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
