import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackFocusSession } from "@/lib/achievementTracking";
import { useEarnedTime } from "@/context/EarnedTimeContext";

// Types
export type TaskCategory = "study" | "health" | "work" | "creative" | "reading" | "custom";

export interface LockInTask {
  id: string;
  name: string;
  category: TaskCategory;
  durationMinutes: number;
  requiresPhotoVerification: boolean;
  isRepeating: boolean;
  repeatDays?: number[]; // 0-6 for Sun-Sat
  scheduledTime?: string; // HH:MM format (optional)
  createdAt: number;
}

export interface LockInSession {
  id: string;
  taskId?: string;
  taskDescription: string;
  type: "quick" | "verified" | "custom" | "exercise";
  durationMinutes: number;
  startedAt: number;
  completedAt?: number;
  beforePhotoUri?: string;
  afterPhotoUri?: string;
  blockedApps: string[];
  status: "active" | "completed" | "failed" | "cancelled";
  pointsEarned?: number;
  exerciseType?: string;
  exerciseDetails?: string;
}

export interface ScheduledLockIn {
  id: string;
  taskId?: string;
  taskName: string;
  scheduledTime: string; // HH:MM format
  scheduledDate?: string; // YYYY-MM-DD format for one-time
  isRepeating: boolean;
  repeatDays?: number[];
  durationMinutes: number;
  requiresPhotoVerification: boolean;
  blockedApps: string[];
}

interface LockInContextType {
  // Tasks
  tasks: LockInTask[];
  addTask: (task: Omit<LockInTask, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, task: Partial<LockInTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Sessions
  activeSession: LockInSession | null;
  sessionHistory: LockInSession[];
  startSession: (session: Omit<LockInSession, "id" | "startedAt" | "status">) => Promise<void>;
  completeSession: (afterPhotoUri?: string, earnedMinutes?: number) => Promise<boolean>; // Returns true if first activity of day (for streak modal)
  cancelSession: () => Promise<void>;
  addExerciseActivity: (exerciseType: string, earnedMinutes: number, details: string) => Promise<void>;

  // Scheduled
  scheduledLockIns: ScheduledLockIn[];
  addScheduledLockIn: (scheduled: Omit<ScheduledLockIn, "id">) => Promise<void>;
  updateScheduledLockIn: (id: string, scheduled: Partial<ScheduledLockIn>) => Promise<void>;
  deleteScheduledLockIn: (id: string) => Promise<void>;

  // Stats
  streak: number;
  totalCompleted: number;
  totalPoints: number;
}

const LockInContext = createContext<LockInContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TASKS: "@lockin_tasks",
  ACTIVE_SESSION: "@lockin_active_session",
  SESSION_HISTORY: "@lockin_session_history",
  SCHEDULED: "@lockin_scheduled",
  STATS: "@lockin_stats",
};

