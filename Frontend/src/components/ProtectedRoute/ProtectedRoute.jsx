import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useStore();

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If role is required and user doesn't have it, redirect to home
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
