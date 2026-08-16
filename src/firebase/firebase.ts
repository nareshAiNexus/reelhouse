import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// ─── Firebase config from environment variables ───────────────────────────────
// Set these in your .env file (copy from Firebase Console → Project Settings)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Prevent re-initializing on hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth     = getAuth(app);
export const db       = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Request profile + email scopes for Google sign-in
googleProvider.addScope('profile');
googleProvider.addScope('email');
