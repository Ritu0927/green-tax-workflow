import React, { createContext, useContext, useMemo, useState } from "react";
import { demoUserById, demoUsers } from "../data/demoUsers";
import { getDefaultRouteForRole, hasPermissionForRole } from "../utils/permissions";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "green-ledger-demo-user-id";

function loadStoredUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(loadStoredUserId);
  const [authError, setAuthError] = useState("");

  const currentUser = currentUserId ? demoUserById[currentUserId] ?? null : null;
  const isAuthenticated = Boolean(currentUser);

  const signIn = (email, password) => {
    const matchedUser = demoUsers.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
    );

    if (!matchedUser) {
      setAuthError("Invalid email or password.");
      return { success: false };
    }

    setCurrentUserId(matchedUser.id);
    setAuthError("");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_STORAGE_KEY, matchedUser.id);
    }
    return { success: true, user: matchedUser };
  };

  const signOut = () => {
    setCurrentUserId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) {
      return false;
    }
    return hasPermissionForRole(currentUser.role, permission);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      signIn,
      signOut,
      hasPermission,
      authError,
      clearAuthError: () => setAuthError(""),
      defaultRoute: currentUser ? getDefaultRouteForRole(currentUser.role) : "/login"
    }),
    [authError, currentUser, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
