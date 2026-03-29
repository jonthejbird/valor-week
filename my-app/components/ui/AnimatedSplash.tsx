/**
 * AnimatedSplash.tsx
 *
 * PURPOSE:
 * Shows a branded startup splash screen before the app loads.
 *
 * DESIGN:
 * - Full-screen background image using checkmark.png
 * - Small branded studio badge near the top using studio_emblem.png
 *
 * ANIMATION FLOW:
 * 1. Background image fades in and slightly scales down
 * 2. Studio emblem badge fades in and slides into place
 * 3. Wait briefly, then call onFinish() so the app continues
 *
 * DEBUG NOTES:
 * - If the splash never disappears, check that onFinish() is firing
 * - If images do not load, verify the require(...) paths
 * - If the emblem badge looks too large/small, adjust styles.emblemImage.width
 * - If the badge stretches across the screen, do NOT use left: 0 and right: 0
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

/**
 * Props for the splash component.
 * onFinish is called after the splash animation completes.
 */
type Props = {
  onFinish: () => void;
};

/**
 * Device dimensions used for responsive sizing.
 */
const { width, height } = Dimensions.get("window");

export default function AnimatedSplash({ onFinish }: Props) {
  /**
   * Animated value for the full-screen background image opacity.
   * Starts invisible, then fades in.
   */
  const mainOpacity = useRef(new Animated.Value(0)).current;

  /**
   * Animated value for the background image scale.
   * Starts slightly enlarged for a subtle zoom-out effect.
   */
  const mainScale = useRef(new Animated.Value(1.03)).current;

  /**
   * Animated value for the studio badge opacity.
   * Starts invisible, then fades in after the background appears.
   */
  const emblemOpacity = useRef(new Animated.Value(0)).current;

  /**
   * Animated value for the studio badge vertical position.
   * Starts slightly above final position, then slides down into place.
   */
  const emblemTranslateY = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    /**
     * Splash animation sequence:
     * 1. Background image fades/scales in
     * 2. Emblem badge fades/slides in
     * 3. Hold briefly
     * 4. Notify parent component that splash is done
     */
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(mainScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(emblemOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(emblemTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),

      /**
       * Small pause so the user actually sees the completed splash.
       */
      Animated.delay(400),
    ]).start(() => {
      /**
       * Tell the parent layout/screen that the splash is finished.
       * If your app gets stuck on the splash, this callback or the parent state handling is the first thing to check.
       */
      onFinish();
    });
  }, [mainOpacity, mainScale, emblemOpacity, emblemTranslateY, onFinish]);

  return (
    <View style={styles.container}>
      {/* 
        FULL-SCREEN BACKGROUND IMAGE
        - Uses checkmark.png as the main branded visual
        - Animated for fade-in and subtle zoom-out
      */}
      <Animated.Image
        source={require("../../assets/images/checkmark.png")}
        resizeMode="cover"
        style={[
          styles.backgroundImage,
          {
            opacity: mainOpacity,
            transform: [{ scale: mainScale }],
          },
        ]}
      />

      {/*
        STUDIO EMBLEM BADGE
        - Small overlay near top of screen
        - Rounded border/background for a more polished appearance
        - Centered using alignSelf instead of left/right stretch
      */}
      <Animated.View
        style={[
          styles.emblemBadge,
          {
            opacity: emblemOpacity,
            transform: [{ translateY: emblemTranslateY }],
          },
        ]}
      >
        <Image
          source={require("../../assets/images/studio_emblem.png")}
          resizeMode="contain"
          style={styles.emblemImage}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Component styles
 */
const styles = StyleSheet.create({
  /**
   * Root container
   * - Fallback orange background shown behind the main image
   */
  container: {
    flex: 1,
    backgroundColor: "#F97316",
  },

  /**
   * Full-screen background image
   * - Absolute fill so it covers the whole screen
   */
  backgroundImage: {
    position: "absolute",
    width,
    height,
  },

  /**
   * Badge wrapper around the studio emblem image
   *
   * IMPORTANT:
   * - Uses alignSelf: "center" so the badge wraps tightly around content
   * - Does NOT use left: 0 and right: 0, because that would stretch the badge across the screen
   */
  emblemBadge: {
    position: "absolute",
    top: height * 0.04,

    /**
     * Center the badge itself without forcing full-width layout.
     */
    alignSelf: "center",

    /**
     * Inner spacing between the border/background and the image.
     * Reduce these values if you want a tighter badge.
     */
    paddingHorizontal: 10,
    paddingVertical: 6,

    /**
     * Rounded corners and clipping.
     */
    borderRadius: 7,
    overflow: "hidden",

    /**
     * Semi-transparent dark background behind the emblem.
     * Helps the badge stand out against the bright splash image.
     */
    backgroundColor: "rgba(0,0,0,0.28)",

    /**
     * Center contents inside the badge.
     */
    alignItems: "center",
    justifyContent: "center",

    /**
     * Subtle border for polish.
     */
    borderWidth: 0.6,
    borderColor: "rgba(255,255,255,0.12)",

    /**
     * Shadow for depth.
     * iOS uses shadow props, Android uses elevation.
     */
    shadowOpacity: 0.12,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  /**
   * Studio emblem image inside the badge
   *
   * THIS is the main size control for the logo.
   * If it looks too big or too small, change the width below.
   */
  emblemImage: {
    width: width * 0.28,
    height: undefined,

    /**
     * The uploaded emblem image is square, so aspectRatio: 1 is correct.
     * If you replace the image later with a wider one, update this ratio.
     */
    aspectRatio: 1,
  },
});