/**
 * services/goals.ts
 *
 * PURPOSE:
 * All Firestore read/write operations for the Goal feature.
 * UI components never touch Firestore directly — they call these functions.
 *
 * FIRESTORE PATH:
 * users/{userId}/goals/{goalId}
 *
 * Using a subcollection per user (rather than a top-level "goals" collection) means:
 * - Security rules can simply check `request.auth.uid == userId`
 * - Queries never cross user boundaries accidentally
 * - Scaling is per-user, not global
 *
 * BUSINESS RULES ENFORCED HERE:
 * 1. Free tier: max 5 goals per week per user
 * 2. No duplicate goal titles within the same week
 *
 * DATA SHAPE:
 * See types/goal.ts for full field definitions.
 *
 * DEBUG NOTES:
 * - "permission-denied" Firestore errors almost always mean the user's UID
 *   does not match the document path, or Firestore rules are misconfigured.
 * - "unavailable" errors mean the device lost network — Firestore will retry
 *   automatically when reconnected due to offline persistence.
 * - If goals are not showing up, confirm the weekOf string matches exactly
 *   (it's the Monday of the current week in "YYYY-MM-DD" format).
 * - If onSnapshot fires but goals state looks stale, check that you are not
 *   re-creating the subscription on every render (use the useEffect dependency array).
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { Goal, GoalInput, getTargetCount } from "../types/goal";

/**
 * Maximum number of goals a free-tier user can create per week.
 * Enforced in createGoal() before writing to Firestore.
 * Update this constant here to change the limit globally.
 */
const FREE_GOAL_LIMIT = 5;

/**
 * getWeekOf
 *
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the given date's week.
 * This string is used as the `weekOf` field on every goal document, so all goals
 * created in the same calendar week share the same weekOf value and can be queried together.
 *
 * EXAMPLE:
 * - If today is Wednesday June 18, 2026 → returns "2026-06-15" (the preceding Monday)
 * - If today is Monday June 15, 2026   → returns "2026-06-15"
 * - If today is Sunday June 14, 2026   → returns "2026-06-08" (Sunday is treated as end of prior week)
 *
 * WHY MONDAY:
 * ISO weeks start on Monday. Using Monday as the anchor means the week boundary
 * is consistent with most productivity conventions and analytics groupings.
 *
 * DEBUG:
 * If goals appear in the wrong week, log the output of this function and verify
 * the device's local time and timezone are correct.
 */
export function getWeekOf(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  // Shift date back to the previous Monday.
  // If today is Sunday (0), go back 6 days. Otherwise go back (day - 1) days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  // Return only the date portion (no time, no timezone suffix)
  return d.toISOString().split("T")[0];
}

/**
 * goalsRef
 *
 * Returns a Firestore CollectionReference pointing to the goals subcollection
 * for a specific user. Used internally by all CRUD functions below.
 *
 * Path: users/{userId}/goals
 */
function goalsRef(userId: string) {
  return collection(db, "users", userId, "goals");
}

/**
 * subscribeToWeekGoals
 *
 * Sets up a real-time Firestore listener for all goals belonging to a user
 * in a specific week. The onUpdate callback fires immediately with current data,
 * and again whenever any goal document in the result set changes (create, update, delete).
 *
 * WHY onSnapshot INSTEAD OF getDocs:
 * Using a live listener means the Goals tab updates instantly when the user
 * creates a goal on the Create screen and navigates back — no manual refresh needed.
 * It also keeps the completion checkboxes in sync if the app is open on two devices.
 *
 * IMPORTANT:
 * Always call the returned Unsubscribe function when the component unmounts,
 * otherwise the listener will leak and continue firing after the screen is gone.
 * In React, return it from useEffect: `useEffect(() => { return unsub; }, [])`.
 *
 * PARAMETERS:
 * - userId:   Firebase Auth UID of the current user
 * - weekOf:   The Monday date string of the week to load (e.g. "2026-06-15")
 * - onUpdate: Called with the full array of Goal objects whenever the data changes
 * - onError:  Optional — called if the listener fails (e.g. permissions error)
 *
 * DEBUG:
 * If onUpdate never fires, check that userId and weekOf are correct.
 * If onError fires with "permission-denied", check Firestore security rules.
 */
