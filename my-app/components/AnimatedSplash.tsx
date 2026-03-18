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
  const checkScale = useRef(new Animated.Value(0.8)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkTranslate = useRef(new Animated.Value(60)).current;
  const studioOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Checkmark comes in (no shield now)
      Animated.parallel([
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
  
      // Studio fades in
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

      {/* Checkmark (same size, rounded via wrapper) */}
      <Animated.View
        style={[
          styles.checkmarkWrap,
          {
            opacity: checkOpacity,
            transform: [{ translateY: checkTranslate },
              {scale: checkScale},
            ],
          },
        ]}
      >
        <Image
          source={require("../assets/images/checkmark.png")}
          style={styles.checkmarkImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Studio emblem (rounded) */}
      <Animated.View
        style={[styles.studioWrap, { opacity: studioOpacity }]}
      >
        <Image
          source={require("../assets/images/studio_emblem.png")}
          style={styles.studioImg}
          resizeMode="contain"
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
    width: "90%",
    height: "90%",
},

    checkmarkWrap: {
    width: ICON_SIZE,
  height: ICON_SIZE,
  alignItems: "center",
  justifyContent: "center",
},
  checkmarkImg: {
    width: "90%",
    height: "90%",
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
    width: "80%",
    height: "80%",
  },
});
