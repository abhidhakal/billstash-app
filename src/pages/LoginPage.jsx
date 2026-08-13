import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-5 bg-[var(--bg-primary)]">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 inline-flex items-center justify-center rounded-2xl mb-4 overflow-hidden shadow-sm">
            <img src="/icons/billstash-logo.png" alt="BillStash Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">BillStash</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track every bill, effortlessly.</p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 text-[var(--text-tertiary)] pointer-events-none" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full h-12 pl-11 pr-4 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
              />
            </div>
          )}

          <div className="relative flex items-center">
            <Mail size={18} className="absolute left-3.5 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full h-12 pl-11 pr-4 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
            />
          </div>

          <div className="relative flex items-center">
            <Lock size={18} className="absolute left-3.5 text-[var(--text-tertiary)] pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="w-full h-12 pl-11 pr-11 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-sm outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
            />
            <button
              type="button"
              className="absolute right-2 w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-xs text-[var(--destructive)] text-center p-2 bg-[var(--destructive-subtle)] rounded-md">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 mt-1"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size={20} color="#fff" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-tertiary)]">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <button
          className="w-full py-3 bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-[var(--accent)] hover:underline font-semibold"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
