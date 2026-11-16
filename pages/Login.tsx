import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, TrendingUp, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { login, register } from '../services/authService';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden p-4">

      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/6 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/4 rounded-full blur-[120px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/25
            flex items-center justify-center mb-5 shadow-lg shadow-emerald-900/20">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">SKS DM Lending</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-card shadow-2xl shadow-black/60 overflow-hidden">
          {/* Sign In / Sign Up Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-zinc-900/80 border-b border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isSignUp
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isSignUp
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={13} />
              <span>Create Account</span>
            </button>
          </div>

          <div className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Email */}
              <div>
                <label className="label-base">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-600" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder={isSignUp ? "newuser@sksdm.com" : "admin@sksdm.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label-base">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-600" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              {/* Confirm Password (only on Sign Up) */}
              {isSignUp && (
                <div>
                  <label className="label-base">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-zinc-600" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-base pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 py-3"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Separate Account' : 'Access Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-medium"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : 'Need a new isolated account? Create Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-950/40 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-600">
              Secured with end-to-end encryption &middot; &copy; {new Date().getFullYear()} SKS Services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;