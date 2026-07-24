import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../app/appContext";
import { useAuth } from "../context/AuthContext";
import { canAccessRoute } from "../utils/permissions";
import { SecurityBadge } from "./SecurityBadge";

function buildInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const {
    activeClient,
    activeReturn,
    availableClients,
    availableReturns,
    setActiveClientId,
    setActiveReturnId,
    hasPermission
  } = useAppContext();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "notif-001",
      title: "Avery Stone uploaded the requested 1099-INT",
      context: "Income documents for the 2025 Form 1040 are ready for review.",
      time: "5 min ago",
      unread: true,
      clientId: "client-001",
      returnId: "ret-2026-001",
      route: "/documents"
    },
    {
      id: "notif-002",
      title: "Summit Bridge Advisors is ready for review",
      context: "The preparer marked the return complete and moved it to reviewer queue.",
      time: "28 min ago",
      unread: true,
      clientId: "client-010",
      returnId: "ret-2026-010",
      route: "/dashboard"
    },
    {
      id: "notif-003",
      title: "A return deadline is approaching",
      context: "Jasper Cole's Form 1040 is due on August 3, 2026.",
      time: "1 hr ago",
      unread: false,
      clientId: "client-011",
      returnId: "ret-2026-011",
      route: "/dashboard"
    },
    {
      id: "notif-004",
      title: "An AI-assisted review item was escalated",
      context: "Shareholder basis support needs reviewer attention.",
      time: "Today",
      unread: true,
      clientId: "client-010",
      returnId: "ret-2026-010",
      route: "/return-workspace"
    }
  ]);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const canSeeFirmSelectors = hasPermission("viewFirmDashboard") || hasPermission("viewAssignedReturns");
  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (!canAccessRoute(currentUser.role, notification.route)) {
          return false;
        }

        if (currentUser.role === "client") {
          return notification.clientId === currentUser.clientId;
        }

        return true;
      }),
    [currentUser, notifications]
  );
  const unreadCount = useMemo(() => visibleNotifications.filter((item) => item.unread).length, [visibleNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setIsProfileModalOpen(false);
        setIsSecurityModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const openNotification = (notificationId) => {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target) {
      return;
    }

    setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)));
    if (canSeeFirmSelectors || target.clientId === currentUser.clientId) {
      setActiveClientId(target.clientId);
      setActiveReturnId(target.returnId);
    }
    navigate(target.route);
    setIsNotificationsOpen(false);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, unread: false } : item)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-context">
          {canSeeFirmSelectors ? (
            <>
              <label className="role-switcher">
                <span className="context-label">Active Client</span>
                <select value={activeClient.id} onChange={(event) => setActiveClientId(event.target.value)}>
                  {availableClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="role-switcher">
                <span className="context-label">Return</span>
                <select value={activeReturn.id} onChange={(event) => setActiveReturnId(event.target.value)}>
                  {availableReturns.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.form} · {item.taxYear}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <div className="single-context">
              <span className="context-label">Signed in for</span>
              <strong>{currentUser.role === "admin" ? "Administration session" : `${activeClient.name} · ${activeReturn.form}`}</strong>
            </div>
          )}
        </div>

        <div className="topbar-actions">
          <SecurityBadge label="MFA Verified" tone="success" />
          <div className="menu-anchor" ref={notificationsRef}>
            <button
              className="icon-button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              aria-expanded={isNotificationsOpen}
              onClick={() => {
                setIsNotificationsOpen((current) => !current);
                setIsProfileOpen(false);
              }}
            >
              <span aria-hidden="true">🔔</span>
              {unreadCount ? <span className="notification-badge">{unreadCount}</span> : null}
            </button>

            {isNotificationsOpen ? (
              <div className="topbar-menu notification-menu" role="menu">
                <div className="menu-header">
                  <strong>Notifications</strong>
                  <button className="text-link" onClick={markAllNotificationsAsRead}>Mark all as read</button>
                </div>
                <ul className="menu-list">
                  {visibleNotifications.map((notification) => (
                    <li key={notification.id} className={`notification-item ${notification.unread ? "unread" : ""}`}>
                      <button className="menu-list-button" onClick={() => openNotification(notification.id)}>
                        <div className="list-title-row">
                          <strong>{notification.title}</strong>
                          <span className="meta-text">{notification.time}</span>
                        </div>
                        <p>{notification.context}</p>
                        <span className="meta-text">{notification.unread ? "Unread" : "Read"}</span>
                      </button>
                      {notification.unread ? (
                        <button className="text-link" onClick={() => markNotificationAsRead(notification.id)}>
                          Mark as read
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="menu-anchor" ref={profileRef}>
            <button
              className="account-button"
              aria-label="Open account menu"
              aria-expanded={isProfileOpen}
              onClick={() => {
                setIsProfileOpen((current) => !current);
                setIsNotificationsOpen(false);
              }}
            >
              <span className="avatar-circle" aria-hidden="true">{buildInitials(currentUser.name)}</span>
              <div className="account-copy">
                <strong>{currentUser.name}</strong>
                <span className="meta-text">{currentUser.roleLabel}</span>
              </div>
            </button>

            {isProfileOpen ? (
              <div className="topbar-menu profile-menu" role="menu">
                <div className="menu-header">
                  <div>
                    <strong>{currentUser.name}</strong>
                    <p className="meta-text">{currentUser.roleLabel}</p>
                    <p className="meta-text">Access: {currentUser.accessType}</p>
                  </div>
                </div>
                <div className="menu-list">
                  <button className="menu-list-button" onClick={() => setIsProfileModalOpen(true)}>My profile</button>
                  <button className="menu-list-button" onClick={() => setIsSecurityModalOpen(true)}>Security and session</button>
                  <button
                    className="menu-list-button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      signOut();
                      navigate("/login");
                    }}
                  >
                    Switch demo account
                  </button>
                  <button
                    className="menu-list-button danger-text"
                    onClick={() => {
                      setIsProfileOpen(false);
                      signOut();
                      navigate("/login");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {isProfileModalOpen ? (
        <div className="overlay-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="panel modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <h3>My profile</h3>
              <button className="text-link" onClick={() => setIsProfileModalOpen(false)}>Close</button>
            </div>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Name</strong>
                <p>{currentUser.name}</p>
              </div>
              <div className="stack-row">
                <strong>Email</strong>
                <p>{currentUser.email}</p>
              </div>
              <div className="stack-row">
                <strong>Assigned access</strong>
                <p>{currentUser.accessType}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSecurityModalOpen ? (
        <div className="overlay-backdrop" onClick={() => setIsSecurityModalOpen(false)}>
          <div className="panel modal-panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <h3>Security and session</h3>
              <button className="text-link" onClick={() => setIsSecurityModalOpen(false)}>Close</button>
            </div>
            <div className="stack-list">
              <div className="stack-row">
                <strong>MFA status</strong>
                <p>MFA Verified</p>
              </div>
              <div className="stack-row">
                <strong>Secure session</strong>
                <p>{currentUser.secureSession}</p>
              </div>
              <div className="stack-row">
                <strong>Recent login</strong>
                <p>{currentUser.recentLogin}</p>
              </div>
            </div>
            <div className="inline-actions">
              <button
                className="button ghost"
                onClick={() => {
                  setIsSecurityModalOpen(false);
                  signOut();
                  navigate("/login");
                }}
              >
                Sign out of this session
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
