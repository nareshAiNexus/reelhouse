import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  sendEmailVerification,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebase';
import { fetchProfile, saveProfile } from '../firebase/db';
import type { ReelhouseProfile } from '../types/user';

// ─── Default avatar colors (Netflix palette) ─────────────────────────────────
const DEFAULT_COLORS = [
  '#e50914', '#0071eb', '#e8a217', '#54b9c5',
  '#8e44ad', '#27ae60', '#e74c3c', '#2980b9',
];
const randomColor = () => DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextType {
  user:                 User | null;
  profile:              ReelhouseProfile | null;
  loading:              boolean;
  signUpWithEmail:      (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail:      (email: string, password: string) => Promise<void>;
  signInWithGoogle:     () => Promise<void>;
  signOut:              () => Promise<void>;
  resendVerification:   () => Promise<void>;
  refreshProfile:       () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<ReelhouseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile whenever the Firebase user changes
  const loadProfile = useCallback(async (fbUser: User | null) => {
    if (!fbUser) { setProfile(null); return; }
    try {
      const p = await fetchProfile(fbUser.uid);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Handle the result of a Google redirect sign-in (fires once on page load).
    // Must run before onAuthStateChanged so profile is written before the
    // listener fires for the first time after redirect.
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        const existing = await fetchProfile(result.user.uid);
        if (!existing) {
          const initialProfile: ReelhouseProfile = {
            displayName: result.user.displayName ?? result.user.email?.split('@')[0] ?? 'User',
            avatarColor: randomColor(),
            createdAt: Date.now(),
          };
          await saveProfile(result.user.uid, initialProfile);
        }
      })
      .catch(() => {
        // No redirect result or browser doesn't support it — safe to ignore
      });

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      await loadProfile(fbUser);
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  // ── Sign Up ──────────────────────────────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
      await sendEmailVerification(newUser);
      // Bootstrap profile in DB
      const initialProfile: ReelhouseProfile = {
        displayName: displayName.trim() || email.split('@')[0],
        avatarColor: randomColor(),
        createdAt: Date.now(),
      };
      await saveProfile(newUser.uid, initialProfile);
      setProfile(initialProfile);
    },
    []
  );

  // ── Sign In ──────────────────────────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will fire and load profile
  }, []);

  // ── Google Sign In (redirect flow — avoids COOP popup restrictions) ────────
  const signInWithGoogle = useCallback(async () => {
    // This redirects the entire page to Google's auth screen.
    // After the user signs in, Google redirects back here and
    // getRedirectResult (called in the useEffect above) picks up the result.
    await signInWithRedirect(auth, googleProvider);
  }, []);

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  }, []);

  // ── Resend verification ──────────────────────────────────────────────────
  const resendVerification = useCallback(async () => {
    if (user) await sendEmailVerification(user);
  }, [user]);

  // ── Refresh profile from DB (call after profile edits) ──────────────────
  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        resendVerification,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
