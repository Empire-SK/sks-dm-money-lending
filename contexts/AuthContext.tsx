import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges, logout } from '../services/authService';
import { auth } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: auth?.currentUser || null,
  isAuthenticated: !!auth?.currentUser,
  isLoading: !auth?.currentUser,
  logoutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth?.currentUser || null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !auth?.currentUser);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (!mounted) return;
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const logoutUser = async () => {
    try {
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
