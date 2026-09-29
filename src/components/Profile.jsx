import React from 'react';

function Profile({ user }) {
  try {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [profileData, setProfileData] = React.useState({
      name: user.objectData.Name,
      email: user.objectData.Email,
      age: user.objectData.Age.toString(),
      gender: user.objectData.Gender
    });
    const [stats, setStats] = React.useState({
      totalDocuments: 0,
      totalCycles: 0,
      totalPrescriptions: 0,
      memberSince: ''
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [successMessage, setSuccessMessage] = React.useState('');

    React.useEffect(() => {
      loadUserStats();
    }, [user]);

    const loadUserStats = async () => {
      try {
        const [documents, cycles, prescriptions] = await Promise.all([
          getUserDocuments(user.objectId),
          getUserCycles(user.objectId),
          getUserPrescriptions(user.objectId)
        ]);

        setStats({
          totalDocuments: documents.length,
          totalCycles: cycles.length,
          totalPrescriptions: prescriptions.length,
          memberSince: new Date(user.createdAt).toLocaleDateString()
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSave = async (e) => {
      e.preventDefault();
      setIsSaving(true);
      try {
        await trickleUpdateObject('user', user.objectId, {
          Name: profileData.name,
          Email: profileData.email,
          Age: parseInt(profileData.age),
          Gender: profileData.gender
        });
        
        const updatedUser = {...user, objectData: {...user.objectData, ...profileData, Age: parseInt(profileData.age)}};
        localStorage.setItem('medvault_user', JSON.stringify(updatedUser));
        
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully! 🎉');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setIsSaving(false);
      }
    };

    if (isLoading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6" data-name="profile" data-file="components/Profile.js">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gradient">Your Profile</h1>
          {successMessage && (
            <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-200">
              {successMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center space-x-2">
                  <div className="icon-user text-purple-500"></div>
                  <span>Personal Information</span>
                </h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <div className={`icon-${isEditing ? 'x' : 'edit'} text-lg`}></div>
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        className="input-field"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        className="input-field"
                        value={profileData.age}
                        onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                        min="1"
                        max="120"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        className="input-field"
                        value={profileData.gender}
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                      >
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <div className="icon-check text-lg"></div>
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                        <div className="icon-user text-xl text-white"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-semibold text-gray-900">{user.objectData.Name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                        <div className="icon-mail text-xl text-white"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{user.objectData.Email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                        <div className="icon-calendar text-xl text-white"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="font-semibold text-gray-900">{user.objectData.Age} years old</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
                        <div className="icon-heart text-xl text-white"></div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="font-semibold text-gray-900 capitalize">{user.objectData.Gender}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <div className="icon-chart-bar text-green-500"></div>
                <span>Account Stats</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Health Records</span>
                  <span className="font-bold text-blue-600">{stats.totalDocuments}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <span className="text-sm text-gray-600">Cycle Entries</span>
                  <span className="font-bold text-pink-600">{stats.totalCycles}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Prescriptions</span>
                  <span className="font-bold text-green-600">{stats.totalPrescriptions}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <div className="icon-clock text-purple-500"></div>
                <span>Account Info</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-semibold text-gray-900">{stats.memberSince}</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <div className="icon-shield-check text-lg"></div>
                  <span>Account Verified & Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Profile component error:', error);
    return (
      <div className="text-center py-12">
        <div className="icon-alert-circle text-4xl text-red-400 mx-auto mb-4"></div>
        <p className="text-red-600">Error loading profile. Please refresh the page.</p>
      </div>
    );
  }
}
