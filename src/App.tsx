import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/Spinner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuickExpensePage } from './pages/QuickExpensePage';
import { InvoicesPage } from './pages/InvoicesPage';

// Pantallas con librerías pesadas: se cargan bajo demanda para aligerar el bundle.
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/registrar" element={<QuickExpensePage />} />
        <Route path="/facturas" element={<InvoicesPage />} />
        <Route
          path="/calendario"
          element={
            <Suspense fallback={<PageLoader />}>
              <CalendarPage />
            </Suspense>
          }
        />
        <Route
          path="/historial"
          element={
            <Suspense fallback={<PageLoader />}>
              <HistoryPage />
            </Suspense>
          }
        />
        <Route
          path="/reportes"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
