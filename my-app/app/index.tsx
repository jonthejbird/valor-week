/**
 * app/index.tsx
 *
 * PURPOSE:
 * True app entry point. The first screen the user sees on every cold launch.
 *
 * FLOW:
 * 1. Render AnimatedSplash while simultaneously checking Firebase auth state
 * 2. AnimatedSplash calls onFinish() when its animation completes (~1.2 seconds)
 * 3. Firebase onAuthStateChanged fires once the persisted session is restored from AsyncStorage
 * 4. Once BOTH the splash is done AND auth is resolved, redirect:
 *    - Signed in  → /(tabs)/home  (skip sign-in, go straight to the app)
 *    - Signed out → /sign-in
 *
 * WHY TWO FLAGS (splashDone + authChecked):
 * The splash and the auth check run in parallel. Either can finish first.
 * We wait for both before redirecting so we never show a flash of the wrong screen.
 * In practice the auth check (AsyncStorage read) resolves before the ~1.2s splash ends,
 * so there is no visible delay.
 *
 * WHY onAuthStateChanged INSTEAD OF auth.currentUser:
 * auth.currentUser is null immediately on cold launch — Firebase needs a tick
 * to restore the session from AsyncStorage. onAuthStateChanged fires once the
 * restoration is complete, giving us the correct value.
 *
 * PERSISTENCE:
 * Session persistence is configured in services/firebase.ts via
 * getReactNativePersistence(AsyncStorage). As long as that is set up correctly,
 * the user will remain signed in across app restarts indefinitely (or until
 * they explicitly sign out).
 *
 * WHY THE SPLASH IS HERE (not in _layout.tsx):
 * Putting the splash in index.tsx means it only runs once at app start.
 * If the root layout rendered the splash, it could re-run on navigation events.
 *
 * DEBUG NOTES:
 * - If the app always redirects to /sign-in even when signed in, the auth
 *   session is not persisting. Check that AsyncStorage is installed and that
 *   initializeAuth in services/firebase.ts uses getReactNativePersistence.
 * - If the app is stuck on the orange loading screen after the splash, the
 *   onAuthStateChanged callback is never firing. Check the Firebase config in
 *   services/firebase.ts for typos in apiKey, projectId, etc.
 * - If the app skips sign-in but shows a permission error, the user's auth
 *   token may have expired. Firebase should refresh it automatically, but
 *   check your Firebase project's session length settings.
 */

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import AnimatedSplash from "../components/ui/AnimatedSplash";
import { auth } from "../services/firebase";

export default function Index() {
  /**
   * splashDone: true after AnimatedSplash finishes its animation (~1.2s).
   * Until then the splash is rendered and the redirect is blocked.
   */
  const [splashDone, setSplashDone] = useState(false);

  /**
   * authChecked: true after onAuthStateChanged fires for the first time.
   * Firebase resolves this quickly from AsyncStorage on cold launch.
   */
  const [authChecked, setAuthChecked] = useState(false);

  /**
   * isSignedIn: true if Firebase restored a valid session, false if not.
   * Determines which route to redirect to after both flags are true.
   */
  const [isSignedIn, setIsSignedIn] = useState(false);

  /**
   * AUTH STATE LISTENER
   *
   * Starts on mount and fires once immediately with the restored session (or null).
   * We unsubscribe right after the first callback to avoid unnecessary re-renders.
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsSignedIn(!!user);
      setAuthChecked(true);
      unsub(); // One-time check — unsubscribe after the first result
    });
    return unsub; // Cleanup if component unmounts before callback fires
  }, []);

  /**
   * PHASE 1: Show splash while the auth check and animation run in parallel.
   */
  if (!splashDone) {
    return <AnimatedSplash onFinish={() => setSplashDone(true)} />;
  }

  /**
   * PHASE 2: Splash is done but auth hasn't resolved yet.
   * Show an orange screen with a spinner to avoid a blank white flash.
   * This state should be extremely brief (or invisible) in practice.
   */
  if (!authChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F97316", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  /**
   * PHASE 3: Both splash and auth are done — redirect to the right screen.
   */
  return <Redirect href={isSignedIn ? "/(tabs)/home" : "/sign-in"} />;
}
