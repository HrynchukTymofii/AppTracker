import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { MaterialIcons } from "@expo/vector-icons";
import {
  BookOpen,
  Brain,
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
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getUserData } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";
import { useCourseDatabase } from "@/lib/db/course";
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import { ContactDialog } from "@/components/modals/ContactDialog";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const AnimatedNumber = ({
  value,
  isDark,
}: {
  value: number;
  isDark: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentValue = Math.min(increment * currentStep, value);
      setDisplayValue(Math.round(currentValue));
      if (currentStep >= steps) clearInterval(timer);
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        color: isDark ? "#ffffff" : "#1f2937",
      }}
    >
      {displayValue}
    </Text>
  );
};

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
          ? isDark ? "rgba(255, 255, 255, 0.15)" : "#111827"
          : isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.03)",
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"
          : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: achievement.unlocked
            ? isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.9)"
            : isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon
          size={22}
          color={
            achievement.unlocked
              ? isDark ? "#ffffff" : "#111827"
              : isDark ? "#64748b" : "#94a3b8"
          }
          strokeWidth={2.5}
        />
      </View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: achievement.unlocked
            ? "#ffffff"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
        }}
      >
        {achievement.title}
      </Text>

      {achievement.unlocked && (
        <View
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#10B981",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={14} color="#ffffff" fill="#10B981" />
        </View>
      )}
    </View>
  );
};

function getDynamicAchievements({
  lessonsCount,
  quizzesCount,
  averageSatScore,
  has100Quiz,
  hasHighScore,
}: {
  lessonsCount: number;
  quizzesCount: number;
  averageSatScore: number;
  has100Quiz: boolean;
  hasHighScore: boolean;
}) {
  return [
    {
      id: 1,
      title: "First Steps",
      description: "Complete first lesson",
      icon: BookOpen,
      unlocked: lessonsCount >= 1,
      color: "cyan",
    },
    {
      id: 2,
      title: "High Scorer",
      description: "Score 700+ on SAT exam",
      icon: Trophy,
      unlocked: hasHighScore,
      color: "amber",
    },
    {
      id: 3,
      title: "Math Master",
      description: "Complete 10 quizzes",
      icon: Brain,
      unlocked: quizzesCount >= 10,
      color: "purple",
    },
    {
      id: 4,
      title: "Perfect Practice",
      description: "Score 100% on quiz",
      icon: Star,
      unlocked: has100Quiz,
      color: "green",
    },
  ];
}

