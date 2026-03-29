/**
 * app/(tabs)/goals.tsx
 *
 * PURPOSE:
 * Skeleton Goals tab.
 *
 * FUTURE IDEAS:
 * - Create goal
 * - Edit goal
 * - View active goals
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      <Text style={styles.subtitle}>Your goals will appear here.</Text>
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