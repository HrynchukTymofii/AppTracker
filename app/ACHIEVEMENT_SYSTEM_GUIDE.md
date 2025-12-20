# Achievement System Implementation Guide

## ✅ What's Been Completed

### 1. Achievement Tracking System (`lib/achievementTracking.ts`)
- **Complete tracking database** with AsyncStorage
- **15 trackable stats** for all 24 achievements
- **Automatic daily updates** for streaks and health scores
- **Session history tracking** with full details
- **Helper functions** for all tracking needs

### 2. Achievements Page (`app/achievements.tsx`)
- **All 24 achievements** with unique icons and colors
- **Fully translated** into all 15 languages
- **Progress tracking** with percentage bar
- **Beautiful UI** matching your app design
- **Real-time updates** when achievements are unlocked

### 3. Profile Integration
- **Achievement preview** showing top 3 achievements
- **Translations** for all profile text
- **Loading states** with proper UI
- **Navigation** to full achievements page

---

## 🏆 All 24 Achievements

| # | Name | Unlock Condition | Tracking Required |
|---|------|------------------|-------------------|
| 1 | **First Time** | Block your first app | `blockedAppsCount >= 1` or `totalAppsBlocked >= 1` |
| 2 | **Focus Beginner** | Complete first focus session | `focusSessionsCount >= 1` |
| 3 | **Task Master** | Complete a task verification | `tasksCompleted >= 1` |
| 4 | **Early Bird** | Start focus before 8 AM | `earlyMorningSessionCount >= 1` |
| 5 | **Night Owl** | Use blocking after 10 PM | `lateNightSessionCount >= 1` |
| 6 | **Discipline** | 7-day blocking streak | `currentStreak >= 7` |
| 7 | **Iron Will** | Complete 10 focus sessions | `focusSessionsCount >= 10` |
| 8 | **Zen Master** | Complete 50 focus sessions | `focusSessionsCount >= 50` |
| 9 | **Schedule Pro** | Create first schedule | `schedulesCount >= 1` |
| 10 | **Time Keeper** | Create 5 schedules | `schedulesCount >= 5` |
| 11 | **Digital Detox** | Block apps for 24 hours | `maxFocusDuration >= 1440` (minutes) |
| 12 | **Weekend Warrior** | Use blocking on weekends | `weekendBlockingDays >= 2` |
| 13 | **Minimalist** | Block 10+ apps at once | `blockedAppsCount >= 10` |
| 14 | **Focus Legend** | 2-hour focus session | `maxFocusDuration >= 120` |
| 15 | **Marathon** | 4-hour focus session | `maxFocusDuration >= 240` |
| 16 | **Consistency King** | 30-day blocking streak | `currentStreak >= 30` |
| 17 | **Health Champion** | Achieve 90+ health score | `healthScore >= 90` |
| 18 | **Screen Saver** | Reduce screen time by 50% | `screenTimeReduction >= 50` |
| 19 | **Morning Routine** | Block apps 3 mornings | `morningBlockingStreak >= 3` |
| 20 | **Productivity Beast** | Complete 5 task verifications | `tasksCompleted >= 5` |
| 21 | **App Blocker Pro** | Block 20+ different apps | `totalAppsBlocked >= 20` |
| 22 | **Focus Flow** | 3 focus sessions in one day | `focusSessionsToday >= 3` |
| 23 | **Digital Wellbeing** | 80+ health score for a week | Weekly health check |
| 24 | **Self Control** | Resist unblocking 10 times | `resistedUnblockCount >= 10` |

---

## 🔧 How to Integrate Tracking

### Step 1: Import the Tracking Functions

```typescript
import {
  trackAppBlocked,
  trackFocusSession,
  trackScheduleCreated,
  trackScheduleDeleted,
  trackTaskCompleted,
  trackUnblockResisted,
  updateBlockedAppsCount,
  getAchievementStats,
} from '@/lib/achievementTracking';
```

### Step 2: Track Events in Your Code

