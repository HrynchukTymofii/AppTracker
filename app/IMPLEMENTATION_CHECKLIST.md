# AI Features Implementation Checklist

Quick guide to integrate the 3 AI features into your existing app.

## ✅ What's Already Done

- [x] OpenAI service module (`lib/openai.ts`)
- [x] Task verification integrated into BlockingContext
- [x] IntentionModal component created
- [x] Smart notifications service created
- [x] API key loaded from `.env`

## 🔨 What You Need to Implement

### 1. Task Verification with Photos (Mostly Done!)

**Status**: Already integrated into `BlockingContext` ✅

**What's Working**:
- `startFocus()` accepts task parameters
- `endFocus()` verifies photos with AI
- API calls to OpenAI Vision

**What You Need to Add**:
- UI for taking before/after photos in the Detox screen
- Camera integration using expo-camera or expo-image-picker (already configured!)

**Example Integration in Detox Screen**:

```typescript
// In app/(tabs)/detox/index.tsx or wherever you start focus sessions

import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

// Add state
const [taskMode, setTaskMode] = useState(false);
const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
const [taskDescription, setTaskDescription] = useState('');

// Add "Require Task" toggle
<Switch
  value={taskMode}
  onValueChange={setTaskMode}
/>

// If task mode enabled, show photo and description inputs
{taskMode && (
  <>
    <TextInput
      placeholder="Describe your task..."
      value={taskDescription}
      onChangeText={setTaskDescription}
    />

    <Button
      title="Take Before Photo"
      onPress={async () => {
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });
        if (!result.canceled) {
          setBeforePhoto(result.assets[0].uri);
        }
      }}
    />
  </>
)}

// When starting focus
const handleStartFocus = async () => {
  await startFocus(
    duration,
    selectedApps,
    taskMode, // requiresTask
    beforePhoto || undefined,
    taskDescription || undefined
  );
};

// When ending focus (if task mode was enabled)
const handleEndFocus = async () => {
  if (focusSession?.requiresTaskCompletion) {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const verification = await endFocus(result.assets[0].uri);

      if (verification) {
        if (verification.isTaskCompleted) {
          Alert.alert('Success!', verification.explanation);
          // Apps unblocked
        } else {
          Alert.alert('Not Complete', verification.explanation);
          // Apps stay blocked
        }
      }
    }
  } else {
    await endFocus();
  }
};
```

---

### 2. Intention-Based App Blocking

**Status**: Component ready, needs integration ⚠️

**What You Need to Add**:

#### A. In Blocking Screen (`app/(tabs)/blocking/index.tsx`)

```typescript
import { IntentionModal } from '@/components/modals/IntentionModal';
import { useState } from 'react';

// Add state
const [showIntentionModal, setShowIntentionModal] = useState(false);
const [selectedAppForIntention, setSelectedAppForIntention] = useState<{
  name: string;
  packageName: string;
} | null>(null);

// When user tries to open/unblock an app
const handleAppClick = (appName: string, packageName: string) => {
  setSelectedAppForIntention({ name: appName, packageName });
  setShowIntentionModal(true);
};

// Handle temporary access
const handleAllowAccess = async (minutes: number) => {
  if (!selectedAppForIntention) return;

  // Create a temporary unblock
  console.log(`Granting ${minutes} min access to ${selectedAppForIntention.name}`);

  // Option 1: Temporarily remove from blocked list
  await removeBlockedApp(selectedAppForIntention.packageName);

  // Set timer to re-block
  setTimeout(async () => {
    await addBlockedApp(
      selectedAppForIntention.packageName,
      selectedAppForIntention.name
    );
  }, minutes * 60 * 1000);

  // Show countdown toast
  Toast.show({
    type: 'info',
    text1: `${minutes} minute access granted`,
    text2: `${selectedAppForIntention.name} will re-block automatically`,
  });

  setShowIntentionModal(false);
};

// Add modal to render
return (
  <>
    {/* Your existing UI */}

    <IntentionModal
      visible={showIntentionModal}
      appName={selectedAppForIntention?.name || ''}
      healthScore={healthScore}
      onClose={() => setShowIntentionModal(false)}
      onAllow={handleAllowAccess}
    />
  </>
);
```

#### B. Get Health Score

You need a way to get the current health score. Either:

```typescript
import { calculateHealthScore } from '@/lib/usageTracking';

// Option 1: From state
const { healthScore } = useHealth(); // if you have this

// Option 2: Calculate it
const [healthScore, setHealthScore] = useState(75);

useEffect(() => {
  const loadHealth = async () => {
    const stats = await getTodayUsageStats();
    const score = calculateHealthScore(stats.totalScreenTime, stats.pickups);
    setHealthScore(score);
  };
  loadHealth();
}, []);
```

---

### 3. Smart Notifications

**Status**: Service ready, needs usage monitoring ⚠️

**What You Need to Add**:

#### A. Start Monitoring App Usage

Create a background monitoring service or add to existing usage tracking:

