import React from 'react';
import { loginUser, registerUser } from '../services/auth.js';

function AuthForm({ onLogin }) {
  try {
    const [isLogin, setIsLogin] = React.useState(true);
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      password: '',
      age: '',
      gender: 'female'
    });
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        let user;
        if (isLogin) {
          user = await loginUser(formData.email, formData.password);
        } else {
          const result = await registerUser(formData);

          if (!result.hasSession) {
            setMessage('Account created. Please check your email to confirm your account, then log in.');
            setIsLogin(true);
            setFormData((current) => ({
              ...current,
              password: '',
            }));
            return;
          }

          user = result.user;
        }
        onLogin(user);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden" data-name="auth-form" data-file="components/AuthForm.js">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-8 animate-float">
            <div className="w-20 h-20 icon-container mx-auto mb-6" 
                 style={{background: 'linear-gradient(135deg, #d946ef, #a855f7)'}}>
              <div className="icon-heart text-3xl text-white"></div>
            </div>
            <h1 className="text-4xl font-bold text-gradient mb-3">MedVault</h1>
            <p className="text-gray-600 text-lg">Your local women's health companion</p>
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
              <div className="icon-shield-check text-green-500"></div>
              <span>Stored in this browser</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="icon-heart text-pink-500"></div>
              <span>Women-Focused</span>
            </div>
          </div>

          <div className="card glass-effect">
            <div className="flex mb-8 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-center font-semibold rounded-lg transition-all duration-300 ${
                  isLogin 
                    ? 'bg-white text-purple-600 shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-center font-semibold rounded-lg transition-all duration-300 ${
                  !isLogin 
                    ? 'bg-white text-purple-600 shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-5">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <div className="icon-user text-purple-400"></div>
                    </div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="input-field pl-12"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required={!isLogin}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <div className="icon-calendar text-purple-400"></div>
                      </div>
                      <input
                        type="number"
                        placeholder="Age"
                        className="input-field pl-12"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        required={!isLogin}
                      />
                    </div>
                    <select
                      className="input-field flex-1"
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="icon-mail text-purple-400"></div>
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="input-field pl-12"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="icon-lock text-purple-400"></div>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="input-field pl-12"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl flex items-center space-x-2">
                  <div className="icon-check-circle text-green-500"></div>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl flex items-center space-x-2">
                  <div className="icon-alert-circle text-red-500"></div>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Please wait...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>{isLogin ? 'Login to MedVault' : 'Create Account'}</span>
                    <div className="icon-arrow-right"></div>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AuthForm component error:', error);
    return null;
  }
}
export default AuthForm;
