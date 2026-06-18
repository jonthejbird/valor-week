/**
 * app/(tabs)/home.tsx
 *
 * PURPOSE:
 * Main dashboard screen — the first tab the user sees after signing in.
 * Currently a placeholder. Will become the weekly overview hub.
 *
 * PLANNED FEATURES:
 * - Weekly summary card: total points earned, goals completed vs total
 * - Quick action buttons: "Add Goal", "View Progress"
 * - Recent goals list (last 3-5 goals from the current week)
 * - Motivational streak counter (consecutive weeks with goals completed)
 *
 * DATA THIS SCREEN WILL NEED:
 * - Current user's goals for the week → subscribeToWeekGoals() from services/goals.ts
 * - User profile (plan, streak data) → users/{userId} document from Firestore
 * - Point totals → computed from goals (sum of pointValue where completed === true)
 *
 * DEBUG NOTES:
 * - When implementing, import auth from services/firebase.ts for the userId
 * - Use getWeekOf() from services/goals.ts for the current weekOf string
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Welcome to ValorWeek.</Text>
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