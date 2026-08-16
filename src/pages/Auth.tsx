import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Tab = 'signin' | 'signup';

export default function Auth() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  const [tab,        setTab]        = useState<Tab>('signin');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [name,       setName]       = useState('');
  const [error,      setError]      = useState('');
  const [info,       setInfo]       = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  // Redirect after render (never during render) to avoid React batching warning
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // While redirecting, render nothing
  if (user) return null;

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use':    'That email is already registered. Try signing in.',
      'auth/invalid-email':           'Please enter a valid email address.',
      'auth/weak-password':           'Password must be at least 6 characters.',
      'auth/user-not-found':          'No account found with that email.',
      'auth/wrong-password':          'Incorrect password.',
      'auth/invalid-credential':      'Incorrect email or password.',
      'auth/too-many-requests':       'Too many attempts. Please try again later.',
      'auth/network-request-failed':  'Network error. Check your connection.',
      'auth/popup-closed-by-user':    'Google sign-in was cancelled.',
    };
    return map[code] ?? 'Something went wrong. Please try again.';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (tab === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (tab === 'signup') {
        await signUpWithEmail(email.trim(), password, name.trim());
        setInfo('Account created! Check your inbox for a verification email before signing in.');
        setTab('signin');
        setPassword('');
        setName('');
      } else {
        await signInWithEmail(email.trim(), password);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(friendlyError(err?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(friendlyError(err?.code ?? ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4 py-12">
      {/* Background cinematic gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(229,9,20,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        }}
      />

      {/* Logo */}
      <Link to="/" className="text-netflix font-black text-4xl tracking-widest mb-10 select-none">
        REEL<span className="text-ink">HOUSE</span>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-lg p-8 sm:p-10"
        style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setInfo(''); }}
              className={`flex-1 pb-3 text-sm font-bold transition-colors ${
                tab === t
                  ? 'text-white border-b-2 border-netflix -mb-px'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Info banner */}
        {info && (
          <div className="mb-5 rounded-md px-4 py-3 text-sm text-green-300 bg-green-900/30 border border-green-700/40">
            {info}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-5 rounded-md px-4 py-3 text-sm text-red-300 bg-red-900/30 border border-red-700/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Name (sign-up only) */}
          {tab === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rh-name" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Your Name
              </label>
              <input
                id="rh-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Wick"
                className="w-full bg-[#333] text-white rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-netflix placeholder:text-white/30 transition"
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rh-email" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Email
            </label>
            <input
              id="rh-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#333] text-white rounded px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-netflix placeholder:text-white/30 transition"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rh-password" className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="rh-password"
                type={showPass ? 'text' : 'password'}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#333] text-white rounded px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-netflix placeholder:text-white/30 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors text-xs font-semibold"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-netflix hover:bg-[#c1121f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors text-sm"
            id="rh-auth-submit"
          >
            {loading
              ? tab === 'signup' ? 'Creating account…' : 'Signing in…'
              : tab === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30 font-medium">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          id="rh-google-signin"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 rounded transition-colors text-sm"
        >
          {/* Google logo SVG */}
          <svg width="18" height="18" viewBox="0 0 488 512" fill="none">
            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" fill="#4285f4"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle tab link */}
        <p className="text-center text-xs text-white/30 mt-6">
          {tab === 'signin' ? (
            <>New to ReelHouse?{' '}
              <button onClick={() => { setTab('signup'); setError(''); setInfo(''); }} className="text-white hover:underline font-semibold">
                Create an account
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setTab('signin'); setError(''); setInfo(''); }} className="text-white hover:underline font-semibold">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Back to home */}
      <Link to="/" className="mt-8 text-xs text-white/20 hover:text-white/50 transition-colors">
        ← Back to ReelHouse
      </Link>
    </div>
  );
}