```typescript
// In lib/usageMonitoring.ts (new file) or existing usage tracking

import {
  startAppSession,
  endAppSession,
  checkAndSendNotification,
} from './smartNotifications';
import { getTodayUsageStats, calculateHealthScore } from './usageTracking';

export const initializeSmartNotifications = async () => {
  // Check every minute
  setInterval(async () => {
    const stats = await getTodayUsageStats();
    const healthScore = calculateHealthScore(stats.totalScreenTime, stats.pickups);

    // Get currently active app (you need to implement this based on your setup)
    const currentApp = await getCurrentlyActiveApp();

    if (currentApp) {
      await checkAndSendNotification(
        currentApp.appName,
        currentApp.packageName,
        healthScore
      );
    }
  }, 60000); // Every 60 seconds
};
```

#### B. Track App Opens/Closes

Integrate with your usage tracking:

```typescript
// When app is opened
import { startAppSession } from '@/lib/smartNotifications';

const onAppOpened = async (appName: string, packageName: string) => {
  await startAppSession(appName, packageName);
  // Your existing tracking code...
};

// When app is closed
import { endAppSession } from '@/lib/smartNotifications';

const onAppClosed = async (packageName: string) => {
  await endAppSession(packageName);
  // Your existing tracking code...
};
```

#### C. Pre-generate Notifications (Recommended)

Add a settings option or run once:

```typescript
// In app/(tabs)/settings/index.tsx or similar

import { pregenerateNotificationsForApps } from '@/lib/smartNotifications';

const handlePregenerateNotifications = async () => {
  setIsGenerating(true);

  const popularApps = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Twitter',
    'Facebook',
    'Snapchat',
    'Reddit',
    'WhatsApp',
    'Telegram',
    'Discord',
  ];

  await pregenerateNotificationsForApps(popularApps, 50);

  setIsGenerating(false);
  Alert.alert('Success', 'Smart notifications generated!');
};

// Add button in settings
<TouchableOpacity onPress={handlePregenerateNotifications}>
  <Text>Generate Smart Notifications</Text>
  <Text style={{ fontSize: 12, color: '#666' }}>
    Pre-generate 500 AI notifications for offline use
  </Text>
</TouchableOpacity>
```

#### D. Request Notification Permissions

Make sure notifications are enabled:

```typescript
import * as Notifications from 'expo-notifications';

const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Notifications', 'Please enable notifications for smart reminders');
  }
};

// Call on app start
useEffect(() => {
  requestNotificationPermission();
}, []);
```

---

## 🎯 Priority Implementation Order

### Quick Win (1-2 hours):
1. ✅ Add IntentionModal to blocking screen
2. ✅ Test intention analysis with a few blocked apps

### Medium (3-4 hours):
3. ✅ Add photo capture UI for task verification
4. ✅ Test task verification flow end-to-end

### Advanced (4-6 hours):
5. ✅ Implement usage monitoring for smart notifications
6. ✅ Pre-generate notification messages
7. ✅ Test notification delivery

---

## 📋 Testing Checklist

### Task Verification
- [ ] Can take before photo
- [ ] Can enter task description
- [ ] Focus session starts with task mode
- [ ] Can take after photo
- [ ] AI correctly verifies completed tasks
- [ ] AI correctly rejects incomplete tasks
- [ ] Apps unblock only when task verified
- [ ] Error handling works (no API key, network failure)

### Intention Analysis
- [ ] Modal appears when clicking blocked app
- [ ] Can enter intention
- [ ] Productive intentions grant 3 minutes
- [ ] Neutral intentions grant 1 minute
- [ ] Unproductive intentions start coaching
- [ ] Coaching conversation works
- [ ] Can give up or insist
- [ ] Temporary access works
- [ ] Apps re-block after time expires

### Smart Notifications
- [ ] Notifications trigger at correct intervals
- [ ] Messages are contextual and relevant
- [ ] Notification count increases over time
- [ ] Messages escalate in urgency
- [ ] Pre-generated messages work offline
- [ ] Real-time generation works when online
- [ ] Statistics tracking works
- [ ] Can clear notification history

---

## 🔐 Security Checklist

- [ ] OpenAI API key is in `.env`, not committed to git
- [ ] API key is not exposed in client code
- [ ] Photos are not permanently stored
- [ ] User data is not sent to OpenAI except for analysis
- [ ] Error messages don't leak sensitive info

---

## 📊 Monitoring

Add analytics to track:

```typescript
// Track feature usage
analytics.track('task_verification_started');
analytics.track('intention_analyzed', { category: result.category });
analytics.track('smart_notification_sent', { appName, notificationCount });

// Track success rates
analytics.track('task_verified', { success: result.isTaskCompleted });
analytics.track('intention_accepted', { allowedMinutes });
```

---

## 🐛 Common Issues

### Issue: "API key not configured"
**Fix**: Make sure `.env` has `OPEN_AI_API_KEY` and restart dev server

### Issue: Photos not uploading
**Fix**: Check camera permissions in app.json (already configured!)

### Issue: Notifications not showing
**Fix**:
1. Check notification permissions
2. Verify Expo Notifications is configured
3. Test with `Notifications.scheduleNotificationAsync()`

### Issue: AI responses are slow
**Fix**:
1. Use pre-generated content where possible
2. Show loading indicators
3. Consider lower quality for images (0.7 instead of 1.0)

---

## 📞 Next Steps

1. **Start with Intention Modal** - easiest to implement and test
2. **Add Task Verification UI** - photos already integrated, just need UI
3. **Set up Smart Notifications** - requires monitoring, so takes longest

Good luck! Refer to `AI_FEATURES_GUIDE.md` for detailed API documentation.
