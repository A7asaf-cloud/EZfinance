import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirstVisit: boolean;
  createAccount: (name: string, password: string) => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const accountData = localStorage.getItem('ez_account');
    const sessionAuth = sessionStorage.getItem('ez_session_auth');

    if (!accountData) {
      setIsFirstVisit(true);
    } else if (sessionAuth === 'true') {
      const parsed = JSON.parse(accountData);
      setUser({ name: parsed.name });
    }
    
    setLoading(false);
  }, []);

  const createAccount = (name: string, password: string) => {
    const account = {
      name,
      passwordHash: btoa(password)
    };
    localStorage.setItem('ez_account', JSON.stringify(account));
    setIsFirstVisit(false);
    setUser({ name });
    sessionStorage.setItem('ez_session_auth', 'true');
  };

  const login = async (password: string): Promise<boolean> => {
    const accountData = localStorage.getItem('ez_account');
    if (!accountData) return false;
    
    const account = JSON.parse(accountData);
    if (account.passwordHash === btoa(password)) {
      setUser({ name: account.name });
      sessionStorage.setItem('ez_session_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFirstVisit, createAccount, login, logout }}>
      {!loading && children}
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
