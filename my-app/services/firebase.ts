/**
 * services/firebase.ts
 *
 * PURPOSE:
 * Initialize Firebase App, Authentication, and Firestore.
 *
 * IMPORTANT:
 * - Uses AsyncStorage for persistent login in React Native
 * - Prevents users from being logged out on app restart
 */

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase project configuration
 * (from Firebase Console → Project Settings → Your Apps → Web App)
 */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKdn9lTg7Udsi5wkyIyEcf6ahMG5i28cc",
  authDomain: "valorweek.firebaseapp.com",
  projectId: "valorweek",
  storageBucket: "valorweek.firebasestorage.app",
  messagingSenderId: "5595471019",
  appId: "1:5595471019:web:a3305c3a2804ead539ebee"
};



/**
 * Initialize Firebase app
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase Auth with persistence
 * This keeps users logged in across app restarts
 */
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

/**
 * Initialize Firestore database
 */
export const db = getFirestore(app);

export default app;