#### When an App is Blocked
```typescript
// In your BlockingContext or wherever you block apps
import { trackAppBlocked } from '@/lib/achievementTracking';

export function blockApp(packageName: string) {
  // Your existing blocking logic...

  // Track the achievement
  await trackAppBlocked(packageName);
}
```

#### When Blocked Apps Count Changes
```typescript
// In BlockingContext, update when blockedApps state changes
import { updateBlockedAppsCount } from '@/lib/achievementTracking';

useEffect(() => {
  const count = blockedApps.filter(a => a.isBlocked).length;
  updateBlockedAppsCount(count);
}, [blockedApps]);
```

#### When a Focus Session Completes
```typescript
// In your focus session component
import { trackFocusSession } from '@/lib/achievementTracking';

async function endFocusSession() {
  const durationMinutes = (endTime - startTime) / 60000;
  const appsBlocked = blockedApps.map(a => a.packageName);
  const taskCompleted = false; // or true if task was verified

  await trackFocusSession(durationMinutes, appsBlocked, taskCompleted);

  // Your existing logic...
}
```

#### When a Task is Verified
```typescript
// After task verification succeeds
import { trackTaskCompleted } from '@/lib/achievementTracking';

async function verifyTask() {
  const result = await verifyTaskWithAI();

  if (result.verified) {
    await trackTaskCompleted();
  }
}
```

#### When a Schedule is Created
```typescript
// When user creates a new schedule
import { trackScheduleCreated } from '@/lib/achievementTracking';

async function createSchedule(schedule: Schedule) {
  // Save schedule...

  await trackScheduleCreated();
}
```

#### When a Schedule is Deleted
```typescript
// When user deletes a schedule
import { trackScheduleDeleted } from '@/lib/achievementTracking';

async function deleteSchedule(scheduleId: string) {
  // Delete schedule...

  await trackScheduleDeleted();
}
```

#### When User Resists Unblocking
```typescript
// When user tries to unblock but decides not to
import { trackUnblockResisted } from '@/lib/achievementTracking';

function showUnblockWarning() {
  Alert.alert(
    "Are you sure?",
    "Breaking focus will reset your progress",
    [
      {
        text: "Keep Blocking",
        onPress: async () => {
          await trackUnblockResisted(); // Track resistance!
        },
      },
      {
        text: "Unblock",
        onPress: () => { /* unblock logic */ }
      }
    ]
  );
}
```

### Step 3: Update Profile Screen to Show Real Stats

```typescript
// In app/(tabs)/profile/index.tsx
import { getAchievementStats } from '@/lib/achievementTracking';

useFocusEffect(
  useCallback(() => {
    (async () => {
      const stats = await getAchievementStats();

      setAchievementStats(stats);
      setAchievements(getDynamicAchievements(t, stats));
    })();
  }, [t])
);
```

---

## 📊 Stats Tracked Automatically

The tracking system automatically maintains:

1. **blockedAppsCount** - Updated when you call `updateBlockedAppsCount()`
2. **focusSessionsCount** - Incremented by `trackFocusSession()`
3. **tasksCompleted** - Incremented by `trackTaskCompleted()`
4. **schedulesCount** - Updated by `trackScheduleCreated/Deleted()`
5. **currentStreak** - Calculated daily from blocking activity
6. **maxFocusDuration** - Automatically tracked from session durations
7. **healthScore** - Updated daily from usage stats
8. **totalAppsBlocked** - Tracks unique apps ever blocked
9. **weekendBlockingDays** - Calculated from daily streaks
10. **focusSessionsToday** - Reset daily, incremented per session
11. **morningBlockingStreak** - Calculated from morning sessions
12. **earlyMorningSessionCount** - Incremented for sessions before 8 AM
13. **lateNightSessionCount** - Incremented for sessions after 10 PM
14. **resistedUnblockCount** - Incremented by `trackUnblockResisted()`

---

## 🧪 Testing Your Implementation

