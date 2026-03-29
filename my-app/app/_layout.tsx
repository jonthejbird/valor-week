/**
 * app/_layout.tsx
 *
 * PURPOSE:
 * Root navigation container for the app.
 *
 * IMPORTANT:
 * Do not put splash logic here.
 * The splash should live in app/index.tsx so it only runs once
 * when the app enters through the root route.
 */

import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}