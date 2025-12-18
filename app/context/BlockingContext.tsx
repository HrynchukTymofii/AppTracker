import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  BlockedApp,
  BlockSchedule,
  FocusSession,
  DailyLimit,
  getBlockedApps,
  getBlockSchedules,
  getCurrentFocusSession,
  getDailyLimits,
  blockApp,
  unblockApp,
  createBlockSchedule,
  updateBlockSchedule,
  deleteBlockSchedule,
  startFocusSession,
  endFocusSession,
  setDailyLimit,
  initializeBlocking,
  checkAndApplySchedules,
  POPULAR_APPS,
} from '@/lib/appBlocking';
import {
  VerificationTask,
  VerificationResult,
  createVerificationTask,
  completeVerificationTask,
  getActiveTasks,
} from '@/lib/taskVerification';

interface BlockingContextType {
  // State
  blockedApps: BlockedApp[];
  schedules: BlockSchedule[];
  focusSession: FocusSession | null;
  dailyLimits: DailyLimit[];
  activeTasks: VerificationTask[];
  isLoading: boolean;
  popularApps: typeof POPULAR_APPS;

  // App blocking actions
  addBlockedApp: (packageName: string, appName: string) => Promise<void>;
  removeBlockedApp: (packageName: string) => Promise<void>;

  // Schedule actions
  addSchedule: (schedule: Omit<BlockSchedule, 'id' | 'createdAt'>) => Promise<void>;
  editSchedule: (id: string, updates: Partial<BlockSchedule>) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;

  // Focus session actions
  startFocus: (
    durationMinutes: number,
    apps: string[],
    requiresTask?: boolean,
    beforePhotoUri?: string,
    taskDescription?: string
  ) => Promise<void>;
  endFocus: (afterPhotoUri?: string) => Promise<VerificationResult | null>;
  cancelFocus: () => Promise<void>;

  // Daily limit actions
  setAppDailyLimit: (packageName: string, appName: string, minutes: number) => Promise<void>;
  removeAppDailyLimit: (packageName: string) => Promise<void>;

  // Task actions
  verifyTask: (taskId: string, afterPhotoUri: string) => Promise<VerificationResult>;

  // Utility
  refreshData: () => Promise<void>;
}

const BlockingContext = createContext<BlockingContextType | undefined>(undefined);

export const BlockingProvider = ({ children }: { children: ReactNode }) => {
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [schedules, setSchedules] = useState<BlockSchedule[]>([]);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [dailyLimits, setDailyLimits] = useState<DailyLimit[]>([]);
  const [activeTasks, setActiveTasks] = useState<VerificationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data
  const refreshData = useCallback(async () => {
    try {
      const [apps, scheds, session, limits, tasks] = await Promise.all([
        getBlockedApps(),
        getBlockSchedules(),
        getCurrentFocusSession(),
        getDailyLimits(),
        getActiveTasks(),
      ]);

      setBlockedApps(apps);
      setSchedules(scheds);
      setFocusSession(session);
      setDailyLimits(limits);
      setActiveTasks(tasks);
    } catch (error) {
      console.error('Error refreshing blocking data:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeBlocking();
      await refreshData();
      setIsLoading(false);
    };

    init();

    // Check schedules every minute
    const interval = setInterval(() => {
      checkAndApplySchedules();
      refreshData();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // App blocking actions
  const addBlockedApp = async (packageName: string, appName: string) => {
    await blockApp(packageName, appName, 'manual');
    await refreshData();
  };

  const removeBlockedApp = async (packageName: string) => {
    await unblockApp(packageName);
    await refreshData();
  };

  // Schedule actions
  const addSchedule = async (schedule: Omit<BlockSchedule, 'id' | 'createdAt'>) => {
    await createBlockSchedule(schedule);
    await refreshData();
  };

  const editSchedule = async (id: string, updates: Partial<BlockSchedule>) => {
    await updateBlockSchedule(id, updates);
    await refreshData();
  };

  const removeSchedule = async (id: string) => {
    await deleteBlockSchedule(id);
    await refreshData();
  };

  // Focus session actions
  const startFocus = async (
    durationMinutes: number,
    apps: string[],
    requiresTask: boolean = false,
    beforePhotoUri?: string,
    taskDescription?: string
  ) => {
    const session = await startFocusSession(
      durationMinutes,
      apps,
      requiresTask,
      beforePhotoUri
    );

    // Create verification task if required
    if (requiresTask && beforePhotoUri && taskDescription) {
      await createVerificationTask(
        'Focus Task',
        taskDescription,
        beforePhotoUri,
        apps,
        session.id
      );
    }

    await refreshData();
  };

  const endFocus = async (afterPhotoUri?: string): Promise<VerificationResult | null> => {
    const session = focusSession;
    if (!session) return null;

    if (session.requiresTaskCompletion && afterPhotoUri) {
      // Find the active task for this session
      const task = activeTasks.find((t) => t.focusSessionId === session.id);
      if (task) {
        try {
          const result = await completeVerificationTask(task.id, afterPhotoUri);
          if (result.isTaskCompleted) {
            await endFocusSession(afterPhotoUri);
            await refreshData();
            return result;
          } else {
            // Task not verified - keep blocking
            await refreshData();
            return result;
          }
        } catch (error) {
          console.error('Error verifying task:', error);
          throw error;
        }
      }
    }

    await endFocusSession(afterPhotoUri);
    await refreshData();
    return null;
  };

  const cancelFocus = async () => {
    await endFocusSession();
    await refreshData();
  };

  // Daily limit actions
  const setAppDailyLimit = async (packageName: string, appName: string, minutes: number) => {
    await setDailyLimit(packageName, appName, minutes);
    await refreshData();
  };

  const removeAppDailyLimit = async (packageName: string) => {
    const limits = dailyLimits.filter((l) => l.packageName !== packageName);
    // This would need a dedicated function in appBlocking.ts
    await refreshData();
  };

  // Task verification
  const verifyTask = async (
    taskId: string,
    afterPhotoUri: string
  ): Promise<VerificationResult> => {
    const result = await completeVerificationTask(taskId, afterPhotoUri);
    await refreshData();
    return result;
  };

  return (
    <BlockingContext.Provider
      value={{
        blockedApps,
        schedules,
        focusSession,
        dailyLimits,
        activeTasks,
        isLoading,
        popularApps: POPULAR_APPS,
        addBlockedApp,
        removeBlockedApp,
        addSchedule,
        editSchedule,
        removeSchedule,
        startFocus,
        endFocus,
        cancelFocus,
        setAppDailyLimit,
        removeAppDailyLimit,
        verifyTask,
        refreshData,
      }}
    >
      {children}
    </BlockingContext.Provider>
  );
};

export const useBlocking = () => {
  const context = useContext(BlockingContext);
  if (context === undefined) {
    throw new Error('useBlocking must be used within a BlockingProvider');
  }
  return context;
};
