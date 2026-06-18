/**
 * app/(tabs)/profile.tsx
 *
 * PURPOSE:
 * User account and settings screen. Currently a placeholder.
 *
 * PLANNED FEATURES:
 * - Display user email and plan (free / premium)
 * - Upgrade to premium CTA (if on free plan)
 * - Sign out button → calls signOutUser() from services/auth.ts,
 *   then redirects to /sign-in using router.replace()
 * - Notification preferences (future — requires expo-notifications)
 * - Display name / avatar (future — requires Firebase Storage or external avatar service)
 * - Delete account option (future — requires Firebase Auth deleteUser() + Firestore cleanup)
 *
 * DATA THIS SCREEN WILL NEED:
 * - User profile document → users/{userId} from Firestore
 *   Fields: email, plan ("free" | "premium"), createdAt
 * - Current user email → auth.currentUser?.email (from services/firebase.ts)
 *
 * SIGN OUT IMPLEMENTATION SKETCH:
 *   import { signOutUser } from "../../services/auth";
 *   import { router } from "expo-router";
 *   const handleSignOut = async () => {
 *     await signOutUser();
 *     router.replace("/sign-in");
 *   };
 *
 * DEBUG NOTES:
 * - After sign out, ensure router.replace (not router.back) is used so the user
 *   cannot navigate back to the authenticated screens with the back gesture.
 * - Plan data is stored in the users/{userId} Firestore document under the `plan` field.
 *   It is set to "free" by default in services/users.ts createUserProfile().
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your profile settings will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});