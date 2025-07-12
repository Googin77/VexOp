import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts and Components
import PublicLayout from './components/PublicLayout';
import MainLayout from './components/MainLayout';

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
import IntegrationSettings from './modules/IntegrationSettings';
// --- NEW: Import the Leads component ---
import Leads from './views/admin/Leads';

// --- UPDATED: Renamed to be more specific ---
const ProtectedClientLayout = () => {
  const { currentUser } = useAuth();
  // This layout is for any logged-in user, so we just check for existence.
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// --- NEW: A specific layout to protect Admin routes ---
const ProtectedAdminLayout = () => {
    const { currentUser } = useAuth();
    // If no user, redirect to login
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    // If the user is not an admin, redirect them to their client dashboard
    if (currentUser.role !== 'admin') {
        return <Navigate to="/client" />;
    }
    // If they are an admin, show the admin content
    return <Outlet />;
};


function AppContent() {
    const { currentUser } = useAuth();

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
            <Route element={<ProtectedClientLayout />}>
                <Route path="/client" element={<ClientDashboardHome />} />
                <Route path="/client/jobs" element={<JobsModule company={currentUser?.company} />} />
                <Route path="/client/quotecalculator" element={<QuoteCalculatorModule company={currentUser?.company} />} />
                <Route path="/client/invoices" element={<InvoicesModule company={currentUser?.company} />} />
                <Route path="/client/crm" element={<CRMModule company={currentUser?.company} />} />
                <Route path="/client/settings/integrations" element={<IntegrationSettings />} />
            </Route>
            
            {/* --- NEW: Grouped and Protected Admin Routes --- */}
            <Route element={<ProtectedAdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/leads" element={<Leads />} />
            </Route>

            {/* This wildcard route catches any path that doesn't match and redirects to the homepage */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

// App component includes the AppContent and the ToastContainer
function App() {
  return (
    <>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
