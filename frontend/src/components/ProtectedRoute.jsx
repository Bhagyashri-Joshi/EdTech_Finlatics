import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center">Checking your session...</div>;
  }

  return user
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
