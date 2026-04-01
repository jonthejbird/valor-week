/**
 * services/firebase.ts
 *
 * PURPOSE:
 * Initialize Firebase App, Auth, and Firestore for Expo/React Native.
 *
 * IMPORTANT:
 * - Uses AsyncStorage so login can persist across app restarts
 * - Do not call getAuth(app) elsewhere if you use initializeAuth here
 */

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;