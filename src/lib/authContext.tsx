import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, AuthCredentials, SignupData, AuthResponse } from '../types';

// Default state represents a logged-out user
const defaultAuthState: AuthState = {
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for stored token
};

interface AuthContextType extends AuthState {
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // Check for a stored token on app startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userString = await AsyncStorage.getItem('user');
        const orgString = await AsyncStorage.getItem('organization');

        if (token && userString) {
          setAuthState({
            token,
            user: JSON.parse(userString),
            organization: orgString ? JSON.parse(orgString) : null,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({ ...defaultAuthState, isLoading: false });
        }
      } catch (e) {
        // In case of error, ensure user is logged out
        setAuthState({ ...defaultAuthState, isLoading: false });
      }
    };

    loadToken();
  }, []);

  const login = async (credentials: AuthCredentials): Promise<void> => {
    try {
      const response = await fetch('https://yugmi-backend-service.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to login.');
      }

      const { user, organization, token } = data.data;

      // Store session
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (organization) {
        await AsyncStorage.setItem('organization', JSON.stringify(organization));
      }

      // Set state on success
      setAuthState({ user, organization, token, isAuthenticated: true, isLoading: false });

    } catch (error: any) {
      // **CRITICAL FIX**: On error, explicitly reset state and clear storage
      await AsyncStorage.clear();
      setAuthState({ ...defaultAuthState, isLoading: false });
      // Re-throw error to be caught by the UI component (e.g., to show an alert)
      throw error;
    }
  };

  const signup = async (userData: SignupData): Promise<void> => {
    try {
      const response = await fetch('https://yugmi-backend-service.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      const { user, organization, token } = data.data;

      // Store session
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (organization) {
        await AsyncStorage.setItem('organization', JSON.stringify(organization));
      }

      // Set state on success
      setAuthState({ user, organization, token, isAuthenticated: true, isLoading: false });

    } catch (error: any) {
      // **CRITICAL FIX**: On error, explicitly reset state and clear storage
      await AsyncStorage.clear();
      setAuthState({ ...defaultAuthState, isLoading: false });
      // Re-throw error to be caught by the UI component
      throw error;
    }
  };

  const logout = async () => {
    // Clear storage and reset state
    await AsyncStorage.clear();
    setAuthState({ ...defaultAuthState, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};