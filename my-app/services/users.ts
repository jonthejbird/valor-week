/**
 * services/users.ts
 *
 * PURPOSE:
 * Create the app-specific user profile document in Firestore.
 */

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

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