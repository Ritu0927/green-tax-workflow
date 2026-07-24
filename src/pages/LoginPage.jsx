import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { demoUsers } from "../data/demoUsers";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { signIn, isAuthenticated, defaultRoute, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated) {
    return <Navigate to={defaultRoute} replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = signIn(email, password);
    if (result.success) {
      navigate(result.user.defaultRoute ?? defaultRoute, { replace: true });
    }
  };

  return (
    <div className="signed-out-shell">
      <div className="panel signed-out-panel login-panel">
        <p className="eyebrow">Prototype Login</p>
        <h1>Green Ledger</h1>
        <p className="page-description">All demo users sign in here. Account role and permissions are assigned by the account itself.</p>
        {location.state?.accessMessage ? <p className="form-error">{location.state.accessMessage}</p> : null}
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span className="context-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearAuthError();
              }}
              placeholder="name@demo.com"
            />
          </label>
          <label className="form-field">
            <span className="context-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearAuthError();
              }}
              placeholder="demo123"
            />
          </label>
          {authError ? <p className="form-error">{authError}</p> : null}
          <button className="button" type="submit">Sign in</button>
        </form>

        <div className="panel inset-panel demo-credentials-panel">
          <div className="section-heading">
            <div>
              <h3>Demo accounts</h3>
              <p className="muted">Password for all accounts: <strong>demo123</strong></p>
            </div>
          </div>
          <ul className="compact-list">
            {demoUsers.map((user) => (
              <li key={user.id}>
                <div>
                  <strong>{user.roleLabel} — {user.email}</strong>
                  <p>{user.name}</p>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword("demo123");
                    clearAuthError();
                  }}
                >
                  Use this account
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
