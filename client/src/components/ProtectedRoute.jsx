import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  if (!user) {
    // If there's a token but no user state yet, wait for AuthContext to finish fetching/flushing
    if (token) return null; 
    
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'employee') return <Navigate to="/employee-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
