import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENT_COLORS, GradientTuple, useOnboardingTheme } from './designSystem';

// ============================================
// GLASS CARD COMPONENT
// ============================================

export const GlassCard = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
}: {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'light' | 'heavy' | 'gradient';
  noPadding?: boolean;
}) => {
  const { colors } = useOnboardingTheme();
  const bgColor = variant === 'light' ? colors.glassLight :
                  variant === 'heavy' ? colors.glassHeavy :
                  colors.glassMedium;

  return (
    <View style={[
      {
        backgroundColor: bgColor,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        padding: noPadding ? 0 : 20,
        overflow: 'hidden',
      },
      style,
    ]}>
      {children}
    </View>
  );
};

// ============================================
// GRADIENT TEXT COMPONENT
// ============================================

export const GradientText = ({
  children,
  style,
  colors = GRADIENT_COLORS.primary
}: {
  children: string;
  style?: any;
  colors?: GradientTuple;
}) => {
  // React Native doesn't support gradient text directly, so we'll use a solid color from gradient
  return (
    <Text style={[style, { color: colors[0] }]}>
      {children}
    </Text>
  );
};

// ============================================
// GRADIENT BUTTON COMPONENT
// ============================================

export const GradientButton = ({
  onPress,
  title,
  subtitle,
  colors = GRADIENT_COLORS.primary,
  style,
  disabled = false,
}: {
  onPress: () => void;
  title: string;
  subtitle?: string;
  colors?: GradientTuple;
  style?: any;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={disabled} style={style}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          padding: 18,
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ============================================
// GRADIENT BAR CHART (Opal Style)
// ============================================

export const GradientBarChart = ({
  data,
  maxValue,
  showLabels = true,
  barColors = [COLORS.gradientPurple, COLORS.gradientBlue, COLORS.gradientOrange, COLORS.gradientCyan],
}: {
  data: { day: string; hours: number; segments?: number[] }[];
  maxValue: number;
  showLabels?: boolean;
  barColors?: string[];
}) => {
  const { colors } = useOnboardingTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 }}>
      {data.map((item, index) => {
        const barHeight = Math.max((item.hours / maxValue) * 100, 8);
        const segments = item.segments || [item.hours * 0.4, item.hours * 0.3, item.hours * 0.2, item.hours * 0.1];
        const totalSegments = segments.reduce((a, b) => a + b, 0);

        return (
          <View key={index} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{
              fontSize: 10,
              color: colors.textSecondary,
              marginBottom: 4,
              fontWeight: '600',
            }}>
              {item.hours.toFixed(1)}h
            </Text>
            <View style={{
              width: '65%',
              height: barHeight,
              borderRadius: 6,
              overflow: 'hidden',
              flexDirection: 'column-reverse',
            }}>
              {segments.map((segment, segIndex) => (
                <View
                  key={segIndex}
                  style={{
                    width: '100%',
                    height: `${(segment / totalSegments) * 100}%`,
                    backgroundColor: barColors[segIndex % barColors.length],
                    opacity: 0.9,
                  }}
                />
              ))}
            </View>
            {showLabels && (
              <Text style={{
                fontSize: 11,
                color: colors.textTertiary,
                marginTop: 8,
                fontWeight: '500',
              }}>
                {item.day}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ============================================
// VIDEO PLACEHOLDER COMPONENT
// ============================================

export const VideoPlaceholder = () => {
  const { Play } = require('lucide-react-native');
  const { colors } = useOnboardingTheme();

  return (
    <GlassCard style={{ alignItems: 'center', justifyContent: 'center', height: 180, marginVertical: 16 }}>
      <LinearGradient
        colors={GRADIENT_COLORS.primary}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Play size={28} color="#FFFFFF" />
      </LinearGradient>
      <Text style={{
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 12,
      }}>
        Tutorial Video
      </Text>
    </GlassCard>
  );
};

// ============================================
// TOGGLE BUTTON COMPONENT
// ============================================

export const ToggleButton = ({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) => {
  const { colors } = useOnboardingTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: selected ? COLORS.gradientPurple : colors.glassLight,
        alignItems: 'center',
      }}
    >
      <Text style={{
        fontSize: 15,
        fontWeight: '600',
        color: selected ? '#FFFFFF' : colors.textSecondary,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
