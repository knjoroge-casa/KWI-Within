import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { loading, isAuthenticated, hasCompletedOnboarding, user, profile } = useAuth();

  if (loading || (user && profile === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};