export default function ProfileScreen() {
  const { token, setToken, user, setUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const {
    getCompletedLessonsCount,
    getCompletedQuizzesCount,
    getAverageScoreByChapter,
    hasPerfectScoreInPublishedChapters,
    hasHighSATScore,
  } = useCourseDatabase();

  const [lessonsCount, setLessonsCount] = useState(0);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [averageSatScore, setAverageSatScore] = useState(0);
  const [have100Quiz, setHave100Quiz] = useState(false);
  const [hasHighScore, setHasHighScore] = useState(false);
  const [achievements, setAchievements] = useState(
    getDynamicAchievements({
      lessonsCount: 0,
      quizzesCount: 0,
      averageSatScore: 0,
      has100Quiz: false,
      hasHighScore: false,
    })
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Load user data when page comes into focus
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

  // Load stats when page comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const SAT_EXAMS_CHAPTER_ID = "8d3703a4-41ce-46b0-a27c-e25c0a0702e2";

        const lessonsRes = await getCompletedLessonsCount();
        const quizzesRes = await getCompletedQuizzesCount();
        const avgSatScoreRes = await getAverageScoreByChapter(SAT_EXAMS_CHAPTER_ID);
        const have100 = await hasPerfectScoreInPublishedChapters();
        const highScoreRes = await hasHighSATScore(SAT_EXAMS_CHAPTER_ID);

        const newLessonsCount = lessonsRes.success ? (lessonsRes.count ?? 0) : 0;
        const newQuizzesCount = quizzesRes.success ? (quizzesRes.count ?? 0) : 0;
        const newAverageScore = avgSatScoreRes.success ? (avgSatScoreRes.average ?? 0) : 0;
        const newHasHighScore = highScoreRes.success ? (highScoreRes.hasHighScore ?? false) : false;

        setLessonsCount(newLessonsCount);
        setQuizzesCount(newQuizzesCount);
        setAverageSatScore(newAverageScore);
        setHave100Quiz(have100.hasPerfectScore || false);
        setHasHighScore(newHasHighScore);

        setAchievements(
          getDynamicAchievements({
            lessonsCount: newLessonsCount,
            quizzesCount: newQuizzesCount,
            averageSatScore: newAverageScore,
            has100Quiz: have100.hasPerfectScore || false,
            hasHighScore: newHasHighScore,
          })
        );
      })();
    }, [])
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
      text1: "You have logged out",
      position: "top",
      visibilityTime: 700,
    });
  };

  const handleRateUs = async () => {
    try {
      // First, check if in-app review is available
      const isAvailable = await StoreReview.isAvailableAsync();

      if (isAvailable) {
        // 🎯 Request in-app review (native popup)
        await StoreReview.requestReview();
        return;
      }

      // Fallback → open store page manually if in-app review not supported
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

  if (loading) return <GraduationCap3DLoader />;
  if (error || !user)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          backgroundColor: isDark ? "#111827" : "#f9fafb",
        }}
      >
        <Text style={{ color: "#ef4444", fontSize: 16, marginBottom: 4 }}>
          Error loading profile
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
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={{ padding: 20, paddingTop: 16 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
              borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 3,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  }}
                />
              ) : answers["avatar"] ? (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDark ? "#ffffff" : "#111827",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text style={{ fontSize: 36 }}>{answers["avatar"]}</Text>
                </View>
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDark ? "#ffffff" : "#111827",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{ color: isDark ? "#111827" : "#ffffff", fontSize: 28, fontWeight: "bold" }}
                  >
                    {initials}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {user.name}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? "#9ca3af" : "#6b7280",
                textAlign: "center",
              }}
            >
              {user.email}
            </Text>
            {user.isPro && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(251, 191, 36, 0.1)" : "#fef3c7",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginTop: 12,
                  alignSelf: "center",
                }}
              >
                <Crown
                  size={16}
                  color={isDark ? "#fbbf24" : "#d97706"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isDark ? "#fbbf24" : "#d97706",
                  }}
                >
                  PRO Member
                </Text>
              </View>
            )}
          </View>

          {/* Achievements */}
          <TouchableOpacity
            onPress={() => router.push("/achievements")}
            activeOpacity={0.9}
            style={{ marginTop: 24 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                Achievements
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginRight: 6,
                  }}
                >
                  View All
                </Text>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={14}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
            </View>
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                borderRadius: 20,
                padding: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 10,
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
                borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
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

          {/* Quick Actions */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginTop: 28,
              marginBottom: 12,
            }}
          >
            Settings
          </Text>

          <View
  style={{
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    borderRadius: 16, // same as button
  }}
>
  <TouchableOpacity
    onPress={() => router.push("/edit-profile")}
    activeOpacity={0.7}
    style={{
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
      borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
      borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
    }}
  >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <User size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Edit Profile
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDark ? "#64748b" : "#9ca3af"}
            />
          </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
              borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Settings size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Settings
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDark ? "#64748b" : "#9ca3af"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setContactOpen(true)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
              borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Mails size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Contact Us
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDark ? "#64748b" : "#9ca3af"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRateUs}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)",
              borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <ThumbsUp size={22} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Rate Us
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDark ? "#64748b" : "#9ca3af"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.15)",
              borderTopColor: isDark ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.2)",
              borderBottomColor: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <LogOut size={22} color="#ef4444" strokeWidth={2} />
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontWeight: "600",
                color: "#ef4444",
              }}
            >
              Log Out
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color="#ef4444"
            />
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
