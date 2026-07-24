import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./app/appContext";
import { AppRouter } from "./app/router";
import { RootErrorBoundary } from "./app/RootErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <AppRouter />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
