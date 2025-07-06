import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Layouts and Components
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout'; // <-- Import the MainLayout with the sidebar

// Standalone Pages
import Login from './Login';

// Public Pages
import Homepage from './Homepage';
import Solutions from './Solutions';
import Pricing from './Pricing';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

// Authenticated (Private) Pages & Modules
import AdminDashboard from './AdminDashboard';
import ClientDashboardHome from './ClientDashboardHome';
import JobsModule from './modules/JobsModule';
import QuoteCalculatorModule from './modules/QuoteCalculatorModule';
import InvoicesModule from './modules/InvoicesModule';
import CRMModule from './modules/CRMModule';
// Make sure to import any other modules you have

// This new component checks for a user and then renders the MainLayout.
// The <Outlet /> inside MainLayout will be replaced by your specific pages (Dashboard, Jobs, etc.).
const ProtectedLayout = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If the user is logged in, render the MainLayout which contains the sidebar.
  // The Outlet will render the specific child route (e.g., ClientDashboardHome, JobsModule).
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};


function AppContent() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Route>

      {/* --- Standalone Login Route --- */}
      <Route path="/login" element={<Login />} />

      {/* --- Authenticated Client Routes --- */}
      {/* All client-facing pages now go inside this protected layout route */}
      <Route element={<ProtectedLayout />}>
        <Route path="/client" element={<ClientDashboardHome />} />
        <Route path="/client/jobs" element={<JobsModule />} />
        <Route path="/client/quotecalculator" element={<QuoteCalculatorModule />} />
        <Route path="/client/invoices" element={<InvoicesModule />} />
        <Route path="/client/crm" element={<CRMModule />} />
        {/* Add any other client routes here */}
      </Route>

      {/* --- Authenticated Admin Route (if different layout) --- */}
      {/* If your admin has the same sidebar, you can place it inside the ProtectedLayout as well.
          If it has a different layout, a new protected route would be needed here.
          For now, this assumes it might be separate. */}
      <Route path="/admin" element={<AdminDashboard />} />


      {/* --- Fallback Route --- */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Your App component is now cleaner
function App() {
  return <AppContent />;
}

export default App;