import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Wraps a route that requires authentication.
 * - While auth state is loading → show Loader
 * - No user → redirect to /auth
 * - User present → render children
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Loading your profile" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
