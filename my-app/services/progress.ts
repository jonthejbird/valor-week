/**
 * services/progress.ts
 *
 * PURPOSE:
 * Data fetching and aggregation logic for the Progress tab.
 * Queries historical goal data from Firestore and computes per-week summaries.
 *
 * FIRESTORE PATH:
 * users/{userId}/goals — same subcollection used by services/goals.ts
 * Queries filter by weekOf using a Firestore "in" clause across multiple weeks.
 *
 * COMPLETION MODEL:
 * Goals use `completionsCount: number` (not `completed: boolean`).
 * A goal counts as "completed" for summary purposes when:
 *   completionsCount >= getTargetCount(frequency)
 * Points are only awarded for fully completed goals.
 *
 * REAL-TIME vs ONE-TIME:
 * subscribeToWeeksData — live onSnapshot listener. Use in the Progress tab so
 *   logging a completion on the Goals tab is immediately reflected here.
 * getWeeksData — one-time read (kept for utility use if needed elsewhere).
 *
 * DEBUG NOTES:
 * - If all WeekSummaries show total: 0, the weekOf strings don't match Firestore.
 *   Log the weekOfs array and compare to the weekOf field in Firestore console.
 * - Firestore "in" queries support up to 30 values. HISTORY_WEEKS (8) is safe.
 * - If subscribeToWeeksData stops updating, check that the Unsubscribe function
 *   is being returned from the useEffect cleanup in progress.tsx.
 */

import {
  collection,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { getWeekOf } from "./goals";
import { GoalFrequency, GoalPriority, PRIORITY_POINTS, getTargetCount } from "../types/goal";

/**
 * WeekSummary — aggregated stats for one calendar week.
 *
 * - weekOf:    Monday date string ("YYYY-MM-DD")
 * - total:     Total goals created this week
 * - completed: Goals that reached their frequency target (completionsCount >= target)
 * - points:      Points earned so far (completionsCount × priority pts)
 * - totalPoints: Max possible points this week (target × priority pts)
 */
export type WeekSummary = {
  weekOf: string;
  total: number;
  completed: number;
  points: number;
  totalPoints: number;
};

/**
 * getPastWeeks
 *
 * Returns weekOf strings for the last `count` weeks, most recent first.
 * Each string is the Monday of that week in "YYYY-MM-DD" format.
 *
 * EXAMPLE (today = Jun 18, 2026, count = 3):
 * ["2026-06-15", "2026-06-08", "2026-06-01"]
 */
export function getPastWeeks(count: number): string[] {
  const weeks: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekOf(d));
  }
  return weeks;
}

/**
 * aggregateSnapshot
 *
 * Shared helper that turns a Firestore snapshot into an array of WeekSummary objects.
 * Called by both subscribeToWeeksData and getWeeksData so the logic stays in one place.
 *
 * COMPLETION LOGIC:
 * A goal is counted as "completed" when completionsCount >= getTargetCount(frequency).
 * This matches the schema change from `completed: boolean` to `completionsCount: number`.
 */
function aggregateSnapshot(
  docs: { data: () => Record<string, unknown> }[],
  weekOfs: string[]
): WeekSummary[] {
  const map: Record<string, WeekSummary> = {};
  for (const w of weekOfs) {
    map[w] = { weekOf: w, total: 0, completed: 0, points: 0, totalPoints: 0 };
  }

  docs.forEach((d) => {
    const data = d.data();
    const week = data.weekOf as string;
    if (!map[week]) return;

    map[week].total++;

    const completionsCount = (data.completionsCount as number) ?? 0;
    const target = getTargetCount(data.frequency as GoalFrequency);
    const pv = PRIORITY_POINTS[(data.priority as GoalPriority) ?? "medium"];
    const isComplete = completionsCount >= target;

    // Points per log = priority value. Partial credit on every completion.
    map[week].points += completionsCount * pv;
    map[week].totalPoints += target * pv;

    if (isComplete) {
      map[week].completed++;
    }
  });

  return weekOfs.map((w) => map[w]);
}

/**
 * subscribeToWeeksData
 *
 * Opens a real-time Firestore listener across multiple weeks of goals.
 * The onUpdate callback fires immediately with current data, then again
 * whenever any goal document in the result set changes.
 *
 * WHY onSnapshot (not getDocsFromServer):
 * With onSnapshot the Progress tab updates instantly as the user taps "+" on the
 * Goals tab — no tab switch required. The listener receives every document change
 * in real time and re-aggregates the summaries automatically.
 *
 * CLEANUP:
 * Return the Unsubscribe function from useEffect to close the listener on unmount:
 *   useEffect(() => subscribeToWeeksData(...), [userId]);
 *
 * DEBUG:
 * If onUpdate never fires, verify userId and weekOfs are correct.
 * If onError fires with "permission-denied", check Firestore security rules.
 */
export function subscribeToWeeksData(
  userId: string,
  weekOfs: string[],
  onUpdate: (summaries: WeekSummary[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (weekOfs.length === 0) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, "users", userId, "goals"),
    where("weekOf", "in", weekOfs)
  );

  return onSnapshot(
    q,
    (snap) => {
      const summaries = aggregateSnapshot(snap.docs as any, weekOfs);
      onUpdate(summaries);
    },
    onError
  );
}

/**
 * calculateStreak
 *
 * Counts consecutive past weeks (excluding the current week) where
 * the user fully completed at least one goal.
 *
 * RULES:
 * - completed > 0 → counts, continue
 * - total > 0 but completed === 0 → breaks streak, stop
 * - total === 0 (no goals that week) → skipped, don't break streak
 */
export function calculateStreak(
  summaries: WeekSummary[],
  currentWeekOf: string
): number {
  const historical = summaries.filter(
    (s) => s.weekOf !== currentWeekOf && s.total > 0
  );
  let streak = 0;
  for (const s of historical) {
    if (s.completed > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * findBestWeek
 *
 * Returns the weekOf string with the highest points, or null if none.
 * Used to mark the best week with a ★ in the history list.
 */
export function findBestWeek(summaries: WeekSummary[]): string | null {
  const withPoints = summaries.filter((s) => s.points > 0);
  if (withPoints.length === 0) return null;
  return withPoints.reduce((best, s) => (s.points > best.points ? s : best))
    .weekOf;
}
