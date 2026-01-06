import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { X, Zap, Target, Camera, Dumbbell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { ExerciseType } from "@/lib/poseUtils";
import { getFavorites } from "@/lib/exerciseFavorites";
import { getExerciseDisplayInfo, EXERCISE_COLORS } from "@/lib/exerciseIcons";

interface QuickActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  iconAnims: Animated.Value[];
  textAnims: Animated.Value[];
}

interface MenuItemProps {
  iconAnim: Animated.Value;
  textAnim: Animated.Value;
  bottomPosition: number;
  translateYStart: number;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string, ...string[]];
  shadowColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  iconAnim,
  textAnim,
  bottomPosition,
  translateYStart,
  title,
  subtitle,
  gradientColors,
  shadowColor,
  icon,
  onPress,
}) => {
  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const iconTranslateY = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [translateYStart, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: bottomPosition,
        right: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        opacity: iconAnim,
        transform: [{ translateY: iconTranslateY }, { scale: iconScale }],
      }}
    >
      <Animated.View
        style={{
          opacity: textAnim,
          alignItems: "flex-end",
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontWeight: "700",
            fontSize: 16,
            marginBottom: 2,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 12,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {subtitle}
        </Text>
      </Animated.View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          overflow: "hidden",
          shadowColor: shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Default exercises to show if no favorites
const DEFAULT_EXERCISES: ExerciseType[] = ['pushups', 'squats', 'plank'];

// Helper to create exercise menu item
const createExerciseMenuItem = (type: ExerciseType, index: number, totalExercises: number) => {
  const info = getExerciseDisplayInfo(type);
  const colors = EXERCISE_COLORS[type];

  // Calculate positions based on index (from top of menu)
  const baseBottom = 220; // Base position for bottom item
  const spacing = 65; // Space between items
  const exerciseIndex = totalExercises - 1 - index; // Reverse for stacking
  const bottomPosition = baseBottom + (exerciseIndex + 2) * spacing; // +2 for Photo Task and Focus Mode
  const translateYStart = 40 + (exerciseIndex + 2) * 60;

  return {
    title: `${info?.emoji || ''} ${info?.label || type}`,
    subtitle: info?.description || '',
    gradientColors: [colors[0], colors[0], colors[1]] as const,
    shadowColor: colors[0],
    icon: <Dumbbell size={24} color="#ffffff" />,
    route: `/(tabs)/lockin?exercise=${type}`,
    bottomPosition,
    translateYStart,
  };
};

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isOpen,
  onToggle,
  iconAnims,
  textAnims,
}) => {
  const router = useRouter();
  const { accentColor } = useTheme();
  const [favorites, setFavorites] = useState<ExerciseType[]>([]);

  // Load favorites on mount and when menu opens
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, [isOpen]);

  const handleMenuItemPress = (route: string) => {
    onToggle();
    setTimeout(() => router.push(route as any), 300);
  };

  // Use favorites if available, otherwise use defaults
  const exercisesToShow = favorites.length > 0 ? favorites : DEFAULT_EXERCISES;

  // Build dynamic menu items
  const exerciseItems = exercisesToShow.map((type, idx) =>
    createExerciseMenuItem(type, idx, exercisesToShow.length)
  );

  // Static items (Photo Task and Focus Mode) - always at bottom
  const staticItems = [
    {
      title: "📸 Photo Task",
      subtitle: "Before/after photos • 1.5x bonus",
      gradientColors: ["#60a5fa", "#3b82f6", "#2563eb"] as const,
      shadowColor: "#3b82f6",
      icon: <Camera size={24} color="#ffffff" />,
      route: "/(tabs)/lockin?openVerified=true",
      bottomPosition: 285,
      translateYStart: 100,
    },
    {
      title: "🎯 Focus Mode",
      subtitle: "LockIn to earn screen time",
      gradientColors: ["#fbbf24", "#f59e0b", "#d97706"] as const,
      shadowColor: "#f59e0b",
      icon: <Target size={24} color="#ffffff" />,
      route: "/(tabs)/detox",
      bottomPosition: 220,
      translateYStart: 40,
    },
  ];

  // Combine exercises (reversed for display order) + static items
  const menuItems = [...exerciseItems.reverse(), ...staticItems];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onToggle}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
            }}
          />
        </TouchableOpacity>
      )}

      {/* Menu Items */}
      {isOpen &&
        menuItems.map((item, index) => (
          <MenuItem
            key={item.title}
            iconAnim={iconAnims[index]}
            textAnim={textAnims[index]}
            bottomPosition={item.bottomPosition}
            translateYStart={item.translateYStart}
            title={item.title}
            subtitle={item.subtitle}
            gradientColors={item.gradientColors}
            shadowColor={item.shadowColor}
            icon={item.icon}
            onPress={() => handleMenuItemPress(item.route)}
          />
        ))}

      {/* Main FAB */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 140,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: isOpen ? 1 : 0,
          borderColor: "rgba(255, 255, 255, 0.3)",
          shadowColor: isOpen ? "transparent" : accentColor.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: isOpen ? 0 : 8,
        }}
      >
        {isOpen ? (
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={28} color="#ffffff" strokeWidth={2} />
          </View>
        ) : (
          <LinearGradient
            colors={[accentColor.primary, accentColor.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={26} color="#ffffff" fill="#ffffff" />
          </LinearGradient>
        )}
      </TouchableOpacity>
    </>
  );
};

export default QuickActionMenu;
