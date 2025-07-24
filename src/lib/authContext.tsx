import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
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
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      // Auth state will be updated by the onAuthStateChanged listener
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later');
      } else {
        throw new Error(error.message || 'Failed to login');
      }
    }
  };

  // Signup function
  const signup = async (userData: SignupData) => {
    try {
      // Validate password match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const firebaseUser = userCredential.user;
      
      try {
        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          username: userData.email.split('@')[0],
          email: userData.email,
          fullName: userData.fullName,
          role: 'user',
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        // If Firestore save fails, we still continue since the user is created in Firebase Auth
        console.error('Error saving user data to Firestore:', firestoreError);
      }
      
      // Auth state will be updated by the onAuthStateChanged listener
      return firebaseUser;
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled');
      } else {
        throw new Error('Failed to create account. Please try again later.');
      }
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to logout');
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      // Send password reset email with Firebase
      await sendPasswordResetEmail(auth, email);
      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else {
        throw new Error(error.message || 'Failed to send reset email');
      }
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