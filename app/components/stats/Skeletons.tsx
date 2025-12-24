import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

// Shimmer Animation Component
export const ShimmerEffect = ({ isDark, style }: { isDark: boolean; style?: any }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton Day Card
export const SkeletonDayCard = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={{
        alignItems: "center",
        marginHorizontal: 3,
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
        borderRadius: 12,
        padding: 8,
        paddingVertical: 10,
        width: 48,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      }}
    >
      <ShimmerEffect isDark={isDark} style={{ width: 24, height: 10, marginBottom: 8 }} />
      <ShimmerEffect isDark={isDark} style={{ width: 32, height: 32, borderRadius: 16, marginBottom: 6 }} />
      <ShimmerEffect isDark={isDark} style={{ width: 20, height: 14 }} />
    </View>
  );
};

// Skeleton Stat Card
export const SkeletonStatCard = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      }}
    >
      <ShimmerEffect isDark={isDark} style={{ width: 50, height: 10, marginBottom: 6 }} />
      <ShimmerEffect isDark={isDark} style={{ width: 40, height: 18 }} />
    </View>
  );
};

// Skeleton Chart
export const SkeletonChart = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 150,
      }}
    >
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3].map((height, index) => (
        <View key={index} style={{ flex: 1, alignItems: "center", marginHorizontal: 4 }}>
          <ShimmerEffect
            isDark={isDark}
            style={{
              width: "100%",
              height: height * 120,
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
          <ShimmerEffect isDark={isDark} style={{ width: 20, height: 10, marginBottom: 4 }} />
          <ShimmerEffect isDark={isDark} style={{ width: 16, height: 8 }} />
        </View>
      ))}
    </View>
  );
};

// Skeleton App Usage Item
export const SkeletonAppItem = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={{
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <ShimmerEffect isDark={isDark} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 12 }} />
        <ShimmerEffect isDark={isDark} style={{ flex: 1, height: 16, marginRight: 12 }} />
        <ShimmerEffect isDark={isDark} style={{ width: 40, height: 14 }} />
      </View>
      <ShimmerEffect isDark={isDark} style={{ height: 6, borderRadius: 3 }} />
    </View>
  );
};
