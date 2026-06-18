/**
 * app/(tabs)/progress.tsx
 *
 * PURPOSE:
 * Analytics screen showing the user's weekly goal performance over the last 8 weeks.
 *
 * SECTIONS:
 * 1. This Week card    — goals completed, points earned, completion bar
 * 2. Streak badge      — consecutive past weeks with at least 1 goal completed
 * 3. Weekly history    — horizontal bar chart for the last 8 weeks
 *
 * DATA FLOW:
 * Firestore (users/{uid}/goals) → subscribeToWeeksData() → WeekSummary[] → rendered UI
 *
 * REFRESH STRATEGY:
 * Uses a real-time onSnapshot listener (subscribeToWeeksData) so the Progress tab
 * updates instantly when the user logs a completion on the Goals tab — no tab switch
 * or manual refresh needed. The listener is opened on mount and cleaned up on unmount.
 *
 * HISTORY_WEEKS:
 * Controls how many weeks of history are shown (default 8).
 * Increase this to show more history — the Firestore "in" query supports up to 30 values.
 *
 * STREAK:
 * Counts consecutive past weeks (NOT including the current week, which is in progress)
 * where at least 1 goal was completed. See calculateStreak() in services/progress.ts.
 *
 * BEST WEEK:
 * The week with the highest total points earned is marked with a ★ in the history list.
 *
 * AUTH ASSUMPTION:
 * auth.currentUser is non-null — screen is inside the authenticated tab group.
 *
 * DEBUG NOTES:
 * - If the history shows all 0/0, the weekOf strings computed here don't match
 *   the weekOf values stored in Firestore. Log `weeks` and compare to Firestore console.
 * - If the screen never leaves the loading state, getWeeksData() is likely throwing.
 *   Add a console.error in the catch block to surface the error.
 * - If the streak is always 0, check that historical weeks (before current week)
 *   have completed goals in Firestore.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { auth } from "../../services/firebase";
import { getWeekOf } from "../../services/goals";
import {
  getPastWeeks,
  subscribeToWeeksData,
  calculateStreak,
  findBestWeek,
  WeekSummary,
} from "../../services/progress";

/** Number of weeks to show in the history list (including current week). */
const HISTORY_WEEKS = 8;

/**
 * formatShortDate
 *
 * Converts a weekOf string ("2026-06-15") into a short label ("Jun 15").
 * The "T00:00:00" suffix forces local time interpretation so the date doesn't
 * shift by one day in negative UTC-offset timezones.
 */