export function subscribeToWeekGoals(
  userId: string,
  weekOf: string,
  onUpdate: (goals: Goal[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(goalsRef(userId), where("weekOf", "==", weekOf));
  return onSnapshot(
    q,
    (snap) => {
      // Map each Firestore document to a Goal object, injecting the document ID as `id`.
      const goals = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
      onUpdate(goals);
    },
    onError
  );
}

/**
 * createGoal
 *
 * Writes a new goal document to Firestore after enforcing business rules.
 *
 * BUSINESS RULES CHECKED (in order):
 * 1. The user must not already have FREE_GOAL_LIMIT (5) goals in the same week.
 *    Throws: "You've reached the 5 goal limit for this week."
 * 2. The goal title must not duplicate an existing goal title in the same week
 *    (case-insensitive comparison, both titles trimmed).
 *    Throws: "You already have a goal with that title this week."
 *
 * WHY CHECK ON THE CLIENT:
 * Firestore does not support unique constraints natively.
 * The race condition (two creates at the exact same millisecond) is acceptable
 * for this use case. If strict enforcement is needed later, use a Cloud Function.
 *
 * FIELDS SET BY THIS FUNCTION (not passed in):
 * - userId: always the authenticated user's UID
 * - weekOf: the Monday of the current week
 * - completed: always false for a new goal
 * - createdAt / updatedAt: Firestore server timestamp
 *
 * DEBUG:
 * If the goal is created but does not appear in the list, verify that
 * subscribeToWeekGoals is using the same weekOf string.
 * If you get a "permission-denied" error, check Firestore rules allow
 * writes to users/{userId}/goals where userId == request.auth.uid.
 */
export async function createGoal(
  userId: string,
  input: GoalInput,
  weekOf: string
): Promise<void> {
  // Fetch all existing goals for this user in this week to enforce rules.
  // This is a one-time read (getDocs), not a listener.
  const existing = await getDocs(
    query(goalsRef(userId), where("weekOf", "==", weekOf))
  );

  // Rule 1: Free tier limit
  if (existing.size >= FREE_GOAL_LIMIT) {
    throw new Error("You've reached the 5 goal limit for this week.");
  }

  // Rule 2: No duplicate titles within the same week (case-insensitive)
  const duplicate = existing.docs.find(
    (d) =>
      d.data().title.trim().toLowerCase() === input.title.trim().toLowerCase()
  );
  if (duplicate) {
    throw new Error("You already have a goal with that title this week.");
  }

  // All rules passed — write the new goal document.
  await addDoc(goalsRef(userId), {
    ...input,
    title: input.title.trim(),
    userId,
    weekOf,
    completionsCount: 0, // Always starts at 0 — user logs completions via the "+" button
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * updateGoal
 *
 * Updates editable fields (title, frequency, priority) on an existing goal document.
 * Does NOT change completed, weekOf, userId, or createdAt.
 *
 * Always updates `updatedAt` to the server timestamp so you can audit when changes occurred.
 *
 * NOTE: Title uniqueness is NOT re-checked on update. If you need to enforce it,
 * add a similar getDocs check here before calling updateDoc.
 *
 * DEBUG:
 * If the edit screen saves successfully but the list shows old data, the Firestore
 * listener (subscribeToWeekGoals) should update automatically. If it does not,
 * check that the listener is still active (not unsubscribed prematurely).
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  updates: Partial<GoalInput>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "goals", goalId), {
    ...updates,
    // Trim the title if it's being updated, same as on create
    ...(updates.title ? { title: updates.title.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * logGoalCompletion
 *
 * Increments `completionsCount` by 1 on a goal document.
 * Called when the user taps the "+" button on GoalCard.
 *
 * CAPPED AT TARGET:
 * If the goal is already fully complete (completionsCount >= targetCount), this
 * is a no-op — the count will not exceed the target. The "+" button in GoalCard
 * is also disabled at that point, so this guard is a safety net.
 *
 * WHY NOT USE increment():
 * We pass currentCount from the client so we can enforce the cap without a
 * Firestore transaction. The risk of a race condition (two taps at the exact
 * same millisecond) is negligible for this use case.
 *
 * DEBUG:
 * If the count increments but the UI doesn't update, the onSnapshot listener
 * in the Goals tab should pick up the change automatically. If it doesn't,
 * check that the listener is still active (not unsubscribed).
 */
export async function logGoalCompletion(
  userId: string,
  goalId: string,
  currentCount: number,
  frequency: import("../types/goal").GoalFrequency
): Promise<void> {
  const target = getTargetCount(frequency);
  if (currentCount >= target) return; // Already fully complete — no-op
  await updateDoc(doc(db, "users", userId, "goals", goalId), {
    completionsCount: currentCount + 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * removeGoalCompletion
 *
 * Decrements completionsCount by 1. Called when the user taps "-" on GoalCard
 * to undo an accidental log. No-op if the count is already 0.
 */
export async function removeGoalCompletion(
  userId: string,
  goalId: string,
  currentCount: number
): Promise<void> {
  if (currentCount <= 0) return;
  await updateDoc(doc(db, "users", userId, "goals", goalId), {
    completionsCount: currentCount - 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * deleteGoal
 *
 * Permanently removes a goal document from Firestore.
 * This operation is irreversible — there is no soft-delete or recycle bin.
 * A confirmation Alert is shown in the UI ([id].tsx) before this is called.
 *
 * After deletion, the real-time listener in the Goals tab will automatically
 * remove the goal from the list without any additional code.
 *
 * DEBUG:
 * If the goal still appears after deletion, the listener may have been
 * unsubscribed. Check the useEffect cleanup in app/(tabs)/goals.tsx.
 */
export async function deleteGoal(
  userId: string,
  goalId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "goals", goalId));
}
