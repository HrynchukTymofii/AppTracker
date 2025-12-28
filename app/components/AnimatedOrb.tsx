import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AnimatedOrbProps {
  size: number;
  level: number; // 1-5
  isTransitioning?: boolean;
  monochrome?: "white" | "dark"; // Optional monochrome mode
}

// Monochrome themes
const MONOCHROME_THEMES = {
  white: {
    core: ["#ffffff", "#f0f0f0", "#e0e0e0"] as const,
    mid: ["#f5f5f5", "#ebebeb", "#e0e0e0"] as const,
    outer: ["#e8e8e8", "#dedede", "#d4d4d4"] as const,
    glow: "#ffffff",
    particles: "rgba(255, 255, 255, 0.6)",
  },
  dark: {
    core: ["#1a1a1a", "#0f0f0f", "#000000"] as const,
    mid: ["#2a2a2a", "#1f1f1f", "#141414"] as const,
    outer: ["#3a3a3a", "#2f2f2f", "#242424"] as const,
    glow: "#1a1a1a",
    particles: "rgba(0, 0, 0, 0.6)",
  },
};

// Color themes for each level
const ORB_THEMES = {
  1: {
    core: ["#ff6b6b", "#ee5a5a", "#dc3545"] as const,
    mid: ["#ff8787", "#ff6b6b", "#ee5a5a"] as const,
    outer: ["#ffa8a8", "#ff8787", "#ff6b6b"] as const,
    glow: "#ff6b6b",
    particles: "#ffcdd2",
  },
  2: {
    core: ["#ff9f43", "#f7931e", "#e67e22"] as const,
    mid: ["#ffb347", "#ff9f43", "#f7931e"] as const,
    outer: ["#ffd093", "#ffb347", "#ff9f43"] as const,
    glow: "#ff9f43",
    particles: "#ffe0b2",
  },
  3: {
    core: ["#54a0ff", "#2e86de", "#1e6fba"] as const,
    mid: ["#74b9ff", "#54a0ff", "#2e86de"] as const,
    outer: ["#a8d8ff", "#74b9ff", "#54a0ff"] as const,
    glow: "#54a0ff",
    particles: "#bbdefb",
  },
  4: {
    core: ["#00d2d3", "#00b894", "#009688"] as const,
    mid: ["#55efc4", "#00d2d3", "#00b894"] as const,
    outer: ["#a8f0e8", "#55efc4", "#00d2d3"] as const,
    glow: "#00d2d3",
    particles: "#b2dfdb",
  },
  5: {
    core: ["#a29bfe", "#6c5ce7", "#5f27cd"] as const,
    mid: ["#d5aaff", "#a29bfe", "#6c5ce7"] as const,
    outer: ["#e8daff", "#d5aaff", "#a29bfe"] as const,
    glow: "#a29bfe",
    particles: "#e1bee7",
  },
};

const PARTICLE_COUNT = 8;

