import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { firebaseService } from './firebaseService';
import { AuthState, User, AuthCredentials, SignupData } from '../types';

// Default auth state
const defaultAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create context
interface AuthContextType extends AuthState {
  login: (credentials: AuthCredentials) => Promise<any>;
  signup: (userData: SignupData) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // Initialize auth state from storage
  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          // Create user object with Firebase and Firestore data
          const user: User = {
            id: parseInt(firebaseUser.uid, 16) || 0, // Convert uid to number or use 0
            username: userData?.username || firebaseUser.email?.split('@')[0] || '',
            email: firebaseUser.email || '',
            fullName: userData?.fullName || '',
            role: userData?.role || 'user',
            createdAt: userData?.createdAt || new Date().toISOString(),
          };
          
          // Update auth state
          setAuthState({
            user,
            token: await firebaseUser.getIdToken(),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error getting user data:', error);
          setAuthState({
            ...defaultAuthState,
            isLoading: false,
          });
        }
      } else {
        // No user is signed in
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
        });
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (credentials: AuthCredentials) => {
    try {
      const response = await firebaseService.login(credentials);
      // Auth state will be updated by the onAuthStateChanged listener
      return response.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Signup function
  const signup = async (userData: SignupData) => {
    try {
      const response = await firebaseService.signup(userData);
      // Auth state will be updated by the onAuthStateChanged listener
      return response.user;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await firebaseService.logout();
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      return await firebaseService.forgotPassword(email);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
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