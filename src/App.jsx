import { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm.jsx';
import Navigation from './components/Navigation.jsx';
import Dashboard from './components/Dashboard.jsx';
import Records from './components/Records.jsx';
import CycleTracker from './components/CycleTracker.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import Profile from './components/Profile.jsx';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading MedVault...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileNavOpen((open) => !open)}
            className="p-2 rounded-lg bg-gray-100"
            aria-label="Toggle navigation"
          >
            <div className="icon-menu text-xl" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <div className="icon-heart text-lg text-white" />
            </div>
            <span className="font-bold text-gradient">MedVault</span>
          </div>
        </div>
      </div>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        user={currentUser}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      <main className="lg:ml-72 pt-20 lg:pt-0 p-4 lg:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard user={currentUser} />}
          {activeTab === 'records' && <Records user={currentUser} />}
          {activeTab === 'cycle' && <CycleTracker user={currentUser} />}
          {activeTab === 'ai-assistant' && <AIAssistant user={currentUser} />}
          {activeTab === 'profile' && <Profile user={currentUser} />}
        </div>
      </main>
    </div>
  );
}

export default App;
