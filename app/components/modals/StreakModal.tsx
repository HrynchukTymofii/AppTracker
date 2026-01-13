import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Zap, Trophy, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StreakModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function StreakModal({
  isVisible,
  onClose,
  currentStreak,
  longestStreak,
}: StreakModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fireScale = useRef(new Animated.Value(0.5)).current;
  const numberScale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      fireScale.setValue(0.5);
      numberScale.setValue(0);
      glowOpacity.setValue(0);
      sparkle1.setValue(0);
      sparkle2.setValue(0);
      sparkle3.setValue(0);

      // Entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Fire icon entrance with bounce
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(fireScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Fire pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Number pop-in with delay
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(numberScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sparkle animations with stagger
      const animateSparkle = (anim: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.delay(400),
          ])
        ).start();
      };
      animateSparkle(sparkle1, 0);
      animateSparkle(sparkle2, 300);
      animateSparkle(sparkle3, 600);
    }
  }, [isVisible]);

  // Get motivational message based on streak
  const getMotivationalMessage = () => {
    if (currentStreak === 1) {
      return t('streakModal.messages.firstDay');
    } else if (currentStreak < 7) {
      return t('streakModal.messages.buildingHabit');
    } else if (currentStreak < 30) {
      return t('streakModal.messages.onFire');
    } else if (currentStreak < 100) {
      return t('streakModal.messages.unstoppable');
    } else {
      return t('streakModal.messages.legendary');
    }
  };

  // Check if this is a new record
  const isNewRecord = currentStreak >= longestStreak && currentStreak > 1;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
        }}
      >
        {/* Full screen gradient background */}
        <LinearGradient
          colors={['#1a0a00', '#2d1810', '#1a0a00']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Animated glow circles */}
        <Animated.View
          style={{
            position: 'absolute',
            top: SCREEN_HEIGHT * 0.15,
            left: SCREEN_WIDTH * 0.5 - 150,
            width: 300,
            height: 300,
            borderRadius: 150,
            opacity: glowOpacity,
          }}
        >
          <LinearGradient
            colors={['#f97316', '#ea580c', 'transparent']}
            style={{
              flex: 1,
              borderRadius: 150,
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Sparkles */}
        <Animated.View
          style={{
            position: 'absolute',
            top: SCREEN_HEIGHT * 0.2,
            left: SCREEN_WIDTH * 0.15,
            opacity: sparkle1,
            transform: [{ scale: sparkle1 }],
          }}
        >
          <Sparkles size={24} color="#fbbf24" />
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            top: SCREEN_HEIGHT * 0.25,
            right: SCREEN_WIDTH * 0.12,
            opacity: sparkle2,
            transform: [{ scale: sparkle2 }],
          }}
        >
          <Sparkles size={20} color="#f97316" />
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            top: SCREEN_HEIGHT * 0.38,
            left: SCREEN_WIDTH * 0.08,
            opacity: sparkle3,
            transform: [{ scale: sparkle3 }],
          }}
        >
          <Sparkles size={18} color="#fb923c" />
        </Animated.View>

        {/* Main content */}
        <Animated.View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Fire icon with animation */}
          <Animated.View
            style={{
              transform: [{ scale: fireScale }],
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#f97316', '#ea580c', '#dc2626']}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Flame size={80} color="#ffffff" fill="#ffffff" strokeWidth={1} />
            </View>
          </Animated.View>

          {/* Streak number with pop animation */}
          <Animated.View
            style={{
              transform: [{ scale: numberScale }],
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 96,
                fontWeight: '900',
                color: '#ffffff',
                textShadowColor: '#f97316',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 30,
              }}
            >
              {currentStreak}
            </Text>
          </Animated.View>

          {/* Day streak label */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#f97316',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            {currentStreak === 1
              ? t('streakModal.title')
              : t('streakModal.titlePlural')}
          </Text>

          {/* New record badge */}
          {isNewRecord && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                marginBottom: 24,
                borderWidth: 1.5,
                borderColor: 'rgba(234, 179, 8, 0.4)',
              }}
            >
              <Trophy size={20} color="#eab308" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#eab308',
                  letterSpacing: 1,
                }}
              >
                {t('streakModal.newRecord')}
              </Text>
            </View>
          )}

          {/* Motivational message */}
          <Text
            style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              marginBottom: 48,
              lineHeight: 28,
              paddingHorizontal: 16,
            }}
          >
            {getMotivationalMessage()}
          </Text>

          {/* Continue button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Zap size={22} color="#ffffff" style={{ marginRight: 10 }} fill="#ffffff" />
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}
              >
                {t('streakModal.continue')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Longest streak info */}
          {longestStreak > 1 && !isNewRecord && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 24,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Flame size={16} color="#f97316" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {t('streakModal.longestStreak')}: {longestStreak} {t('streakModal.days')}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default StreakModal;
