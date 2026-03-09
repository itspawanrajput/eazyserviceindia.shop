import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getMe } from '../../services/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      // Small delay to prevent flash and ensure state consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = sessionStorage.getItem('admin_token');
      if (!token) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      try {
        await getMe();
        if (isMounted) setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed', error);
        if (isMounted) {
          setIsAuthenticated(false);
          sessionStorage.removeItem('admin_token');
        }
      }
    };

    checkAuth();
    return () => { isMounted = false; };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
