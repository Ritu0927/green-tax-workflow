import React from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { getNavigationForRole } from "../utils/permissions";

export function Sidebar() {
  const { activeRole, currentUser } = useAppContext();
  const navItems = getNavigationForRole(activeRole);

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
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>{item.label}</span>
            <small>{currentUser.roleLabel}</small>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer panel">
        <p className="eyebrow">Security</p>
        <strong>Least-Privilege Access</strong>
        <p className="muted">Navigation and actions are assigned by account permissions. Internal notes and admin controls stay restricted.</p>
      </div>
    </aside>
  );
}
