import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import * as workspaceApi from '../api/workspace';
import toast from 'react-hot-toast';

const WorkspaceContext = createContext();

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // { workspaceId: count }
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { socket } = useSocket();

  // Initialize workspaces only when logged in
  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setLoadingWorkspace(false);
      setUnreadCounts({});
      localStorage.removeItem('activeWorkspaceId');
    }
  }, [user]);

  const fetchWorkspaces = useCallback(async () => {
    setLoadingWorkspace(true);
    try {
      const res = await workspaceApi.getWorkspaceSummaries();
      if (res?.data?.data?.workspaces) {
        const wList = res.data.data.workspaces;
        setWorkspaces(wList);

        // Build unread counts map
        const counts = {};
        wList.forEach(ws => {
          counts[ws._id] = ws.unreadCount || 0;
        });
        setUnreadCounts(counts);

        // State Persistence & Validation
        const storedId = localStorage.getItem('activeWorkspaceId');
        let targetWorkspace = null;

        if (storedId) {
          targetWorkspace = wList.find(w => w._id === storedId);
        }

        // If no stored ID or stored ID is invalid, fallback to first workspace
        if (!targetWorkspace && wList.length > 0) {
          targetWorkspace = wList[0];
          localStorage.setItem('activeWorkspaceId', targetWorkspace._id);
        }

        if (targetWorkspace) {
          setActiveWorkspace(targetWorkspace);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces', err);
    } finally {
      setLoadingWorkspace(false);
    }
  }, []); // Removed activeWorkspace dependency to prevent loops

  // Clear unread count when switching to a workspace
  const handleSetActiveWorkspace = useCallback((ws) => {
    if (!ws || ws._id === activeWorkspace?._id) return;

    setIsSwitching(true);
    
    // Update state and persistence
    setActiveWorkspace(ws);
    localStorage.setItem('activeWorkspaceId', ws._id);
    
    if (ws?._id) {
      setUnreadCounts(prev => ({ ...prev, [ws._id]: 0 }));
    }

    // Provide a small artificial delay for the global loader to be visible and for data clearing
    setTimeout(() => {
      setIsSwitching(false);
    }, 600);
  }, [activeWorkspace?._id]);

  // Increment unread count for a specific workspace
  const incrementUnread = useCallback((workspaceId) => {
    if (activeWorkspace?._id === workspaceId) return;
    setUnreadCounts(prev => ({
      ...prev,
      [workspaceId]: (prev[workspaceId] || 0) + 1,
    }));
  }, [activeWorkspace?._id]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('unread_message_increment', incrementUnread);

    return () => {
      socket.off('unread_message_increment', incrementUnread);
    };
  }, [socket, incrementUnread]);

  const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);

  const deleteWorkspace = async (workspaceId) => {
    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      const wsName = workspaces.find(w => w._id === workspaceId)?.name || 'Workspace';
      
      // Update local state immediately
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
      if (activeWorkspace?._id === workspaceId) {
        setActiveWorkspace(null);
        localStorage.removeItem('activeWorkspaceId');
      }

      // Show Undo Toast
      toast((t) => (
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm">Deleted "{wsName}"</span>
          <button 
            className="text-primary-600 dark:text-primary-400 font-black hover:underline px-3 py-1 text-sm transition-all active:scale-95"
            onClick={async () => {
              await restoreWorkspace(workspaceId);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </div>
      ), { duration: 8000, position: 'bottom-right' });

      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
      return false;
    }
  };

  const restoreWorkspace = async (workspaceId) => {
    try {
      await workspaceApi.restoreWorkspace(workspaceId);
      await fetchWorkspaces(); // Refresh list to get it back
      toast.success('Workspace restored');
      return true;
    } catch (err) {
      toast.error('Failed to restore workspace');
      return false;
    }
  };

  const leaveWorkspace = async (workspaceId) => {
    try {
      await workspaceApi.leaveWorkspace(workspaceId);
      const wsName = workspaces.find(w => w._id === workspaceId)?.name || 'Workspace';
      
      // Update local state
      setWorkspaces(prev => prev.filter(w => w._id !== workspaceId));
      if (activeWorkspace?._id === workspaceId) {
        setActiveWorkspace(null);
        localStorage.removeItem('activeWorkspaceId');
      }

      // Show Undo Toast for Leaving
      toast((t) => (
        <div className="flex items-center gap-4">
          <span className="font-medium text-sm">Left "{wsName}"</span>
          <button 
            className="text-primary-600 dark:text-primary-400 font-black hover:underline px-3 py-1 text-sm transition-all active:scale-95"
            onClick={async () => {
              await rejoinWorkspace(workspaceId);
              toast.dismiss(t.id);
            }}
          >
            Undo
          </button>
        </div>
      ), { duration: 8000, position: 'bottom-right' });

      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave workspace');
      return false;
    }
  };

  const rejoinWorkspace = async (workspaceId) => {
    try {
      await workspaceApi.rejoinWorkspace(workspaceId);
      await fetchWorkspaces();
      toast.success('Rejoined successfully');
      return true;
    } catch (err) {
      toast.error('Failed to rejoin workspace');
      return false;
    }
  };

  const updateWorkspace = async (workspaceId, data) => {
    try {
      await workspaceApi.updateWorkspace(workspaceId, data);
      await fetchWorkspaces();
      toast.success('Workspace updated');
      return true;
    } catch (err) {
      toast.error('Failed to update workspace');
      return false;
    }
  };

  const value = {
    activeWorkspace,
    setActiveWorkspace: handleSetActiveWorkspace,
    workspaces,
    fetchWorkspaces,
    loadingWorkspace,
    isSwitching,
    unreadCounts,
    incrementUnread,
    totalUnread,
    deleteWorkspace,
    restoreWorkspace,
    leaveWorkspace,
    rejoinWorkspace,
    updateWorkspace,
    isSettingsOpen,
    setIsSettingsOpen,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
