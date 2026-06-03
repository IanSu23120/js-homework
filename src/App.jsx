import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TripProvider } from './context/TripContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';

export default function App() {
  return (
    <TripProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/trip/:tripId" element={<TripDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TripProvider>
  );
}
