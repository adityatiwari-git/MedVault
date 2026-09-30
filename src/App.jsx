import { useEffect, useState } from 'react';
import { getCurrentUser, logout } from './services/auth.js';
import AuthForm from './components/AuthForm.jsx';
import Navigation from './components/Navigation.jsx';
import Dashboard from './components/Dashboard.jsx';
import Records from './components/Records.jsx';
import CycleTracker from './components/CycleTracker.jsx';
import Profile from './components/Profile.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((user) => {
        if (mounted) {
          setCurrentUser(user);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Unable to restore session:', error);
        if (mounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCurrentUser(null);
      setActiveTab('dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="brand-mark mx-auto mb-4">
            <span>♡</span>
          </div>
          <p className="text-slate-500 font-medium">Opening your health space...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen app-shell">
      <div className="lg:hidden mobile-header">
        <button
          onClick={() => setIsMobileNavOpen((open) => !open)}
          className="icon-button"
          aria-label="Open menu"
        >
          <span>☰</span>
        </button>

        <div className="brand-inline">
          <div className="brand-mark small"><span>♡</span></div>
          <span>MedVault</span>
        </div>

        <button
          onClick={() => setActiveTab('profile')}
          className="profile-mini"
          aria-label="Open profile"
        >
          {currentUser.objectData.Name?.charAt(0)?.toUpperCase() || 'U'}
        </button>
      </div>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        user={currentUser}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      <main className="lg:ml-[280px] min-h-screen px-4 py-20 lg:px-8 lg:py-8">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'dashboard' && <Dashboard user={currentUser} onNavigate={setActiveTab} />}
          {activeTab === 'records' && <Records user={currentUser} />}
          {activeTab === 'cycle' && <CycleTracker user={currentUser} />}
          {activeTab === 'profile' && <Profile user={currentUser} onUserUpdated={setCurrentUser} />}
        </div>
      </main>
    </div>
  );
}

export default App;
