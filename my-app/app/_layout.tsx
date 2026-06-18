/**
 * app/_layout.tsx
 *
 * PURPOSE:
 * Root navigation container for the entire app.
 * Every screen in the app is a child of this Stack navigator.
 *
 * ROUTE STRUCTURE:
 * _layout.tsx (Stack)
 * ├── index.tsx         → Splash screen, then redirects to /sign-in
 * ├── sign-in.tsx       → Email/password login
 * ├── sign-up.tsx       → Account creation
 * ├── (tabs)/_layout.tsx → Tab navigator (Home, Goals, Progress, Profile)
 * │   ├── (tabs)/home.tsx
 * │   ├── (tabs)/goals.tsx
 * │   ├── (tabs)/progress.tsx
 * │   └── (tabs)/profile.tsx
 * └── goals/
 *     ├── create.tsx    → New goal form
 *     └── [id].tsx      → Edit/delete goal form
 *
 * WHY headerShown: false:
 * Every screen manages its own header UI (custom styled bars, or no header at all).
 * The default Stack header is hidden globally here so individual screens
 * don't need to set it themselves.
 *
 * IMPORTANT:
 * Do not put splash or auth logic here.
 * The splash lives in app/index.tsx (runs once at app start).
 * Auth state is checked at the sign-in/sign-up level.
 * If you add a global auth listener in the future, this is a good place for it.
 *
 * DEBUG NOTES:
 * - If a screen is unreachable, verify its file path matches Expo Router's
 *   file-based routing convention (folder = route segment, [param] = dynamic).
 * - If you see the default Stack header appearing, a screen is overriding
 *   headerShown locally. Check its <Stack.Screen> options.
 */

import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}