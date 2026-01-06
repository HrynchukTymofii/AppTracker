import React from "react";
import { View, Text } from "react-native";
import { Star, Award, Crown, Diamond } from "lucide-react-native";
import { Achievement } from "./achievements";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";

interface AchievementBadgeProps {
  achievement: Achievement;
  isDark: boolean;
  isFullPage?: boolean;
}

// Get multicolor gradient colors based on achievement color
const getGlowingGradient = (color: string): [string, string, string] => {
  const gradientMap: Record<string, [string, string, string]> = {
    '#10b981': ['#10b981', '#06b6d4', '#0ea5e9'], // Green -> Cyan -> Sky
    '#3b82f6': ['#6366f1', '#8b5cf6', '#a855f7'], // Indigo -> Purple -> Violet
    '#8b5cf6': ['#8b5cf6', '#a855f7', '#ec4899'], // Purple -> Violet -> Pink
    '#f59e0b': ['#f59e0b', '#f97316', '#ef4444'], // Amber -> Orange -> Red
    '#ef4444': ['#ef4444', '#f97316', '#fbbf24'], // Red -> Orange -> Yellow
    '#ec4899': ['#ec4899', '#f472b6', '#a855f7'], // Pink -> Light Pink -> Violet
    '#06b6d4': ['#06b6d4', '#0ea5e9', '#3b82f6'], // Cyan -> Sky -> Blue
    '#84cc16': ['#84cc16', '#22c55e', '#10b981'], // Lime -> Green -> Emerald
    '#6366f1': ['#6366f1', '#8b5cf6', '#c084fc'], // Indigo -> Purple -> Light Purple
    '#f43f5e': ['#f43f5e', '#ec4899', '#d946ef'], // Rose -> Pink -> Fuchsia
    '#14b8a6': ['#14b8a6', '#10b981', '#22c55e'], // Teal -> Emerald -> Green
    '#a855f7': ['#a855f7', '#d946ef', '#ec4899'], // Violet -> Fuchsia -> Pink
    '#64748b': ['#64748b', '#475569', '#6b7280'], // Slate shades
    '#0ea5e9': ['#0ea5e9', '#06b6d4', '#14b8a6'], // Sky -> Cyan -> Teal
    '#f97316': ['#f97316', '#fb923c', '#fbbf24'], // Orange shades
    '#fbbf24': ['#fbbf24', '#f59e0b', '#f97316'], // Yellow -> Amber -> Orange
    '#fb923c': ['#fb923c', '#f97316', '#ef4444'], // Light Orange -> Orange -> Red
  };
  return gradientMap[color] || ['#6366f1', '#8b5cf6', '#a855f7'];
};

// Pentagon SVG shape component with gradient fill
const PentagonShape = ({
  size,
  gradientColors,
  unlocked,
  isDark,
  achievementId,
}: {
  size: number;
  gradientColors: [string, string, string];
  unlocked: boolean;
  isDark: boolean;
  achievementId: string;
}) => {
  // Pentagon path for a 100x100 viewBox
  const pentagonPath = "M50 8 L92 35 L78 88 L22 88 L8 35 Z";
  const innerPentagonPath = "M50 15 L85 38 L73 82 L27 82 L15 38 Z";
  const gradientId = `grad-${achievementId}-${gradientColors[0].replace('#', '')}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Main gradient for fill */}
        <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={unlocked ? gradientColors[0] : isDark ? '#2a2a2a' : '#d4d4d4'} stopOpacity={unlocked ? 0.95 : 0.5} />
          <Stop offset="50%" stopColor={unlocked ? gradientColors[1] : isDark ? '#1f1f1f' : '#c4c4c4'} stopOpacity={unlocked ? 0.9 : 0.4} />
          <Stop offset="100%" stopColor={unlocked ? gradientColors[2] : isDark ? '#1a1a1a' : '#b4b4b4'} stopOpacity={unlocked ? 0.85 : 0.3} />
        </SvgLinearGradient>
        {/* Border gradient */}
        <SvgLinearGradient id={`${gradientId}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="50%" stopColor={gradientColors[1]} />
          <Stop offset="100%" stopColor={gradientColors[2]} />
        </SvgLinearGradient>
      </Defs>

      {/* Main pentagon fill */}
      <Path
        d={pentagonPath}
        fill={`url(#${gradientId})`}
        stroke={unlocked ? `url(#${gradientId}-border)` : isDark ? '#3a3a3a' : '#d4d4d4'}
        strokeWidth="2"
        opacity={unlocked ? 1 : 0.5}
      />

      {/* Inner shine/highlight effect */}
      {unlocked && (
        <Path
          d={innerPentagonPath}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      )}

      {/* Top shine effect */}
      {unlocked && (
        <Path
          d="M50 15 L72 30 L65 28 L50 20 L35 28 L28 30 Z"
          fill="rgba(255,255,255,0.18)"
        />
      )}
    </Svg>
  );
};

