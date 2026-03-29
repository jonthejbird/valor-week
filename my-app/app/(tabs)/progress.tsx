/**
 * app/(tabs)/progress.tsx
 *
 * PURPOSE:
 * Skeleton Progress tab.
 *
 * FUTURE IDEAS:
 * - Weekly charts
 * - Completion trends
 * - Streak tracking
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Your progress data will appear here.</Text>
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