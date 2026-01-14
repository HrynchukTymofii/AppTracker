import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Image } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { X, Zap, Target, Camera, Dumbbell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { ExerciseType } from "@/lib/poseUtils";
import { getFavorites } from "@/lib/exerciseFavorites";
import { getExerciseDisplayInfo, getExerciseIcon, EXERCISE_COLORS } from "@/lib/exerciseIcons";

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
  isImage?: boolean;
  onPress: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
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
  isImage,
  onPress,
  disabled,
  comingSoon,
}) => {
  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  const iconTranslateY = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [translateYStart, 0],
  });

  const ButtonComponent = disabled ? View : TouchableOpacity;
  const buttonProps = disabled ? {} : { onPress, activeOpacity: 0.8 };

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {comingSoon && (
            <View
              style={{
                backgroundColor: "rgba(251, 191, 36, 0.3)",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "rgba(251, 191, 36, 0.5)",
              }}
            >
              <Text
                style={{
                  color: "#fbbf24",
                  fontSize: 9,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                Soon
              </Text>
            </View>
          )}
          <Text
            style={{
              color: disabled ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
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
        </View>
        <Text
          style={{
            color: disabled ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.7)",
            fontSize: 12,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {subtitle}
        </Text>
      </Animated.View>

      <ButtonComponent
        {...buttonProps}
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          overflow: "hidden",
          shadowColor: disabled ? "transparent" : shadowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: disabled ? 0 : 0.5,
          shadowRadius: 12,
          elevation: disabled ? 0 : 8,
          borderWidth: isImage ? 2 : 0,
          borderColor: isImage ? gradientColors[0] : "transparent",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {isImage ? (
          <View style={{ flex: 1 }}>
            {icon}
          </View>
        ) : (
          <LinearGradient
            colors={disabled ? ["#6b7280", "#4b5563", "#374151"] as const : gradientColors}
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
        )}
      </ButtonComponent>
    </Animated.View>
  );
};

// Default exercises to show if no favorites
const DEFAULT_EXERCISES: ExerciseType[] = ['pushups', 'squats', 'plank'];

// Map exercise type (kebab-case) to translation key (camelCase)
const exerciseTypeToTranslationKey: Record<ExerciseType, string> = {
  'pushups': 'pushups',
  'squats': 'squats',
  'plank': 'plank',
  'jumping-jacks': 'jumpingJacks',
  'lunges': 'lunges',
  'crunches': 'crunches',
  'shoulder-press': 'shoulderPress',
  'leg-raises': 'legRaises',
  'high-knees': 'highKnees',
  'pull-ups': 'pullUps',
  'wall-sit': 'wallSit',
  'side-plank': 'sidePlank',
};

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isOpen,
  onToggle,
  iconAnims,
  textAnims,
}) => {
  const router = useRouter();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<ExerciseType[]>([]);

  // Load favorites on mount and when menu opens
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, [isOpen]);

  const handleMenuItemPress = (route: string) => {
    onToggle();
    setTimeout(() => router.push(route as any), 300);
  };

  // Helper to create exercise menu item with translations
  const createExerciseMenuItem = (type: ExerciseType, index: number, totalExercises: number) => {
    const info = getExerciseDisplayInfo(type);
    const iconInfo = getExerciseIcon(type);
    const colors = EXERCISE_COLORS[type];
    const translationKey = exerciseTypeToTranslationKey[type];

    // Calculate positions based on index (from top of menu)
    const baseBottom = 220; // Base position for bottom item
    const spacing = 65; // Space between items
    const exerciseIndex = totalExercises - 1 - index; // Reverse for stacking
    const bottomPosition = baseBottom + (exerciseIndex + 2) * spacing; // +2 for Photo Task and Focus Mode
    const translateYStart = 40 + (exerciseIndex + 2) * 60;

    // Use image if available, otherwise use Dumbbell icon
    const iconElement = iconInfo.image ? (
      <Image
        source={iconInfo.image}
        style={{ width: "100%", height: "100%", borderRadius: 12 }}
        resizeMode="cover"
      />
    ) : (
      <Dumbbell size={24} color="#ffffff" />
    );

    return {
      title: iconInfo.image ? t(`exercise.${translationKey}.name`) : `${info?.emoji || ''} ${t(`exercise.${translationKey}.name`)}`,
      subtitle: t(`exercise.${translationKey}.description`),
      gradientColors: [colors[0], colors[0], colors[1]] as const,
      shadowColor: colors[0],
      icon: iconElement,
      isImage: !!iconInfo.image,
      route: `/(tabs)/lockin?exercise=${type}`,
      bottomPosition,
      translateYStart,
      disabled: false,
      comingSoon: false,
    };
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
      title: t("home.quickActions.photoTask"),
      subtitle: t("home.quickActions.photoTaskDesc"),
      gradientColors: ["#60a5fa", "#3b82f6", "#2563eb"] as const,
      shadowColor: "#3b82f6",
      icon: <Camera size={24} color="#ffffff" />,
      isImage: false,
      route: "",
      bottomPosition: 285,
      translateYStart: 100,
      disabled: true,
      comingSoon: true,
    },
    {
      title: t("home.quickActions.focusMode"),
      subtitle: t("home.quickActions.focusModeDesc"),
      gradientColors: ["#fbbf24", "#f59e0b", "#d97706"] as const,
      shadowColor: "#f59e0b",
      icon: <Target size={24} color="#ffffff" />,
      isImage: false,
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
            isImage={item.isImage}
            onPress={() => handleMenuItemPress(item.route)}
            disabled={item.disabled}
            comingSoon={item.comingSoon}
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
