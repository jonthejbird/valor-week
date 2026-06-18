/**
 * app/(tabs)/goals.tsx
 *
 * PURPOSE:
 * The Goals tab — the main screen for viewing and interacting with the current week's goals.
 *
 * WHAT THIS SCREEN DOES:
 * 1. Computes the current week's Monday date string (weekOf) on mount
 * 2. Opens a real-time Firestore listener for the current user's goals in that week
 * 3. Renders the goal list, a completion progress bar, and a FAB to create new goals
 * 4. Handles inline goal completion toggling (tapping the checkbox in GoalCard)
 *
 * DATA FLOW:
 * Firestore (users/{uid}/goals) → subscribeToWeekGoals → goals state → FlatList
 *
 * AUTH ASSUMPTION:
 * auth.currentUser is guaranteed non-null on this screen because:
 * - The root layout redirects unauthenticated users to /sign-in
 * - The (tabs) group is only reachable after successful sign-in
 * If auth.currentUser is somehow null here, the app will crash with a clear error.
 * Check the redirect logic in app/index.tsx and sign-in.tsx if this happens.
 *
 * FREE TIER LIMIT:
 * The FAB disappears when the user reaches FREE_LIMIT (5) goals for the week.
 * The limit is also enforced server-side in services/goals.ts createGoal().
 * If you raise the limit, update FREE_LIMIT here AND FREE_GOAL_LIMIT in services/goals.ts.
 *
 * REAL-TIME UPDATES:
 * Using onSnapshot means this screen auto-refreshes when:
 * - The user creates a goal on the Create screen and comes back
 * - The user deletes a goal on the Edit screen and comes back
 * - A goal is toggled completed (though that is also handled locally here)
 * The subscription is cleaned up in the useEffect return to prevent memory leaks.
 *
 * DEBUG NOTES:
 * - If goals do not appear, log `weekOf` and compare it against the `weekOf` field
 *   in your Firestore documents. A mismatch means the week calculation is off.
 * - If the list flickers, check that the useEffect dependency array is stable
 *   (userId and weekOf should not change on every render).
 * - If the FAB appears even at 5 goals, check the FREE_LIMIT constant below.
 * - If you see a "permission-denied" error in onError, check Firestore security rules:
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /users/{userId}/goals/{goalId} {
 *         allow read, write: if request.auth.uid == userId;
 *       }
 *     }
 *   }
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../services/firebase";
import {
  subscribeToWeekGoals,
  logGoalCompletion,
  removeGoalCompletion,
  getWeekOf,
} from "../../services/goals";
import GoalCard from "../../components/goals/GoalCard";
import { Goal, getTargetCount } from "../../types/goal";

/**
 * Free tier maximum goals per week.
 * When goals.length reaches this number, the FAB is hidden and the user
 * cannot navigate to the Create screen until next week.
 * Must stay in sync with FREE_GOAL_LIMIT in services/goals.ts.
 */
const FREE_LIMIT = 5;

/**
 * formatWeekRange
 *
 * Converts a weekOf date string ("2026-06-15") into a human-readable range
 * displayed below the "Goals" heading (e.g. "Jun 15 – Jun 21").
 *
 * NOTE: The weekOf string represents Monday. Sunday is computed by adding 6 days.
 * The "T00:00:00" suffix forces the Date constructor to treat the string as local time,
 * not UTC — without it, the date would be off by one day in negative UTC-offset timezones.
 */
