import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AnimatedSplash from "../components/AnimatedSplash";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hard minimum time: ensures you *see* it in Expo Go
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return <AnimatedSplash onFinish={() => setReady(true)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
