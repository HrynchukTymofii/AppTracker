import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS, GradientTuple } from './designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ============================================
// SCALE IN VIEW - Pop/bounce entrance animation
// ============================================

export const ScaleInView = ({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ============================================
// SLIDE IN VIEW - Slide from direction
// ============================================

export const SlideInView = ({
  delay = 0,
  direction = 'left',
  children,
  style,
}: {
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  children: React.ReactNode;
  style?: any;
}) => {
  const getInitialValue = () => {
    switch (direction) {
      case 'left': return -SCREEN_WIDTH;
      case 'right': return SCREEN_WIDTH;
      case 'up': return 100;
      case 'down': return -100;
      default: return -SCREEN_WIDTH;
    }
  };

  const translateAnim = useRef(new Animated.Value(getInitialValue())).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const getTransform = () => {
    if (direction === 'left' || direction === 'right') {
      return [{ translateX: translateAnim }];
    }
    return [{ translateY: translateAnim }];
  };

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: getTransform(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ============================================
// TYPEWRITER TEXT - Character by character animation
// ============================================

export const TypewriterText = ({
  text,
  delay = 0,
  speed = 50,
  style,
  onComplete,
}: {
  text: string;
  delay?: number;
  speed?: number;
  style?: any;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <Text style={style}>
      {displayedText}
      {displayedText.length < text.length && <Text style={{ opacity: 0.5 }}>|</Text>}
    </Text>
  );
};

// ============================================
// STAGGERED CHILDREN - Animate children sequentially
// ============================================

export const StaggeredChildren = ({
  children,
  staggerDelay = 100,
  initialDelay = 0,
  style,
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  style?: any;
}) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeInView delay={initialDelay + index * staggerDelay}>
          {child}
        </FadeInView>
      ))}
    </View>
  );
};

// ============================================
// PULSE VIEW - Continuous pulsing animation
// ============================================

export const PulseView = ({
  children,
  style,
  duration = 1500,
  minScale = 0.95,
  maxScale = 1.05,
}: {
  children: React.ReactNode;
  style?: any;
  duration?: number;
  minScale?: number;
  maxScale?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

// ============================================
// SHIMMER VIEW - Shimmer loading effect
// ============================================

export const ShimmerView = ({
  width = 100,
  height = 20,
  borderRadius = 8,
  style,
}: {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: any;
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: width * 2 }}
        />
      </Animated.View>
    </View>
  );
};

// ============================================
// ROTATING BORDER - Animated gradient border
// ============================================

export const RotatingBorder = ({
  children,
  size = 100,
  borderWidth = 3,
  duration = 3000,
}: {
  children: React.ReactNode;
  size?: number;
  borderWidth?: number;
  duration?: number;
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate }],
        }}
      >
        <LinearGradient
          colors={[GRADIENT_COLORS.primary[0], GRADIENT_COLORS.primary[1], 'transparent', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: size / 2,
          }}
        />
      </Animated.View>
      <View
        style={{
          width: size - borderWidth * 2,
          height: size - borderWidth * 2,
          borderRadius: (size - borderWidth * 2) / 2,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
};
