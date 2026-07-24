import React from "react";
import { useAppContext } from "../app/appContext";
import { SecurityBadge } from "../components/SecurityBadge";
import { StatusChip } from "../components/StatusChip";

export function AdminSettingsPage() {
  const { mockData, hasPermission } = useAppContext();
  const fullAccess = hasPermission("manageUsers");

  return (
    <div className="page-grid">
      <section className="summary-row">
        <article className="summary-card panel accent">
          <p className="eyebrow">User Accounts</p>
          <strong>{mockData.userAccounts.length}</strong>
          <p className="muted">Firm and client accounts with least-privilege role assignments.</p>
        </article>
        <article className="summary-card panel">
          <p className="eyebrow">MFA Coverage</p>
          <strong>100%</strong>
          <p className="muted">All firm roles require MFA before access to sensitive data.</p>
        </article>
        <article className="summary-card panel">
          <p className="eyebrow">Audit Events</p>
          <strong>{mockData.auditEvents.length}</strong>
          <p className="muted">Visible log of field locks, access changes, and reviewer actions.</p>
        </article>
        <article className="summary-card panel">
          <p className="eyebrow">Access Level</p>
          <strong>{fullAccess ? "Admin" : "Read-only"}</strong>
          <p className="muted">Administrative actions stay explicit and restricted.</p>
        </article>
      </section>

      <section className="workspace-layout admin-layout">
        <article className="panel workspace-main">
          <div className="section-heading">
            <h3>User Roles and Permissions</h3>
            <SecurityBadge label={fullAccess ? "Full administrative access" : "Preview mode"} tone={fullAccess ? "success" : "warning"} />
          </div>

          <div className="data-table">
            <div className="data-table-head">
              <span>User</span>
              <span>Role</span>
              <span>Access</span>
              <span>MFA</span>
              <span>Status</span>
            </div>
            {mockData.userAccounts.map((user) => (
              <div key={user.id} className="data-table-row">
                <div>
                  <strong>{user.name}</strong>
                </div>
                <div>{user.role}</div>
                <div>{user.access}</div>
                <div>{user.mfa}</div>
                <div><StatusChip value={user.status} /></div>
              </div>
            ))}
          </div>

          <div className="section-heading top-gap">
            <h3>Permission Matrix</h3>
            <span className="tag neutral">One product, four visible roles</span>
          </div>
          <div className="permission-grid">
            <div className="permission-row heading">
              <span>Capability</span>
              <span>Client</span>
              <span>Preparer</span>
              <span>Reviewer</span>
              <span>Admin</span>
            </div>
            {mockData.permissionGroups.map((group) => (
              <div key={group.capability} className="permission-row">
                <span>{group.capability}</span>
                <span>{group.client}</span>
                <span>{group.preparer}</span>
                <span>{group.reviewer}</span>
                <span>{group.admin}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="workspace-rail">
          <article className="panel">
            <div className="section-heading">
              <h3>Security Settings</h3>
              <span className="tag success">Mocked UI only</span>
            </div>
            <ul className="timeline-list">
              {mockData.securitySettings.map((setting) => (
                <li key={setting.id}>
                  <div className="list-title-row">
                    <strong>{setting.label}</strong>
                    <StatusChip value={setting.state} />
                  </div>
                  <p>Owner {setting.owner}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h3>Recent Access Activity</h3>
              <span className="tag warning">Monitored</span>
            </div>
            <ul className="timeline-list">
              {mockData.accessActivity.map((item) => (
                <li key={item.id}>
                  <strong>{item.user}</strong>
                  <p>{item.event} · {item.detail}</p>
                  <span className="meta-text">Risk {item.risk}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h3>Audit Log</h3>
              <span className="tag neutral">{mockData.auditEvents.length} entries</span>
            </div>
            <ul className="timeline-list">
              {mockData.auditEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.actor}</strong>
                  <p>{event.action}</p>
                  <span className="meta-text">{event.time}</span>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
