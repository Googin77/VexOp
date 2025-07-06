
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Layouts and Components
import PublicLayout from './components/PublicLayout';

// Standalone Pages
import Login from './Login';

// Public Pages
import Homepage from './Homepage';
import Solutions from './Solutions';
import Pricing from './Pricing';
// NEW: Re-add imports for the legal pages
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

// Authenticated (Private) Pages
import AdminDashboard from './AdminDashboard';
import ClientDashboardHome from './ClientDashboardHome';

function PrivateRoute({ children, role, userRole }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }
  return children;
}

function AppContent() {
  const { currentUser } = useAuth();
  const userRole = currentUser ? currentUser.role : null;

  return (
    <Routes>
      {/* Routes with the Public Header and Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/pricing" element={<Pricing />} />
        {/* NEW: Add the routes for the legal pages back in */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Route>

      {/* Standalone route without the public layout */}
      <Route path="/login" element={<Login />} />

       <Route
        path="/admin"
        element={
          <PrivateRoute role="admin" userRole={userRole}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/client"
        element={
          <PrivateRoute role="client" userRole={userRole}>
            <ClientDashboardHome />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}


function App() {
  return (
    // AuthProvider is now defined thanks to the import
    <AuthProvider>
        
        <AppContent />
   
    </AuthProvider>
  );
}

export default App;