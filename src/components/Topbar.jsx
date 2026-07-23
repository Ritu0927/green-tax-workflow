import React from "react";
import { useAppContext } from "../app/appContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { SecurityBadge } from "./SecurityBadge";

export function Topbar() {
  const { activeClient, activeReturn, mockData, setActiveClientId, setActiveReturnId } = useAppContext();

  return (
    <header className="topbar">
      <div className="topbar-context">
        <label className="role-switcher">
          <span className="context-label">Active Client</span>
          <select value={activeClient.id} onChange={(event) => setActiveClientId(event.target.value)}>
            {mockData.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className="role-switcher">
          <span className="context-label">Return</span>
          <select value={activeReturn.id} onChange={(event) => setActiveReturnId(event.target.value)}>
            {mockData.returns
              .filter((item) => item.clientId === activeClient.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.form} · {item.taxYear}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="topbar-actions">
        <SecurityBadge label="MFA Verified" tone="success" />
        <SecurityBadge label="Secure Session" tone="neutral" />
        <RoleSwitcher />
      </div>
    </header>
  );
}
