import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import schedulerService from '@/services/scheduler';

// Lazy load components
import { lazy, Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';

// Onboarding
const OnboardingFlow = lazy(() => import('@/modules/onboarding/OnboardingFlow'));

// Main views
const HomeView = lazy(() => import('@/modules/home/HomeView'));
const LoginView = lazy(() => import('@/modules/auth/LoginView'));

// Patient modules
const HealthDataView = lazy(() => import('@/modules/patient/HealthDataView'));
const QuestionnairesView = lazy(() => import('@/modules/patient/QuestionnairesView'));
const DataSourcesView = lazy(() => import('@/modules/patient/DataSourcesView'));

// Provider modules
const PatientManagementView = lazy(() => import('@/modules/provider/PatientManagementView'));
const DataReviewView = lazy(() => import('@/modules/provider/DataReviewView'));

// Researcher modules
const StudyManagementView = lazy(() => import('@/modules/researcher/StudyManagementView'));
const DataAnalysisView = lazy(() => import('@/modules/researcher/DataAnalysisView'));

// Shared modules
const ContactsView = lazy(() => import('@/modules/contacts/ContactsView'));
const AccountView = lazy(() => import('@/modules/account/AccountView'));

// Setup modules
const ModuleSetupView = lazy(() => import('@/modules/setup/ModuleSetupView'));

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Role-based route wrapper
function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes(): JSX.Element {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Show onboarding if user needs it
  if (user && needsOnboarding && !config.features.skipOnboarding) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingFlow />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/contacts" element={<ContactsView />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountView />
            </ProtectedRoute>
          }
        />

        {/* Patient routes */}
        <Route
          path="/health-data"
          element={
            <RoleRoute allowedRoles={['patient']}>
              <HealthDataView />
            </RoleRoute>
          }
        />

        <Route
          path="/questionnaires"
          element={
            <RoleRoute allowedRoles={['patient']}>
              <QuestionnairesView />
            </RoleRoute>
          }
        />

        <Route
          path="/data-sources"
          element={
            <RoleRoute allowedRoles={['patient']}>
              <DataSourcesView />
            </RoleRoute>
          }
        />

        {/* Provider routes */}
        <Route
          path="/patients"
          element={
            <RoleRoute allowedRoles={['provider']}>
              <PatientManagementView />
            </RoleRoute>
          }
        />

        <Route
          path="/review"
          element={
            <RoleRoute allowedRoles={['provider']}>
              <DataReviewView />
            </RoleRoute>
          }
        />

        {/* Researcher routes */}
        <Route
          path="/studies"
          element={
            <RoleRoute allowedRoles={['researcher']}>
              <StudyManagementView />
            </RoleRoute>
          }
        />

        <Route
          path="/analysis"
          element={
            <RoleRoute allowedRoles={['researcher']}>
              <DataAnalysisView />
            </RoleRoute>
          }
        />

        {/* Setup routes - accessible to all authenticated users */}
        <Route
          path="/setup/modules"
          element={
            <ProtectedRoute>
              <ModuleSetupView />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App(): JSX.Element {
  useEffect(() => {
    logger.info('App component mounted');

    // Start background scheduler for tasks and notifications
    schedulerService.start();
    logger.info('Scheduler service started');

    // Cleanup on unmount
    return () => {
      schedulerService.stop();
      logger.info('Scheduler service stopped');
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
