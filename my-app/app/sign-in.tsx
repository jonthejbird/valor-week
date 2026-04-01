// app/sign-in.tsx

import React, { useRef, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";

import { signInWithEmail } from "../services/auth";

export default function SignInScreen() {
  /**
   * FORM STATE
   */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * UI STATE
   */
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 45,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 45,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * SIGN-IN HANDLER
   */
  const handleSignIn = async () => {
    if (loading) return;

    Keyboard.dismiss();
    setError("");

    /**
     * Local validation first
     */
    if (!email.trim()) {
      setError("Please enter your email.");
      triggerShake();
      return;
    }

    if (!emailIsValid) {
      setError("Invalid email.");
      triggerShake();
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      triggerShake();
      return;
    }

    try {
      setLoading(true);

      await signInWithEmail(email.trim(), password);

      /**
       * SUCCESS → route to home.tsx
       */
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const code = err?.code;

      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Check your connection.");
      } else {
        setError("Sign-in failed. Please try again.");
      }

      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Animated.View
          style={[
            styles.form,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {/* EMAIL INPUT + GREEN CHECKMARK */}
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
              textContentType="emailAddress"
              returnKeyType="next"
            />

            {email.length > 0 && emailIsValid && (
              <Text style={styles.check}>✔</Text>
            )}
          </View>

          {/* PASSWORD INPUT + SHOW/HIDE */}
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
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />

            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.showButton}
              activeOpacity={0.7}
            >
              <Text style={styles.showButtonText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* INLINE ERROR */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* SIGN IN BUTTON */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* CREATE ACCOUNT LINK */}
          <TouchableOpacity onPress={() => router.push("/sign-up")}>
            <Text style={styles.link}>Don&apos;t have an account? Create one</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F97316",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
  },
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
  buttonDisabled: {
    opacity: 0.7,
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