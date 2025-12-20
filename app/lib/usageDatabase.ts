/**
 * Usage Database Module
 * Stores historical usage data locally to show stats beyond the last week
 */

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('usage_history.db');

// Initialize database
export const initUsageDatabase = async () => {
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

    console.log('Usage database initialized');
  } catch (error) {
    console.error('Error initializing usage database:', error);
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
    const appsJson = JSON.stringify(appsData);

    await db.runAsync(
      `INSERT OR REPLACE INTO daily_usage
       (date, total_screen_time, pickups, health_score, orb_level, apps_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, totalScreenTime, pickups, healthScore, orbLevel, appsJson]
    );

    console.log(`Saved usage data for ${date}`);
  } catch (error) {
    console.error('Error saving daily usage:', error);
  }
};

// Get daily usage for a specific date
export const getDailyUsage = async (date: string) => {
  try {
    const result = await db.getFirstAsync(
      'SELECT * FROM daily_usage WHERE date = ?',
      [date]
    );

    if (result) {
      return {
        ...result,
        apps_data: JSON.parse(result.apps_data as string),
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
    const results = await db.getAllAsync(
      `SELECT * FROM daily_usage
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    return results.map(row => ({
      ...row,
      apps_data: JSON.parse(row.apps_data as string),
    }));
  } catch (error) {
    console.error('Error getting week usage:', error);
    return [];
  }
};

// Check if data exists for a date range
export const hasDataForRange = async (startDate: string, endDate: string): Promise<boolean> => {
  try {
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM daily_usage
       WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    ) as { count: number };

    return result.count > 0;
  } catch (error) {
    console.error('Error checking data range:', error);
    return false;
  }
};

// Get all dates with data (for calendar heatmap)
export const getAllDatesWithData = async () => {
  try {
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

// Helper: Get week date range
export const getWeekDateRange = (weekOffset: number): { startDate: string; endDate: string } => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    startDate: formatDate(startOfWeek),
    endDate: formatDate(endOfWeek),
  };
};
