import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User, AuthCredentials, SignupData, Organization, AuthResponse } from '../types';

// Default auth state
const defaultAuthState: AuthState = {
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create context
interface AuthContextType extends AuthState {
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  signup: (userData: SignupData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    // On app start, you might want to load the token from async storage
    // and validate it to restore the session.
    setAuthState({ ...defaultAuthState, isLoading: false });
  }, []);

  // Updated Login function
  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('https://yugmi-backend-service.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to login.');
      }

      const { user, organization, token } = data.data;

      setAuthState({
        user,
        organization,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // You should also save the token to AsyncStorage here to persist login
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Updated Signup function
  const signup = async (userData: SignupData): Promise<AuthResponse> => {
    const nameParts = userData.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    try {
      const response = await fetch('https://yugmi-backend-service.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: firstName,
          lastName: lastName,
          userType: 'individual', // Assuming individual signup for now
        }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create account.');
      }

      const { user, organization, token } = data.data;

      setAuthState({
        user,
        organization,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // You should also save the token to AsyncStorage here to persist login
      return data;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    // Clear the auth state and remove the token from AsyncStorage
    setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    // This would be updated to call the new backend's endpoint
    console.log('Forgot password function needs to be updated for the new API');
    // Example implementation:
    // const response = await fetch('https://yugmi-backend-service.onrender.com/api/auth/forgot-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email }),
    // });
    // const data = await response.json();
    // if (!response.ok) throw new Error(data.message);
    // return data;
    return Promise.reject('Forgot password not implemented for the new API');
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};