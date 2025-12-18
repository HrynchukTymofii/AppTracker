import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  BookOpen,
  Brain,
  CheckCircle,
  LucideIcon,
  Star,
  Trophy,
  ArrowLeft,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCourseDatabase } from "@/lib/db/course";
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import {
  SafeAreaView,
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

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    cyan: { bg: "#06B6D4", text: "#ffffff", icon: "#ffffff" },
    purple: { bg: "#8B5CF6", text: "#ffffff", icon: "#ffffff" },
    amber: { bg: "#F59E0B", text: "#ffffff", icon: "#ffffff" },
    green: { bg: "#10B981", text: "#ffffff", icon: "#ffffff" },
  };

  const colors = colorMap[achievement.color] || colorMap.cyan;

  return (
    <View
      style={{
        width: "48%",
        borderRadius: 16,
        backgroundColor: achievement.unlocked
          ? colors.bg
          : isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "#e2e8f0",
        padding: 16,
        marginBottom: 16,
        alignItems: "center",
        opacity: achievement.unlocked ? 1 : 0.6,
        shadowColor: achievement.unlocked ? colors.bg : "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: achievement.unlocked ? 0.3 : 0.15,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1.5,
        borderColor: achievement.unlocked
          ? "rgba(255, 255, 255, 0.3)"
          : isDark
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(0, 0, 0, 0.08)",
        borderTopColor: achievement.unlocked
          ? "rgba(255, 255, 255, 0.5)"
          : isDark
            ? "rgba(255, 255, 255, 0.25)"
            : "rgba(255, 255, 255, 0.8)",
        borderBottomColor: achievement.unlocked
          ? "rgba(0, 0, 0, 0.1)"
          : isDark
            ? "rgba(0, 0, 0, 0.2)"
            : "rgba(0, 0, 0, 0.05)",
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: achievement.unlocked
            ? "rgba(255,255,255,0.2)"
            : isDark
              ? "#1e293b"
              : "#cbd5e1",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon
          size={28}
          color={
            achievement.unlocked ? colors.icon : isDark ? "#64748b" : "#94a3b8"
          }
        />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: achievement.unlocked
            ? colors.text
            : isDark
              ? "#94a3b8"
              : "#64748b",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {achievement.title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: achievement.unlocked
            ? "rgba(255,255,255,0.8)"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
        }}
      >
        {achievement.description}
      </Text>

      {achievement.unlocked && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 2,
          }}
        >
          <CheckCircle size={16} color="#10B981" />
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

export default function AchievementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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

  // Load stats when page comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
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

        setLoading(false);
      })();
    }, [])
  );

  if (loading) return <GraduationCap3DLoader />;

  const unlockedCount = achievements.filter((ach) => ach.unlocked).length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#ffffff" : "#1f2937"} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}
              >
                Achievements
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginTop: 4,
                }}
              >
                {unlockedCount} of {achievements.length} unlocked
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
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
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#1f2937",
                marginBottom: 8,
              }}
            >
              Progress
            </Text>
            <View
              style={{
                height: 8,
                backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${(unlockedCount / achievements.length) * 100}%`,
                  backgroundColor: "#10B981",
                  borderRadius: 4,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginTop: 8,
              }}
            >
              {Math.round((unlockedCount / achievements.length) * 100)}% Complete
            </Text>
          </View>

          {/* Achievements Grid */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#1f2937",
              marginBottom: 16,
            }}
          >
            All Achievements
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {achievements.map((ach) => (
              <AchievementBadge
                key={ach.id}
                achievement={ach}
                isDark={isDark}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
