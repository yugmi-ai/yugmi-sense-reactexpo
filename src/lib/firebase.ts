// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

// Firebase collection names
export const collections = {
    users: 'users',
    media: 'media',
    reports: 'reports',
    analysis: 'analysis',
    stats: 'stats'
};

// Firebase storage paths
export const storagePaths = {
    media: 'media',
    thumbnails: 'thumbnails'
};

export { app, auth, db, storage };