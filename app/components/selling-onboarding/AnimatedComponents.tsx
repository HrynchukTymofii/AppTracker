import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS, GradientTuple } from './designSystem';

// ============================================
// ANIMATED COUNTER
// ============================================

export const AnimatedCounter = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  style,
  startDelay = 0,
  decimals = 0,
  gradientColors,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  style?: any;
  startDelay?: number;
  decimals?: number;
  gradientColors?: GradientTuple;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value: v }) => {
        setDisplayValue(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v));
      });

      return () => animatedValue.removeListener(listener);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [value]);

  const textContent = `${prefix}${displayValue}${suffix}`;

  if (gradientColors) {
    return (
      <Text style={style}>{textContent}</Text>
    );
  }

  return (
    <Text style={style}>
      {textContent}
    </Text>
  );
};

// ============================================
// FADE IN VIEW
// ============================================

export const FadeInView = ({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// GLOWING BORDER
// ============================================

export const GlowingBorder = ({
  children,
  colors = GRADIENT_COLORS.primary,
}: {
  children: React.ReactNode;
  colors?: GradientTuple;
}) => {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={{ opacity: pulseAnim, position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 22 }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 22 }}
        />
      </Animated.View>
      {children}
    </View>
  );
};