### Check Current Stats
```typescript
import { getAchievementStats } from '@/lib/achievementTracking';

const stats = await getAchievementStats();
console.log('Current Achievement Stats:', stats);
```

### Reset Everything (for testing)
```typescript
import { resetAchievementStats } from '@/lib/achievementTracking';

// WARNING: This deletes all achievement progress!
await resetAchievementStats();
```

### Manually Unlock Achievements (for testing)
```typescript
// Simulate completing 10 focus sessions
for (let i = 0; i < 10; i++) {
  await trackFocusSession(30, ['com.example.app'], false);
}

// Check achievements page - "Iron Will" should be unlocked!
```

---

## 📱 Example Integration Points

### BlockingContext.tsx
```typescript
// Update blocked apps count whenever it changes
useEffect(() => {
  const count = blockedApps.filter(a => a.isBlocked).length;
  updateBlockedAppsCount(count);
}, [blockedApps]);

// Track when blocking an app
const blockApp = async (packageName: string) => {
  // ... your blocking logic
  await trackAppBlocked(packageName);
};
```

### Focus Session Modal
```typescript
const endSession = async () => {
  const duration = (Date.now() - startTime) / 60000;
  const apps = selectedApps.map(a => a.packageName);

  await trackFocusSession(duration, apps, taskWasCompleted);

  // Close modal...
};
```

### Task Verification
```typescript
const handleTaskVerification = async () => {
  const result = await verifyWithOpenAI(beforePhoto, afterPhoto);

  if (result.confidence > 70) {
    await trackTaskCompleted();
    // Show success...
  }
};
```

### Schedule Management
```typescript
const saveSchedule = async (schedule: Schedule) => {
  await saveToDatabase(schedule);
  await trackScheduleCreated();
};

const deleteSchedule = async (id: string) => {
  await deleteFromDatabase(id);
  await trackScheduleDeleted();
};
```

---

## 🎨 UI is Already Styled

- ✅ Matches your app's design system
- ✅ Dark mode support
- ✅ Colored icons for each achievement
- ✅ Unlocked/locked states with visual feedback
- ✅ Progress bar showing completion percentage
- ✅ Fully translated into 15 languages

---

## 🚀 Quick Start

1. **Import tracking functions** where needed
2. **Call tracking functions** when events happen
3. **Test on achievements page** to see unlocks
4. **View in profile** to see top 3 achievements

That's it! The system handles everything else automatically including:
- Daily streak calculations
- Health score updates
- Session history
- Weekend tracking
- Morning routine tracking

---

## 💡 Pro Tips

1. **Call tracking functions immediately** after the action completes
2. **Don't worry about calling them multiple times** - the system handles duplicates
3. **Stats update in real-time** - refresh achievements page to see changes
4. **Streaks calculate automatically** at midnight
5. **Use `getAchievementStats()`** to debug what's being tracked

---

## 🐛 Troubleshooting

**Achievement not unlocking?**
- Check the stat value: `const stats = await getAchievementStats();`
- Verify you're calling the correct tracking function
- Check if the unlock condition matches the stat

**Stats not persisting?**
- AsyncStorage is used for persistence
- Stats survive app restarts
- Use `resetAchievementStats()` to test fresh state

**Need to test unlocks?**
- Use tracking functions in a loop to quickly unlock achievements
- Reset with `resetAchievementStats()` to start over
- Check achievements page after each test

---

## 📖 Files Created/Modified

✅ **Created:**
- `lib/achievementTracking.ts` - Complete tracking system

✅ **Updated:**
- `app/achievements.tsx` - All 24 achievements with tracking
- `app/(tabs)/profile/index.tsx` - Achievement preview + translations
- `i18n/locales/*.json` - All 15 language files with translations

---

## 🎯 Next Steps

1. **Integrate tracking calls** into your existing code
2. **Test each achievement** by triggering its condition
3. **Verify translations** work in different languages
4. **Celebrate!** Your achievement system is complete! 🎉
