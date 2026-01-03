import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface CircularTimerProps {
  size?: number;
  strokeWidth?: number;
  timeRemaining: number;
  totalTime: number;
  isDark: boolean;
}

export const CircularTimer = ({
  size = 280,
  strokeWidth = 16,
  timeRemaining,
  totalTime,
  isDark,
}: CircularTimerProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (timeRemaining / totalTime) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Glassy background effect */}
      <View
        style={{
          position: "absolute",
          top: strokeWidth,
          left: strokeWidth,
          right: strokeWidth,
          bottom: strokeWidth,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
        }}
      />

      <Svg width={size} height={size}>
        <Defs>
          {/* Glassy gradient for progress ring */}
          <LinearGradient id="glassyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="1" />
            <Stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </LinearGradient>

          {/* Background ring gradient */}
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity="0.04" />
          </LinearGradient>
        </Defs>

        {/* Background Circle with gradient */}
        <Circle
          stroke="url(#bgGradient)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Progress Circle with glassy gradient */}
        <Circle
          stroke="url(#glassyGradient)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Inner glow circle */}
        <Circle
          stroke="url(#glassyGradient)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={2}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.3}
        />
      </Svg>

      {/* Time in the middle */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 52,
            fontWeight: "800",
            color: isDark ? "#ffffff" : "#0f172a",
            letterSpacing: -1,
          }}
        >
          {formatTime(timeRemaining)}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {timeRemaining > 0 ? "remaining" : "ready"}
        </Text>
      </View>
    </View>
  );
};
