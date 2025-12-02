import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signUp = async (email, password, displayName) => {
    const mockUser = { uid: `user-${Date.now()}`, email, displayName };
    setUser(mockUser);
    setIsAuthenticated(true);
    return { success: true, user: mockUser };
  };

  const signIn = async (email, password) => {
    const mockUser = { uid: `user-${Date.now()}`, email, displayName: email.split('@')[0] };
    setUser(mockUser);
    setIsAuthenticated(true);
    return { success: true, user: mockUser };
  };

  const signOut = async () => {
    setUser(null);
    setIsAuthenticated(false);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
