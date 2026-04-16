import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth(); // User comes from AuthContext

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

    setSocket(socketInstance);

    return () => {
      // Disconnect and cleanup to avoid memory leaks
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  return useContext(SocketContext);
};
