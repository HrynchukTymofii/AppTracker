import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  CheckCircle,
  LucideIcon,
  ArrowLeft,
  Target,
  Trophy,
  Sun,
  Moon,
  Star,
  Shield,
  Brain,
  Calendar,
  Clock,
  Zap,
  Award,
  Layers,
  Flame,
  Crown,
  Heart,
  TrendingDown,
  Sunrise,
  Rocket,
  Lock,
  Sparkles,
  Activity,
  ShieldCheck,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from 'react-i18next';
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { getAchievementStats, hasWeeklyHealthAbove80 } from "@/lib/achievementTracking";

export interface Achievement {
  id: string;
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
        width: "48%",
        borderRadius: 16,
        backgroundColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff"
          : isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
        padding: 16,
        marginBottom: 16,
        alignItems: "center",
        opacity: achievement.unlocked ? 1 : 0.5,
        shadowColor: achievement.unlocked ? achievement.color : "#000",
        shadowOffset: { width: 0, height: achievement.unlocked ? 8 : 2 },
        shadowOpacity: achievement.unlocked ? 0.2 : 0.05,
        shadowRadius: achievement.unlocked ? 16 : 4,
        elevation: achievement.unlocked ? 6 : 2,
        borderWidth: 1.5,
        borderColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)"
          : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        borderTopColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.8)"
          : "transparent",
        borderBottomColor: achievement.unlocked
          ? isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)"
          : "transparent",
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: achievement.unlocked
            ? achievement.color + "20"
            : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          borderWidth: 2.5,
          borderColor: achievement.unlocked
            ? achievement.color
            : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        <Icon
          size={32}
          color={
            achievement.unlocked ? achievement.color : isDark ? "#64748b" : "#94a3b8"
          }
          strokeWidth={2.5}
        />
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: achievement.unlocked
            ? isDark ? "#ffffff" : "#111827"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
          marginBottom: 6,
          lineHeight: 18,
        }}
      >
        {achievement.title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: achievement.unlocked
            ? isDark ? "#9ca3af" : "#6b7280"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
          lineHeight: 16,
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
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#10B981",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <CheckCircle size={18} color="#ffffff" fill="#10B981" strokeWidth={3} />
        </View>
      )}
    </View>
  );
};

