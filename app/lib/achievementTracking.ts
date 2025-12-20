import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayUsageStats, calculateHealthScore } from './usageTracking';

const ACHIEVEMENT_STATS_KEY = '@achievement_stats';
const SESSION_HISTORY_KEY = '@session_history';
const DAILY_STREAKS_KEY = '@daily_streaks';

export interface AchievementStats {
  blockedAppsCount: number;
  focusSessionsCount: number;
  tasksCompleted: number;
  schedulesCount: number;
  currentStreak: number;
  maxFocusDuration: number;
  healthScore: number;
  totalAppsBlocked: number;
  weekendBlockingDays: number;
  focusSessionsToday: number;
  morningBlockingStreak: number;
  screenTimeReduction: number;
  earlyMorningSessionCount: number;
  lateNightSessionCount: number;
  resistedUnblockCount: number;
  lastUpdated: string;
}

export interface SessionRecord {
  id: string;
  type: 'focus' | 'schedule' | 'manual';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  appsBlocked: string[];
  taskCompleted: boolean;
}

export interface DailyStreak {
  date: string;
  hadBlockingActivity: boolean;
  hadMorningBlocking: boolean;
  healthScore: number;
}

// Initialize achievement stats
export async function initializeAchievementStats(): Promise<AchievementStats> {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENT_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    const initialStats: AchievementStats = {
      blockedAppsCount: 0,
      focusSessionsCount: 0,
      tasksCompleted: 0,
      schedulesCount: 0,
      currentStreak: 0,
      maxFocusDuration: 0,
      healthScore: 0,
      totalAppsBlocked: 0,
      weekendBlockingDays: 0,
      focusSessionsToday: 0,
      morningBlockingStreak: 0,
      screenTimeReduction: 0,
      earlyMorningSessionCount: 0,
      lateNightSessionCount: 0,
      resistedUnblockCount: 0,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(initialStats));
    return initialStats;
  } catch (error) {
    console.error('Error initializing achievement stats:', error);
    throw error;
  }
}

// Get current achievement stats
export async function getAchievementStats(): Promise<AchievementStats> {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENT_STATS_KEY);
    if (stored) {
      const stats = JSON.parse(stored);
      // Update daily stats
      await updateDailyStats(stats);
      return stats;
    }
    return await initializeAchievementStats();
  } catch (error) {
    console.error('Error getting achievement stats:', error);
    return await initializeAchievementStats();
  }
}

// Update achievement stats
async function saveAchievementStats(stats: AchievementStats): Promise<void> {
  try {
    stats.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(ACHIEVEMENT_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving achievement stats:', error);
  }
}

// Update daily stats (health score, today's sessions)
async function updateDailyStats(stats: AchievementStats): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = stats.lastUpdated.split('T')[0];

    // Reset daily counters if it's a new day
    if (today !== lastUpdate) {
      stats.focusSessionsToday = 0;
    }

    // Update health score
    const usageStats = await getTodayUsageStats();
    stats.healthScore = calculateHealthScore(usageStats.totalScreenTime, usageStats.pickups);

    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
}

// Track when an app is blocked
export async function trackAppBlocked(packageName: string): Promise<void> {
  try {
    const stats = await getAchievementStats();

    // Track total unique apps blocked
    const uniqueApps = await getUniqueBlockedApps();
    if (!uniqueApps.includes(packageName)) {
      uniqueApps.push(packageName);
      await AsyncStorage.setItem('@unique_blocked_apps', JSON.stringify(uniqueApps));
      stats.totalAppsBlocked = uniqueApps.length;
    }

    // Update currently blocked apps count (will be updated by BlockingContext)
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking app blocked:', error);
  }
}

// Update currently blocked apps count
export async function updateBlockedAppsCount(count: number): Promise<void> {
  try {
    const stats = await getAchievementStats();
    stats.blockedAppsCount = count;
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error updating blocked apps count:', error);
  }
}

// Track focus session
export async function trackFocusSession(
  durationMinutes: number,
  appsBlocked: string[],
  taskCompleted: boolean = false
): Promise<void> {
  try {
    const stats = await getAchievementStats();
    const now = new Date();
    const hour = now.getHours();

    // Increment focus session count
    stats.focusSessionsCount++;
    stats.focusSessionsToday++;

    // Update max focus duration
    if (durationMinutes > stats.maxFocusDuration) {
      stats.maxFocusDuration = durationMinutes;
    }

    // Track early morning sessions (before 8 AM)
    if (hour < 8) {
      stats.earlyMorningSessionCount++;
    }

    // Track late night sessions (after 10 PM)
    if (hour >= 22) {
      stats.lateNightSessionCount++;
    }

    // Track task completion
    if (taskCompleted) {
      stats.tasksCompleted++;
    }

    // Save session history
    const session: SessionRecord = {
      id: Date.now().toString(),
      type: 'focus',
      startTime: new Date(now.getTime() - durationMinutes * 60000).toISOString(),
      endTime: now.toISOString(),
      durationMinutes,
      appsBlocked,
      taskCompleted,
    };
    await saveSessionHistory(session);

    // Update streaks
    await updateStreaks(true, hour < 12);

    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking focus session:', error);
  }
}

