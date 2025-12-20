/**
 * Smart Notifications Module
 *
 * Monitors app usage and sends contextual AI-powered notifications
 * to encourage healthy digital habits.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { generateSmartNotification, NotificationContext } from './openai';
import { calculateHealthScore } from './usageTracking';

// Storage keys
const NOTIFICATION_HISTORY_KEY = '@notification_history';
const PREGENERATED_NOTIFICATIONS_KEY = '@pregenerated_notifications';
const APP_SESSION_KEY = '@app_sessions';

interface NotificationHistory {
  appName: string;
  timestamp: number;
  message: string;
  sessionDuration: number;
}

interface AppSession {
  appName: string;
  packageName: string;
  startTime: number;
  lastNotificationTime: number;
  notificationCount: number;
}

interface PregeneratedNotifications {
  [appName: string]: string[];
}

// Notification thresholds (in minutes)
const NOTIFICATION_INTERVALS = [
  10, // First notification at 10 minutes
  20, // Second at 20 minutes
  30, // Third at 30 minutes
  40, // Fourth at 40 minutes
  50, // And every 10 minutes after
];

/**
 * Get time of day category
 */
const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Get notification history for today
 */
const getTodayNotificationHistory = async (): Promise<NotificationHistory[]> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (!stored) return [];

    const history: NotificationHistory[] = JSON.parse(stored);
    const today = new Date().toDateString();

    return history.filter((n) => new Date(n.timestamp).toDateString() === today);
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
};

/**
 * Save notification to history
 */
const saveNotificationToHistory = async (
  appName: string,
  message: string,
  sessionDuration: number
): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const history: NotificationHistory[] = stored ? JSON.parse(stored) : [];

    history.push({
      appName,
      timestamp: Date.now(),
      message,
      sessionDuration,
    });

    // Keep only last 100 notifications
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving notification to history:', error);
  }
};

/**
 * Get active app sessions
 */
const getAppSessions = async (): Promise<AppSession[]> => {
  try {
    const stored = await AsyncStorage.getItem(APP_SESSION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting app sessions:', error);
    return [];
  }
};

/**
 * Save app sessions
 */
const saveAppSessions = async (sessions: AppSession[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(APP_SESSION_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving app sessions:', error);
  }
};

/**
 * Start tracking an app session
 */
export const startAppSession = async (appName: string, packageName: string): Promise<void> => {
  const sessions = await getAppSessions();

  // Check if session already exists
  const existingIndex = sessions.findIndex((s) => s.packageName === packageName);

  if (existingIndex >= 0) {
    // Update existing session
    sessions[existingIndex].startTime = Date.now();
  } else {
    // Create new session
    sessions.push({
      appName,
      packageName,
      startTime: Date.now(),
      lastNotificationTime: 0,
      notificationCount: 0,
    });
  }

  await saveAppSessions(sessions);
};

/**
 * End tracking an app session
 */
export const endAppSession = async (packageName: string): Promise<void> => {
  const sessions = await getAppSessions();
  const filtered = sessions.filter((s) => s.packageName !== packageName);
  await saveAppSessions(filtered);
};

/**
 * Check if notification should be sent and send it
 */
export const checkAndSendNotification = async (
  appName: string,
  packageName: string,
  healthScore: number
): Promise<void> => {
  try {
    const sessions = await getAppSessions();
    const session = sessions.find((s) => s.packageName === packageName);

    if (!session) return;

    const now = Date.now();
    const sessionDuration = Math.floor((now - session.startTime) / 1000 / 60); // in minutes

    // Determine if we should send a notification
    let shouldNotify = false;
    const nextThreshold = NOTIFICATION_INTERVALS[session.notificationCount] ||
      (NOTIFICATION_INTERVALS[NOTIFICATION_INTERVALS.length - 1] +
       (session.notificationCount - NOTIFICATION_INTERVALS.length + 1) * 10);

    if (sessionDuration >= nextThreshold) {
      const timeSinceLastNotification = (now - session.lastNotificationTime) / 1000 / 60;
      if (timeSinceLastNotification >= 10 || session.lastNotificationTime === 0) {
        shouldNotify = true;
      }
    }

    if (!shouldNotify) return;

    // Generate notification message
    const context: NotificationContext = {
      appName,
      timeSpentMinutes: sessionDuration,
      healthScore,
      notificationCount: session.notificationCount + 1,
      timeOfDay: getTimeOfDay(),
    };

    const message = await getNotificationMessage(appName, context);

    // Send the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time Check',
        body: message,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });

    // Update session
    session.lastNotificationTime = now;
    session.notificationCount++;

    await saveAppSessions(sessions);
    await saveNotificationToHistory(appName, message, sessionDuration);
  } catch (error) {
    console.error('Error checking and sending notification:', error);
  }
};