// Get badge icon based on unlock tier
const getBadgeIcon = (index: number) => {
  if (index < 8) return Star;
  if (index < 16) return Diamond;
  return Crown;
};

export const AchievementBadge = ({
  achievement,
  isDark,
  isFullPage = false,
}: AchievementBadgeProps) => {
  const Icon = achievement.icon;
  const gradientColors = getGlowingGradient(achievement.color);
  const badgeSize = isFullPage ? 110 : 90;
  const iconSize = isFullPage ? 32 : 26;

  return (
    <View
      style={{
        width: isFullPage ? "48%" : "31%",
        alignItems: "center",
        marginBottom: isFullPage ? 20 : 12,
      }}
    >
      {/* Pentagon Badge Container */}
      <View
        style={{
          width: badgeSize,
          height: badgeSize,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Shadow glow layer for unlocked badges */}
        {achievement.unlocked && (
          <View
            style={{
              position: "absolute",
              width: badgeSize * 0.85,
              height: badgeSize * 0.85,
              borderRadius: badgeSize * 0.5,
              backgroundColor: `${gradientColors[1]}40`,
              opacity: 0.9,
            }}
          />
        )}
        {achievement.unlocked && (
          <View
            style={{
              position: "absolute",
              width: badgeSize * 1.1,
              height: badgeSize * 1.1,
              borderRadius: badgeSize * 0.6,
              backgroundColor: `${gradientColors[1]}20`,
              opacity: 0.7,
            }}
          />
        )}
        {/* Pentagon Shape */}
        <PentagonShape
          size={badgeSize}
          gradientColors={gradientColors}
          unlocked={achievement.unlocked}
          isDark={isDark}
          achievementId={String(achievement.id)}
        />

        {/* Icon centered in pentagon */}
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={iconSize}
            color={
              achievement.unlocked
                ? "#ffffff"
                : isDark
                  ? "#4a4a4a"
                  : "#9ca3af"
            }
            strokeWidth={2}
          />
        </View>

        {/* Small badge indicator in corner */}
        {achievement.unlocked && (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: isFullPage ? 5 : 0,
              width: isFullPage ? 24 : 20,
              height: isFullPage ? 24 : 20,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[gradientColors[0], gradientColors[1]]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <Star size={isFullPage ? 14 : 12} color="#ffffff" fill="#ffffff" />
          </View>
        )}
      </View>

      {/* Achievement Title */}
      <Text
        style={{
          fontSize: isFullPage ? 11 : 9,
          fontWeight: "700",
          color: achievement.unlocked
            ? isDark
              ? "#ffffff"
              : "#111827"
            : isDark
              ? "#4a4a4a"
              : "#9ca3af",
          textAlign: "center",
          marginTop: 6,
          lineHeight: isFullPage ? 14 : 11,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>

      {/* Description for full page view */}
      {isFullPage && (
        <Text
          style={{
            fontSize: 10,
            color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
            textAlign: "center",
            marginTop: 3,
            lineHeight: 12,
          }}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
      )}
    </View>
  );
};
