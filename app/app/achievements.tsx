import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
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
  CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from 'react-i18next';
import GraduationCap3DLoader from "@/components/ui/GraduationCapLoader";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { getAchievementStats, hasWeeklyHealthAbove80 } from "@/lib/achievementTracking";
import { AchievementBadge } from "@/components/profile/AchievementBadge";
import { Achievement } from "@/components/profile/achievements";

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

          {/* Progress Card with Gradient Border */}
          <View
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 24,
              position: 'relative',
            }}
          >
            {/* Gradient border */}
            <LinearGradient
              colors={['#10b981', '#8b5cf6', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            {/* Inner content */}
            <View
              style={{
                margin: 1.5,
                borderRadius: 19,
                backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
                padding: 20,
              }}
            >
              {/* Glass shine */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                  borderTopLeftRadius: 19,
                  borderTopRightRadius: 19,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      }}
                    />
                    <Trophy size={20} color="#ffffff" strokeWidth={2} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: isDark ? "#ffffff" : "#111827",
                      }}
                    >
                      {t('achievements.unlocked')}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#6b7280" : "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      {unlockedCount} of {achievements.length} badges
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: "#10b981",
                    }}
                  >
                    {Math.round((unlockedCount / achievements.length) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Progress bar with gradient */}
              <View
                style={{
                  height: 12,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${(unlockedCount / achievements.length) * 100}%`,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={['#10b981', '#8b5cf6', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flex: 1,
                      borderRadius: 6,
                    }}
                  />
                  {/* Shine overlay */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                    }}
                  />
                </View>
              </View>
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
                isFullPage={true}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
