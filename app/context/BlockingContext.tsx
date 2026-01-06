import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
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
  removeDailyLimit,
  getDefaultAppLimitMinutes,
  setDefaultAppLimitMinutes,
  initializeAppLimitsFromOnboarding,
  initializeBlocking,
  checkAndApplySchedules,
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
  hasOverlayPermission,
  openOverlaySettings,
  hasAllRequiredPermissions,
  POPULAR_APPS,
  syncBlockedWebsitesToNative,
} from '@/lib/appBlocking';
import * as AppBlocker from '@/modules/app-blocker';
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
  getDefaultLimit: () => Promise<number>;
  setDefaultLimit: (minutes: number) => Promise<void>;

  // Task actions
  verifyTask: (taskId: string, afterPhotoUri: string) => Promise<VerificationResult>;

  // Permission checks
  isAccessibilityServiceEnabled: () => Promise<boolean>;
  openAccessibilitySettings: () => void;
  hasOverlayPermission: () => Promise<boolean>;
  openOverlaySettings: () => void;
  hasAllRequiredPermissions: () => Promise<boolean>;

  // iOS-specific methods
  requestIOSAuthorization: () => Promise<boolean>;
  showIOSAppPicker: () => Promise<{ appsCount: number; categoriesCount: number } | null>;
  applyIOSBlocking: () => void;
  clearIOSBlocking: () => void;

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

  // Sync daily limits to native SharedPreferences (Android only)
  const syncDailyLimitsToNative = useCallback((limits: DailyLimit[]) => {
    if (Platform.OS !== 'android') return;
    try {
      const limitsMap: Record<string, number> = {};
      for (const limit of limits) {
        limitsMap[limit.packageName] = limit.limitMinutes;
      }
      AppBlocker.setDailyLimits(limitsMap);
    } catch (error) {
      console.error('Error syncing daily limits to native:', error);
    }
  }, []);

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

      // Sync daily limits to native for the blocking screen
      syncDailyLimitsToNative(limits);
    } catch (error) {
      console.error('Error refreshing blocking data:', error);
    }
  }, [syncDailyLimitsToNative]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeBlocking();

      // Platform-specific initialization
      if (Platform.OS === 'ios') {
        // Request Family Controls authorization on iOS
        try {
          await AppBlocker.requestAuthorization();
        } catch (error) {
          console.log('iOS authorization request:', error);
        }
      } else {
        // Android: Sync websites to native module
        await syncBlockedWebsitesToNative();
      }

      await initializeAppLimitsFromOnboarding(); // Initialize app limits from onboarding
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
      beforePhotoUri,
      taskDescription
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
    await removeDailyLimit(packageName);
    await refreshData();
  };

  // Default limit getters/setters
  const getDefaultLimit = async (): Promise<number> => {
    return await getDefaultAppLimitMinutes();
  };

  const setDefaultLimit = async (minutes: number): Promise<void> => {
    await setDefaultAppLimitMinutes(minutes);
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

  // iOS-specific methods
  const requestIOSAuthorization = async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;
    try {
      return await AppBlocker.requestAuthorization();
    } catch (error) {
      console.error('Error requesting iOS authorization:', error);
      return false;
    }
  };

  const showIOSAppPicker = async (): Promise<{ appsCount: number; categoriesCount: number } | null> => {
    if (Platform.OS !== 'ios') return null;
    try {
      return await AppBlocker.showAppPicker();
    } catch (error) {
      console.error('Error showing iOS app picker:', error);
      return null;
    }
  };

  const applyIOSBlocking = (): void => {
    if (Platform.OS !== 'ios') return;
    AppBlocker.applyBlocking();
  };

  const clearIOSBlocking = (): void => {
    if (Platform.OS !== 'ios') return;
    AppBlocker.clearBlocking();
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
        getDefaultLimit,
        setDefaultLimit,
        verifyTask,
        isAccessibilityServiceEnabled,
        openAccessibilitySettings,
        hasOverlayPermission,
        openOverlaySettings,
        hasAllRequiredPermissions,
        requestIOSAuthorization,
        showIOSAppPicker,
        applyIOSBlocking,
        clearIOSBlocking,
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
