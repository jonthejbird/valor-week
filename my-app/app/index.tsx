/**
 * app/index.tsx
 *
 * PURPOSE:
 * True app entry point.
 *
 * FLOW:
 * 1. Show splash
 * 2. Redirect to sign-in
 */

import React, { useState } from "react";
import { Redirect } from "expo-router";
import AnimatedSplash from "../components/ui/AnimatedSplash";

export default function Index() {
  const [finished, setFinished] = useState(false);

  if (!finished) {
    return <AnimatedSplash onFinish={() => setFinished(true)} />;
  }

  return <Redirect href="/sign-in" />;
}