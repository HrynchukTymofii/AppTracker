import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLockIn } from "@/context/LockInContext";
import { useTranslation } from "react-i18next";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import {
  HeroSection,
  ActiveSession,
  SessionHistory,
  EarnTimeSection,
} from "@/components/lockin";
import { VerifiedLockInModal } from "@/components/lockin/modals/VerifiedLockInModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { StreakModal } from "@/components/modals/StreakModal";
import { ExerciseModal } from "@/components/exercise";
import { ThemedBackground } from "@/components/ui/ThemedBackground";
import { ExerciseType } from "@/lib/poseUtils";

export default function LockInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    exercise?: string;
    openVerified?: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedExerciseType, setSelectedExerciseType] = useState<ExerciseType | undefined>(undefined);

  // Get streak data for the streak modal
  const { streak, markStreakShown } = useEarnedTime();

  // Handle URL params to auto-open modals
  useEffect(() => {
    if (params.exercise) {
      const exerciseType = params.exercise as ExerciseType;
      const validExercises: ExerciseType[] = [
        'pushups', 'squats', 'plank',
        'jumping-jacks', 'lunges', 'crunches', 'shoulder-press',
        'leg-raises', 'high-knees', 'pull-ups',
        'wall-sit', 'side-plank',
      ];
      if (validExercises.includes(exerciseType)) {
        setSelectedExerciseType(exerciseType);
        setShowExerciseModal(true);
        // Clear the param after handling
        router.setParams({ exercise: undefined });
      }
    } else if (params.openVerified === "true") {
      setShowVerifiedModal(true);
      // Clear the param after handling
      router.setParams({ openVerified: undefined });
    }
  }, [params.exercise, params.openVerified]);

  const {
    activeSession,
    sessionHistory,
    startSession,
    completeSession,
    cancelSession,
  } = useLockIn();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh data if needed
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleVerifiedStart = () => {
    setShowVerifiedModal(true);
  };

  const handleStartExercise = (type?: ExerciseType) => {
    setSelectedExerciseType(type);
    setShowExerciseModal(true);
  };

  const handleGiveUp = () => {
    setShowGiveUpConfirm(true);
  };

  const handleConfirmGiveUp = async () => {
    await cancelSession();
    setShowGiveUpConfirm(false);
  };

  const handleComplete = async (afterPhotoUri?: string) => {
    const isFirstActivityToday = await completeSession(afterPhotoUri);
    // Show streak modal if this was the first activity of the day
    if (isFirstActivityToday) {
      setTimeout(() => {
        setShowStreakModal(true);
      }, 500);
    }
  };

  // If there's an active session, show the session view
  if (activeSession) {
    return (
      <ThemedBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <ActiveSession
            session={activeSession}
            isDark={isDark}
            onComplete={handleComplete}
            onGiveUp={handleGiveUp}
          />

          {/* Give Up Confirmation Modal */}
          <ConfirmationModal
            visible={showGiveUpConfirm}
            title={t("lockin.giveUp")}
            message={t("lockin.giveUpMessage")}
            confirmText={t("lockin.giveUpConfirm")}
            cancelText={t("lockin.keepGoing")}
            type="danger"
            onConfirm={handleConfirmGiveUp}
            onCancel={() => setShowGiveUpConfirm(false)}
          />

          {/* Streak Celebration Modal */}
          <StreakModal
            isVisible={showStreakModal}
            onClose={async () => {
              setShowStreakModal(false);
              await markStreakShown();
            }}
            currentStreak={streak.currentStreak}
            longestStreak={streak.longestStreak}
          />
        </SafeAreaView>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section with stats */}
        <HeroSection isDark={isDark} />

        {/* Earn Time Section */}
        <EarnTimeSection
          isDark={isDark}
          onStartExercise={handleStartExercise}
          onVerifiedStart={handleVerifiedStart}
        />

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.05)",
            marginHorizontal: 20,
            marginTop: 24,
          }}
        />

        {/* TODO: Scheduled LockIns - Uncomment when ready
        <TaskList
          tasks={tasks}
          isDark={isDark}
          onAddTask={handleAddTask}
          onTaskPress={handleTaskPress}
          onTaskLongPress={handleTaskLongPress}
        />

        <View
          style={{
            height: 1,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.05)",
            marginHorizontal: 20,
            marginTop: 12,
          }}
        />
        */}

        {/* Session History */}
        <SessionHistory
          sessions={sessionHistory}
          isDark={isDark}
          onSeeAll={() => router.push("/activities")}
        />
      </ScrollView>

      {/* Modals */}
      <VerifiedLockInModal
        visible={showVerifiedModal}
        isDark={isDark}
        onClose={() => setShowVerifiedModal(false)}
        onStart={async (task, minutes, blockedApps, beforePhotoUri) => {
          await startSession({
            taskDescription: task,
            type: "verified",
            durationMinutes: minutes,
            blockedApps,
            beforePhotoUri,
          });
          setShowVerifiedModal(false);
        }}
      />

      <ExerciseModal
        visible={showExerciseModal}
        isDark={isDark}
        initialExercise={selectedExerciseType}
        onClose={() => {
          setShowExerciseModal(false);
          setSelectedExerciseType(undefined);
        }}
      />
      </SafeAreaView>
    </ThemedBackground>
  );
}
