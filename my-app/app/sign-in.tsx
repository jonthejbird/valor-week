/**
 * app/sign-in.tsx
 *
 * PURPOSE:
 * Simple sign-in placeholder screen.
 *
 * CURRENT BEHAVIOR:
 * - User can enter any email/password
 * - Pressing Sign In routes into the tab layout
 *
 * KEYBOARD FIX:
 * - KeyboardAvoidingView shifts content when keyboard opens
 * - ScrollView allows the user to scroll if lower fields are covered
 * - keyboardShouldPersistTaps lets buttons/inputs behave properly
 */

import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function SignInScreen() {
  /**
   * Placeholder local state.
   * No real authentication yet.
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Temporary sign-in action.
   * Right now, any input will pass through.
   */
  const handleSignIn = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      /**
       * On iOS, "padding" usually works best.
       * On Android, "height" is often more reliable.
       */
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>ValorWeek</Text>
          <Text style={styles.subtitle}>
            Build consistency. Track progress. Stay accountable.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              returnKeyType="done"
              style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Skeleton auth screen for now
          </Text>
        </View>
      </ScrollView>/**
 * app/sign-up.tsx
 *
 * PURPOSE:
 * Creates a real Firebase account and a Firestore profile.
 *
 * FLOW:
 * 1. User enters email/password
 * 2. Firebase Auth account is created
 * 3. Firestore user profile is created
 * 4. User is routed into the app
 */

import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { signUpWithEmail } from "../services/auth";
import { createUserProfile } from "../services/users";

export default function SignUpScreen() {
  /**
   * Form state
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Loading state to prevent double-submission
   */
  const [loading, setLoading] = useState(false);

  /**
   * Create Firebase Auth user + Firestore profile
   */
  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      /**
       * Step 1: Create Firebase Auth account
       */
      const credential = await signUpWithEmail(email.trim(), password);
      const user = credential.user;

      /**
       * Step 2: Create Firestore profile document
       */
      await createUserProfile(user.uid, user.email ?? email.trim());

      /**
       * Step 3: Enter app
       */
      router.replace("/(tabs)/home");
    } catch (error: any) {
      Alert.alert("Sign up failed", error?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start with a free ValorWeek account.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F97316",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFEDD5",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /**
   * Full screen wrapper
   */
  container: {
    flex: 1,
    backgroundColor: "#F97316",
  },

  /**
   * ScrollView content wrapper.
   * flexGrow: 1 makes content fill screen height,
   * which keeps vertical centering working nicely.
   */
  scrollContent: {
    flexGrow: 1,
  },

  /**
   * Main centered content area
   */
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  /**
   * App title
   */
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#8a1780",
    textAlign: "center",
    marginBottom: 10,
  },

  /**
   * Subtitle below title
   */
  subtitle: {
    fontSize: 16,
    color: "#8a1780",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 22,
  },

  /**
   * Form container card
   */
  form: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
  },

  /**
   * Input labels
   */
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  /**
   * Text input fields
   */
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },

  /**
   * Sign-in button
   */
  button: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
  },

  /**
   * Button text
   */
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /**
   * Small footer text
   */
  footerText: {
    textAlign: "center",
    color: "#FFEDD5",
    marginTop: 20,
    fontSize: 13,
  },
});