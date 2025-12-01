import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslation } from './i18n';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyCreate from './pages/CompanyCreate';
import CompanyDetail from './pages/CompanyDetail';
import CompanyEdit from './pages/CompanyEdit';
import Customers from './pages/Customers';
import CustomerCreate from './pages/CustomerCreate';
import CustomerDetail from './pages/CustomerDetail';
import CustomerEdit from './pages/CustomerEdit';
import CustomerImport from './pages/CustomerImport';
import Contracts from './pages/Contracts';
import ContractCreate from './pages/ContractCreate';
import ContractDetail from './pages/ContractDetail';
import ContractEdit from './pages/ContractEdit';
import ContractDemo from './pages/ContractDemo';
import PaymentSchedule from './pages/PaymentSchedule';
import Payments from './pages/Payments';
import PaymentCreate from './pages/PaymentCreate';
import PaymentDetail from './pages/PaymentDetail';
import PaymentEdit from './pages/PaymentEdit';
import Vehicles from './pages/Vehicles';
import VehicleCreate from './pages/VehicleCreate';
import VehicleEdit from './pages/VehicleEdit';
import VehicleDetails from './pages/VehicleDetails';
import VehicleImport from './pages/VehicleImport';
import Users from './pages/Users';
import UserCreate from './pages/UserCreate';
import UserEdit from './pages/UserEdit';
import Settings from './pages/Settings';
import DypSenedleri from './pages/DypSenedleri';
import OverdueNotifications from './pages/OverdueNotifications';
import Analytics from './pages/Analytics';
import HoverGuide from './components/HoverGuide';
import GuideTourWelcome from './components/GuideTourWelcome';
import GuideInfoModal from './components/GuideInfoModal';

// Component to redirect to first accessible page
function FirstAccessiblePage() {
  const { canAccessPage } = useAuth();
  
  // Define pages in order of preference
  const pages = [
    { path: '/dashboard', page: 'dashboard' },
    { path: '/analytics', page: 'analytics' },
    { path: '/customers', page: 'customers' },
    { path: '/contracts', page: 'contracts' },
    { path: '/payments', page: 'payments' },
    { path: '/vehicles', page: 'vehicles' },
    { path: '/companies', page: 'companies' },
    { path: '/users', page: 'users' },
    { path: '/settings', page: 'settings' },
  ];
  
  // Find first accessible page
  const firstAccessiblePage = pages.find(({ page }) => page === null || canAccessPage(page));
  
  if (firstAccessiblePage) {
    return <Navigate to={firstAccessiblePage.path} replace />;
  }
  
  // If no pages are accessible, show debug info and error
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mt-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Access</h3>
          <p className="text-gray-600 mb-6">Contact administrator for access.</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: { page: string; action: string };
}) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission) {
    const hasAccess = hasPermission(requiredPermission.page, requiredPermission.action);
    if (!hasAccess) {
      // Redirect to first accessible page instead of dashboard
      return <Navigate to="/first-accessible" />;
    }
  }
  
  return <>{children}</>;
}

