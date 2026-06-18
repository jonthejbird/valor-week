/**
 * app/(tabs)/_layout.tsx
 *
 * PURPOSE:
 * Bottom tab bar layout for the main authenticated area of the app.
 * All four main screens (Home, Goals, Progress, Profile) live inside this layout.
 *
 * TAB ORDER:
 * The order of <Tabs.Screen> components here controls the left-to-right
 * order of tabs in the tab bar. Reorder them here to change the tab order.
 *
 * COLORS:
 * - tabBarActiveTintColor:   "#F97316" (orange) — selected tab icon + label
 * - tabBarInactiveTintColor: "#6B7280" (gray)   — unselected tab icons + labels
 * Update both here if the brand color changes.
 *
 * initialRouteName: "home"
 * Forces the Home tab to be selected when the user first lands on the tab navigator.
 * Without this, Expo Router defaults to whichever tab file appears first alphabetically.
 *
 * headerShown: false
 * Each tab screen manages its own header (or has none).
 * The default Stack/Tab header is hidden here globally.
 *
 * ADDING A NEW TAB:
 * 1. Create app/(tabs)/yourscreen.tsx
 * 2. Add a <Tabs.Screen name="yourscreen" options={{ title: "Label" }} /> here
 * 3. Optionally add a tabBarIcon using @expo/vector-icons
 *
 * DEBUG NOTES:
 * - If a tab screen shows a blank white screen, the file likely has a rendering error.
 *   Check the Metro bundler output for the specific error.
 * - If tab icons are missing, you need to add tabBarIcon to each Tabs.Screen options.
 *   Currently using text-only labels (no icons) as a placeholder.
 * - If the wrong tab is selected on first load, check initialRouteName.
 */

import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      {/* HOME TAB — weekly summary, quick actions, streak info (future) */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />

      {/* GOALS TAB — create, view, toggle, and manage weekly goals */}
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
        }}
      />

      {/* PROGRESS TAB — weekly charts, completion trends, streaks (future) */}
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
        }}
      />

      {/* PROFILE TAB — account settings, plan info, preferences (future) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}