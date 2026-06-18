/**
 * app/goals/create.tsx
 *
 * PURPOSE:
 * Screen for creating a new goal. Accessible via the FAB on the Goals tab.
 * Route: /goals/create
 *
 * FLOW:
 * 1. User fills in GoalForm (title, frequency, point value)
 * 2. GoalForm calls this screen's handleSubmit with the form values
 * 3. handleSubmit calls createGoal() in services/goals.ts
 * 4. createGoal() enforces business rules (5-goal limit, no duplicates) and writes to Firestore
 * 5. On success: router.back() returns the user to the Goals tab
 *    On failure: GoalForm catches the error and displays it inline (no navigation occurs)
 *
 * AUTH ASSUMPTION:
 * auth.currentUser is guaranteed non-null here.
 * This screen is only reachable from the Goals tab (inside the authenticated tab group).
 * If auth.currentUser is null, the `!` assertion will throw — check that the
 * root auth redirect in app/index.tsx is working correctly.
 *
 * WEEK HANDLING:
 * getWeekOf() is called once when the component renders. If the user keeps this screen
 * open across a week boundary (midnight Sunday/Monday), the goal will be created in the
 * previous week. This edge case is acceptable for now — address it in a future update
 * if users report it.
 *
 * NAVIGATION:
 * - "← Back" calls router.back() without saving
 * - Successful submission also calls router.back() after the Firestore write completes
 * - The Goals tab's real-time listener (subscribeToWeekGoals) will automatically display
 *   the new goal when the user returns — no manual refresh is needed
 *
 * DEBUG NOTES:
 * - If the goal is created but the Goals tab doesn't update, check that the listener
 *   in app/(tabs)/goals.tsx is still active (not unsubscribed prematurely).
 * - If createGoal throws "You've reached the 5 goal limit", the FAB should already be
 *   hidden on the Goals tab — check the FREE_LIMIT constant in app/(tabs)/goals.tsx.
 * - If createGoal throws "You already have a goal with that title", the error appears
 *   inline in the GoalForm below the chips.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../services/firebase";
import { createGoal, getWeekOf } from "../../services/goals";
import GoalForm from "../../components/goals/GoalForm";
import { GoalInput } from "../../types/goal";

export default function CreateGoalScreen() {
  /**
   * AUTH: safe to assert non-null — screen is inside the authenticated tab group
   */
  const userId = auth.currentUser!.uid;

  /**
   * WEEK: computed once on render. All goals created on this screen this week
   * will share this weekOf value and appear together in the Goals tab.
   */
  const weekOf = getWeekOf();

  /**
   * SUBMIT HANDLER
   *
   * Passed to GoalForm as the `onSubmit` prop.
   * GoalForm calls this with the user's input after local validation passes.
   *
   * If createGoal() throws (limit reached, duplicate title, network error),
   * GoalForm catches it and displays the error message inline — this function
   * does NOT need its own try/catch.
   *
   * If createGoal() resolves successfully, router.back() navigates back to the
   * Goals tab. The Firestore listener there will auto-update with the new goal.
   */
  const handleSubmit = async (values: GoalInput) => {
    await createGoal(userId, values, weekOf);
    router.back();
  };

  return (
    <View style={styles.container}>

      {/**
       * HEADER BAR
       * Three-column layout: [← Back] [Title] [spacer]
       * The spacer (same width as the back button) keeps the title visually centered.
       * Using a spacer View instead of absolute positioning is simpler and handles
       * varying button label widths without layout calculations.
       */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Goal</Text>
        {/* Spacer keeps title centered — must match the width of the back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/**
       * SCROLLABLE FORM AREA
       * keyboardShouldPersistTaps="handled" ensures that tapping the chip buttons
       * (or anywhere outside the keyboard) does not dismiss the keyboard unexpectedly
       * while the title TextInput is focused.
       */}
      <ScrollView keyboardShouldPersistTaps="handled">
        <GoalForm onSubmit={handleSubmit} submitLabel="Create Goal" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full-screen cream background matching the rest of the app */
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },

  /**
   * Header bar
   * White background + bottom border separates it from the scrollable form below.
   * paddingTop: 60 handles the iOS status bar (same pattern as the Goals tab header).
   */
  headerBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },

  /** Orange back link — matches the brand color used throughout the app */
  back: {
    fontSize: 15,
    color: "#F97316",
    fontWeight: "600",
    width: 64,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  /**
   * Invisible spacer — same width as the back button (64pt)
   * Keeps the title text visually centered in the header
   */
  headerSpacer: {
    width: 64,
  },
});
