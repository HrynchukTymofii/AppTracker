import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  PanResponder,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { useAuth, UserType } from "@/context/AuthContext";
import { useTranslation } from 'react-i18next';
import {
  Mails,
  Settings,
  Trophy,
  LogOut,
  Crown,
  ThumbsUp,
  Zap,
  Shield,
  Globe,
  Timer,
  ShieldCheck,
  ChevronRight,
  User,
  Sparkles,
  Flame,
  Target,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { getUserData } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import { ContactDialog } from "@/components/modals/ContactDialog";
import { DefaultBlockedItemsModal } from "@/components/modals/DefaultBlockedItemsModal";
import { getDefaultBlockedApps, getDefaultBlockedWebsites, getDefaultAppLimitMinutes, setDefaultAppLimitMinutes } from "@/lib/appBlocking";
import { getAchievementStats } from "@/lib/achievementTracking";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemedBackground } from "@/components/ui/ThemedBackground";

// Import extracted components
import {
  AchievementBadge,
  SettingsItem,
  getDynamicAchievements,
} from "@/components/profile";

export { Achievement } from "@/components/profile";

// Smooth Slider Component with PanResponder
interface SmoothSliderProps {
  value: number;
  minValue: number;
  maxValue: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  gradientColors: string[];
  isDark: boolean;
  minLabel: string;
  maxLabel: string;
}

