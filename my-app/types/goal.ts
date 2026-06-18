/**
 * types/goal.ts
 *
 * PURPOSE:
 * Central type definitions for goals throughout the app.
 * Import from here — never define goal shapes inline in components or services.
 *
 * DATA FLOW:
 * GoalInput → createGoal() / updateGoal() → Firestore → Goal (read back)
 *
 * FIRESTORE STRUCTURE:
 * Collection path: users/{userId}/goals/{goalId}
 * Each document contains all fields of the Goal interface minus the `id`
 * (the `id` is the Firestore document ID, added client-side after reads).
 *
 * COMPLETION MODEL:
 * Goals are NOT a simple done/not-done boolean. Each goal has a target number
 * of completions per week based on its frequency (e.g. "3x_week" → target = 3).
 * The user logs completions one at a time via the "+" button on GoalCard.
 * A goal is fully complete when completionsCount >= getTargetCount(frequency).
 *
 * DEBUG NOTES:
 * - If a goal shows the wrong completion count, check the `completionsCount` field
 *   directly in Firestore console — it should be a number (0 by default on create).
 * - If getTargetCount returns unexpected values, check FREQUENCY_TARGETS below.
 * - Timestamps (createdAt/updatedAt) come from Firestore serverTimestamp()
 *   and may be null immediately after a write before the server round-trip.
 */

import { Timestamp } from "firebase/firestore";

/**
 * GoalFrequency — how often the user intends to complete a goal within the week.
 *
 * "once"     → 1 completion needed
 * "daily"    → 7 completions needed (once per day)
 * "3x_week"  → 3 completions needed
 * "5x_week"  → 5 completions needed
 */
export type GoalFrequency = "once" | "daily" | "3x_week" | "5x_week";

/**
 * Human-readable labels for each GoalFrequency value.
 * Used in GoalCard badges and GoalForm chip buttons.
 */
export const FREQUENCY_LABELS: Record<GoalFrequency, string> = {
  once: "Once",
  daily: "Daily",
  "3x_week": "3x/week",
  "5x_week": "5x/week",
};

/**
 * Target completion count for each frequency.
 * This is the number of times the user must tap "+" to fully complete a goal.
 * Used in GoalCard progress bar, logGoalCompletion guard, and Progress tab aggregation.
 * Update these numbers here if the frequency definitions change.
 */
export const FREQUENCY_TARGETS: Record<GoalFrequency, number> = {
  once: 1,
  daily: 7,
  "3x_week": 3,
  "5x_week": 5,
};

/**
 * getTargetCount
 * Convenience function to look up the completion target for a given frequency.
 * Prefer this over indexing FREQUENCY_TARGETS directly for readability.
 */
export function getTargetCount(frequency: GoalFrequency): number {
  return FREQUENCY_TARGETS[frequency];
}

/**
 * GoalPriority — how important the goal is to the user.
 * Determines the per-completion point value automatically.
 *
 * Points per log:  low=1  medium=3  high=5
 * Total possible:  priority_pts × frequency_target
 * Examples:
 *   High + Daily   = 5 × 7 = 35 pts max
 *   Medium + 3x    = 3 × 3 =  9 pts max
 *   Low  + Once    = 1 × 1 =  1 pt  max
 */
export type GoalPriority = "low" | "medium" | "high";

export const PRIORITY_LABELS: Record<GoalPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_POINTS: Record<GoalPriority, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

export function getPriorityPoints(priority: GoalPriority): number {
  return PRIORITY_POINTS[priority];
}

/**
 * Goal — the full document shape as stored in Firestore and read back into the app.
 *
 * FIELDS:
 * - id:               Firestore document ID. Added client-side after reading.
 * - userId:           Firebase Auth UID of the owner.
 * - title:            The goal name. Always trimmed before saving.
 * - frequency:        How often the goal is intended to be done this week.
 * - priority:         How important the goal is (low/medium/high). Drives per-log pts.
 * - completionsCount: How many times the user has logged this goal this week.
 *                     Starts at 0. Capped at getTargetCount(frequency).
 *                     Replaces the old `completed: boolean` field.
 * - weekOf:           The Monday date string of the goal's week ("YYYY-MM-DD").
 * - createdAt:        Firestore server timestamp. Set once on create.
 * - updatedAt:        Firestore server timestamp. Updated on every write.
 */
export interface Goal {
  id: string;
  userId: string;
  title: string;
  frequency: GoalFrequency;
  priority: GoalPriority;
  completionsCount: number;
  weekOf: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * GoalInput — the fields the user fills in when creating or editing a goal.
 * Does NOT include id, userId, completionsCount, weekOf, or timestamps.
 */
export type GoalInput = {
  title: string;
  frequency: GoalFrequency;
  priority: GoalPriority;
};
