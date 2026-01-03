import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Camera, ChevronRight, Sparkles } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

interface QuickActionsProps {
  isDark: boolean;
  onQuickStart: () => void;
  onVerifiedStart: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isDark,
  onQuickStart,
  onVerifiedStart,
}) => {
  const { accentColor } = useTheme();

  const ActionCard = ({
    icon: Icon,
    gradientColors,
    title,
    subtitle,
    badge,
    badgeGradient,
    onPress,
    isPrimary = false,
  }: {
    icon: any;
    gradientColors: [string, string];
    title: string;
    subtitle: string;
    badge?: string;
    badgeGradient?: [string, string];
    onPress: () => void;
    isPrimary?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isPrimary
          ? `rgba(${accentColor.rgb}, 0.3)`
          : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)"),
        shadowColor: isPrimary ? accentColor.primary : "#000",
        shadowOffset: { width: 0, height: isPrimary ? 8 : 4 },
        shadowOpacity: isPrimary ? 0.3 : (isDark ? 0.15 : 0.06),
        shadowRadius: isPrimary ? 20 : 12,
        elevation: isPrimary ? 8 : 3,
      }}
    >
      {/* Inner gradient background */}
      <LinearGradient
        colors={isPrimary
          ? (isDark ? [`rgba(${accentColor.rgb}, 0.15)`, `rgba(${accentColor.rgb}, 0.05)`] : [`rgba(${accentColor.rgb}, 0.1)`, `rgba(${accentColor.rgb}, 0.02)`])
          : (isDark ? ["rgba(255, 255, 255, 0.03)", "rgba(255, 255, 255, 0.01)"] : ["#ffffff", "#f9fafb"])
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      {/* Icon with gradient */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
          overflow: "hidden",
          shadowColor: gradientColors[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <Icon size={26} color="#ffffff" strokeWidth={2} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#0f172a",
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
          {badge && badgeGradient && (
            <View
              style={{
                marginLeft: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={badgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Sparkles size={10} color="#ffffff" style={{ marginRight: 4 }} />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {badge}
                </Text>
              </View>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 13,
            color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* Arrow */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronRight
          size={18}
          color={isDark ? "rgba(255,255,255,0.4)" : "#cbd5e1"}
          strokeWidth={2}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <ActionCard
        icon={Zap}
        gradientColors={[accentColor.primary, accentColor.dark]}
        title="Quick LockIn"
        subtitle="Block distractions instantly"
        onPress={onQuickStart}
        isPrimary
      />
    </View>
  );
};

export default QuickActions;
