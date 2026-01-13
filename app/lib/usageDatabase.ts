/**
 * Usage Database Module
 * Stores historical usage data locally to show stats beyond the last week
 */

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('usage_history.db');

// Track initialization state
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Type for database row (note: column still called 'pickups' for backward compatibility)
interface DailyUsageRow {
  id: number;
  date: string;
  total_screen_time: number;
  pickups: number; // maps to 'unlocks' in the app
  health_score: number;
  orb_level: number;
  apps_data: string;
  created_at: string;
}

// Initialize database
export const initUsageDatabase = async () => {
  // Return existing promise if already initializing
  if (initPromise) return initPromise;
  if (isInitialized) return;

  initPromise = (async () => {
    try {
      // Create table for daily usage stats
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL UNIQUE,
          total_screen_time INTEGER NOT NULL,
          pickups INTEGER NOT NULL,
          health_score INTEGER NOT NULL,
          orb_level INTEGER NOT NULL,
          apps_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_date ON daily_usage(date);
      `);

      isInitialized = true;
      console.log('Usage database initialized');
    } catch (error) {
      console.error('Error initializing usage database:', error);
    }
  })();

  return initPromise;
};

// Ensure DB is initialized before any operation
const ensureInitialized = async () => {
  if (!isInitialized) {
    console.log('[UsageDB] ensureInitialized: DB not ready, initializing...');
    const start = Date.now();
    await initUsageDatabase();
    console.log('[UsageDB] ensureInitialized: done', `(${Date.now() - start}ms)`);
  }
};

// Save daily usage data
export const saveDailyUsage = async (
  date: string,
  totalScreenTime: number,
  pickups: number,
  healthScore: number,
  orbLevel: number,
  appsData: any[]
) => {
  try {
    await ensureInitialized();
    const appsJson = JSON.stringify(appsData);

    await db.runAsync(
      `INSERT OR REPLACE INTO daily_usage
       (date, total_screen_time, pickups, health_score, orb_level, apps_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, totalScreenTime, pickups, healthScore, orbLevel, appsJson]
    );
  } catch (error) {
    console.error('Error saving daily usage:', error);
  }
};

// Get daily usage for a specific date
export const getDailyUsage = async (date: string) => {
  try {
    await ensureInitialized();
    const result = await db.getFirstAsync<DailyUsageRow>(
      'SELECT * FROM daily_usage WHERE date = ?',
      [date]
    );

    if (result) {
      return {
        ...result,
        apps_data: JSON.parse(result.apps_data),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return null;
  }
};

// Get usage data for a week
export const getWeekUsage = async (startDate: string, endDate: string) => {
  try {
    await ensureInitialized();
    const results = await db.getAllAsync<DailyUsageRow>(
      `SELECT * FROM daily_usage
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    return results.map(row => ({
      ...row,
      apps_data: JSON.parse(row.apps_data),
    }));
  } catch (error) {
    console.error('Error getting week usage:', error);
    return [];
  }
};

// Check if data exists for a date range
export const hasDataForRange = async (startDate: string, endDate: string): Promise<boolean> => {
  const fnStart = Date.now();
  console.log('[UsageDB] hasDataForRange START', startDate, '-', endDate);
  try {
    await ensureInitialized();
    console.log('[UsageDB] hasDataForRange: querying...', `(${Date.now() - fnStart}ms)`);
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM daily_usage
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    ) as { count: number };

    console.log('[UsageDB] hasDataForRange DONE, count:', result?.count, `(${Date.now() - fnStart}ms)`);
    return result?.count > 0;
  } catch (error) {
    console.error('[UsageDB] hasDataForRange ERROR:', error);
    return false;
  }
};

// Get all dates with data (for calendar heatmap)
export const getAllDatesWithData = async () => {
  try {
    await ensureInitialized();
    const results = await db.getAllAsync(
      `SELECT date, health_score, orb_level, total_screen_time, pickups
       FROM daily_usage
       ORDER BY date DESC
       LIMIT 365`
    );

    return results;
  } catch (error) {
    console.error('Error getting all dates:', error);
    return [];
  }
};

// Helper: Format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get week date range (rolling 7 days: today + 6 previous days)
export const getWeekDateRange = (weekOffset: number): { startDate: string; endDate: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // End date is today (or offset weeks ago)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (weekOffset * 7));

  // Start date is 6 days before end date (7 days total including end date)
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};