export default function AnimatedOrb({ size, level, isTransitioning, monochrome }: AnimatedOrbProps) {
  const theme = monochrome
    ? MONOCHROME_THEMES[monochrome]
    : (ORB_THEMES[level as keyof typeof ORB_THEMES] || ORB_THEMES[3]);

  // Core animations
  const coreRotation = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(1)).current;
  const coreGlow = useRef(new Animated.Value(0.6)).current;

  // Layer rotations (different speeds for depth)
  const layer1Rotation = useRef(new Animated.Value(0)).current;
  const layer2Rotation = useRef(new Animated.Value(0)).current;
  const layer3Rotation = useRef(new Animated.Value(0)).current;

  // Floating animation for the whole orb
  const floatY = useRef(new Animated.Value(0)).current;

  // Particle animations
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      orbit: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0.3 + Math.random() * 0.4),
    }))
  ).current;

  // Energy ring pulse
  const ringPulse = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Core rotation - slow, majestic
    Animated.loop(
      Animated.timing(coreRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Core pulse - breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow intensity pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreGlow, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(coreGlow, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Layer rotations at different speeds
    Animated.loop(
      Animated.timing(layer1Rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(layer2Rotation, {
        toValue: -1, // Opposite direction
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(layer3Rotation, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Floating effect - smooth continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle orbits
    particleAnims.forEach((particle, index) => {
      const delay = index * 200;
      const duration = 4000 + index * 500;

      Animated.loop(
        Animated.timing(particle.orbit, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Particle twinkle
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle.opacity, {
            toValue: 0.8,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.2,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Energy ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringPulse, {
            toValue: 1.3,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringPulse, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const coreRotateInterpolate = coreRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const layer1RotateInterpolate = layer1Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const layer2RotateInterpolate = layer2Rotation.interpolate({
    inputRange: [-1, 0],
    outputRange: ["-360deg", "0deg"],
  });

  const layer3RotateInterpolate = layer3Rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: floatY }],
        },
      ]}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: theme.glow,
            opacity: coreGlow.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0.15, 0.3],
            }),
          },
        ]}
      />

      {/* Energy ring pulse */}
      <Animated.View
        style={[
          styles.energyRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.glow,
            opacity: ringOpacity,
            transform: [{ scale: ringPulse }],
          },
        ]}
      />

      {/* Outer layer - slowest rotation */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [
              { rotate: layer3RotateInterpolate },
              { scale: corePulse },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.outer[0], theme.outer[1], theme.outer[2], "transparent"] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientLayer, { borderRadius: size / 2 }]}
        />
      </Animated.View>

      {/* Middle layer */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            transform: [
              { rotate: layer2RotateInterpolate },
              { scale: corePulse },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={theme.mid}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.gradientLayer, { borderRadius: size * 0.4 }]}
        />
      </Animated.View>

      {/* Inner layer - fastest rotation */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            transform: [
              { rotate: layer1RotateInterpolate },
              { scale: corePulse },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={theme.core}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={[styles.gradientLayer, { borderRadius: size * 0.3 }]}
        />
      </Animated.View>

      {/* Core - bright center with rotation */}
      <Animated.View
        style={[
          styles.core,
          {
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: size * 0.175,
            transform: [
              { rotate: coreRotateInterpolate },
              { scale: corePulse },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["#ffffff", theme.core[0], theme.core[1]]}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.7, y: 0.7 }}
          style={[styles.gradientLayer, { borderRadius: size * 0.175 }]}
        />
        {/* Bright spot */}
        <View
          style={[
            styles.brightSpot,
            {
              width: size * 0.12,
              height: size * 0.12,
              borderRadius: size * 0.06,
              top: size * 0.05,
              left: size * 0.05,
            },
          ]}
        />
      </Animated.View>

      {/* Orbiting particles */}
      {particleAnims.map((particle, index) => {
        const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
        const orbitRadius = size * 0.55 + (index % 3) * 8;
        const particleSize = 4 + (index % 3) * 2;

        const rotateInterpolate = particle.orbit.interpolate({
          inputRange: [0, 1],
          outputRange: [`${angle}rad`, `${angle + Math.PI * 2}rad`],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particleContainer,
              {
                width: size,
                height: size,
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.particle,
                {
                  width: particleSize,
                  height: particleSize,
                  borderRadius: particleSize / 2,
                  backgroundColor: theme.particles,
                  opacity: particle.opacity,
                  transform: [
                    { translateX: orbitRadius },
                    { scale: particle.scale },
                  ],
                  shadowColor: theme.glow,
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                },
              ]}
            />
          </Animated.View>
        );
      })}

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: size * 0.4,
            height: size * 0.15,
            borderRadius: size * 0.075,
            top: size * 0.18,
            left: size * 0.2,
            opacity: coreGlow.interpolate({
              inputRange: [0.6, 1],
              outputRange: [0.4, 0.7],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientLayer}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
  energyRing: {
    position: "absolute",
    borderWidth: 2,
  },
  layer: {
    position: "absolute",
    overflow: "hidden",
  },
  gradientLayer: {
    flex: 1,
  },
  core: {
    position: "absolute",
    overflow: "hidden",
  },
  brightSpot: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  particleContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
  shimmer: {
    position: "absolute",
    overflow: "hidden",
  },
});
