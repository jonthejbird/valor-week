// app/sign-up.tsx

import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Animated,
} from "react-native";
import { signUpWithEmail } from "../services/auth";

export default function SignUpScreen() {
  /**
   * FORM STATE
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * UI STATE
   */
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /**
   * EMAIL VALIDATION
   */
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const emailIsValid = isValidEmail(email);

  /**
   * SHAKE ANIMATION
   */
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  /**
   * SIGN-UP HANDLER
   */
  const handleSignUp = async () => {
    Keyboard.dismiss();
    setError("");

    /**
     * LOCAL VALIDATION FIRST
     */
    if (!emailIsValid) {
      setError("Invalid email.");
      triggerShake();
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password.");
      triggerShake();
      return;
    }

    try {
      await signUpWithEmail(email.trim(), password);

      /**
       * SUCCESS → go back to sign-in
       */
      router.replace("/sign-in");

    } catch (err: any) {
      const code = err?.code;

      if (code === "auth/email-already-in-use") {
        setError("Account already exists with this email.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Check your connection.");
      } else {
        setError("Sign-up failed. Please try again.");
      }

      triggerShake();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      style={{ backgroundColor: "#8F00FF" }}   // 👈 ADD THIS
    >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>

          <Animated.View
            style={[
              styles.form,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {/* EMAIL INPUT + CHECKMARK */}
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Email"
                style={styles.inputFlex}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              {email.length > 0 && emailIsValid && (
                <Text style={styles.check}>✔</Text>
              )}
            </View>

            {/* PASSWORD */}
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Password"
                style={styles.passwordInput}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.showButton}
              >
                <Text style={styles.showButtonText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ERROR */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* BUTTON */}
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            {/* BACK */}
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>Back to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F97316" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24 },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  form: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
  },

  /**
   * Email + checkmark
   */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
  },

  inputFlex: {
    flex: 1,
    padding: 12,
  },

  check: {
    marginRight: 10,
    fontSize: 18,
    color: "green",
    fontWeight: "bold",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    padding: 12,
  },

  showButton: {
    paddingHorizontal: 12,
  },

  showButtonText: {
    fontWeight: "700",
    color: "#111827",
  },

  error: {
    color: "#fff",
    backgroundColor: "rgba(153,27,27,0.65)",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#111827",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
});