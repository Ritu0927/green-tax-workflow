import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccessRoute } from "../utils/permissions";

export function ProtectedRoute({ path, children }) {
  const location = useLocation();
  const { currentUser, isAuthenticated, defaultRoute } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(currentUser.role, path)) {
    return <Navigate to={defaultRoute} replace state={{ accessMessage: "You do not have access to that page." }} />;
  }

  return children;
}
