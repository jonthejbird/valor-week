/**
 * components/goals/GoalForm.tsx
 *
 * PURPOSE:
 * Reusable form for creating and editing goals.
 * Used in two screens:
 *   - app/goals/create.tsx  → initialValues is undefined (blank form)
 *   - app/goals/[id].tsx    → initialValues is populated from the existing goal
 *
 * FORM FIELDS:
 * 1. Title        — free-text input, max 60 characters, required
 * 2. Frequency    — chip button group (Once / Daily / 3x/week / 5x/week)
 * 3. Point Value  — chip button group (1 / 2 / 3 / 5 / 10)
 *
 * STATE:
 * GoalForm manages its own local state (title, frequency, pointValue).
 * On submit, it calls the onSubmit prop with a GoalInput object.
 * The parent screen is responsible for the actual Firestore write and navigation.
 *
 * ERROR HANDLING:
 * Errors thrown by the onSubmit callback (e.g. from createGoal or updateGoal)
 * are caught here and displayed inline below the form. This covers both
 * validation errors (duplicate title, goal limit) and network errors.
 *
 * DEFAULTS:
 * - frequency defaults to "once" — the simplest option
 * - pointValue defaults to 1 — the lowest value
 * These defaults are intentionally conservative so the user actively chooses
 * their values rather than accidentally inflating their points.
 *
 * DEBUG NOTES:
 * - If the form submits but nothing happens, the onSubmit prop probably threw
 *   silently. Check the error state — if it shows, the error message is the clue.
 * - If initialValues are not populating the form on the edit screen, verify
 *   that the parent passes them only after the goal has loaded (not while loading === true).
 * - The loading guard (`if (loading) return`) prevents double-submission if the
 *   user taps the button twice quickly.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  GoalFrequency,
  GoalPriority,
  GoalInput,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_POINTS,
} from "../../types/goal";

interface Props {
  /**
   * If provided, pre-populates the form with existing values.
   * Used by the Edit screen. When undefined, the form starts blank (Create screen).
   */
  initialValues?: GoalInput;
  /**
   * Called with the user's input when they tap the submit button.
   * Should be an async function — GoalForm awaits it and catches errors.
   * Throw an Error with a human-readable message to display it in the form.
   */
  onSubmit: (values: GoalInput) => Promise<void>;
  /**
   * Label for the submit button. Defaults to "Save".
   * Pass "Create Goal" or "Save Changes" from the parent for clarity.
   */
  submitLabel?: string;
}

export default function GoalForm({
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  /**
   * FORM STATE
   * Initialized from initialValues if provided (edit mode), otherwise blank/default.
   */
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [frequency, setFrequency] = useState<GoalFrequency>(
    initialValues?.frequency ?? "once"
  );
  const [priority, setPriority] = useState<GoalPriority>(
    initialValues?.priority ?? "medium"
  );

  /**
   * UI STATE
   * - loading: true while the onSubmit async call is in flight. Disables the button.
   * - error: displayed below the form when onSubmit throws, or when validation fails.
   */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * SUBMIT HANDLER
   *
   * Validates the title locally before calling onSubmit.
   * Wraps the onSubmit call in try/catch so any thrown errors
   * (business rule violations, network errors) surface in the UI.
   */
  const handleSubmit = async () => {
    // Prevent double-submission if user taps button twice
    if (loading) return;

    setError("");

    // Local validation — title is the only required field
    if (!title.trim()) {
      setError("Goal title is required.");
      return;
    }

    try {
      setLoading(true);
      // Delegate the actual Firestore write to the parent screen
      await onSubmit({ title, frequency, priority });
      // If onSubmit resolves without throwing, the parent navigates away.
      // No need to reset state here.
    } catch (err: any) {
      // Display whatever the service layer or parent threw
      setError(err.message ?? "Something went wrong.");
    } finally {
      // Always re-enable the button, even on error
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>

      {/**
       * TITLE INPUT
       * - placeholderTextColor explicitly set because the default is sometimes
       *   invisible on certain Android versions
       * - maxLength prevents excessively long titles in Firestore
       * - Clearing error on change so the user doesn't see a stale error while typing
       */}
      <Text style={styles.label}>Goal Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Exercise for 30 minutes"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          setError(""); // Clear error as user types
        }}
        returnKeyType="done"
        maxLength={60}
      />

      {/**
       * FREQUENCY CHIP GROUP
       *
       * Renders one chip per GoalFrequency value from FREQUENCY_LABELS.
       * The selected chip gets the orange active style.
       * Tapping a chip updates local state only — nothing is written to Firestore
       * until the user taps the submit button.
       *
       * WHY CHIPS INSTEAD OF A PICKER/DROPDOWN:
       * All four options are visible at once, making the choice faster and
       * reducing cognitive load compared to a hidden dropdown.
       */}
      <Text style={styles.label}>Frequency</Text>
      <View style={styles.row}>
        {(Object.keys(FREQUENCY_LABELS) as GoalFrequency[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, frequency === f && styles.chipActive]}
            onPress={() => setFrequency(f)}
          >
            <Text
              style={[styles.chipText, frequency === f && styles.chipTextActive]}
            >
              {FREQUENCY_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/**
       * PRIORITY CHIP GROUP
       *
       * Replaces manual point value selection. The user picks how important
       * the goal is; the app auto-calculates pts per completion:
       *   Low=1  Medium=3  High=5
       * Total possible = pts × frequency target (shown as a hint below the chips).
       */}
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {(Object.keys(PRIORITY_LABELS) as GoalPriority[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, priority === p && styles.chipActive]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
              {PRIORITY_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.priorityHint}>
        {PRIORITY_POINTS[priority]} pt{PRIORITY_POINTS[priority] > 1 ? "s" : ""} per completion · auto-calculated from priority
      </Text>

      {/**
       * INLINE ERROR MESSAGE
       * Shown below the chips and above the submit button.
       * Covers both local validation errors (empty title) and
       * errors thrown by the parent's onSubmit (goal limit, duplicates, network).
       */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/**
       * SUBMIT BUTTON
       * - Disabled and faded while loading to prevent double-submission
       * - Shows ActivityIndicator spinner during async onSubmit call
       * - Label is passed from the parent ("Create Goal" or "Save Changes")
       */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Outer container — padding gives consistent spacing inside any parent scroll view */
  form: {
    padding: 20,
  },

  /**
   * Section label above each form field group
   * Uppercase + letter-spacing for a clean "settings page" look
   * marginTop provides visual separation between sections
   */
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /**
   * Text input for the goal title
   * White background with a light border distinguishes it from the cream screen background
   */
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },

  /**
   * Chip row wrapper
   * flexWrap: "wrap" allows chips to flow onto a second line if needed
   * gap: 8 works on RN 0.71+ (this project uses 0.81.5, so it is safe)
   */
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  /** Default (unselected) chip */
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  /** Active (selected) chip — orange fill */
  chipActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },

  /** Text inside unselected chip */
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  /** Text inside selected chip — white for contrast against orange */
  chipTextActive: {
    color: "#fff",
  },

  /** Small hint showing the auto-calculated pts value below the priority chips */
  priorityHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
  },

  /**
   * Error message block
   * Red text on light red background makes errors easy to spot
   * Positioned between the chips and the submit button
   */
  error: {
    marginTop: 16,
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    textAlign: "center",
  },

  /** Submit button — dark background contrasts with the form's light colors */
  button: {
    marginTop: 28,
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  /** Faded state while loading — visual indicator that input is disabled */
  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
