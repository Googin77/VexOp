import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

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

const ProtectedLayout = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return (
    <MainLayout>
      {/* The Outlet will pass down the currentUser from the context */}
      <Outlet />
    </MainLayout>
  );
};


function AppContent() {
    const { currentUser } = useAuth(); // Get currentUser here to pass as a prop

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
                {/* THIS IS THE CORRECTED LINE */}
                <Route path="/client/jobs" element={<JobsModule company={currentUser?.company} />} />
                <Route path="/client/quotecalculator" element={<QuoteCalculatorModule company={currentUser?.company} />} />
                <Route path="/client/invoices" element={<InvoicesModule company={currentUser?.company} />} />
                <Route path="/client/crm" element={<CRMModule company={currentUser?.company} />} />
            </Route>
            
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

// Your App component is now cleaner
function App() {
  return <AppContent />;
}

export default App;