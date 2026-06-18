/**
 * app/goals/[id].tsx
 *
 * PURPOSE:
 * Screen for editing or deleting an existing goal.
 * Route: /goals/[id]  (e.g. /goals/abc123)
 *
 * HOW THE ID IS PASSED:
 * Expo Router reads the [id] segment from the URL and makes it available via
 * useLocalSearchParams(). When GoalCard calls `router.push(\`/goals/${goal.id}\`)`,
 * Expo Router matches this file and `id` becomes the Firestore document ID.
 *
 * DATA LOADING:
 * The goal is fetched once on mount using getDoc() (a one-time read, not a listener).
 * We don't need real-time updates here because:
 * - Only one user can edit their own goals
 * - The Goals tab already has a live listener that reflects any changes on return
 *
 * FLOW — EDIT:
 * 1. Screen mounts, fetches goal by ID from Firestore
 * 2. GoalForm is pre-populated with the existing title/frequency/pointValue
 * 3. User edits and taps "Save Changes"
 * 4. GoalForm calls handleUpdate → updateGoal() writes to Firestore → router.back()
 * 5. Goals tab listener auto-reflects the change
 *
 * FLOW — DELETE:
 * 1. User taps "Delete" in the header
 * 2. Alert.alert() shows a native confirmation dialog
 * 3. User confirms → deleteGoal() removes the Firestore document → router.back()
 * 4. Goals tab listener auto-removes the goal from the list
 *
 * AUTH ASSUMPTION:
 * auth.currentUser is non-null — same guarantee as create.tsx.
 *
 * ERROR STATES:
 * - loading: true until getDoc() resolves
 * - notFound: true if the document doesn't exist (deleted elsewhere, bad ID)
 *   Shows a "Goal not found." message and disables the Delete button
 *
 * DEBUG NOTES:
 * - If the form shows but fields are blank, verify that initialValues is only
 *   passed to GoalForm after `goal` state is non-null (the conditional render handles this).
 * - If the goal shows "not found" immediately, the Firestore document may have
 *   been deleted, or the goalId in the URL doesn't match the subcollection path.
 *   Log `id` and `userId` and verify them against your Firestore console.
 * - If editing saves successfully but the Goals tab shows stale data, the listener
 *   in app/(tabs)/goals.tsx may have been unsubscribed. Check the useEffect cleanup.
 * - If delete fails silently, wrap deleteGoal() in a try/catch and show an Alert.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { updateGoal, deleteGoal } from "../../services/goals";
import GoalForm from "../../components/goals/GoalForm";
import { Goal, GoalInput } from "../../types/goal";

export default function EditGoalScreen() {
  /**
   * ROUTE PARAMS
   * `id` is the Firestore document ID of the goal to edit.
   * Typed as string — Expo Router always provides URL params as strings.
   * The `!` assertion in getDoc() is safe because we only call it when id is truthy.
   */
  const { id } = useLocalSearchParams<{ id: string }>();

  /**
   * AUTH: safe to assert non-null — screen is inside the authenticated tab group
   */
  const userId = auth.currentUser!.uid;

  /**
   * GOAL STATE
   * null until the Firestore document is fetched.
   * The GoalForm is not rendered while goal is null (see conditional render below).
   */
  const [goal, setGoal] = useState<Goal | null>(null);

  /**
   * LOADING STATE
   * True from mount until getDoc() resolves (success or not-found).
   * Shows a spinner in place of the form while loading.
   */
  const [loading, setLoading] = useState(true);

  /**
   * NOT FOUND STATE
   * True if the Firestore document doesn't exist.
   * This can happen if the goal was deleted on another device, or if the
   * URL contains an invalid/stale goal ID.
   */
  const [notFound, setNotFound] = useState(false);

  /**
   * FETCH GOAL ON MOUNT
   *
   * getDoc() is a one-time read — not a real-time listener.
   * Path: users/{userId}/goals/{id}
   *
   * If the document exists, we spread its data and inject `id` (the Firestore doc ID)
   * to produce a full Goal object. This matches the shape returned by subscribeToWeekGoals.
   *
   * Dependencies: [id, userId] — both are stable strings that won't change
   * while the screen is mounted.
   */
  useEffect(() => {
    if (!id) return; // Guard against undefined id (should not happen with Expo Router)
    getDoc(doc(db, "users", userId, "goals", id)).then((snap) => {
      if (snap.exists()) {
        // Combine document data with the document ID to form a full Goal object
        setGoal({ id: snap.id, ...snap.data() } as Goal);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id, userId]);

  /**
   * UPDATE HANDLER
   *
   * Passed to GoalForm as the `onSubmit` prop.
   * Called with the user's edited values after GoalForm's local validation passes.
   *
   * updateGoal() writes only the changed fields (title, frequency, pointValue)
   * plus updatedAt — it does not overwrite completed, weekOf, or createdAt.
   *
   * If updateGoal() throws (network error, permission denied), GoalForm catches
   * it and displays the error inline. No navigation occurs on failure.
   */
  const handleUpdate = async (values: GoalInput) => {
    await updateGoal(userId, id!, values);
    router.back();
  };

  /**
   * DELETE HANDLER
   *
   * Shows a native Alert dialog for confirmation before deleting.
   * Using Alert.alert() is the standard React Native pattern for destructive confirmations —
   * it adapts to iOS and Android native dialog styles automatically.
   *
   * The goal title is included in the confirmation message so the user is certain
   * which goal they are about to delete.
   *
   * After deletion, router.back() returns to the Goals tab.
   * The Firestore listener there will remove the deleted goal from the list automatically.
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      `Delete "${goal?.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteGoal(userId, id!);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/**
       * HEADER BAR
       * Three-column layout: [← Back] [Title] [Delete]
       *
       * The Delete button is:
       * - Red to signal a destructive action
       * - Disabled (faded) while loading or if the goal is not found
       * - hitSlop enlarges the tap target without changing visual size
       */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Goal</Text>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={loading || notFound}
        >
          <Text
            style={[
              styles.deleteBtn,
              (loading || notFound) && styles.deleteBtnDisabled,
            ]}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>

      {/**
       * BODY — three mutually exclusive states:
       * 1. loading:  spinner while fetching the goal from Firestore
       * 2. notFound: error message if the document doesn't exist
       * 3. form:     GoalForm pre-populated with the existing goal values
       */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#F97316" size="large" />
      ) : notFound ? (
        <View style={styles.center}>
          <Text style={styles.notFound}>Goal not found.</Text>
        </View>
      ) : (
        /**
         * EDIT FORM
         * initialValues pre-populates the form with the current goal's data.
         * goal! is safe here — we only reach this branch when loading is false
         * and notFound is false, which means goal is non-null.
         *
         * keyboardShouldPersistTaps="handled" prevents chip taps from dismissing
         * the keyboard if the title input is focused.
         */
        <ScrollView keyboardShouldPersistTaps="handled">
          <GoalForm
            initialValues={{
              title: goal!.title,
              frequency: goal!.frequency,
              priority: goal!.priority,
            }}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },

  /**
   * Header bar — same pattern as create.tsx
   * White background + bottom border separates it from the form content
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

  /** Orange back link */
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
   * Red delete button in the top-right corner
   * Width: 64 balances the header layout (same as the back button width)
   * textAlign: "right" keeps it flush to the edge
   */
  deleteBtn: {
    fontSize: 15,
    color: "#DC2626",
    fontWeight: "600",
    width: 64,
    textAlign: "right",
  },

  /**
   * Faded state for the delete button while loading or goal not found
   * opacity: 0.3 visually communicates the button is non-interactive
   */
  deleteBtnDisabled: {
    opacity: 0.3,
  },

  loader: {
    marginTop: 60,
  },

  /** Centered container for the "Goal not found" message */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  notFound: {
    fontSize: 16,
    color: "#6B7280",
  },
});