async function getDynamicAchievements(t: any) {
  const stats = await getAchievementStats();
  const weeklyHealth = await hasWeeklyHealthAbove80();

  return [
    {
      id: 'firstBlock',
      title: t('achievements.list.firstBlock.title'),
      description: t('achievements.list.firstBlock.description'),
      icon: Target,
      unlocked: stats.blockedAppsCount >= 1 || stats.totalAppsBlocked >= 1,
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
      unlocked: stats.earlyMorningSessionCount >= 1,
      color: "#f97316",
    },
    {
      id: 'nightOwl',
      title: t('achievements.list.nightOwl.title'),
      description: t('achievements.list.nightOwl.description'),
      icon: Moon,
      unlocked: stats.lateNightSessionCount >= 1,
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
    {
      id: 'ironWill',
      title: t('achievements.list.ironWill.title'),
      description: t('achievements.list.ironWill.description'),
      icon: Shield,
      unlocked: stats.focusSessionsCount >= 10,
      color: "#64748b",
    },
    {
      id: 'zenMaster',
      title: t('achievements.list.zenMaster.title'),
      description: t('achievements.list.zenMaster.description'),
      icon: Brain,
      unlocked: stats.focusSessionsCount >= 50,
      color: "#a855f7",
    },
    {
      id: 'schedulePro',
      title: t('achievements.list.schedulePro.title'),
      description: t('achievements.list.schedulePro.description'),
      icon: Calendar,
      unlocked: stats.schedulesCount >= 1,
      color: "#06b6d4",
    },
    {
      id: 'timeKeeper',
      title: t('achievements.list.timeKeeper.title'),
      description: t('achievements.list.timeKeeper.description'),
      icon: Clock,
      unlocked: stats.schedulesCount >= 5,
      color: "#0ea5e9",
    },
    {
      id: 'digitalDetox',
      title: t('achievements.list.digitalDetox.title'),
      description: t('achievements.list.digitalDetox.description'),
      icon: Zap,
      unlocked: stats.maxFocusDuration >= 1440,
      color: "#14b8a6",
    },
    {
      id: 'weekendWarrior',
      title: t('achievements.list.weekendWarrior.title'),
      description: t('achievements.list.weekendWarrior.description'),
      icon: Award,
      unlocked: stats.weekendBlockingDays >= 2,
      color: "#ec4899",
    },
    {
      id: 'minimalist',
      title: t('achievements.list.minimalist.title'),
      description: t('achievements.list.minimalist.description'),
      icon: Layers,
      unlocked: stats.blockedAppsCount >= 10,
      color: "#84cc16",
    },
    {
      id: 'focusLegend',
      title: t('achievements.list.focusLegend.title'),
      description: t('achievements.list.focusLegend.description'),
      icon: Flame,
      unlocked: stats.maxFocusDuration >= 120,
      color: "#f59e0b",
    },
    {
      id: 'marathon',
      title: t('achievements.list.marathon.title'),
      description: t('achievements.list.marathon.description'),
      icon: Zap,
      unlocked: stats.maxFocusDuration >= 240,
      color: "#ef4444",
    },
    {
      id: 'consistencyKing',
      title: t('achievements.list.consistencyKing.title'),
      description: t('achievements.list.consistencyKing.description'),
      icon: Crown,
      unlocked: stats.currentStreak >= 30,
      color: "#fbbf24",
    },
    {
      id: 'healthChampion',
      title: t('achievements.list.healthChampion.title'),
      description: t('achievements.list.healthChampion.description'),
      icon: Heart,
      unlocked: stats.healthScore >= 90,
      color: "#f43f5e",
    },
    {
      id: 'screenTimeSavior',
      title: t('achievements.list.screenTimeSavior.title'),
      description: t('achievements.list.screenTimeSavior.description'),
      icon: TrendingDown,
      unlocked: stats.screenTimeReduction >= 50,
      color: "#10b981",
    },
    {
      id: 'morningRoutine',
      title: t('achievements.list.morningRoutine.title'),
      description: t('achievements.list.morningRoutine.description'),
      icon: Sunrise,
      unlocked: stats.morningBlockingStreak >= 3,
      color: "#fb923c",
    },
    {
      id: 'productivityBeast',
      title: t('achievements.list.productivityBeast.title'),
      description: t('achievements.list.productivityBeast.description'),
      icon: Rocket,
      unlocked: stats.tasksCompleted >= 5,
      color: "#8b5cf6",
    },
    {
      id: 'appBlockerPro',
      title: t('achievements.list.appBlockerPro.title'),
      description: t('achievements.list.appBlockerPro.description'),
      icon: Lock,
      unlocked: stats.totalAppsBlocked >= 20,
      color: "#6366f1",
    },
    {
      id: 'focusFlow',
      title: t('achievements.list.focusFlow.title'),
      description: t('achievements.list.focusFlow.description'),
      icon: Sparkles,
      unlocked: stats.focusSessionsToday >= 3,
      color: "#a855f7",
    },
    {
      id: 'digitalWellbeing',
      title: t('achievements.list.digitalWellbeing.title'),
      description: t('achievements.list.digitalWellbeing.description'),
      icon: Activity,
      unlocked: weeklyHealth,
      color: "#14b8a6",
    },
    {
      id: 'selfControl',
      title: t('achievements.list.selfControl.title'),
      description: t('achievements.list.selfControl.description'),
      icon: ShieldCheck,
      unlocked: stats.resistedUnblockCount >= 10,
      color: "#64748b",
    },
  ];
}

export default function AchievementsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load achievements when page comes into focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const loadedAchievements = await getDynamicAchievements(t);
        setAchievements(loadedAchievements);
        setLoading(false);
      })();
    }, [t])
  );

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
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  const unlockedCount = achievements.filter((ach) => ach.unlocked).length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20, paddingTop: 16 }}>
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
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {t('achievements.title')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginTop: 4,
                }}
              >
                {t('achievements.unlockedCount', { count: unlockedCount, total: achievements.length })}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
              borderRadius: 16,
              padding: 20,
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
                  fontSize: 16,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {t('achievements.unlocked')}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#10B981",
                }}
              >
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </Text>
            </View>
            <View
              style={{
                height: 10,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${(unlockedCount / achievements.length) * 100}%`,
                  backgroundColor: "#10B981",
                  borderRadius: 5,
                }}
              />
            </View>
          </View>

          {/* Achievements Grid */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 16,
            }}
          >
            {t('profile.achievements')}
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
