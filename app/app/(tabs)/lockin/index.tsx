import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLockIn, LockInTask } from "@/context/LockInContext";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import {
  HeroSection,
  QuickActions,
  TaskList,
  ActiveSession,
  SessionHistory,
  EarnTimeSection,
} from "@/components/lockin";
import { QuickLockInModal } from "@/components/lockin/modals/QuickLockInModal";
import { VerifiedLockInModal } from "@/components/lockin/modals/VerifiedLockInModal";
import { AddTaskModal } from "@/components/lockin/modals/AddTaskModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { ExerciseModal } from "@/components/exercise";
import { ThemedBackground } from "@/components/ui/ThemedBackground";

export default function LockInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<LockInTask | null>(null);

  const {
    tasks,
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

  const handleQuickStart = () => {
    setShowQuickModal(true);
  };

  const handleVerifiedStart = () => {
    setShowVerifiedModal(true);
  };

  const handleStartExercise = () => {
    setShowExerciseModal(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowAddTaskModal(true);
  };

  const handleTaskPress = (task: LockInTask) => {
    setSelectedTask(task);
    setShowAddTaskModal(true);
  };

  const handleTaskLongPress = (task: LockInTask) => {
    setSelectedTask(task);
    setShowAddTaskModal(true);
  };

  const handleGiveUp = () => {
    setShowGiveUpConfirm(true);
  };

  const handleConfirmGiveUp = async () => {
    await cancelSession();
    setShowGiveUpConfirm(false);
  };

  const handleComplete = async (afterPhotoUri?: string) => {
    await completeSession(afterPhotoUri);
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
            title="Give Up?"
            message="You'll lose your current streak if you give up now. Are you sure?"
            confirmText="Give Up"
            cancelText="Keep Going"
            type="danger"
            onConfirm={handleConfirmGiveUp}
            onCancel={() => setShowGiveUpConfirm(false)}
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

        {/* Quick Action Cards */}
        <QuickActions
          isDark={isDark}
          onQuickStart={handleQuickStart}
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

        {/* Scheduled LockIns (formerly My Tasks) */}
        <TaskList
          tasks={tasks}
          isDark={isDark}
          onAddTask={handleAddTask}
          onTaskPress={handleTaskPress}
          onTaskLongPress={handleTaskLongPress}
        />

        {/* Divider */}
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

        {/* Session History */}
        <SessionHistory
          sessions={sessionHistory}
          isDark={isDark}
          onSeeAll={() => {}}
        />
      </ScrollView>

      {/* Modals */}
      <QuickLockInModal
        visible={showQuickModal}
        isDark={isDark}
        onClose={() => setShowQuickModal(false)}
        onStart={async (minutes, blockedApps) => {
          await startSession({
            taskDescription: "Quick Focus",
            type: "quick",
            durationMinutes: minutes,
            blockedApps,
          });
          setShowQuickModal(false);
        }}
      />

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

        <AddTaskModal
          visible={showAddTaskModal}
          isDark={isDark}
          task={selectedTask}
          onClose={() => {
            setShowAddTaskModal(false);
            setSelectedTask(null);
          }}
        />

        <ExerciseModal
          visible={showExerciseModal}
          isDark={isDark}
          onClose={() => setShowExerciseModal(false)}
        />
      </SafeAreaView>
    </ThemedBackground>
  );
}
