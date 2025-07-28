// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB5WTZFkVKP7L6qZrYbDctR0JIpktpKojA",
    authDomain: "yugmi-app-e14c0.firebaseapp.com",
    projectId: "yugmi-app-e14c0",
    storageBucket: "yugmi-app-e14c0.firebasestorage.app",
    messagingSenderId: "161170705600",
    appId: "1:161170705600:web:8da8a4dfb07144ecd13125"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Functions
const functions = getFunctions(app);

// Development emulator connections (uncomment for local testing)
// if (__DEV__) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// Firebase collection names
export const collections = {
    users: 'users',
    media: 'media',
    reports: 'reports',
    analysis: 'analysis',
    stats: 'stats',
    inspections: 'inspections',
    projects: 'projects',
    locations: 'locations'
};

// Firebase storage paths
export const storagePaths = {
    media: 'media',
    thumbnails: 'thumbnails',
    reports: 'reports',
    exports: 'exports'
};

// Firebase utilities
export const enableOfflineCapability = () => {
  return enableNetwork(db);
};

export const disableOfflineCapability = () => {
  return disableNetwork(db);
};

export { app, auth, db, storage, functions };
