import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, GRADIENT_COLORS, GradientTuple, useOnboardingTheme } from './designSystem';

// ============================================
// GLASS CARD COMPONENT - Enhanced with gradient border
// ============================================

export const GlassCard = ({
  children,
  style,
  variant = 'default',
  noPadding = false,
  gradientBorder = false,
}: {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'light' | 'heavy' | 'gradient';
  noPadding?: boolean;
  gradientBorder?: boolean;
}) => {
  const { colors, isDark } = useOnboardingTheme();

  const getBgColor = () => {
    if (variant === 'gradient') {
      return isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)';
    }
    if (variant === 'light') return colors.glassLight;
    if (variant === 'heavy') return colors.glassHeavy;
    return colors.glassMedium;
  };

  // Extract layout styles for inner content, keep container styles for outer
  const flatStyle = StyleSheet.flatten(style) || {};
  const {
    flexDirection,
    alignItems,
    justifyContent,
    gap,
    rowGap,
    columnGap,
    flexWrap,
    alignContent,
    ...containerStyle
  } = flatStyle;

  const contentStyle: any = {
    padding: noPadding ? 0 : 20,
  };
  if (flexDirection) contentStyle.flexDirection = flexDirection;
  if (alignItems) contentStyle.alignItems = alignItems;
  if (justifyContent) contentStyle.justifyContent = justifyContent;
  if (gap) contentStyle.gap = gap;
  if (rowGap) contentStyle.rowGap = rowGap;
  if (columnGap) contentStyle.columnGap = columnGap;
  if (flexWrap) contentStyle.flexWrap = flexWrap;
  if (alignContent) contentStyle.alignContent = alignContent;

  const cardContent = (
    <View style={[
      {
        borderRadius: gradientBorder ? 18 : 20,
        borderWidth: gradientBorder ? 0 : 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
        overflow: 'hidden',
      },
      containerStyle,
    ]}>
      <BlurView intensity={isDark ? 20 : 35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top shine */}
      <LinearGradient
        colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'transparent'] : ['rgba(255, 255, 255, 0.4)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { height: '60%' }]}
      />
      {/* Inner gradient overlay for depth (gradient variant) */}
      {variant === 'gradient' && (
        <LinearGradient
          colors={isDark
            ? ['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.05)', 'transparent']
            : ['rgba(139, 92, 246, 0.08)', 'rgba(6, 182, 212, 0.03)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );

  if (gradientBorder) {
    return (
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.5)', 'rgba(6, 182, 212, 0.5)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 1,
        }}
      >
        {cardContent}
      </LinearGradient>
    );
  }

  return cardContent;
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
  shadowDelay = 800,
}: {
  onPress: () => void;
  title: string;
  subtitle?: string;
  colors?: GradientTuple;
  style?: any;
  disabled?: boolean;
  shadowDelay?: number;
}) => {
  const { isDark } = useOnboardingTheme();
  const [showShadow, setShowShadow] = React.useState(false);

  // Delay shadow appearance to after fade-in animation
  React.useEffect(() => {
    const timer = setTimeout(() => setShowShadow(true), shadowDelay);
    return () => clearTimeout(timer);
  }, [shadowDelay]);

  // Get accent color from gradient for subtle tint
  const accentColor = colors[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      disabled={disabled}
      style={[style, {
        borderRadius: 20,
        ...(showShadow && {
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }),
      }]}
    >
      <View style={{
        borderRadius: 20,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
      }}>
        {/* Base blur layer */}
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        {/* Subtle color tint */}
        <LinearGradient
          colors={isDark
            ? [`${accentColor}25`, `${accentColor}15`]
            : [`${accentColor}20`, `${accentColor}10`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glass base - more opaque to hide shadow */}
        <LinearGradient
          colors={isDark
            ? ['rgba(40, 40, 50, 0.95)', 'rgba(30, 30, 40, 0.9)']
            : ['rgba(255, 255, 255, 0.98)', 'rgba(245, 245, 250, 0.95)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top shine for 3D effect */}
        <LinearGradient
          colors={isDark
            ? ['rgba(255, 255, 255, 0.2)', 'transparent']
            : ['rgba(255, 255, 255, 0.9)', 'transparent']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { height: '50%' }]}
        />

        {/* Bottom shadow for depth */}
        <LinearGradient
          colors={['transparent', isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { top: '50%' }]}
        />

        <View style={{ padding: 18, alignItems: 'center' }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1a1a2e',
            letterSpacing: 0.3,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: 13,
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              marginTop: 4,
            }}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// WHITE GLASS BUTTON (Light glassy style)
// ============================================

export const WhiteGlassButton = ({
  onPress,
  title,
  style,
  disabled = false,
  shadowDelay = 800,
}: {
  onPress: () => void;
  title: string;
  style?: any;
  disabled?: boolean;
  shadowDelay?: number;
}) => {
  const { isDark } = useOnboardingTheme();
  const [showShadow, setShowShadow] = React.useState(false);

  // Delay shadow appearance to after fade-in animation
  React.useEffect(() => {
    const timer = setTimeout(() => setShowShadow(true), shadowDelay);
    return () => clearTimeout(timer);
  }, [shadowDelay]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={[style, {
        borderRadius: 20,
        ...(showShadow && {
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 16,
          elevation: 8,
        }),
      }]}
    >
      <View style={{
        borderRadius: 20,
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      }}>
        {/* Base blur layer */}
        <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />

        {/* Glass base */}
        <LinearGradient
          colors={isDark
            ? ['rgba(255, 255, 255, 0.98)', 'rgba(240, 240, 245, 0.95)']
            : ['rgba(20, 20, 30, 0.98)', 'rgba(30, 30, 40, 0.95)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top shine for 3D effect */}
        <LinearGradient
          colors={isDark
            ? ['rgba(255, 255, 255, 0.5)', 'transparent']
            : ['rgba(255, 255, 255, 0.15)', 'transparent']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { height: '50%' }]}
        />

        {/* Bottom shadow for depth */}
        <LinearGradient
          colors={['transparent', isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.2)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { top: '50%' }]}
        />

        <View style={{ padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: isDark ? '#1a1a2e' : '#FFFFFF',
            letterSpacing: 0.3,
            marginRight: 8,
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: isDark ? '#1a1a2e' : '#FFFFFF',
          }}>
            {'>'}
          </Text>
        </View>
      </View>
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
  const { colors, isDark } = useOnboardingTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: selected ? 0 : 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
      }}
    >
      {selected ? (
        <>
          <LinearGradient
            colors={[COLORS.gradientPurple, COLORS.gradientBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Top shine */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={[StyleSheet.absoluteFill, { height: '60%' }]}
          />
        </>
      ) : (
        <>
          <BlurView intensity={isDark ? 20 : 35} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Top shine */}
          <LinearGradient
            colors={isDark ? ['rgba(255, 255, 255, 0.06)', 'transparent'] : ['rgba(255, 255, 255, 0.4)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={[StyleSheet.absoluteFill, { height: '60%' }]}
          />
        </>
      )}
      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: selected ? '#FFFFFF' : colors.textSecondary,
        }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
