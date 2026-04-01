/**
 * services/auth.ts
 *
 * PURPOSE:
 * Central Firebase Authentication helper functions.
 *
 * IMPORTANT:
 * - These functions are imported by sign-in.tsx and sign-up.tsx
 * - If one of these exports is missing, you'll get "is not a function"
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Create a new Firebase Auth account with email and password.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in an existing Firebase Auth user.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  return signOut(auth);
}