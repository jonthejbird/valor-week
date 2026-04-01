/**
 * services/auth.ts
 *
 * PURPOSE:
 * Firebase Authentication helper functions.
 *
 * RULE:
 * - This file ONLY talks to Firebase Auth
 * - No UI logic here
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Create a new user account
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in existing user
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  return signOut(auth);
}