function formatWeekRange(weekOf: string): string {
  const monday = new Date(weekOf + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function GoalsScreen() {
  /**
   * GOALS STATE
   * Populated and kept in sync by the Firestore real-time listener below.
   * Starts as an empty array — the loading spinner is shown until the first update.
   */
  const [goals, setGoals] = useState<Goal[]>([]);

  /**
   * LOADING STATE
   * True until the first onSnapshot callback fires.
   * Prevents showing an empty state flash before data arrives.
   */
  const [loading, setLoading] = useState(true);

  /**
   * STABLE IDENTIFIERS
   * Computed once outside the effect so they don't change on every render.
   * userId: the authenticated user's Firestore UID
   * weekOf: the Monday of the current week (e.g. "2026-06-15")
   */
  const weekOf = getWeekOf();
  const userId = auth.currentUser!.uid;

  /**
   * REAL-TIME FIRESTORE SUBSCRIPTION
   *
   * Opens an onSnapshot listener when the screen mounts.
   * The listener fires immediately with the current data, then again on any change.
   *
   * Cleanup: returning `unsub` from useEffect tells React to call it on unmount,
   * which closes the Firestore listener and prevents memory leaks / stale updates.
   *
   * Dependencies: userId and weekOf are stable strings and will not trigger
   * unnecessary re-subscriptions.
   */
  useEffect(() => {
    const unsub = subscribeToWeekGoals(
      userId,
      weekOf,
      (g) => {
        setGoals(g);
        setLoading(false);
      },
      // onError: stop loading spinner even if the query fails
      () => setLoading(false)
    );
    return unsub; // Firestore cleanup on unmount
  }, [userId, weekOf]);

  /**
   * LOG HANDLER
   *
   * Called by GoalCard when the user taps the "+" button.
   * Increments completionsCount by 1 in Firestore (capped at the frequency target).
   * The real-time listener reflects the change automatically — no local state needed.
   */
  const handleLog = (goal: Goal) => {
    logGoalCompletion(userId, goal.id, goal.completionsCount ?? 0, goal.frequency);
  };

  const handleRemove = (goal: Goal) => {
    removeGoalCompletion(userId, goal.id, goal.completionsCount ?? 0);
  };

  /**
   * DERIVED VALUES
   * canAdd:         whether the user can still create goals this week
   * completedCount: goals that have reached their frequency target (for the header stats)
   */
  const canAdd = goals.length < FREE_LIMIT;
  const completedCount = goals.filter(
    (g) => (g.completionsCount ?? 0) >= getTargetCount(g.frequency)
  ).length;

  return (
    <View style={styles.container}>

      {/**
       * HEADER
       * Title + current week date range (e.g. "Jun 15 – Jun 21")
       * paddingTop: 60 accounts for the status bar on iOS without a SafeAreaView
       */}
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Text style={styles.week}>{formatWeekRange(weekOf)}</Text>
      </View>

      {/**
       * STATS ROW
       * Shows "X/Y completed · Z/5 slots used" and a thin orange progress bar.
       *
       * PROGRESS BAR:
       * - Tracks completion rate (completedCount / goals.length)
       * - Falls back to "0%" when there are no goals to avoid a divide-by-zero
       * - The percentage string is supported by React Native's flexbox layout engine
       */}
      <View style={styles.statsRow}>
        <Text style={styles.countText}>
          {completedCount}/{goals.length} completed · {goals.length}/{FREE_LIMIT} slots used
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  goals.length > 0
                    ? `${(completedCount / goals.length) * 100}%`
                    : "0%",
              },
            ]}
          />
        </View>
      </View>

      {/**
       * MAIN CONTENT — three mutually exclusive states:
       * 1. loading: spinner while Firestore data is being fetched
       * 2. empty:   no goals yet — prompt the user to create one
       * 3. list:    FlatList of GoalCards
       */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#F97316" size="large" />
      ) : goals.length === 0 ? (
        /**
         * EMPTY STATE
         * Shown when the user has no goals for the current week.
         * paddingBottom: 80 nudges the content above the FAB.
         */
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap + to add your first goal for the week.
          </Text>
        </View>
      ) : (
        /**
         * GOAL LIST
         * keyExtractor uses the Firestore document ID for stable React keys.
         * contentContainerStyle paddingBottom: 100 prevents the last card
         * from being hidden behind the FAB.
         * showsVerticalScrollIndicator: false for a cleaner look.
         */
        <FlatList
          data={goals}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onLog={() => handleLog(item)}
              onRemove={() => handleRemove(item)}
              onPress={() => router.push(`/goals/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/**
       * FLOATING ACTION BUTTON (FAB)
       *
       * Only rendered when the user has fewer than FREE_LIMIT goals.
       * At the limit, the FAB disappears — the user must wait until next week
       * or upgrade (premium feature, not yet implemented).
       *
       * Navigates to /goals/create using Expo Router's push.
       * The orange shadow is set separately from the button background so it
       * only appears on iOS (shadowColor). Android uses elevation.
       */}
      {canAdd && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/goals/create")}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full-screen cream background matching the other tab screens */
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },

  /**
   * Header section
   * paddingTop: 60 is a safe offset for the status bar on most iOS devices
   * without importing SafeAreaView. Adjust if the header looks clipped on notched devices.
   */
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  /** Current week range displayed below the title */
  week: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },

  statsRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  countText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },

  /**
   * Progress bar track — the gray container
   * overflow: "hidden" clips the orange fill at the track's rounded corners
   */
  progressTrack: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },

  /** Orange fill inside the progress track — width is set dynamically as a percentage */
  progressFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 2,
  },

  /** FlatList padding — paddingBottom: 100 leaves room for the FAB */
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  loader: {
    marginTop: 60,
  },

  /**
   * Empty state container
   * flex: 1 + centering puts the empty message in the middle of the screen
   * paddingBottom: 80 shifts it slightly above center to account for the FAB
   */
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },

  /**
   * FAB (Floating Action Button)
   * - Fixed position in the bottom-right corner using position: "absolute"
   * - Orange shadow on iOS (shadowColor: "#F97316") gives a glowing effect
   * - elevation: 6 is the Android shadow equivalent
   * - The "+" text is intentionally large and light-weight for easy reading
   */
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    backgroundColor: "#F97316",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  fabText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
  },
});
