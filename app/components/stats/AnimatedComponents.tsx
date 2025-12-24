import React, { useState, useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

// Animated Number Component
export const AnimatedNumber = ({
  value,
  suffix = "",
  duration = 800,
  style,
}: {
  value: number | string;
  suffix?: string;
  duration?: number;
  style?: any;
}) => {
  const [displayValue, setDisplayValue] = useState<string>("--");
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typeof value === "string" || value === 0) {
      setDisplayValue(value === 0 ? `0${suffix}` : String(value));
      return;
    }

    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(`${Math.round(v * 10) / 10}${suffix}`);
    });

    return () => animatedValue.removeListener(listener);
  }, [value, suffix]);

  return <Text style={style}>{displayValue}</Text>;
};

// Animated Bar Component
export const AnimatedBar = ({
  height,
  maxHeight,
  isDark,
  delay = 0,
}: {
  height: number;
  maxHeight: number;
  isDark: boolean;
  delay?: number;
}) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedHeight.setValue(0);
    Animated.timing(animatedHeight, {
      toValue: height,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [height]);

  const barHeight = animatedHeight.interpolate({
    inputRange: [0, maxHeight || 1],
    outputRange: [0, 120],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={{
        width: "100%",
        height: barHeight,
        backgroundColor: isDark ? "#ffffff" : "#111827",
        borderRadius: 6,
        marginBottom: 8,
      }}
    />
  );
};

// Animated Progress Bar Component
export const AnimatedProgressBar = ({
  percentage,
  isDark,
  delay = 0,
}: {
  percentage: number;
  isDark: boolean;
  delay?: number;
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View
      style={{
        height: 6,
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: "100%",
          width,
          backgroundColor: isDark ? "#ffffff" : "#111827",
          borderRadius: 3,
        }}
      />
    </View>
  );
};