function formatShortDate(weekOf: string): string {
  const d = new Date(weekOf + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * formatWeekRange
 * Converts a weekOf string into "Jun 15 – Jun 21" for the header subtitle.
 */
function formatWeekRange(weekOf: string): string {
  const monday = new Date(weekOf + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function ProgressScreen() {
  const userId = auth.currentUser!.uid;
  const currentWeekOf = getWeekOf();

  /**
   * SCREEN STATE
   * - summaries: one WeekSummary per week, most recent first
   * - loading:   true while the Firestore query is in flight
   */
  const [summaries, setSummaries] = useState<WeekSummary[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * REAL-TIME DATA SUBSCRIPTION
   *
   * Opens a live Firestore listener for the last HISTORY_WEEKS weeks.
   * Fires immediately with current data, then again whenever any goal
   * document changes — so logging a completion on the Goals tab is
   * reflected here instantly without needing to switch tabs.
   *
   * The returned Unsubscribe function is called on unmount to close the listener.
   */
  useEffect(() => {
    const weeks = getPastWeeks(HISTORY_WEEKS);
    setLoading(true);

    const unsub = subscribeToWeeksData(
      userId,
      weeks,
      (data: WeekSummary[]) => {
        setSummaries(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [userId]);

  /**
   * DERIVED VALUES
   * Computed from summaries once data is loaded.
   */
  const currentWeek = summaries.find((s) => s.weekOf === currentWeekOf) ?? {
    weekOf: currentWeekOf,
    total: 0,
    completed: 0,
    points: 0,
    totalPoints: 0,
  };

  const streak = calculateStreak(summaries, currentWeekOf);
  const bestWeek = findBestWeek(summaries);

  // Only show weeks in the history list that have at least 1 goal, OR the current week
  const historyWeeks = summaries.filter(
    (s) => s.total > 0 || s.weekOf === currentWeekOf
  );

  const currentCompletionPct =
    currentWeek.total > 0
      ? Math.round((currentWeek.completed / currentWeek.total) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>{formatWeekRange(currentWeekOf)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          color="#F97316"
          size="large"
        />
      ) : (
        <>
          {/**
           * THIS WEEK CARD
           * Shows current week's completion count, points earned, and a progress bar.
           * The completion percentage bar uses a string width ("60%") which React Native
           * supports natively inside a flex container.
           */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>This Week</Text>

            <View style={styles.cardRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statNumber}>{currentWeek.completed}</Text>
                <Text style={styles.statUnit}>/ {currentWeek.total} goals</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statNumber}>{currentWeek.points}</Text>
                <Text style={styles.statUnit}>/ {currentWeek.totalPoints} pts</Text>
              </View>
            </View>

            {/* Completion progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${currentCompletionPct}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>{currentCompletionPct}% complete</Text>
          </View>

          {/**
           * STREAK BADGE
           * Shows streak count based on consecutive completed past weeks.
           * "0 week streak" is shown as an encouragement message instead.
           */}
          <View style={styles.streakRow}>
            <Text style={styles.streakIcon}>{streak > 0 ? "🔥" : "⭐"}</Text>
            <View>
              {streak > 0 ? (
                <>
                  <Text style={styles.streakNumber}>{streak} week streak</Text>
                  <Text style={styles.streakSub}>Keep it going!</Text>
                </>
              ) : (
                <>
                  <Text style={styles.streakNumber}>No streak yet</Text>
                  <Text style={styles.streakSub}>
                    Complete a goal to start one
                  </Text>
                </>
              )}
            </View>
          </View>

          {/**
           * WEEKLY HISTORY
           * One row per week that has at least 1 goal (plus current week always).
           * Each row shows: week label | completion bar | count | best week star
           *
           * BAR WIDTH:
           * Based on completion rate (completed / total). Weeks with 0 goals show an empty bar.
           * The bar track has a fixed width via flex layout; the fill uses a percentage string.
           */}
          {historyWeeks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly History</Text>

              {historyWeeks.map((s) => {
                const isCurrent = s.weekOf === currentWeekOf;
                const isBest = s.weekOf === bestWeek;
                const rate =
                  s.total > 0 ? (s.completed / s.total) * 100 : 0;

                return (
                  <View key={s.weekOf} style={styles.weekRow}>
                    {/* Week label — bold + orange if current week */}
                    <Text
                      style={[
                        styles.weekLabel,
                        isCurrent && styles.weekLabelCurrent,
                      ]}
                    >
                      {formatShortDate(s.weekOf)}
                    </Text>

                    {/* Bar track + fill */}
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${rate}%` },
                          // Full completion weeks get a darker fill
                          s.completed === s.total &&
                            s.total > 0 &&
                            styles.barFillComplete,
                        ]}
                      />
                    </View>

                    {/* Goal count */}
                    <Text style={styles.weekCount}>
                      {s.completed}/{s.total}
                    </Text>

                    {/* Points earned / available */}
                    <Text style={styles.weekPts}>
                      {s.points}/{s.totalPoints}p
                    </Text>

                    {/* Best week star */}
                    <Text style={styles.bestStar}>{isBest ? "★" : " "}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty state — user has no goal history at all */}
          {historyWeeks.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first goal to start tracking progress.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  content: {
    paddingBottom: 48,
  },

  /** Header — same pattern as Goals tab */
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },

  loader: {
    marginTop: 60,
  },

  /**
   * THIS WEEK CARD
   * White card with shadow — same elevation pattern as GoalCard
   */
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  statBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  statUnit: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  /** Progress bar inside the This Week card */
  progressTrack: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
  },

  /**
   * STREAK ROW
   * Horizontal layout: flame emoji | streak count + sub-label
   */
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  streakIcon: {
    fontSize: 32,
  },
  streakNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  streakSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  /** WEEKLY HISTORY section */
  section: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  /**
   * Each week row: label | bar | count | star
   * alignItems: "center" keeps everything vertically aligned
   */
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },

  /** Week date label — 44pt wide so bars align across rows */
  weekLabel: {
    width: 44,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  /** Orange + bold for the current week label */
  weekLabelCurrent: {
    color: "#F97316",
    fontWeight: "700",
  },

  /**
   * Bar track — flex: 1 fills remaining width between the label and count
   * overflow: "hidden" clips the orange fill at rounded corners
   */
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  /** Orange fill — width is set dynamically as a percentage string */
  barFill: {
    height: "100%",
    backgroundColor: "#F97316",
    opacity: 0.6,
    borderRadius: 4,
  },
  /** Fully completed weeks get a solid (full opacity) fill */
  barFillComplete: {
    opacity: 1,
  },

  /** "X/Y" goal count to the right of the bar */
  weekCount: {
    width: 30,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },

  /** "Xp/Yp" points earned/available */
  weekPts: {
    width: 38,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
  },

  /**
   * Best week star — always takes up space (even as " ") so the column
   * width stays consistent and bars don't shift position
   */
  bestStar: {
    width: 14,
    fontSize: 12,
    color: "#F97316",
    textAlign: "center",
  },

  /** Empty state — no goal history at all */
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
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
  },
});