function AuthenticatedApp() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [showGuideWelcome, setShowGuideWelcome] = React.useState(false);
  const [showHoverGuide, setShowHoverGuide] = React.useState(false);
  const [showGuideInfo, setShowGuideInfo] = React.useState(false);

  // Check if guide should be shown on first visit
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const guideCompleted = localStorage.getItem('app_hover_guide_completed');
      const tourCompleted = localStorage.getItem('app_guide_tour_completed');
      
      // Show info modal on first visit
      const hasSeenInfo = localStorage.getItem('app_guide_info_seen');
      if (!hasSeenInfo) {
        setShowGuideInfo(true);
        localStorage.setItem('app_guide_info_seen', 'true');
      }
      
      // Show welcome modal if neither guide has been completed
      // For testing, you can comment out the localStorage check
      if (!guideCompleted && !tourCompleted) {
        const hasSeenWelcome = sessionStorage.getItem('has_seen_guide_welcome');
        if (!hasSeenWelcome) {
          setShowGuideWelcome(true);
          sessionStorage.setItem('has_seen_guide_welcome', 'true');
        }
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleStartGuide = () => {
    setShowGuideWelcome(false);
    setShowGuideInfo(false); // Close info modal when starting guide
    setShowHoverGuide(true);
  };

  const handleCloseGuide = () => {
    setShowHoverGuide(false);
  };

  const handleCloseGuideInfo = () => {
    setShowGuideInfo(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <Layout 
        onStartGuide={() => {
          setShowHoverGuide(true);
        }}
        isGuideActive={showHoverGuide}
      >
        <Routes>
        <Route path="/dashboard" element={<ProtectedRoute requiredPermission={{ page: 'dashboard', action: 'read' }}><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/first-accessible" element={<FirstAccessiblePage />} />
        <Route path="/customers" element={<ProtectedRoute requiredPermission={{ page: 'customers', action: 'read' }}><Customers /></ProtectedRoute>} />
        <Route path="/customers/create" element={<ProtectedRoute requiredPermission={{ page: 'customers', action: 'create' }}><CustomerCreate /></ProtectedRoute>} />
        <Route path="/customers/import" element={<ProtectedRoute requiredPermission={{ page: 'customers', action: 'create' }}><CustomerImport /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute requiredPermission={{ page: 'customers', action: 'read' }}><CustomerDetail /></ProtectedRoute>} />
        <Route path="/customers/:id/edit" element={<ProtectedRoute requiredPermission={{ page: 'customers', action: 'edit' }}><CustomerEdit /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute requiredPermission={{ page: 'contracts', action: 'read' }}><Contracts /></ProtectedRoute>} />
        <Route path="/contracts/create" element={<ProtectedRoute requiredPermission={{ page: 'contracts', action: 'create' }}><ContractCreate /></ProtectedRoute>} />
        <Route path="/contracts/:id" element={<ProtectedRoute requiredPermission={{ page: 'contracts', action: 'read' }}><ContractDetail /></ProtectedRoute>} />
        <Route path="/contracts/:id/edit" element={<ProtectedRoute requiredPermission={{ page: 'contracts', action: 'edit' }}><ContractEdit /></ProtectedRoute>} />
        <Route path="/contracts/:contractId/schedule" element={<ProtectedRoute requiredPermission={{ page: 'contracts', action: 'read' }}><PaymentSchedule /></ProtectedRoute>} />
        <Route path="/contract-demo" element={<ContractDemo />} />
        <Route path="/payments" element={<ProtectedRoute requiredPermission={{ page: 'payments', action: 'read' }}><Payments /></ProtectedRoute>} />
        <Route path="/payments/create" element={<ProtectedRoute requiredPermission={{ page: 'payments', action: 'create' }}><PaymentCreate /></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute requiredPermission={{ page: 'payments', action: 'read' }}><PaymentDetail /></ProtectedRoute>} />
        <Route path="/payments/:id/edit" element={<ProtectedRoute requiredPermission={{ page: 'payments', action: 'edit' }}><PaymentEdit /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute requiredPermission={{ page: 'companies', action: 'read' }}><Companies /></ProtectedRoute>} />
        <Route path="/companies/create" element={<ProtectedRoute requiredPermission={{ page: 'companies', action: 'create' }}><CompanyCreate /></ProtectedRoute>} />
        <Route path="/companies/:id" element={<ProtectedRoute requiredPermission={{ page: 'companies', action: 'read' }}><CompanyDetail /></ProtectedRoute>} />
        <Route path="/companies/:id/edit" element={<ProtectedRoute requiredPermission={{ page: 'companies', action: 'edit' }}><CompanyEdit /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute requiredPermission={{ page: 'vehicles', action: 'read' }}><Vehicles /></ProtectedRoute>} />
        <Route path="/vehicles/create" element={<ProtectedRoute requiredPermission={{ page: 'vehicles', action: 'create' }}><VehicleCreate /></ProtectedRoute>} />
        <Route path="/vehicles/import" element={<ProtectedRoute requiredPermission={{ page: 'vehicles', action: 'create' }}><VehicleImport /></ProtectedRoute>} />
        <Route path="/vehicles/:id" element={<ProtectedRoute requiredPermission={{ page: 'vehicles', action: 'read' }}><VehicleDetails /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute requiredPermission={{ page: 'vehicles', action: 'edit' }}><VehicleEdit /></ProtectedRoute>} />
        <Route path="/overdue-notifications" element={<ProtectedRoute requiredPermission={{ page: 'overdue-notifications', action: 'read' }}><OverdueNotifications /></ProtectedRoute>} />
        <Route path="/dyp-senedleri" element={<DypSenedleri />} />
        {/* <Route path="/dyp-senedleri" element={<ProtectedRoute requiredPermission={{ page: 'dyp-senedleri', action: 'read' }}><DypSenedleri /></ProtectedRoute>} /> */}
        <Route path="/users" element={<ProtectedRoute requiredPermission={{ page: 'users', action: 'read' }}><Users /></ProtectedRoute>} />
        <Route path="/users/create" element={<ProtectedRoute requiredPermission={{ page: 'users', action: 'create' }}><UserCreate /></ProtectedRoute>} />
        <Route path="/users/:userId/edit" element={<ProtectedRoute requiredPermission={{ page: 'users', action: 'edit' }}><UserEdit /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredPermission={{ page: 'settings', action: 'read' }}><Settings /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/first-accessible" replace />} />
        <Route path="*" element={<Navigate to="/first-accessible" replace />} />
      </Routes>
      </Layout>
      
      {/* Guide Welcome Modal */}
      <GuideTourWelcome
        isOpen={showGuideWelcome}
        onClose={() => setShowGuideWelcome(false)}
        onStartTour={handleStartGuide}
      />
      
      {/* Hover Guide */}
      <HoverGuide
        isActive={showHoverGuide}
        onClose={handleCloseGuide}
      />
      
      {/* Guide Info Modal - Only show if guide is not active */}
      <GuideInfoModal
        isOpen={showGuideInfo && !showHoverGuide}
        onClose={handleCloseGuideInfo}
        onStartGuide={() => {
          setShowGuideInfo(false);
          setShowHoverGuide(true);
        }}
      />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <DataProvider>
            <div className="min-h-screen bg-gray-50">
              <AuthenticatedApp />
            </div>
          </DataProvider>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;