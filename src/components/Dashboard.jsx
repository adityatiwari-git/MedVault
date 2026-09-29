import React from 'react';
import { getUserDocuments, getUserPrescriptions, getUserCycles } from '../services/storage.js';

function Dashboard({ user }) {
  try {
    const [stats, setStats] = React.useState({
      totalDocuments: 0,
      recentUploads: [],
      upcomingReminders: [],
      cycleInsights: null
    });
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
      try {
        // Load user documents
        const documents = await trickleListObjects(`document:${user.objectId}`, 10, true);
        
        // Load prescriptions for reminders
        const prescriptions = await trickleListObjects(`prescription:${user.objectId}`, 10, true);
        
        // Load recent cycle data
        const cycles = await trickleListObjects(`cycle_tracking:${user.objectId}`, 3, true);

        setStats({
          totalDocuments: documents.items.length,
          recentUploads: documents.items.slice(0, 3),
          upcomingReminders: prescriptions.items.filter(p => p.objectData.ReminderEnabled).slice(0, 3),
          cycleInsights: cycles.items[0] || null
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoading) {
      return (
        <div className="space-y-6" data-name="dashboard" data-file="components/Dashboard.js">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6" data-name="dashboard" data-file="components/Dashboard.js">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gradient mb-2 animate-float">
              Welcome back, {user.objectData.Name}! 
              <span className="inline-block ml-2">👋</span>
            </h1>
            <p className="text-gray-600 text-lg">Here's your health overview for today</p>
            <div className="flex items-center space-x-2 mt-3 text-sm text-gray-500">
              <div className="icon-calendar text-lg"></div>
              <span>{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-full">
            <div className="icon-shield-check text-lg"></div>
            <span>All data secured & encrypted</span>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <div className="icon-folder text-2xl text-white"></div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-blue-600 font-medium">Health Records</p>
              </div>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse-soft" 
                   style={{width: `${Math.min(stats.totalDocuments * 20, 100)}%`}}></div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-pink-50 to-purple-100 border-pink-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                <div className="icon-calendar-heart text-2xl text-white"></div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.cycleInsights ? 'Active' : 'Start'}
                </p>
                <p className="text-pink-600 font-medium">Cycle Tracking</p>
              </div>
            </div>
            <div className="h-2 bg-pink-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse-soft" 
                   style={{width: stats.cycleInsights ? '100%' : '20%'}}></div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <div className="icon-pill text-2xl text-white"></div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingReminders.length}</p>
                <p className="text-green-600 font-medium">Active Reminders</p>
              </div>
            </div>
            <div className="h-2 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse-soft" 
                   style={{width: `${Math.min(stats.upcomingReminders.length * 25, 100)}%`}}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Uploads */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="icon-upload text-purple-500"></div>
                <span>Recent Uploads</span>
              </h3>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Last 3 items
              </div>
            </div>
            {stats.recentUploads.length > 0 ? (
              <div className="space-y-4">
                {stats.recentUploads.map((doc, index) => (
                  <div key={doc.objectId} 
                       className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-300"
                       style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <div className="icon-file-text text-lg text-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{doc.objectData.FileName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {doc.objectData.Category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.objectData.DateUploaded).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="icon-chevron-right text-gray-400"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-folder-plus text-4xl text-gray-300 mx-auto mb-4"></div>
                <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                <p className="text-sm text-gray-400">Start by uploading your first health document</p>
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="icon-bell text-green-500"></div>
                <span>Medication Reminders</span>
              </h3>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Active now
              </div>
            </div>
            {stats.upcomingReminders.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingReminders.map((prescription, index) => (
                  <div key={prescription.objectId}
                       className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300"
                       style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <div className="icon-pill text-lg text-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{prescription.objectData.MedicineName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {prescription.objectData.Frequency}
                        </span>
                        <span className="text-xs text-gray-500">
                          Next: Today
                        </span>
                      </div>
                    </div>
                    <div className="icon-clock text-gray-400"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="icon-pill text-4xl text-gray-300 mx-auto mb-4"></div>
                <p className="text-gray-500 mb-4">No active reminders</p>
                <p className="text-sm text-gray-400">Add medications to get helpful reminders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard component error:', error);
    return null;
  }
}
export default Dashboard;
