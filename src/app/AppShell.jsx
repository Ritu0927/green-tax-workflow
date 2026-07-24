import React from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "./appContext";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { ClientHomePage } from "../pages/ClientHomePage";
import { CpaDashboardPage } from "../pages/CpaDashboardPage";
import { ReturnWorkspacePage } from "../pages/ReturnWorkspacePage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";

const pageMap = {
  "/client-workspace": ClientHomePage,
  "/dashboard": CpaDashboardPage,
  "/return-workspace": ReturnWorkspacePage,
  "/documents": DocumentsPage,
  "/admin-settings": AdminSettingsPage
};

export function AppShell() {
  const location = useLocation();
  const { roleConfig } = useAppContext();
  const Page = pageMap[location.pathname] ?? CpaDashboardPage;
  const accessMessage = location.state?.accessMessage;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="page-shell">
          <section className="page-header">
            <div>
              <p className="eyebrow">{roleConfig.label} Experience</p>
              <h1>{roleConfig.pageTitles[location.pathname] ?? "Tax Workflow Platform"}</h1>
              <p className="page-description">{roleConfig.pageDescriptions[location.pathname]}</p>
            </div>
          </section>
          {accessMessage ? <div className="empty-note">{accessMessage}</div> : null}
          <Page />
        </main>
      </div>
    </div>
  );
}
