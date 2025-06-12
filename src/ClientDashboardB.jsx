import React from "react";
import ProjectsModule from "./modules/ProjectsModule";
import HRDocumentsModule from "./modules/HRDocumentsModule";
import CRMModule from "./modules/CRMModule";
import MetricsModule from "./modules/MetricsModule";
import InvoicesModule from "./Modules/InvoicesModule";

export default function ClientDashboardB({ user, onLogout }) {
  const company = user?.company;
  return (
    <div>
      <header>
        <h1>Client Dashboard B</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <main>
        <ProjectsModule company={company} />
        <HRDocumentsModule company={company} />
        <CRMModule company={company} />
        <MetricsModule company={company} />
        <InvoicesModule company={company} />
      </main>
    </div>
  );
}
