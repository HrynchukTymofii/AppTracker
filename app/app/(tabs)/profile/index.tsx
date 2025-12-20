import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { useAuth, UserType } from "@/context/AuthContext";
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  LucideIcon,
  Mails,
  Settings,
  Star,
  Trophy,
  LogOut,
  User,
  Target,
  Crown,
  ThumbsUp,
  Sun,
  Moon,
  Shield,
  Calendar,
  Clock,
  Zap,
  Award,
  Layers,
  Flame,
  Heart,
  TrendingDown,
  Sunrise,
  Rocket,
  Lock,
  Sparkles,
  Activity,
  ShieldCheck,
  ChevronRight,
  Brain,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getUserData } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";
import { useCourseDatabase } from "@/lib/db/course";
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import { ContactDialog } from "@/components/modals/ContactDialog";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export interface Achievement {
  id: number | string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  color: string;
}

const AchievementBadge = ({
  achievement,
  isDark,
}: {
  achievement: Achievement;
  isDark: boolean;
}) => {
  const Icon = achievement.icon;

  return (
    <View
      style={{
        width: "31%",
        borderRadius: 16,
        backgroundColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff"
          : isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? achievement.color + "40"
          : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        opacity: achievement.unlocked ? 1 : 0.5,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: achievement.unlocked
            ? achievement.color + "20"
            : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          borderWidth: 2,
          borderColor: achievement.unlocked
            ? achievement.color
            : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        <Icon
          size={24}
          color={
            achievement.unlocked
              ? achievement.color
              : isDark ? "#64748b" : "#94a3b8"
          }
          strokeWidth={2.5}
        />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: achievement.unlocked
            ? isDark ? "#ffffff" : "#111827"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
          lineHeight: 13,
        }}
      >
        {achievement.title}
      </Text>

      {achievement.unlocked && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#10B981",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={14} color="#ffffff" fill="#10B981" strokeWidth={3} />
        </View>
      )}
    </View>
  );
};

function getDynamicAchievements(t: any, stats: {
  blockedAppsCount: number;
  focusSessionsCount: number;
  tasksCompleted: number;
  schedulesCount: number;
  currentStreak: number;
  maxFocusDuration: number;
  healthScore: number;
  totalAppsBlocked: number;
  weekendBlockingDays: number;
  focusSessionsToday: number;
  morningBlockingStreak: number;
  screenTimeReduction: number;
}) {
  return [
    {
      id: 'firstBlock',
      title: t('achievements.list.firstBlock.title'),
      description: t('achievements.list.firstBlock.description'),
      icon: Target,
      unlocked: stats.blockedAppsCount >= 1,
      color: "#3b82f6",
    },
    {
      id: 'focusBeginner',
      title: t('achievements.list.focusBeginner.title'),
      description: t('achievements.list.focusBeginner.description'),
      icon: CheckCircle,
      unlocked: stats.focusSessionsCount >= 1,
      color: "#10b981",
    },
    {
      id: 'taskMaster',
      title: t('achievements.list.taskMaster.title'),
      description: t('achievements.list.taskMaster.description'),
      icon: Trophy,
      unlocked: stats.tasksCompleted >= 1,
      color: "#f59e0b",
    },
    {
      id: 'earlyBird',
      title: t('achievements.list.earlyBird.title'),
      description: t('achievements.list.earlyBird.description'),
      icon: Sun,
      unlocked: false,
      color: "#f97316",
    },
    {
      id: 'nightOwl',
      title: t('achievements.list.nightOwl.title'),
      description: t('achievements.list.nightOwl.description'),
      icon: Moon,
      unlocked: false,
      color: "#6366f1",
    },
    {
      id: 'discipline',
      title: t('achievements.list.discipline.title'),
      description: t('achievements.list.discipline.description'),
      icon: Star,
      unlocked: stats.currentStreak >= 7,
      color: "#8b5cf6",
    },
  ];
}

// Settings menu item component
const SettingsItem = ({
  icon: Icon,
  label,
  onPress,
  isDark,
  color = isDark ? "#ffffff" : "#111827",
  bgColor,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  isDark: boolean;
  color?: string;
  bgColor?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      backgroundColor: bgColor || (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color === "#ef4444"
          ? "rgba(239, 68, 68, 0.15)"
          : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}
    >
      <Icon size={22} color={color} strokeWidth={2} />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: color,
      }}
    >
      {label}
    </Text>
    <ChevronRight size={22} color={isDark ? "#6b7280" : "#9ca3af"} />
  </TouchableOpacity>
);

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
        const stats = {
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
        };

        setAchievementStats(stats);
        setAchievements(getDynamicAchievements(t, stats));
      })();
    }, [t])
  );

  useEffect(() => {
    const loadAnswers = async () => {
      const stored = await SecureStore.getItemAsync("onboardingAnswers");
      if (stored) setAnswers(JSON.parse(stored));
      else setAnswers({ name: user?.name || "Student" });
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
          backgroundColor: isDark ? "#000000" : "#ffffff",
        }}
      >
        <GraduationCap3DLoader />
        <Text
          style={{
            marginTop: 20,
            fontSize: 16,
            color: isDark ? "#9ca3af" : "#6b7280",
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
          backgroundColor: isDark ? "#000000" : "#ffffff",
        }}
      >
        <Text style={{ color: "#ef4444", fontSize: 16, marginBottom: 4 }}>
          {t('profile.errorLoading')}
        </Text>
        {error && (
          <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>{error}</Text>
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with centered avatar */}
        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 32 }}>
          {/* Avatar */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: isDark ? "#3b82f6" : "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#3b82f6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                }}
              />
            ) : answers["avatar"] ? (
              <Text style={{ fontSize: 44 }}>{answers["avatar"]}</Text>
            ) : (
              <Text
                style={{ color: "#ffffff", fontSize: 36, fontWeight: "bold" }}
              >
                {initials}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            {user.name}
          </Text>

          {/* Email */}
          <Text
            style={{
              fontSize: 15,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {user.email}
          </Text>

          {/* Pro Badge */}
          {user.isPro && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(251, 191, 36, 0.1)",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#fbbf24",
              }}
            >
              <Crown size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#fbbf24",
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
            style={{ marginBottom: 24 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Trophy size={20} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {t('profile.achievements')}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginRight: 6,
                  }}
                >
                  {t('profile.viewAll')}
                </Text>
                <ChevronRight size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
              </View>
            </View>

            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
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

          {/* Settings Section */}
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Settings size={20} color={isDark ? "#9ca3af" : "#6b7280"} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {t('common.settings')}
              </Text>
            </View>

            <SettingsItem
              icon={User}
              label={t('profile.editProfile')}
              onPress={() => router.push("/edit-profile")}
              isDark={isDark}
            />

            <SettingsItem
              icon={Settings}
              label={t('common.settings')}
              onPress={() => router.push("/settings")}
              isDark={isDark}
            />

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
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#ef4444",
              marginTop: 8,
            }}
          >
            <LogOut size={22} color="#ef4444" strokeWidth={2} />
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
    </SafeAreaView>
  );
}
