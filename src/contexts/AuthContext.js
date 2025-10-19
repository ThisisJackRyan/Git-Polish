'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check for existing token and user in sessionStorage on mount
    const savedToken = sessionStorage.getItem('githubToken');
    const savedUser = sessionStorage.getItem('githubUser');
    
    if (savedToken) {
      setToken(savedToken);
    }
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        sessionStorage.removeItem('githubUser');
      }
    }
    
    setLoading(false);
    setMounted(true);
  }, []);

  const signOut = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('githubToken');
    sessionStorage.removeItem('githubUser');
  };

  const value = {
    user,
    setUser,
    token,
    setToken,
    loading,
    mounted,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