const SmoothSlider: React.FC<SmoothSliderProps> = ({
  value,
  minValue,
  maxValue,
  onValueChange,
  onSlidingComplete,
  gradientColors,
  isDark,
  minLabel,
  maxLabel,
}) => {
  const sliderWidth = useRef(0);
  const sliderPageX = useRef(0);
  const sliderRef = useRef<View>(null);
  const currentValue = useRef(value);
  const animatedValue = useRef(new Animated.Value((value - minValue) / (maxValue - minValue))).current;

  // Store props in refs so PanResponder always has current values
  const propsRef = useRef({ minValue, maxValue, onValueChange, onSlidingComplete });
  propsRef.current = { minValue, maxValue, onValueChange, onSlidingComplete };

  useEffect(() => {
    // Update animated value when external value changes
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    animatedValue.setValue(normalizedValue);
    currentValue.current = value;
  }, [value, minValue, maxValue]);

  const updateValueFromPageX = (pageX: number) => {
    if (sliderWidth.current > 0) {
      const { minValue: min, maxValue: max, onValueChange: onChange } = propsRef.current;
      // Calculate x position relative to slider using pageX
      const x = pageX - sliderPageX.current;
      const percentage = Math.max(0, Math.min(1, x / sliderWidth.current));
      const newValue = Math.round(min + percentage * (max - min));
      currentValue.current = newValue;
      animatedValue.setValue(percentage);
      onChange(newValue);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        // Measure slider position right when touch starts
        if (sliderRef.current) {
          sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            sliderPageX.current = pageX;
            sliderWidth.current = width;
            updateValueFromPageX(evt.nativeEvent.pageX);
          });
        }
      },
      onPanResponderMove: (evt) => {
        updateValueFromPageX(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        const { onSlidingComplete: onComplete } = propsRef.current;
        if (onComplete) {
          onComplete(currentValue.current);
        }
      },
    })
  ).current;

  const handleLayout = (event: LayoutChangeEvent) => {
    sliderWidth.current = event.nativeEvent.layout.width;
    // Also measure the page position
    if (sliderRef.current) {
      sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
        sliderPageX.current = pageX;
      });
    }
  };

  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View
        ref={sliderRef}
        style={{
          height: 44,
          justifyContent: 'center',
        }}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={{
          height: 8,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
        }}>
          <Animated.View style={{
            height: '100%',
            width: progressWidth,
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: '100%',
              }}
            />
          </Animated.View>
          {/* Thumb Circle */}
          <Animated.View style={{
            position: 'absolute',
            top: -8,
            left: thumbPosition,
            marginLeft: -12,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: gradientColors[0],
            borderWidth: 3,
            borderColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }} />
        </View>
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{minLabel}</Text>
        <Text style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>{maxLabel}</Text>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { token, setToken, user, setUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [achievementStats, setAchievementStats] = useState({
    blockedAppsCount: 0,
    focusSessionsCount: 0,
    tasksCompleted: 0,
    schedulesCount: 0,
    currentStreak: 0,
    maxFocusDuration: 0,
    healthScore: 0,
    totalAppsBlocked: 0,
    weekendBlockingDays: 0,
    focusSessionsToday: 0,
    morningBlockingStreak: 0,
    screenTimeReduction: 0,
  });

  const [achievements, setAchievements] = useState(
    getDynamicAchievements(t, achievementStats)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Blocked items state
  const [showBlockedItemsModal, setShowBlockedItemsModal] = useState(false);
  const [defaultAppsCount, setDefaultAppsCount] = useState(0);
  const [defaultWebsitesCount, setDefaultWebsitesCount] = useState(0);

  // Default app limit state
  const [defaultAppLimit, setDefaultAppLimit] = useState(30);

  // Daily goal state
  const [dailyGoal, setDailyGoal] = useState(60);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.push({ pathname: "/login", params: { returnUrl: "/profile" } });
        return;
      }

      const load = async () => {
        try {
          setLoading(true);
          const res = await getUserData(token);
          if (res.success) {
            const mappedUser: UserType = {
              ...res.user,
              categories: res.user.league,
            };
            setUser(mappedUser);
          } else {
            setError(res.error || "Error loading data");
          }
        } catch {
          setError("An unexpected error occurred");
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [token])
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const storedStats = await getAchievementStats();
          const stats = {
            blockedAppsCount: storedStats.blockedAppsCount || 0,
            focusSessionsCount: storedStats.focusSessionsCount || 0,
            tasksCompleted: storedStats.tasksCompleted || 0,
            schedulesCount: storedStats.schedulesCount || 0,
            currentStreak: storedStats.currentStreak || 0,
            maxFocusDuration: storedStats.maxFocusDuration || 0,
            healthScore: storedStats.healthScore || 0,
            totalAppsBlocked: storedStats.totalAppsBlocked || 0,
            weekendBlockingDays: storedStats.weekendBlockingDays || 0,
            focusSessionsToday: storedStats.focusSessionsToday || 0,
            morningBlockingStreak: storedStats.morningBlockingStreak || 0,
            screenTimeReduction: storedStats.screenTimeReduction || 0,
          };

          setAchievementStats(stats);
          setAchievements(getDynamicAchievements(t, stats));
        } catch (error) {
          console.error('Error loading achievement stats:', error);
        }
      })();
    }, [t])
  );

  // Load blocked items counts, default app limit, and daily goal
  useFocusEffect(
    useCallback(() => {
      const loadBlockedItems = async () => {
        try {
          const [apps, websites, limit, storedGoal] = await Promise.all([
            getDefaultBlockedApps(),
            getDefaultBlockedWebsites(),
            getDefaultAppLimitMinutes(),
            SecureStore.getItemAsync("dailyGoal"),
          ]);
          setDefaultAppsCount(apps.length);
          setDefaultWebsitesCount(websites.length);
          setDefaultAppLimit(limit);
          if (storedGoal) {
            setDailyGoal(parseInt(storedGoal, 10));
          }
        } catch (error) {
          console.error('Error loading blocked items:', error);
        }
      };
      loadBlockedItems();
    }, [])
  );

  useEffect(() => {
    const loadAnswers = async () => {
      const stored = await SecureStore.getItemAsync("onboardingAnswers");
      if (stored) setAnswers(JSON.parse(stored));
      else setAnswers({ name: user?.name || "Achiever" });
    };
    loadAnswers();
  }, [user]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.replace("/login");
    Toast.show({
      type: "success",
      text1: t('profile.logOut'),
      position: "top",
      visibilityTime: 700,
    });
  };

  const handleRateUs = async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();

      if (isAvailable) {
        await StoreReview.requestReview();
        return;
      }

      if (Platform.OS === "ios") {
        const appStoreLink = "itms-apps://itunes.apple.com/app/6751187640";
        const webLink = "https://apps.apple.com/app/id6751187640";
        Linking.openURL(appStoreLink).catch(() => Linking.openURL(webLink));
      } else if (Platform.OS === "android") {
        const playStoreLink = "market://details?id=com.hrynchuk.pdrtests";
        const webLink = "https://play.google.com/store/apps/details?id=com.hrynchuk.satprepapp";
        Linking.openURL(playStoreLink).catch(() => Linking.openURL(webLink));
      }
    } catch (error) {
      console.error("Rate app error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to open app rating",
        position: "top",
        visibilityTime: 1000,
      });
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#000000" : "#f8fafc",
        }}
      >
        <GraduationCap3DLoader />
        <Text
          style={{
            marginTop: 20,
            fontSize: 15,
            color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
            fontWeight: "500",
          }}
        >
          {t('profile.loading')}
        </Text>
      </View>
    );
  }

  if (error || !user)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          backgroundColor: isDark ? "#000000" : "#f8fafc",
        }}
      >
        <Text style={{ color: "#ef4444", fontSize: 16, marginBottom: 4, fontWeight: "600" }}>
          {t('profile.errorLoading')}
        </Text>
        {error && (
          <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b" }}>{error}</Text>
        )}
      </View>
    );

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              letterSpacing: -0.5,
            }}
          >
            {t('tabs.profile')}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Settings size={22} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            marginBottom: 28,
            borderRadius: 24,
            padding: 28,
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            borderWidth: 0.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.2 : 0.06,
            shadowRadius: 24,
            elevation: 3,
          }}
        >
          <LinearGradient
            colors={isDark
              ? ["rgba(59, 130, 246, 0.15)", "rgba(59, 130, 246, 0.05)", "transparent"]
              : ["rgba(59, 130, 246, 0.10)", "rgba(59, 130, 246, 0.03)", "transparent"]
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

          {/* Avatar */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              overflow: "hidden",
              shadowColor: "#3b82f6",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
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
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 32,
                }}
              />
            ) : answers["avatar"] ? (
              <Text style={{ fontSize: 44 }}>{answers["avatar"]}</Text>
            ) : (
              <Text
                style={{ color: "#ffffff", fontSize: 36, fontWeight: "700" }}
              >
                {initials}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              textAlign: "center",
              marginBottom: 6,
              letterSpacing: -0.5,
            }}
          >
            {user.name}
          </Text>

          {/* Email */}
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {user.email}
          </Text>

          {/* Stats Row - Streak, Sessions, Tasks */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginBottom: 20,
              paddingHorizontal: 16,
            }}
          >
            {/* Streak */}
            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(251, 146, 60, 0.1)" : "rgba(251, 146, 60, 0.08)",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(251, 146, 60, 0.2)" : "rgba(251, 146, 60, 0.15)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Flame size={18} color="#f97316" fill="#f97316" />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: "#f97316",
                    marginLeft: 6,
                  }}
                >
                  {achievementStats.currentStreak}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t('profile.streak') || 'Streak'}
              </Text>
            </View>

            {/* Focus Sessions */}
            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Zap size={18} color="#3b82f6" />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: "#3b82f6",
                    marginLeft: 6,
                  }}
                >
                  {achievementStats.focusSessionsCount}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t('profile.sessions') || 'Sessions'}
              </Text>
            </View>

            {/* Tasks */}
            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Trophy size={18} color="#10b981" />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: "#10b981",
                    marginLeft: 6,
                  }}
                >
                  {achievementStats.tasksCompleted}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {t('profile.tasks') || 'Tasks'}
              </Text>
            </View>
          </View>

          {/* Pro Badge */}
          {user.isPro && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 0.5,
                borderColor: "rgba(251, 191, 36, 0.3)",
              }}
            >
              <LinearGradient
                colors={["rgba(251, 191, 36, 0.15)", "rgba(251, 191, 36, 0.05)"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Sparkles size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#fbbf24",
                  letterSpacing: 0.3,
                }}
              >
                {t('profile.proMember')}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 20 }}>
          {/* Achievements Card */}
          <TouchableOpacity
            onPress={() => router.push("/achievements")}
            activeOpacity={0.9}
            style={{ marginBottom: 28 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Trophy size={16} color="#ffffff" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.3,
                  }}
                >
                  {t('profile.achievements')}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                    marginRight: 6,
                    fontWeight: "500",
                  }}
                >
                  {t('profile.viewAll')}
                </Text>
                <ChevronRight size={16} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
              </View>
            </View>

            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                borderRadius: 20,
                padding: 18,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {achievements.slice(0, 3).map((ach) => (
                  <AchievementBadge
                    key={ach.id}
                    achievement={ach}
                    isDark={isDark}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily Screen Time Goal Section */}
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Target size={16} color="#ffffff" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.3,
                  }}
                >
                  Daily Goal
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                borderRadius: 18,
                padding: 18,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                  marginBottom: 18,
                }}
              >
                How much screen time do you want to earn per day?
              </Text>

              {/* Current Value Display */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: '#10b981',
                    textAlign: 'center',
                  }}>
                    {dailyGoal >= 60
                      ? `${Math.floor(dailyGoal / 60)}h ${dailyGoal % 60 > 0 ? `${dailyGoal % 60}m` : ''}`
                      : `${dailyGoal}m`}
                  </Text>
                </View>
              </View>

              {/* Smooth Slider */}
              <SmoothSlider
                value={dailyGoal}
                minValue={15}
                maxValue={180}
                onValueChange={setDailyGoal}
                onSlidingComplete={async (val) => {
                  await SecureStore.setItemAsync("dailyGoal", val.toString());
                  Toast.show({
                    type: "success",
                    text1: "Daily goal updated",
                    position: "top",
                    visibilityTime: 1500,
                  });
                }}
                gradientColors={['#10b981', '#059669']}
                isDark={isDark}
                minLabel="15 min"
                maxLabel="3 hours"
              />
            </View>
          </View>

          {/* Blocked Apps & Websites Section */}
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#3b82f6", "#1d4ed8"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Shield size={16} color="#ffffff" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.3,
                  }}
                >
                  {t('profile.blockedItems') || "Blocked Items"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowBlockedItemsModal(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                borderRadius: 18,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <ShieldCheck size={24} color="#3b82f6" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: isDark ? "#ffffff" : "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  {t('profile.defaultBlockedItems') || "Default Blocked Items"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Shield size={14} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} style={{ marginRight: 5 }} strokeWidth={1.5} />
                    <Text style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", fontWeight: "500" }}>
                      {defaultAppsCount} {t('profile.apps') || "apps"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Globe size={14} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} style={{ marginRight: 5 }} strokeWidth={1.5} />
                    <Text style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", fontWeight: "500" }}>
                      {defaultWebsitesCount} {t('profile.websites') || "websites"}
                    </Text>
                  </View>
                </View>
              </View>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#cbd5e1"} strokeWidth={1.5} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 12,
                color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8",
                marginTop: 10,
                paddingHorizontal: 4,
              }}
            >
              {t('profile.blockedItemsDesc') || "These are pre-selected when creating new schedules"}
            </Text>
          </View>

          {/* Default App Limit Section */}
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#f59e0b", "#d97706"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Timer size={16} color="#ffffff" strokeWidth={2} />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                    letterSpacing: -0.3,
                  }}
                >
                  {t('profile.defaultAppLimit') || "Default App Limit"}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                borderRadius: 18,
                padding: 18,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.03,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                  marginBottom: 18,
                }}
              >
                {t('profile.defaultAppLimitDesc') || "New apps will use this time limit by default"}
              </Text>

              {/* Current Value Display */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}>
                  <Text style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: '#f59e0b',
                    textAlign: 'center',
                  }}>
                    {defaultAppLimit >= 60
                      ? `${Math.floor(defaultAppLimit / 60)}h ${defaultAppLimit % 60 > 0 ? `${defaultAppLimit % 60}m` : ''}`
                      : `${defaultAppLimit}m`}
                  </Text>
                </View>
              </View>

              {/* Smooth Slider */}
              <SmoothSlider
                value={defaultAppLimit}
                minValue={1}
                maxValue={120}
                onValueChange={setDefaultAppLimit}
                onSlidingComplete={async (val) => {
                  await setDefaultAppLimitMinutes(val);
                  Toast.show({
                    type: "success",
                    text1: t('profile.limitUpdated') || "Default limit updated",
                    position: "top",
                    visibilityTime: 1500,
                  });
                }}
                gradientColors={['#f59e0b', '#d97706']}
                isDark={isDark}
                minLabel="1 min"
                maxLabel="2 hours"
              />
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#8b5cf6", "#6d28d9"]}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <Zap size={16} color="#ffffff" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#0f172a",
                  letterSpacing: -0.3,
                }}
              >
                {t('profile.quickActions')}
              </Text>
            </View>

            <SettingsItem
              icon={Mails}
              label={t('profile.contactUs')}
              onPress={() => setContactOpen(true)}
              isDark={isDark}
            />

            <SettingsItem
              icon={ThumbsUp}
              label={t('profile.rateUs')}
              onPress={handleRateUs}
              isDark={isDark}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={{
              borderRadius: 18,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 0.5,
              borderColor: "rgba(239, 68, 68, 0.3)",
              marginTop: 12,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={isDark
                ? ["rgba(239, 68, 68, 0.12)", "rgba(239, 68, 68, 0.06)"]
                : ["rgba(239, 68, 68, 0.08)", "rgba(239, 68, 68, 0.04)"]
              }
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <LogOut size={20} color="#ef4444" strokeWidth={2} />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 16,
                fontWeight: "700",
                color: "#ef4444",
              }}
            >
              {t('profile.logOut')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ContactDialog
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        isDark={isDark}
      />

      <DefaultBlockedItemsModal
        visible={showBlockedItemsModal}
        onClose={() => setShowBlockedItemsModal(false)}
        onSave={async () => {
          // Reload counts after saving
          const [apps, websites] = await Promise.all([
            getDefaultBlockedApps(),
            getDefaultBlockedWebsites(),
          ]);
          setDefaultAppsCount(apps.length);
          setDefaultWebsitesCount(websites.length);
        }}
        isDark={isDark}
      />
      </SafeAreaView>
    </ThemedBackground>
  );
}
