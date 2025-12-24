import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  StyleSheet,
  Easing,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  ChevronRight,
  Zap,
  Shield,
  Calendar,
  Clock,
  Timer,
  Target,
  Trophy,
  Settings,
  User,
  Lock,
  BarChart3,
  Smartphone,
  Check,
  Flame,
  TrendingUp,
  Heart,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

export type AnimationType =
  | 'wave'
  | 'orb'
  | 'stats'
  | 'lightning'
  | 'calendar'
  | 'apps'
  | 'checkmark'
  | 'shield'
  | 'focus'
  | 'timer'
  | 'chart'
  | 'swipe'
  | 'heatmap'
  | 'detox'
  | 'lock'
  | 'profile'
  | 'trophy'
  | 'settings';

export interface HelpCard {
  id: string;
  title: string;
  description: string;
  image?: any;
  video?: any;
  animationType?: AnimationType;
}

interface HelpCarouselProps {
  visible: boolean;
  cards: HelpCard[];
  onClose: () => void;
}

// Animated Illustration Component
const AnimatedIllustration: React.FC<{ type: AnimationType; isActive: boolean; isDark: boolean }> = ({
  type,
  isActive,
  isDark,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (isActive) {
      // Reset animations
      scaleAnim.setValue(0.8);
      rotateAnim.setValue(0);
      floatAnim.setValue(0);
      progressAnim.setValue(0);
      slideAnim.setValue(-50);

      // Entry animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Continuous floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress animation for certain types
      if (['stats', 'chart', 'heatmap', 'timer'].includes(type)) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }

      // Slide animation for swipe type
      if (type === 'swipe') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(slideAnim, {
              toValue: 50,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -50,
              duration: 1500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Rotation for lightning
      if (type === 'lightning') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 0.05,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -0.05,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
          ])
        ).start();
      }
    }
  }, [isActive, type]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  const renderContent = () => {
    switch (type) {
      case 'wave':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.welcomeContainer}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircleLarge}
              >
                <Text style={styles.waveEmoji}>👋</Text>
              </LinearGradient>
              <View style={styles.sparkleContainer}>
                {[...Array(5)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.sparkle,
                      {
                        transform: [
                          { rotate: `${i * 72}deg` },
                          { translateY: -70 },
                          { scale: pulseAnim },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.sparkleDot} />
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'orb':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.orbContainer}>
              <LinearGradient
                colors={['#10b981', '#34d399', '#6ee7b7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.orbOuter}
              >
                <View style={styles.orbInner}>
                  <Heart size={40} color="#ffffff" fill="#ffffff" />
                </View>
              </LinearGradient>
              <View style={styles.orbGlow} />
            </View>
          </Animated.View>
        );

      case 'stats':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                <Flame size={20} color="#f59e0b" />
                <Animated.Text
                  style={[
                    styles.statNumber,
                    { color: isDark ? '#ffffff' : '#0f172a', opacity: progressAnim },
                  ]}
                >
                  7
                </Animated.Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Streak</Text>
              </View>
              <View style={[styles.statCard, styles.statCardMain, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                <Clock size={24} color="#3b82f6" />
                <Animated.Text
                  style={[
                    styles.statNumberLarge,
                    { color: isDark ? '#ffffff' : '#0f172a', opacity: progressAnim },
                  ]}
                >
                  2h 15m
                </Animated.Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>Today</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }]}>
                <TrendingUp size={20} color="#10b981" />
                <Animated.Text
                  style={[
                    styles.statNumber,
                    { color: isDark ? '#ffffff' : '#0f172a', opacity: progressAnim },
                  ]}
                >
                  -45m
                </Animated.Text>
                <Text style={[styles.statLabel, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>vs Avg</Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'lightning':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotation },
                  { translateY: floatAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#f59e0b', '#fbbf24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Zap size={56} color="#ffffff" fill="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      case 'calendar':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={[styles.calendarContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.calendarHeader}
              >
                <Calendar size={24} color="#ffffff" />
                <Text style={styles.calendarTitle}>Schedule</Text>
              </LinearGradient>
              <View style={styles.calendarBody}>
                {[...Array(7)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.calendarDay,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' },
                      i === 3 && styles.calendarDayActive,
                      {
                        opacity: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
                        i === 3 && styles.calendarDayTextActive,
                      ]}
                    >
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'apps':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.appsContainer}>
              {[
                { color: '#ef4444', icon: Smartphone },
                { color: '#f59e0b', icon: Smartphone },
                { color: '#3b82f6', icon: Smartphone },
              ].map((app, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.appItem,
                    {
                      opacity: progressAnim,
                      transform: [
                        {
                          translateX: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-30, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[styles.appIcon, { backgroundColor: app.color }]}
                  >
                    <app.icon size={20} color="#ffffff" />
                  </View>
                  <View style={[styles.appBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <Animated.View
                      style={[
                        styles.appBarFill,
                        {
                          backgroundColor: app.color,
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', `${90 - i * 25}%`],
                          }),
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 'checkmark':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Check size={60} color="#ffffff" strokeWidth={3} />
            </LinearGradient>
          </Animated.View>
        );

      case 'shield':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Shield size={56} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      case 'focus':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.focusContainer}>
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.focusRing}
              >
                <View style={[styles.focusInner, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
                  <Target size={40} color="#8b5cf6" />
                </View>
              </LinearGradient>
              <Animated.View
                style={[
                  styles.focusPulse,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.05],
                      outputRange: [0.5, 0],
                    }),
                  },
                ]}
              />
            </View>
          </Animated.View>
        );

      case 'timer':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.timerContainer}>
              <View style={[styles.timerRing, { borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.3)' }]}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    {
                      transform: [
                        {
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '270deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <View style={styles.timerInner}>
                <Timer size={32} color="#f59e0b" />
                <Animated.Text
                  style={[
                    styles.timerText,
                    { color: isDark ? '#ffffff' : '#0f172a', opacity: progressAnim },
                  ]}
                >
                  30m
                </Animated.Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'chart':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.chartContainer}>
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8].map((height, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.chartBar,
                    {
                      height: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, height * 100],
                      }),
                      backgroundColor:
                        i === 3 ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        );

      case 'swipe':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.swipeContainer}>
              <Animated.View
                style={[
                  styles.swipeCard,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                  { transform: [{ translateX: slideAnim }] },
                ]}
              >
                <BarChart3 size={32} color="#3b82f6" />
                <Text style={[styles.swipeText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }]}>Week 1</Text>
              </Animated.View>
              <View style={styles.swipeIndicator}>
                <ChevronRight size={24} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                <ChevronRight
                  size={24}
                  color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                  style={{ marginLeft: -12 }}
                />
              </View>
            </View>
          </Animated.View>
        );

      case 'heatmap':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.heatmapContainer}>
              {[...Array(4)].map((_, row) => (
                <View key={row} style={styles.heatmapRow}>
                  {[...Array(7)].map((_, col) => {
                    const intensity = Math.random();
                    return (
                      <Animated.View
                        key={col}
                        style={[
                          styles.heatmapCell,
                          {
                            opacity: progressAnim,
                            backgroundColor: `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </Animated.View>
        );

      case 'detox':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Text style={styles.detoxEmoji}>🌿</Text>
            </LinearGradient>
          </Animated.View>
        );

      case 'lock':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Lock size={56} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      case 'profile':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <User size={56} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      case 'trophy':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Trophy size={56} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      case 'settings':
        return (
          <Animated.View
            style={[
              styles.illustrationContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: floatAnim },
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['#6b7280', '#4b5563']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircleLarge}
            >
              <Settings size={56} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.illustrationWrapper}>{renderContent()}</View>;
};

// Video Card Component
const VideoCard: React.FC<{ video: any; shouldPlay: boolean }> = ({
  video,
  shouldPlay,
}) => {
  const videoSource = typeof video === 'string' ? video : video;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    if (shouldPlay) {
      p.play();
    }
  });

  React.useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export const HelpCarousel: React.FC<HelpCarouselProps> = ({
  visible,
  cards,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      translateX.setValue(0);
      progressAnim.setValue(0);
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1 / cards.length,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, cards.length]);

  const goToCard = useCallback(
    (index: number) => {
      if (index < 0 || index >= cards.length) return;

      currentIndexRef.current = index;
      setCurrentIndex(index);

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: -index * SCREEN_WIDTH,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: (index + 1) / cards.length,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [cards.length, translateX, progressAnim]
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        },
        onPanResponderMove: (_, gestureState) => {
          const baseOffset = -currentIndexRef.current * SCREEN_WIDTH;
          translateX.setValue(baseOffset + gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          const idx = currentIndexRef.current;
          if (gestureState.dx < -SWIPE_THRESHOLD && idx < cards.length - 1) {
            goToCard(idx + 1);
          } else if (gestureState.dx > SWIPE_THRESHOLD && idx > 0) {
            goToCard(idx - 1);
          } else {
            Animated.spring(translateX, {
              toValue: -idx * SCREEN_WIDTH,
              tension: 50,
              friction: 10,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [cards.length, goToCard, translateX]
  );

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      goToCard(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  if (!visible || cards.length === 0) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={isDark
            ? ['#000000', '#0a0a0a', '#000000']
            : ['#ffffff', '#f8fafc', '#ffffff']
          }
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={isDark
            ? ['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)', 'rgba(0, 0, 0, 0)']
            : ['rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.03)', 'rgba(255, 255, 255, 0)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
        />
      </View>

      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#3b82f6', '#60a5fa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressText, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>
            {currentIndex + 1} of {cards.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
          activeOpacity={0.7}
        >
          <X size={22} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Cards Container */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardsContainer,
          {
            width: SCREEN_WIDTH * cards.length,
            transform: [{ translateX }],
          },
        ]}
      >
        {cards.map((card, index) => (
          <View key={card.id} style={[styles.card, { width: SCREEN_WIDTH }]}>
            {/* Animated Illustration or Media */}
            {card.animationType ? (
              <AnimatedIllustration
                type={card.animationType}
                isActive={index === currentIndex}
                isDark={isDark}
              />
            ) : (card.image || card.video) ? (
              <View style={styles.mediaContainer}>
                {card.video ? (
                  <VideoCard video={card.video} shouldPlay={index === currentIndex} />
                ) : card.image ? (
                  <Image
                    source={
                      typeof card.image === 'string' ? { uri: card.image } : card.image
                    }
                    style={styles.media}
                    resizeMode="cover"
                  />
                ) : null}
                <LinearGradient
                  colors={isDark
                    ? ['transparent', 'rgba(0, 0, 0, 0.8)', '#000000']
                    : ['transparent', 'rgba(255, 255, 255, 0.8)', '#ffffff']
                  }
                  style={styles.mediaOverlay}
                />
              </View>
            ) : null}

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>{card.title}</Text>
              <Text style={[styles.cardDescription, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)' }]}>{card.description}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Bottom Action Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          style={styles.nextButton}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.nextButtonText}>
            {currentIndex === cards.length - 1 ? "Get Started" : 'Next'}
          </Text>
          {currentIndex < cards.length - 1 && (
            <ChevronRight
              size={20}
              color="#ffffff"
              strokeWidth={2.5}
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>

        <View style={styles.dotsContainer}>
          {cards.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => goToCard(index)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' },
                  index === currentIndex && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  card: {
    flex: 1,
  },
  illustrationWrapper: {
    height: SCREEN_HEIGHT * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    height: SCREEN_HEIGHT * 0.4,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    justifyContent: 'flex-start',
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  // Illustration styles
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  waveEmoji: {
    fontSize: 56,
  },
  sparkleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  orbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  statCardMain: {
    padding: 20,
    minWidth: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statNumberLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  calendarContainer: {
    width: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  calendarDayActive: {
    backgroundColor: '#3b82f6',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  calendarDayTextActive: {
    color: '#ffffff',
  },
  appsContainer: {
    width: 260,
    gap: 12,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  appBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  focusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  timerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  timerProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f59e0b',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBar: {
    width: 24,
    borderRadius: 12,
    minHeight: 10,
  },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  swipeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  swipeIndicator: {
    flexDirection: 'row',
  },
  heatmapContainer: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  detoxEmoji: {
    fontSize: 56,
  },
});

export default HelpCarousel;
