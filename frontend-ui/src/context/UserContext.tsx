import React, { createContext, useContext, useEffect } from 'react';
import randomName from '@scaleway/random-name'

type User = {
  uuid: string;
  displayName: string;
  createdAt: string;
};

type UserContextType = {
  user: User | null;
  resetSession: () => void;
} | undefined;

const UserContext = createContext<UserContextType>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { 
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const LOCAL_STORAGE_KEY = 'user';

  const resetSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else {
      const newUser: User = {
        uuid: crypto.randomUUID(),
        displayName: randomName(),
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user === null && !isLoading) {
      const newUser: User = {
        uuid: crypto.randomUUID(),
        displayName: randomName(),
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <>{null}</>;
  }

  return (
    <UserContext.Provider value={{ user, resetSession }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}