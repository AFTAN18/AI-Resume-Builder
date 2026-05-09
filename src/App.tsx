import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppChrome } from './components/layout/AppChrome';

const AuthPage = lazy(() => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const BuilderPage = lazy(() => import('./pages/BuilderPage').then((module) => ({ default: module.BuilderPage })));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage').then((module) => ({ default: module.TemplatesPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

export function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route element={<AppChrome />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/builder/:resumeId" element={<BuilderPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-[color:var(--surface)] px-4">
      <div className="w-full max-w-md space-y-3">
        <div className="shimmer h-12 rounded-sm bg-white/10" />
        <div className="shimmer h-32 rounded-md bg-white/10" />
      </div>
    </div>
  );
}
