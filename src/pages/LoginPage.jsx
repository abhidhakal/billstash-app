import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Receipt, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './LoginPage.css';

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
    <div className="login-page">
      <div className="login-container animate-fade-in">
        <div className="login-brand">
          <div className="login-logo">
            <Receipt size={28} strokeWidth={1.5} />
          </div>
          <h1 className="login-title">BillStash</h1>
          <p className="login-subtitle">Track every bill, effortlessly.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="login-field">
              <User size={18} className="login-field-icon" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-field">
            <Mail size={18} className="login-field-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <Lock size={18} className="login-field-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="login-field-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size={20} color="#fff" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-outline btn-lg btn-full login-google-btn"
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

        <p className="login-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="login-toggle-btn"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
