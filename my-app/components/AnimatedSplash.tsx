import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from "react-native";

type Props = { onFinish: () => void };

const { width, height } = Dimensions.get("window");
const ICON_SIZE = Math.min(width, height) * 0.90;   // main badge size


export default function AnimatedSplash({ onFinish }: Props) {
  const shieldOpacity = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkTranslate = useRef(new Animated.Value(60)).current;
  const studioOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Shield fade in
      Animated.timing(shieldOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      // Checkmark slice in
      Animated.parallel([
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(checkTranslate, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Studio emblem fade in
      Animated.timing(studioOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      Animated.delay(250),
    ]).start(() => onFinish());
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Shield (rounded via wrapper) */}
      <Animated.View
        style={[styles.shieldWrap, { opacity: shieldOpacity }]}
      >
        <Image
          source={require("../assets/images/shield.png")}
          style={styles.shieldImg}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Checkmark (same size, rounded via wrapper) */}
      <Animated.View
        style={[
          styles.checkmarkWrap,
          {
            opacity: checkOpacity,
            transform: [{ translateY: checkTranslate }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/checkmark.png")}
          style={styles.checkmarkImg}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Studio emblem (rounded) */}
      <Animated.View
        style={[styles.studioWrap, { opacity: studioOpacity }]}
      >
        <Image
          source={require("../assets/images/studio_emblem.png")}
          style={styles.studioImg}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },

    shieldWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    position: "absolute",
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.10)", // 👈 makes rounding visible
},
    shieldImg: {
    width: "100%",
    height: "100%",
},

    checkmarkWrap: {
    width: ICON_SIZE,
  height: ICON_SIZE,
  position: "absolute",
  borderRadius: 32,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.06)", // 👈 makes rounding visible
},
  checkmarkImg: {
    width: "100%",
    height: "100%",
  },

  studioWrap: {
    position: "absolute",
    bottom: height * 0.06,
    width: height * 0.45,
    height: height * 0.12,
    borderRadius: 5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  studioImg: {
    width: "100%",
    height: "100%",
  },
});
