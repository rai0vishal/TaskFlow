import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import toast, { Toaster, resolveValue } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import WorkspaceSettingsModal from './components/WorkspaceSettingsModal';
import CommandPalette from './components/CommandPalette';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// Lazy-load heavier pages for better initial bundle size
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Global loader for workspace switching
function GlobalSwitchLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-md transition-all duration-500 animate-in fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/50 animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-sm font-bold text-surface-900 dark:text-white tracking-widest uppercase animate-pulse">
        Switching Workspace
      </p>
    </div>
  );
}

// Suspense fallback spinner
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function AppLayout({ children }) {
  const { user } = useAuth();
  const { isSwitching, isSettingsOpen, setIsSettingsOpen } = useWorkspace();

  return (
    <div className="min-h-screen bg-bg-page flex flex-col overflow-x-hidden transition-colors duration-300">
      {isSwitching && <GlobalSwitchLoader />}
      <Navbar />
      <div className="flex-1 page-wrapper">
        {children}
      </div>
      <WorkspaceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <SocketProvider>
        <WorkspaceProvider>
          <BrowserRouter>
        <Routes>
          {/* Public Routes without Navbar? Actually Home needs Navbar */}
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><AppLayout><TaskManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><Suspense fallback={<PageLoader />}><Analytics /></Suspense></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><Suspense fallback={<PageLoader />}><Profile /></Suspense></AppLayout></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <CommandPalette />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }}>
          {(t) => {
            const types = {
              success: { border: 'border-l-success', icon: <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" /> },
              error: { border: 'border-l-danger', icon: <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" /> },
              loading: { border: 'border-l-info', icon: <Info className="w-5 h-5 text-info shrink-0 mt-0.5" /> },
              blank: { border: 'border-l-info', icon: <Info className="w-5 h-5 text-info shrink-0 mt-0.5" /> },
              custom: { border: 'border-l-info', icon: <Info className="w-5 h-5 text-info shrink-0 mt-0.5" /> },
            };
            const typeConfig = types[t.type] || types.blank;
            
            return (
              <div
                className={`w-[320px] bg-bg-card border-[0.5px] border-border border-l-[3px] ${typeConfig.border} rounded-[var(--radius-md)] p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-start gap-3 pointer-events-auto`}
                style={{
                  animation: t.visible ? 'toastIn 280ms ease-out forwards' : 'toastOut 220ms ease-in forwards'
                }}
              >
                {typeConfig.icon}
                <div className="flex-1">
                  <span className="text-[14px] font-[500] text-text-heading leading-tight block">
                    {resolveValue(t.message, t)}
                  </span>
                </div>
              </div>
            );
          }}
        </Toaster>
        </BrowserRouter>
        </WorkspaceProvider>
      </SocketProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}
