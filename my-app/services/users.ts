/**
 * services/users.ts
 *
 * PURPOSE:
 * Create and manage Firestore user profile documents.
 */

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create or merge a user profile document in Firestore.
 */
export async function createUserProfile(uid: string, email: string) {
  const userRef = doc(db, "users", uid);

  await setDoc(
    userRef,
    {
      email,
      plan: "free",
      premiumStatus: "inactive",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}