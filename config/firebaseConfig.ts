// Firebase Configuration for React Native
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
    apiKey: "AIzaSyBJNMUynV_i4h8YPVWIfZ0VvW-Dvex9aBw",
    authDomain: "fir-course-4e4ec.firebaseapp.com",
    projectId: "fir-course-4e4ec",
    storageBucket: "fir-course-4e4ec.firebasestorage.app",
    messagingSenderId: "632639207438",
    appId: "1:632639207438:web:982eecba95a3127796645f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for native platforms
let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    // @ts-ignore - getReactNativePersistence is available in React Native but might not be in the types
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
}

export { app, auth };

