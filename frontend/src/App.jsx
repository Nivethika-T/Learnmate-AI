import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ResourcesPage from './pages/ResourcesPage';
import UploadPage from './pages/UploadPage';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import LearningPathPage from './pages/LearningPathPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import './styles/theme.css';
import './styles/components.css';

function MainApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [quizInitialTopic, setQuizInitialTopic] = useState(null);

  if (loading) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-muted)'
        }}
      >
        <p>Initializing LearnMate AI platform...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleStartQuizTopic = (topicName) => {
    setQuizInitialTopic(topicName);
    setActivePage('quiz');
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Student Learning Dashboard';
      case 'resources': return 'My Learning Resources';
      case 'upload': return 'Upload & Process Materials';
      case 'chat': return 'AI Study Assistant & Tutor';
      case 'quiz': return 'Adaptive Assessment Generator';
      case 'learning-path': return 'Personalized Learning Roadmap';
      case 'analytics': return 'Progress & Mastery Analytics';
      case 'profile': return 'Student Profile & Settings';
      default: return 'LearnMate AI';
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={(page) => {
        if (page !== 'quiz') setQuizInitialTopic(null);
        setActivePage(page);
      }} />

      <main className="main-content">
        <Navbar title={getPageTitle()} />

        <div className="page-body">
          {activePage === 'dashboard' && (
            <DashboardPage 
              setActivePage={setActivePage} 
              onStartQuizTopic={handleStartQuizTopic} 
            />
          )}

          {activePage === 'resources' && (
            <ResourcesPage setActivePage={setActivePage} />
          )}

          {activePage === 'upload' && (
            <UploadPage setActivePage={setActivePage} />
          )}

          {activePage === 'chat' && (
            <ChatPage />
          )}

          {activePage === 'quiz' && (
            <QuizPage 
              initialTopic={quizInitialTopic} 
              setActivePage={setActivePage} 
            />
          )}

          {activePage === 'learning-path' && (
            <LearningPathPage 
              setActivePage={setActivePage} 
              onStartQuizTopic={handleStartQuizTopic} 
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage />
          )}

          {activePage === 'profile' && (
            <ProfilePage />
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
