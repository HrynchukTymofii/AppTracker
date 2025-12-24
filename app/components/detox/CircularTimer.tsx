import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularTimerProps {
  size?: number;
  strokeWidth?: number;
  timeRemaining: number;
  totalTime: number;
  isDark: boolean;
}

export const CircularTimer = ({
  size = 280,
  strokeWidth = 12,
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
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          stroke={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle */}
        <Circle
          stroke={isDark ? "#ffffff" : "#111827"}
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
            fontSize: 56,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {formatTime(timeRemaining)}
        </Text>
      </View>
    </View>
  );
};
