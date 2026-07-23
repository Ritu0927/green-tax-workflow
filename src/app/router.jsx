import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />} />
      <Route path="/client-home" element={<AppShell />} />
      <Route path="/cpa-dashboard" element={<AppShell />} />
      <Route path="/return-workspace" element={<AppShell />} />
      <Route path="/documents" element={<AppShell />} />
      <Route path="/collaboration" element={<AppShell />} />
      <Route path="/admin-settings" element={<AppShell />} />
      <Route path="*" element={<Navigate to="/cpa-dashboard" replace />} />
    </Routes>
  );
}
