/**
 * components/goals/GoalCard.tsx
 *
 * PURPOSE:
 * A single goal row in the Goals list. Shows the goal's title, frequency,
 * per-week completion progress bar, and a "+" button to log each completion.
 *
 * LAYOUT (top to bottom):
 * ┌──────────────────────────────────────────┐
 * │  Goal Title                         ›   │  ← tapping card → edit screen
 * │  [████████░░░░░░]  2 / 3               │  ← progress bar + count
 * │  3x/week  ·  5 pts           [+]       │  ← meta badges + log button
 * └──────────────────────────────────────────┘
 *
 * When fully complete (completionsCount >= target):
 * ┌──────────────────────────────────────────┐
 * │  ✓ Goal Title                       ›   │
 * │  [████████████████]  3 / 3             │
 * │  3x/week  ·  5 pts           [✓]       │  ← log button becomes checkmark
 * └──────────────────────────────────────────┘
 *
 * PROPS:
 * - goal:    The Goal object (completionsCount, frequency, title, pointValue, etc.)
 * - onLog:   Called when the user taps "+". Parent calls logGoalCompletion().
 * - onPress: Called when the user taps the card body. Parent navigates to /goals/[id].
 *
 * WHY onLog AND onPress ARE SEPARATE:
 * The "+" button must fire without also triggering card navigation.
 * Both are TouchableOpacity elements with independent event handlers.
 * The outer card is also a TouchableOpacity — React Native respects the inner
 * tap and does NOT bubble it to the outer card.
 *
 * PROGRESS BAR:
 * Width is a percentage string ("66%") computed from completionsCount / target.
 * React Native supports percentage strings for width inside a flex container.
 * The bar fills orange while in progress and turns solid when complete.
 *
 * DEBUG NOTES:
 * - If the "+" button does nothing, check that onLog in the parent is calling
 *   logGoalCompletion() correctly and that Firestore rules allow the write.
 * - If the bar width looks wrong, log `completionsCount` and `target` to verify
 *   getTargetCount(goal.frequency) returns the expected number.
 * - Shadow (iOS) and elevation (Android) are both set on the card container.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  Goal,
  GoalPriority,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_POINTS,
  getTargetCount,
} from "../../types/goal";

interface Props {
  goal: Goal;
  /** Called when the user taps "+" to log one completion. */
  onLog: () => void;
  /** Called when the user taps "−" to undo an accidental log. */
  onRemove: () => void;
  /** Called when the user taps the card to open the Edit Goal screen. */
  onPress: () => void;
}

const PRIORITY_BADGE_BG: Record<GoalPriority, string> = {
  low: "#F3F4F6",
  medium: "#EFF6FF",
  high: "#FFF7ED",
};
const PRIORITY_BADGE_TEXT: Record<GoalPriority, string> = {
  low: "#6B7280",
  medium: "#2563EB",
  high: "#F97316",
};

export default function GoalCard({ goal, onLog, onRemove, onPress }: Props) {
  const target = getTargetCount(goal.frequency);
  const count = goal.completionsCount ?? 0;
  const isComplete = count >= target;
  const progressPct = Math.min((count / target) * 100, 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>

      {/* ── ROW 1: Title + chevron ── */}
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, isComplete && styles.titleDone]}
          numberOfLines={1}
        >
          {/* Checkmark prefix when fully complete */}
          {isComplete ? "✓ " : ""}{goal.title}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>

      {/* ── ROW 2: Progress bar + count ── */}
      <View style={styles.progressRow}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${progressPct}%` },
              isComplete && styles.barFillComplete,
            ]}
          />
        </View>
        <Text style={[styles.countLabel, isComplete && styles.countLabelDone]}>
          {count} / {target}
        </Text>
      </View>

      {/* ── ROW 3: Meta badges + Log button ── */}
      <View style={styles.metaRow}>
        <View style={styles.badges}>
          {/* Frequency badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{FREQUENCY_LABELS[goal.frequency]}</Text>
          </View>
          {/* Priority badge — color-coded by level */}
          <View style={[styles.badge, { backgroundColor: PRIORITY_BADGE_BG[goal.priority] }]}>
            <Text style={[styles.badgeText, { color: PRIORITY_BADGE_TEXT[goal.priority] }]}>
              {PRIORITY_LABELS[goal.priority]}
            </Text>
          </View>
          {/* Points earned vs max */}
          <Text style={styles.points}>
            {count * PRIORITY_POINTS[goal.priority]} / {target * PRIORITY_POINTS[goal.priority]} pts
          </Text>
        </View>

        <View style={styles.logBtnGroup}>
          {/* − button: undo an accidental log, disabled at 0 */}
          <TouchableOpacity
            style={[styles.logBtn, styles.logBtnMinus, count === 0 && styles.logBtnDisabled]}
            onPress={onRemove}
            disabled={count === 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.logBtnText, styles.logBtnMinusText, count === 0 && styles.logBtnTextDisabled]}>
              −
            </Text>
          </TouchableOpacity>

          {/* + button: log a completion, disabled when fully done */}
          <TouchableOpacity
            style={[styles.logBtn, isComplete && styles.logBtnDone]}
            onPress={onLog}
            disabled={isComplete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.logBtnText, isComplete && styles.logBtnTextDone]}>
              {isComplete ? "✓" : "+"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /**
   * Card container
   * White background + shadow lifts it above the cream screen background.
   * padding: 14 on all sides, with 12 gap between internal rows.
   */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  /** Title + chevron on one line */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },

  /** Strikethrough + gray when fully complete */
  titleDone: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },

  chevron: {
    fontSize: 20,
    color: "#D1D5DB",
  },

  /** Progress bar track + count label side by side */
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  /**
   * Bar track — flex: 1 fills remaining width
   * overflow: "hidden" clips the fill at rounded corners
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
    opacity: 0.7,
    borderRadius: 4,
  },

  /** Fully complete — solid orange, full opacity */
  barFillComplete: {
    opacity: 1,
  },

  /** "2 / 3" count to the right of the bar */
  countLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    minWidth: 36,
    textAlign: "right",
  },

  countLabelDone: {
    color: "#F97316",
  },

  /** Bottom row: badges on left, log button on right */
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /** Frequency pill badge */
  badge: {
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 12,
    color: "#F97316",
    fontWeight: "600",
  },

  points: {
    fontSize: 12,
    color: "#6B7280",
  },

  /** Row holding − and + buttons side by side */
  logBtnGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  /** Base style shared by both buttons */
  logBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
  },

  /** − button — outlined gray circle */
  logBtnMinus: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },

  /** − button disabled at count === 0 */
  logBtnDisabled: {
    borderColor: "#E5E7EB",
  },

  /** + button completed state — green circle */
  logBtnDone: {
    backgroundColor: "#D1FAE5",
  },

  logBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },

  /** − button text color */
  logBtnMinusText: {
    color: "#6B7280",
  },

  /** − button text when disabled */
  logBtnTextDisabled: {
    color: "#D1D5DB",
  },

  logBtnTextDone: {
    color: "#059669",
    fontSize: 14,
  },
});
