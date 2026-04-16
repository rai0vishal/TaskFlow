import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import Profile from './pages/Profile';
import ChatPanel from './components/ChatPanel';

// Layout wrapper for Navbar
function AppLayout({ children }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      // Don't toast if we sent it
      if (msg.sender._id === user._id) return;
      
      if (!isChatOpen) {
        setUnreadCount((prev) => prev + 1);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-surface-800 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                    {msg.sender.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-surface-900">New Message from {msg.sender.name}</p>
                  <p className="mt-1 text-sm text-surface-500 line-clamp-2">{msg.content}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-surface-200">
              <button
                onClick={() => { toast.dismiss(t.id); setIsChatOpen(true); }}
                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-primary-600 hover:text-primary-500 hover:bg-primary-50"
              >
                Reply
              </button>
            </div>
          </div>
        ));
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, isChatOpen, user]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col overflow-x-hidden transition-colors duration-300">
      <Navbar 
        onChatToggle={() => {
          setIsChatOpen(!isChatOpen);
          setUnreadCount(0);
        }} 
        unreadCount={unreadCount} 
      />
      <div className="flex-1">
        {children}
      </div>
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          setUnreadCount(0);
        }} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <SocketProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes without Navbar? Actually Home needs Navbar */}
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><AppLayout><TaskManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
      </SocketProvider>
    </ThemeProvider>
    </AuthProvider>
  );
}
