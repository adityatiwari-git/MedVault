class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

    React.useEffect(() => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
      setIsLoading(false);
    }, []);

    const handleLogin = (user) => {
      setCurrentUser(user);
      setActiveTab('dashboard');
    };

    const handleLogout = () => {
      logout();
      setCurrentUser(null);
    };

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading MedVault...</p>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return <AuthForm onLogin={handleLogin} />;
    }

    return (
      <div className="min-h-screen gradient-bg" data-name="app" data-file="app.js">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 rounded-lg bg-gray-100"
            >
              <div className="icon-menu text-xl"></div>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="icon-heart text-lg text-white"></div>
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
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);