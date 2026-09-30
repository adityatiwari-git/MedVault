import React from 'react';

function Navigation({ activeTab, onTabChange, onLogout, user, isMobileOpen, onMobileClose }) {
  try {
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'records', label: 'Health Records', icon: 'folder-medical' },
      { id: 'cycle', label: 'Cycle Tracker', icon: 'calendar-heart' },
      { id: 'ai-assistant', label: 'AI Assistant', icon: 'bot' },
      { id: 'profile', label: 'Profile', icon: 'user' }
    ];

    const handleTabChange = (tabId) => {
      onTabChange(tabId);
      if (onMobileClose) onMobileClose();
    };

    return (
      <>
        {/* Mobile Overlay */}
        {isMobileOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onMobileClose}
          />
        )}
        
        <nav className={`fixed left-0 top-0 h-full w-72 glass-effect shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`} data-name="navigation" data-file="components/Navigation.js">
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-10 animate-float">
            <div className="w-12 h-12 icon-container" 
                 style={{background: 'linear-gradient(135deg, #d946ef, #a855f7)'}}>
              <div className="icon-heart text-2xl text-white"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">MedVault</h2>
              <p className="text-sm text-gray-500 font-medium">Your Health Companion</p>
            </div>
          </div>

          <div className="space-y-3 mb-12">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-item w-full text-left ${
                  activeTab === item.id ? 'active' : ''
                }`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={`icon-${item.icon} text-xl`}></div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-gray-200">
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <div className="icon-user text-xl text-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{user?.objectData?.Name}</p>
              <p className="text-sm text-gray-500">{user?.objectData?.Email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-secondary w-full flex items-center justify-center space-x-3"
          >
            <div className="icon-log-out text-lg"></div>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
    );
  } catch (error) {
    console.error('Navigation component error:', error);
    return null;
  }
}

export default Navigation;