/**
 * Get notification message (from pregenerated or generate new)
 */
const getNotificationMessage = async (
  appName: string,
  context: NotificationContext
): Promise<string> => {
  try {
    // Try to get from pregenerated messages first
    const stored = await AsyncStorage.getItem(PREGENERATED_NOTIFICATIONS_KEY);
    if (stored) {
      const pregenerated: PregeneratedNotifications = JSON.parse(stored);
      const messages = pregenerated[appName];

      if (messages && messages.length > 0) {
        // Get a random message or cycle through them
        const index = (context.notificationCount - 1) % messages.length;
        return messages[index];
      }
    }

    // Generate new message using AI
    return await generateSmartNotification(context);
  } catch (error) {
    console.error('Error getting notification message:', error);
    // Fallback messages
    const fallbacks = [
      `You've been on ${appName} for ${context.timeSpentMinutes} minutes`,
      'Time to take a break from the screen',
      "Maybe it's time to do something else?",
    ];
    return fallbacks[context.notificationCount % fallbacks.length];
  }
};

/**
 * Pregenerate notification messages for common apps
 */
export const pregenerateNotificationsForApps = async (
  appNames: string[],
  messagesPerApp: number = 50
): Promise<void> => {
  try {
    const notifications: PregeneratedNotifications = {};

    for (const appName of appNames) {
      notifications[appName] = [];

      for (let i = 1; i <= messagesPerApp; i++) {
        const context: NotificationContext = {
          appName,
          timeSpentMinutes: Math.floor(Math.random() * 120) + 10,
          healthScore: Math.floor(Math.random() * 100),
          notificationCount: i,
          timeOfDay: ['morning', 'afternoon', 'evening', 'night'][
            Math.floor(Math.random() * 4)
          ] as any,
        };

        try {
          const message = await generateSmartNotification(context);
          notifications[appName].push(message);

          // Rate limit to avoid API issues
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating notification ${i} for ${appName}:`, error);
        }
      }
    }

    await AsyncStorage.setItem(PREGENERATED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error pregenerating notifications:', error);
  }
};

/**
 * Get pregenerated notifications
 */
export const getPregeneratedNotifications = async (): Promise<PregeneratedNotifications | null> => {
  try {
    const stored = await AsyncStorage.getItem(PREGENERATED_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting pregenerated notifications:', error);
    return null;
  }
};

/**
 * Clear notification history
 */
export const clearNotificationHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
    await AsyncStorage.removeItem(APP_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing notification history:', error);
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (): Promise<{
  totalNotifications: number;
  notificationsByApp: Record<string, number>;
  averageSessionDuration: number;
}> => {
  try {
    const history = await getTodayNotificationHistory();

    const notificationsByApp: Record<string, number> = {};
    let totalDuration = 0;

    history.forEach((n) => {
      notificationsByApp[n.appName] = (notificationsByApp[n.appName] || 0) + 1;
      totalDuration += n.sessionDuration;
    });

    return {
      totalNotifications: history.length,
      notificationsByApp,
      averageSessionDuration: history.length > 0 ? totalDuration / history.length : 0,
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      totalNotifications: 0,
      notificationsByApp: {},
      averageSessionDuration: 0,
    };
  }
};

export default {
  startAppSession,
  endAppSession,
  checkAndSendNotification,
  pregenerateNotificationsForApps,
  getPregeneratedNotifications,
  clearNotificationHistory,
  getNotificationStats,
};
