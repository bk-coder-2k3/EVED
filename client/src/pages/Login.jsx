import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier, password });
      await login(res.data.token, res.data.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-surface-container-lowest font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
      
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-container relative flex-col justify-between overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" className="text-on-primary-container" />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-on-primary-container/20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-on-primary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[120px] text-on-primary-container/40">admin_panel_settings</span>
          </div>
        </div>

        <div className="p-10 relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded flex items-center justify-center text-primary-container shadow-sm">
            <span className="material-symbols-outlined icon-fill">account_balance</span>
          </div>
          <span className="font-headline-lg font-bold text-on-primary-container tracking-wide">EVED</span>
        </div>

        <div className="p-12 relative z-10 max-w-xl">
          <h1 className="text-4xl lg:text-5xl font-bold text-on-primary-container leading-tight mb-6">
            Secure Electoral<br/>Management System
          </h1>
          <p className="text-on-primary-container/80 text-body-md leading-relaxed mb-12 max-w-md">
            Authorized access only. Enterprise-grade secure portal for managing voter data, organizational hierarchies, and electoral reporting with uncompromising integrity.
          </p>

          <div className="flex items-center gap-4 text-on-primary-container/70 text-sm">
            <div className="flex -space-x-2">
               <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary-container"><span className="material-symbols-outlined text-[14px] text-on-surface">shield</span></div>
               <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary-container"><span className="material-symbols-outlined text-[14px] text-on-surface">lock</span></div>
               <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary-container"><span className="material-symbols-outlined text-[14px] text-on-surface">verified</span></div>
            </div>
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 bg-surface-container-lowest">
        
        {/* Mobile Logo (Visible only on mobile) */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center text-on-primary-container shadow-sm">
            <span className="material-symbols-outlined icon-fill">account_balance</span>
          </div>
          <span className="font-headline-lg font-bold text-primary tracking-wide">EVED</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-on-surface mb-2 font-headline-lg tracking-tight">Welcome Back</h2>
            <p className="text-on-surface-variant text-body-md">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-error-container/50 border border-error/20 text-error text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span> {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">Employee ID / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">badge</span>
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  placeholder="Enter your ID or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-on-surface">Password</label>
                <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-2.5 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-outline hover:text-on-surface transition-colors focus:outline-none">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center py-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary bg-surface border-outline-variant rounded focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-on-surface-variant">
                Remember this device for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-on-primary bg-primary-container hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer links removed as requested */}
        </div>
      </div>
      
    </div>
  );
};

export default Login;
