import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import Svg, { Circle } from "react-native-svg";
import { useDetox } from "@/context/DetoxContext";

// Circular Timer Component
const CircularTimer = ({
  size = 280,
  strokeWidth = 12,
  timeRemaining,
  totalTime,
  isDark,
}: {
  size?: number;
  strokeWidth?: number;
  timeRemaining: number;
  totalTime: number;
  isDark: boolean;
}) => {
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

export default function DetoxScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isActive, timeRemaining, startDetox, TOTAL_TIME } = useDetox();

  // Health score (dummy data)
  const healthScore = 85;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            Detox
          </Text>
        </View>

        {/* Orb Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 24,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
            borderRadius: 24,
            padding: 32,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 10,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
            borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Orb Image */}
          <Image
            source={require("@/assets/images/orb1.png")}
            style={{ width: 200, height: 200, marginBottom: 24 }}
            resizeMode="contain"
          />

          {/* Health Score */}
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            {healthScore}
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              width: "100%",
              height: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              borderRadius: 6,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${healthScore}%`,
                backgroundColor: isDark ? "#ffffff" : "#111827",
                borderRadius: 6,
              }}
            />
          </View>

          {/* Health Label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              letterSpacing: 1,
            }}
          >
            HEALTH
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            marginHorizontal: 40,
            marginVertical: 24,
          }}
        />

        {/* Timer Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 24,
              letterSpacing: 0.5,
            }}
          >
            DETOX TIMER
          </Text>

          <CircularTimer
            size={280}
            strokeWidth={12}
            timeRemaining={timeRemaining}
            totalTime={TOTAL_TIME}
            isDark={isDark}
          />

          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {isActive
              ? "Click the Detox button to stop the timer"
              : "Click the Detox button to start the timer"
            }
          </Text>
        </View>

        {/* Info Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 8,
              }}
            >
              About Digital Detox
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#9ca3af" : "#6b7280",
                lineHeight: 20,
              }}
            >
              Take a break from your phone and improve your mental health. During detox mode, you'll be encouraged to stay away from distracting apps.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
