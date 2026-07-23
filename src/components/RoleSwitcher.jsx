import React from "react";
import { useAppContext } from "../app/appContext";

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRole } = useAppContext();

  return (
    <label className="role-switcher">
      <span className="context-label">Role</span>
      <select value={activeRole} onChange={(event) => setActiveRole(event.target.value)}>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.label}
          </option>
        ))}
      </select>
    </label>
  );
}