export function LockInProvider({ children }: { children: ReactNode }) {
  const { recordActivity, earnTime } = useEarnedTime();
  const [tasks, setTasks] = useState<LockInTask[]>([]);
  const [activeSession, setActiveSession] = useState<LockInSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<LockInSession[]>([]);
  const [scheduledLockIns, setScheduledLockIns] = useState<ScheduledLockIn[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, activeData, historyData, scheduledData, statsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED),
        AsyncStorage.getItem(STORAGE_KEYS.STATS),
      ]);

      if (tasksData) setTasks(JSON.parse(tasksData));
      if (activeData) setActiveSession(JSON.parse(activeData));
      if (historyData) setSessionHistory(JSON.parse(historyData));
      if (scheduledData) setScheduledLockIns(JSON.parse(scheduledData));
      if (statsData) {
        const stats = JSON.parse(statsData);
        setStreak(stats.streak || 0);
        setTotalCompleted(stats.totalCompleted || 0);
        setTotalPoints(stats.totalPoints || 0);
      }
    } catch (error) {
      console.error("Error loading LockIn data:", error);
    }
  };

  // Task functions
  const addTask = async (task: Omit<LockInTask, "id" | "createdAt">) => {
    const newTask: LockInTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  const updateTask = async (id: string, taskUpdate: Partial<LockInTask>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...taskUpdate } : t));
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  // Session functions
  const startSession = async (session: Omit<LockInSession, "id" | "startedAt" | "status">) => {
    const newSession: LockInSession = {
      ...session,
      id: Date.now().toString(),
      startedAt: Date.now(),
      status: "active",
    };
    setActiveSession(newSession);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(newSession));
  };

  const completeSession = async (afterPhotoUri?: string, earnedMinutes?: number): Promise<boolean> => {
    if (!activeSession) return false;

    const completedSession: LockInSession = {
      ...activeSession,
      status: "completed",
      completedAt: Date.now(),
      afterPhotoUri,
      pointsEarned: calculatePoints(activeSession),
    };

    const updatedHistory = [completedSession, ...sessionHistory].slice(0, 100);
    setSessionHistory(updatedHistory);
    setActiveSession(null);

    // Update stats
    const newTotalCompleted = totalCompleted + 1;
    const newTotalPoints = totalPoints + (completedSession.pointsEarned || 0);
    const newStreak = Math.max(1, streak + 1); // Ensure streak is at least 1

    setTotalCompleted(newTotalCompleted);
    setTotalPoints(newTotalPoints);
    setStreak(newStreak);

    // Track for achievement system (updates daily streak)
    await trackFocusSession(
      activeSession.durationMinutes,
      activeSession.blockedApps || [],
      true // taskCompleted
    );

    // Earn time for photo-verified tasks
    if (earnedMinutes && earnedMinutes > 0 && activeSession.type === 'verified') {
      await earnTime('photo_task', earnedMinutes, activeSession.taskDescription || 'Photo task');
    }

    // Record activity for the unified streak system (shared with exercises)
    // Returns true if this was the first activity of the day
    const isFirstActivityToday = await recordActivity();

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION),
      AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({
        streak: newStreak,
        totalCompleted: newTotalCompleted,
        totalPoints: newTotalPoints,
      })),
    ]);

    return isFirstActivityToday; // Return whether to show streak modal
  };

  const cancelSession = async () => {
    if (!activeSession) return;

    const cancelledSession: LockInSession = {
      ...activeSession,
      status: "cancelled",
      completedAt: Date.now(),
    };

    const updatedHistory = [cancelledSession, ...sessionHistory].slice(0, 100);
    setSessionHistory(updatedHistory);
    setActiveSession(null);
    setStreak(0); // Reset streak on cancel

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION),
      AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory)),
      AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({
        streak: 0,
        totalCompleted,
        totalPoints,
      })),
    ]);
  };

  // Add exercise activity to history
  const addExerciseActivity = async (exerciseType: string, earnedMinutes: number, details: string) => {
    const exerciseSession: LockInSession = {
      id: `exercise_${Date.now()}`,
      taskDescription: `${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} - ${details}`,
      type: "exercise",
      durationMinutes: earnedMinutes,
      startedAt: Date.now() - (earnedMinutes * 60 * 1000), // Approximate start time
      completedAt: Date.now(),
      blockedApps: [],
      status: earnedMinutes > 0 ? "completed" : "failed",
      pointsEarned: Math.round(earnedMinutes * 10),
      exerciseType,
      exerciseDetails: details,
    };

    const updatedHistory = [exerciseSession, ...sessionHistory].slice(0, 100);
    setSessionHistory(updatedHistory);

    if (earnedMinutes > 0) {
      setTotalCompleted(prev => prev + 1);
      // Track for achievement system (updates daily streak)
      await trackFocusSession(earnedMinutes, [], true);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory));
  };

  // Scheduled functions
  const addScheduledLockIn = async (scheduled: Omit<ScheduledLockIn, "id">) => {
    const newScheduled: ScheduledLockIn = {
      ...scheduled,
      id: Date.now().toString(),
    };
    const updated = [...scheduledLockIns, newScheduled];
    setScheduledLockIns(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(updated));
  };

  const updateScheduledLockIn = async (id: string, scheduledUpdate: Partial<ScheduledLockIn>) => {
    const updated = scheduledLockIns.map((s) => (s.id === id ? { ...s, ...scheduledUpdate } : s));
    setScheduledLockIns(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(updated));
  };

  const deleteScheduledLockIn = async (id: string) => {
    const updated = scheduledLockIns.filter((s) => s.id !== id);
    setScheduledLockIns(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(updated));
  };

  // Helper functions
  const calculatePoints = (session: LockInSession): number => {
    let points = Math.floor(session.durationMinutes / 10) * 10; // Base: 10 points per 10 minutes
    if (session.type === "verified") points *= 1.5; // 50% bonus for verified
    if (session.beforePhotoUri && session.afterPhotoUri) points *= 1.25; // 25% bonus for photos
    return Math.round(points);
  };

  return (
    <LockInContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        activeSession,
        sessionHistory,
        startSession,
        completeSession,
        cancelSession,
        addExerciseActivity,
        scheduledLockIns,
        addScheduledLockIn,
        updateScheduledLockIn,
        deleteScheduledLockIn,
        streak,
        totalCompleted,
        totalPoints,
      }}
    >
      {children}
    </LockInContext.Provider>
  );
}

export function useLockIn() {
  const context = useContext(LockInContext);
  if (context === undefined) {
    throw new Error("useLockIn must be used within a LockInProvider");
  }
  return context;
}
