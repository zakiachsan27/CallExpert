import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: ReactNode;
  requireUser?: boolean;
  requireExpert?: boolean;
};

export function ProtectedRoute({ children, requireUser, requireExpert }: ProtectedRouteProps) {
  const { isUserLoggedIn, isExpertLoggedIn, userId, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Check User auth - allow both regular users AND experts (both have userId)
  // This allows experts to access user-facing features like booking other experts
  if (requireUser && !userId) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check Expert auth - strictly for expert dashboard/management
  if (requireExpert && !isExpertLoggedIn) {
    // Redirect to expert login with return URL
    return <Navigate to="/expert/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
