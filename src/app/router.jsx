import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

export function AppRouter() {
  const { isAuthenticated, defaultRoute } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
      <Route path="/client-home" element={<Navigate to="/client-workspace" replace />} />
      <Route path="/cpa-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/client-workspace"
        element={(
          <ProtectedRoute path="/client-workspace">
            <AppShell />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute path="/dashboard">
            <AppShell />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/return-workspace"
        element={(
          <ProtectedRoute path="/return-workspace">
            <AppShell />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/documents"
        element={(
          <ProtectedRoute path="/documents">
            <AppShell />
          </ProtectedRoute>
        )}
      />
      <Route path="/collaboration" element={<Navigate to="/client-workspace" replace />} />
      <Route
        path="/admin-settings"
        element={(
          <ProtectedRoute path="/admin-settings">
            <AppShell />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? defaultRoute : "/login"} replace />} />
    </Routes>
  );
}
