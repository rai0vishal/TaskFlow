import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // List of online user IDs
  const { user } = useAuth(); // User comes from AuthContext
  const joinedWorkspaceRef = useRef(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) return;

    // Use environment variable for backend URL if provided, otherwise default
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    
    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      
      // Default join the user's personal room for global task updates
      socketInstance.emit('joinUserRoom', user._id);
    });

    socketInstance.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socketInstance.on('userOnline', (userId) => {
      setOnlineUsers((prev) => Array.from(new Set([...prev, userId])));
    });

    socketInstance.on('userOffline', (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    setSocket(socketInstance);

    return () => {
      // Disconnect and cleanup to avoid memory leaks
      socketInstance.disconnect();
    };
  }, [user]);

  /**
   * Join a workspace room for real-time events scoped to that workspace.
   * Automatically leaves the previous workspace room.
   */
  const joinWorkspaceRoom = (workspaceId) => {
    if (!socket || !workspaceId) return;

    // Leave previous workspace room if different
    if (joinedWorkspaceRef.current && joinedWorkspaceRef.current !== workspaceId) {
      socket.emit('leaveWorkspace', joinedWorkspaceRef.current);
    }

    socket.emit('joinWorkspace', workspaceId);
    joinedWorkspaceRef.current = workspaceId;
  };

  return (
    <SocketContext.Provider value={{ socket, joinWorkspaceRoom, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};
