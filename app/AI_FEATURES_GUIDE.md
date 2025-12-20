# AI-Powered Features Guide

This guide explains how to use the 3 AI-powered features implemented in the app using OpenAI's GPT-4o model.

## Table of Contents
1. [Task Verification with Photos](#1-task-verification-with-photos)
2. [Intention-Based App Blocking](#2-intention-based-app-blocking)
3. [Smart Notifications](#3-smart-notifications)

---

## 1. Task Verification with Photos

### Overview
Users can create tasks that must be completed before apps are unblocked. The system uses AI vision to verify task completion by comparing before/after photos.

### How It Works
1. User creates a focus session with a task requirement
2. Takes a "before" photo of the task area
3. All specified apps are blocked until task is verified
4. User completes the task and takes an "after" photo
5. AI analyzes both photos and determines if task was completed
6. If verified, apps are unblocked; if not, they remain blocked

### Implementation

#### Basic Usage (Already Integrated)
The task verification is already integrated into the `BlockingContext`. Here's how it works:

```typescript
import { useBlocking } from '@/context/BlockingContext';

function MyComponent() {
  const { startFocus, endFocus } = useBlocking();

  // Start a focus session with task verification
  const handleStartWithTask = async () => {
    const beforePhotoUri = 'file://path/to/before/photo.jpg';
    const taskDescription = 'Clean my desk';
    const blockedApps = ['com.instagram.android', 'com.tiktok'];

    await startFocus(
      60, // 60 minutes
      blockedApps,
      true, // requiresTask = true
      beforePhotoUri,
      taskDescription
    );
  };

  // End focus session and verify task
  const handleEndWithVerification = async () => {
    const afterPhotoUri = 'file://path/to/after/photo.jpg';

    const result = await endFocus(afterPhotoUri);

    if (result) {
      if (result.isTaskCompleted) {
        // Task verified! Apps unblocked
        console.log('Success:', result.explanation);
        console.log('Detected changes:', result.detectedChanges);
      } else {
        // Task not verified, apps stay blocked
        console.log('Not complete:', result.explanation);
      }
    }
  };
}
```

#### Using Task Verification Directly

```typescript
import { verifyTaskWithPhotos } from '@/lib/openai';

const result = await verifyTaskWithPhotos(
  beforePhotoUri,
  afterPhotoUri,
  'Make my bed neatly'
);

console.log('Completed:', result.isTaskCompleted);
console.log('Confidence:', result.confidence); // 0-100
console.log('Explanation:', result.explanation);
console.log('Changes:', result.detectedChanges);
```

### Example UI Flow

```typescript
// In your detox or blocking screen
import * as ImagePicker from 'expo-image-picker';

const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
const [taskDescription, setTaskDescription] = useState('');

// Step 1: Take before photo
const takeBeforePhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    setBeforePhoto(result.assets[0].uri);
  }
};

// Step 2: Start focus with task
const startTaskFocus = async () => {
  if (!beforePhoto || !taskDescription) return;

  await startFocus(
    60,
    selectedApps,
    true,
    beforePhoto,
    taskDescription
  );
};

// Step 3: Take after photo and verify
const verifyCompletion = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const verificationResult = await endFocus(result.assets[0].uri);
    // Handle result...
  }
};
```

---

## 2. Intention-Based App Blocking

### Overview
When users try to open a blocked app, they must first write their intention. AI analyzes the intention to determine if it's productive or distracting, and responds accordingly with coaching.

### How It Works
1. User tries to open a blocked app
2. `IntentionModal` appears asking "Why do you want to use this app?"
3. User writes their intention (e.g., "need to answer a message" vs "want to scroll")
4. AI analyzes the intention:
   - **Productive** (e.g., work, answering messages): 3 minutes granted
   - **Neutral** (e.g., quick check): 1 minute granted
   - **Unproductive** (e.g., scrolling, boredom): Coaching conversation starts
5. If unproductive, AI asks thought-provoking questions to help user reflect
6. User can either:
   - Give up and skip using the app
   - Insist and get 1 minute anyway

### Implementation

#### Add IntentionModal to Your Blocking Screen

```typescript
import { IntentionModal } from '@/components/modals/IntentionModal';
import { useState } from 'react';

function BlockingScreen() {
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<{ name: string; package: string } | null>(null);
  const { healthScore } = useHealthScore(); // Your health score hook

  const handleAppClick = (appName: string, packageName: string) => {
    // When user clicks a blocked app
    setSelectedApp({ name: appName, package: packageName });
    setShowIntentionModal(true);
  };

  const handleAllowAccess = (minutes: number) => {
    // Grant temporary access
    console.log(`Granting ${minutes} minute(s) access to ${selectedApp?.name}`);

    // Implement temporary unblock logic here
    // You could:
    // 1. Temporarily remove from blockedApps
    // 2. Set a timer to re-block after `minutes`
    // 3. Show a countdown timer

    setShowIntentionModal(false);
  };

  return (
    <>
      {/* Your blocking UI */}

      <IntentionModal
        visible={showIntentionModal}
        appName={selectedApp?.name || ''}
        healthScore={healthScore}
        onClose={() => setShowIntentionModal(false)}
        onAllow={handleAllowAccess}
      />
    </>
  );
}
```

#### Direct API Usage

```typescript
import { analyzeIntention, generateCoachingResponse } from '@/lib/openai';

// Analyze intention
const result = await analyzeIntention(
  "I want to scroll for a bit",
  "Instagram",
  75 // health score
);

console.log('Is productive:', result.isProductive);
console.log('Category:', result.category); // 'productive' | 'unproductive' | 'neutral'
console.log('Allowed minutes:', result.allowedMinutes);
console.log('Coaching question:', result.coachingQuestion);

// Generate coaching response
const followUp = await generateCoachingResponse(
  "Why do you feel the need to scroll right now?",
  "I'm just bored",
  "Instagram"
);

console.log('Coach response:', followUp);
```

### Example Intention Flows

**Productive Intention:**
```
User: "Need to reply to a work message"
AI: ✅ Productive intention detected
Result: 3 minutes granted immediately
```

**Unproductive Intention:**
```
User: "Want to scroll and kill some time"
AI: 🤔 Starts coaching conversation
AI: "What else could you do with this time that would make you feel better later?"
User: "I don't know, maybe read?"
AI: "Reading sounds fulfilling. Would scrolling really satisfy you more than that?"
User can: [Give up] or [Insist - 1 min]
```

---

## 3. Smart Notifications

### Overview
The app monitors usage patterns and sends contextual, AI-generated notifications to encourage healthy digital habits. Notifications become more urgent as usage continues.

### How It Works
1. App monitors when user is actively using certain apps
2. Sends notifications at intervals: 10min, 20min, 30min, 40min, then every 10min
3. Each notification is contextual, considering:
   - Which app they're using
   - How long they've been using it
   - Their health score
   - Time of day
   - How many notifications they've already received
4. Messages can be:
   - Pre-generated (hundreds of variations stored offline)
   - Generated in real-time by AI

### Implementation

#### Option A: Pre-generate Notifications (Recommended)

```typescript
import { pregenerateNotificationsForApps } from '@/lib/smartNotifications';

// Run this once (e.g., in settings or on app update)
async function setupNotifications() {
  const popularApps = [
    'Instagram',
    'TikTok',
    'YouTube',
    'Twitter',
    'Facebook',
  ];

  console.log('Generating notifications... This may take a few minutes');

  await pregenerateNotificationsForApps(popularApps, 50); // 50 messages per app

  console.log('Done! Notifications cached for offline use');
}
```

#### Option B: Real-time Generation

```typescript
import {
  startAppSession,
  endAppSession,
  checkAndSendNotification,
} from '@/lib/smartNotifications';

// When user starts using an app
await startAppSession('Instagram', 'com.instagram.android');

// Check periodically (e.g., every 60 seconds)
setInterval(async () => {
  await checkAndSendNotification(
    'Instagram',
    'com.instagram.android',
    currentHealthScore
  );
}, 60000);

// When user closes the app
await endAppSession('com.instagram.android');
```

#### Integration with Usage Tracking

```typescript
import { getTodayUsageStats } from '@/lib/usageTracking';
import { checkAndSendNotification } from '@/lib/smartNotifications';

// In your usage tracking logic
useEffect(() => {
  const monitorUsage = async () => {
    const stats = await getTodayUsageStats();
    const healthScore = calculateHealthScore(stats.totalScreenTime, stats.pickups);

    // For each app in active use
    for (const app of stats.apps) {
      await checkAndSendNotification(
        app.appName,
        app.packageName,
        healthScore
      );
    }
  };

  // Check every minute
  const interval = setInterval(monitorUsage, 60000);

  return () => clearInterval(interval);
}, []);
```

### Example Notifications

The AI generates messages that escalate in urgency:

**1st notification (10 min):**
- "Maybe it's time to do some work"
- "10 minutes on Instagram - quick check done?"

**2nd notification (20 min):**
- "20 minutes scrolling. What about that task you wanted to finish?"
- "You've spent 20 min on TikTok this morning"

**3rd notification (30 min):**
- "30 minutes on YouTube. This is valuable time"
- "Third session today. Time for something real?"

**5th+ notification (50+ min):**
- "You've spent 50 min on Instagram - that's nearly an hour of your life"
- "Is this really how you want to spend your afternoon?"

### Notification Statistics

```typescript
import { getNotificationStats } from '@/lib/smartNotifications';

const stats = await getNotificationStats();

console.log('Total today:', stats.totalNotifications);
console.log('By app:', stats.notificationsByApp);
console.log('Avg session duration:', stats.averageSessionDuration, 'minutes');
```

---

## Configuration

### Setting Up OpenAI API Key

The API key is configured in `.env`:

```env
OPEN_AI_API_KEY=sk-proj-your-api-key-here
```

The app automatically loads it from `process.env.OPEN_AI_API_KEY`.

### Customizing AI Behavior

#### Task Verification Strictness

Edit `lib/openai.ts` - adjust the system prompt:

```typescript
// More strict
content: `Be very strict in your assessment. Only mark tasks as complete if there's clear, significant improvement.`

// More lenient
content: `Be fair and reasonable. Give credit for genuine effort even if not perfect.`
```

#### Intention Analysis Thresholds

Modify the categories in the `analyzeIntention` system prompt to adjust what counts as productive:

```typescript
Guidelines:
- Productive: work tasks, replying to specific messages, legitimate errands
- Neutral: quick notification checks, 5-minute breaks
- Unproductive: scrolling, boredom, procrastination
```

#### Notification Intervals

Adjust when notifications are sent in `smartNotifications.ts`:

```typescript
const NOTIFICATION_INTERVALS = [
  5,  // First notification at 5 minutes (instead of 10)
  10, // Second at 10 minutes (instead of 20)
  15, // etc.
  20,
  25,
];
```

---

## Best Practices

### 1. Rate Limiting
- Pre-generate notifications when possible to reduce API calls
- Cache results when appropriate
- Handle API errors gracefully with fallbacks

### 2. User Privacy
- All photos are processed client-side then sent to OpenAI
- No photos are stored long-term
- Users should be informed about AI analysis

### 3. Error Handling
- Always provide fallback behavior if AI fails
- For task verification: allow manual override option
- For intentions: default to 1-minute access if analysis fails
- For notifications: use pre-written fallback messages

### 4. Cost Management
- Monitor OpenAI API usage
- Set up usage limits in OpenAI dashboard
- Consider caching frequent queries
- Use pre-generated content where possible

---

## Troubleshooting

### "OpenAI API key not configured"
- Check `.env` file has `OPEN_AI_API_KEY`
- Restart the development server
- Verify the key is valid in OpenAI dashboard

### Task verification always fails
- Ensure photos are clear and well-lit
- Verify task description is specific
- Check network connection
- Review OpenAI API logs for errors

### Notifications not sending
- Check notification permissions
- Verify app is monitoring usage correctly
- Check interval timings
- Review AsyncStorage for session data

### AI responses seem off
- Adjust temperature (0-1, lower = more focused)
- Refine system prompts
- Check if context data is accurate
- Review API responses in logs

---

## Future Enhancements

Potential improvements:

1. **Multilingual Support**: Translate prompts and responses to user's language
2. **Personalization**: Learn from user patterns to customize messages
3. **Voice Intentions**: Allow voice input for intentions
4. **Achievement Integration**: Reward users for resisting unproductive intentions
5. **Analytics Dashboard**: Show AI interaction statistics
6. **Offline Mode**: Fully pre-generated responses for offline use
7. **Custom Coaching Styles**: Let users choose coaching tone (gentle, strict, humorous)

---

## API Cost Estimates

Based on OpenAI pricing (as of 2024):

- **Task Verification**: ~$0.01 per verification (2 images)
- **Intention Analysis**: ~$0.001 per analysis
- **Coaching Conversation**: ~$0.001 per message
- **Smart Notification**: ~$0.0005 per generation

**Pre-generation strategy** (50 messages × 10 apps = 500 messages):
- One-time cost: ~$0.25
- Provides weeks of offline notifications

---

## Support

For issues or questions:
1. Check this guide
2. Review code comments in `lib/openai.ts`
3. Check OpenAI API documentation
4. Review error logs in console

---

**Version**: 1.0
**Last Updated**: 2025-12-20
**AI Model**: GPT-4o
