import React from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../app/appContext";

const navItems = [
  { to: "/client-home", label: "Client Home", key: "client-home" },
  { to: "/cpa-dashboard", label: "CPA Dashboard", key: "cpa-dashboard" },
  { to: "/return-workspace", label: "Return Workspace", key: "return-workspace" },
  { to: "/documents", label: "Documents", key: "documents" },
  { to: "/collaboration", label: "Collaboration and Tasks", key: "collaboration" },
  { to: "/admin-settings", label: "Admin and Role Settings", key: "admin-settings" }
];

export function Sidebar() {
  const { getRouteAccess, activeRole } = useAppContext();

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">G</div>
        <div>
          <p className="eyebrow">Secure Tax Workflow</p>
          <h2>Green Ledger</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems
          .filter((item) => getRouteAccess(item.key) !== "hidden")
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""} ${getRouteAccess(item.key)}`
              }
            >
              <span>{item.label}</span>
              <small>{getRouteAccess(item.key) === "limited" ? "Limited" : activeRole}</small>
            </NavLink>
          ))}
      </nav>

      <div className="sidebar-footer panel">
        <p className="eyebrow">Security</p>
        <strong>Least-Privilege Access</strong>
        <p className="muted">Navigation and actions change by active role. Internal notes stay hidden from clients.</p>
      </div>
    </aside>
  );
}
