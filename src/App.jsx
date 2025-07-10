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
// Import the new IntegrationSettings component
import IntegrationSettings from './modules/IntegrationSettings';

const ProtectedLayout = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
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
            <Route element={<ProtectedLayout />}>
                <Route path="/client" element={<ClientDashboardHome />} />
                <Route path="/client/jobs" element={<JobsModule company={currentUser?.company} />} />
                <Route path="/client/quotecalculator" element={<QuoteCalculatorModule company={currentUser?.company} />} />
                <Route path="/client/invoices" element={<InvoicesModule company={currentUser?.company} />} />
                <Route path="/client/crm" element={<CRMModule company={currentUser?.company} />} />
                
                {/* --- NEW ROUTE ADDED HERE --- */}
                <Route path="/client/settings/integrations" element={<IntegrationSettings />} />
            </Route>
            
            <Route path="/admin" element={<AdminDashboard />} />
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