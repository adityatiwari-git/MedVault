import { useState } from 'react';
import { ArrowRight, Heart, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { loginUser, registerUser } from '../services/auth.js';

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'female',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        const user = await loginUser(formData.email, formData.password);
        onLogin(user);
        return;
      }

      const result = await registerUser(formData);
      setMessage('Your local MedVault account was created on this browser.');
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="brand-mark xl mb-7">
              <Heart size={30} fill="currentColor" />
            </div>
            <p className="eyebrow">A private space for women's health</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-900 xl:text-6xl">
              Keep every important part of your health story in one place.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
              Store reports, keep prescription details close, understand your cycle history,
              and maintain the health information you want available when you need it.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                ['Records', 'Store reports & prescriptions'],
                ['Cycles', 'Keep period history organized'],
                ['Profile', 'Save personal health details'],
              ].map(([title, text]) => (
                <div key={title} className="soft-panel p-4">
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <div className="brand-mark mx-auto mb-3">
              <Heart size={28} fill="currentColor" />
            </div>
            <p className="text-2xl font-black text-gradient">MedVault</p>
            <p className="mt-1 text-sm text-slate-500">Women's health companion</p>
          </div>

          <div className="auth-card">
            <div className="mb-6 rounded-2xl bg-slate-100/80 p-1.5">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className={'auth-tab ' + (isLogin ? 'auth-tab-active' : '')}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className={'auth-tab ' + (!isLogin ? 'auth-tab-active' : '')}
                >
                  Create account
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-purple-600">
                {isLogin ? 'Welcome back' : 'Create your MedVault'}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                {isLogin ? 'Your health space is waiting.' : 'A healthier record starts here.'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      placeholder="Full name"
                      className="input-control"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="input-wrap">
                      <span className="text-sm font-bold text-slate-400">Age</span>
                      <input
                        type="number"
                        placeholder="Age"
                        min="1"
                        max="120"
                        className="input-control"
                        value={formData.age}
                        onChange={(event) => setFormData({ ...formData, age: event.target.value })}
                        required
                      />
                    </div>
                    <select
                      className="input-control select-control"
                      value={formData.gender}
                      onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
                    >
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              <div className="input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="Email address"
                  className="input-control"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  required
                />
              </div>

              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="input-control"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  required
                />
              </div>

              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-error">{error}</div>}

              <button type="submit" className="btn btn-primary w-full justify-center" disabled={isLoading}>
                {isLoading ? 'Please wait...' : isLogin ? 'Login to MedVault' : 'Create account'}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-center text-xs leading-5 text-slate-500">
              Your MedVault account and health records are stored locally in this browser.
              They are not synced to a cloud service.
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-400">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span>Your health space stays on this device.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
