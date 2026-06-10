import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TripProvider } from './context/TripContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">載入中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/planner"
              element={
                <RequireAuth>
                  <PlannerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/groups"
              element={
                <RequireAuth>
                  <GroupsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId"
              element={
                <RequireAuth>
                  <TripDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/trip/:tripId/expenses"
              element={
                <RequireAuth>
                  <ExpensesPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TripProvider>
    </AuthProvider>
  );
}
