// Context for react to share the WebSocket connection across components
import React, { createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

type AppGatewayConnection = {
  userId: string; // unused
  socket: Socket;
};

const WsConnectionContext = createContext<AppGatewayConnection | null>(null);

export const WsConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appUserState = useUser();
  const userUniqueId = appUserState?.user?.uuid || 'unknown-user';
  const socket = io('http://localhost:3422', {
    transports: ['websocket'], // Force WebSocket transport
    extraHeaders: {
      'X-Ephemeral-Id': userUniqueId,
    }
  });

  socket.on('connect', () => {
    socket.emit('hello', {
      message: 'Hello from the client!',
      userId: userUniqueId,
      knownAs: appUserState?.user?.displayName || 'unknown',
    });
  });

  return (
    <WsConnectionContext.Provider value={{ userId: userUniqueId, socket }}>
      {children}
    </WsConnectionContext.Provider>
  );
};

export const useWsConnection = () => {
  const context = useContext(WsConnectionContext);
  if (context === null) {
    throw new Error('useWsConnection must be used within a WsConnectionProvider');
  }
  return context;
};