// Track schedule creation
export async function trackScheduleCreated(): Promise<void> {
  try {
    const stats = await getAchievementStats();
    stats.schedulesCount++;
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking schedule created:', error);
  }
}

// Track schedule deletion
export async function trackScheduleDeleted(): Promise<void> {
  try {
    const stats = await getAchievementStats();
    if (stats.schedulesCount > 0) {
      stats.schedulesCount--;
    }
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking schedule deleted:', error);
  }
}

// Track task completion
export async function trackTaskCompleted(): Promise<void> {
  try {
    const stats = await getAchievementStats();
    stats.tasksCompleted++;
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking task completed:', error);
  }
}

// Track unblock resistance
export async function trackUnblockResisted(): Promise<void> {
  try {
    const stats = await getAchievementStats();
    stats.resistedUnblockCount++;
    await saveAchievementStats(stats);
  } catch (error) {
    console.error('Error tracking unblock resisted:', error);
  }
}

// Update streaks
async function updateStreaks(hadActivity: boolean, hadMorning: boolean): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const streaks = await getDailyStreaks();

    // Check if today already recorded
    const todayStreak = streaks.find(s => s.date === today);
    if (!todayStreak) {
      const usageStats = await getTodayUsageStats();
      const healthScore = calculateHealthScore(usageStats.totalScreenTime, usageStats.pickups);

      streaks.push({
        date: today,
        hadBlockingActivity: hadActivity,
        hadMorningBlocking: hadMorning,
        healthScore,
      });

      // Keep only last 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const filtered = streaks.filter(s => new Date(s.date) >= cutoffDate);

      await saveDailyStreaks(filtered);

      // Calculate current streak
      const stats = await getAchievementStats();
      stats.currentStreak = calculateCurrentStreak(filtered);
      stats.morningBlockingStreak = calculateMorningStreak(filtered);
      stats.weekendBlockingDays = calculateWeekendDays(filtered);
      await saveAchievementStats(stats);
    }
  } catch (error) {
    console.error('Error updating streaks:', error);
  }
}

// Calculate current blocking streak
function calculateCurrentStreak(streaks: DailyStreak[]): number {
  if (streaks.length === 0) return 0;

  const sorted = streaks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const streakDate = new Date(sorted[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (streakDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0] && sorted[i].hadBlockingActivity) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Calculate morning blocking streak
function calculateMorningStreak(streaks: DailyStreak[]): number {
  if (streaks.length === 0) return 0;

  const sorted = streaks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const streakDate = new Date(sorted[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (streakDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0] && sorted[i].hadMorningBlocking) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Calculate weekend blocking days
function calculateWeekendDays(streaks: DailyStreak[]): number {
  const lastWeekend = streaks.filter(s => {
    const date = new Date(s.date);
    const day = date.getDay();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return (day === 0 || day === 6) && date >= weekAgo && s.hadBlockingActivity;
  });

  return lastWeekend.length;
}

// Helper functions for storage
async function getUniqueBlockedApps(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem('@unique_blocked_apps');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveSessionHistory(session: SessionRecord): Promise<void> {
  try {
    const history = await getSessionHistory();
    history.push(session);

    // Keep only last 100 sessions
    const trimmed = history.slice(-100);
    await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving session history:', error);
  }
}

async function getSessionHistory(): Promise<SessionRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function getDailyStreaks(): Promise<DailyStreak[]> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_STREAKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveDailyStreaks(streaks: DailyStreak[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_STREAKS_KEY, JSON.stringify(streaks));
  } catch (error) {
    console.error('Error saving daily streaks:', error);
  }
}

// Calculate screen time reduction percentage
export async function calculateScreenTimeReduction(): Promise<number> {
  // TODO: Implement baseline tracking
  // For now, return 0
  return 0;
}

// Check if weekly health score is above threshold
export async function hasWeeklyHealthAbove80(): Promise<boolean> {
  try {
    const streaks = await getDailyStreaks();
    const lastWeek = streaks.filter(s => {
      const date = new Date(s.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    if (lastWeek.length < 7) return false;

    const avgHealth = lastWeek.reduce((sum, s) => sum + s.healthScore, 0) / lastWeek.length;
    return avgHealth >= 80;
  } catch {
    return false;
  }
}

// Reset all achievement stats (for testing)
export async function resetAchievementStats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACHIEVEMENT_STATS_KEY);
    await AsyncStorage.removeItem(SESSION_HISTORY_KEY);
    await AsyncStorage.removeItem(DAILY_STREAKS_KEY);
    await AsyncStorage.removeItem('@unique_blocked_apps');
    await initializeAchievementStats();
  } catch (error) {
    console.error('Error resetting achievement stats:', error);
  }
}
