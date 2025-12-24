# Google Play Permission Declaration Video Scripts

**App:** LockIn - Digital Wellbeing & App Blocker
**Purpose:** Help users reduce screen time by blocking distracting apps

---

## Video 1: Usage Stats Permission (~45 sec)

**Permission:** `PACKAGE_USAGE_STATS`
**Play Console Category:** Usage Stats Permission

### What to Show:
1. Open LockIn app
2. Navigate to the Stats/Usage tab
3. Show daily screen time breakdown
4. Show per-app usage times
5. Show weekly/monthly trends if available

### Script:

"LockIn, a digital wellbeing app designed to help users reduce their screen time.

We require the Usage Stats permission to access and display the user's screen time data.

As you can see, this screen shows users exactly how much time they've spent on each app today. Users can see their total screen time, which apps they use most, and track their progress over time.

All usage data remains on the device and is never uploaded to external servers. Without this permission, we cannot provide screen time insights to our users."

---

## Video 2: Query All Packages (~45 sec)

**Permission:** `QUERY_ALL_PACKAGES`
**Play Console Category:** App Visibility Permission

### What to Show:
1. Open LockIn app
2. Go to blocking/app selection screen
3. Show the list of installed apps
4. Select some apps to block
5. Show the blocked apps list

### Script:

"LockIn allows users to select specific apps they want to block during focus sessions.

To provide this functionality, we need the Query All Packages permission. This allows us to display all installed apps on the user's device.

Here you can see the complete list of apps. Users can browse through and select which apps they find distracting.

When a user selects an app, it gets added to their block list. Without this permission, we cannot show users their installed apps, and they would have no way to choose which apps to block. This is fundamental to how our app blocking feature works."

---

## Video 3: Accessibility Service + Display Over Apps (~60 sec)

**Permissions:**
- `BIND_ACCESSIBILITY_SERVICE` (Accessibility Service)
- `SYSTEM_ALERT_WINDOW` (Display Over Other Apps)

**Play Console Category:** Accessibility Service Declaration

### What to Show:
1. Show LockIn settings with accessibility enabled
2. Show a blocked app in the list (e.g., Instagram)
3. Go to home screen
4. Try to open the blocked app
5. Show the intervention/intention screen appearing
6. Show the user interaction with the modal

### Script:

"The core feature of LockIn is blocking distracting apps. This requires two permissions working together: Accessibility Service and Display Over Other Apps.

The Accessibility Service allows LockIn to detect when the user opens an app that is on their block list.

Watch what happens when I try to open Instagram, which I have added to my block list.

Immediately, LockIn detects the app launch and displays this intervention screen using the Display Over Other Apps permission.

This screen asks the user to pause and reflect on why they want to use this app.

Without the Accessibility Service, we cannot detect app launches. Without Display Over Other Apps, we cannot show this blocking screen. Both permissions are essential for our app's core blocking functionality."

---

## Video 4: Foreground Service Special Use (~50 sec)

**Permissions:**
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_SPECIAL_USE`

**Play Console Category:** Foreground Service Permission

### What is Special Use Type?

`FOREGROUND_SERVICE_SPECIAL_USE` is required starting from Android 14 when your foreground service doesn't fit standard categories (camera, location, microphone, etc.). For LockIn, we use it because:

- Our service monitors app launches via Accessibility APIs
- This is a "special use case" not covered by predefined types
- It runs continuously to provide real-time app blocking

### What to Show:
1. Show the notification bar with LockIn service running
2. Show the persistent notification
3. Demonstrate that blocking works even after minimizing the app
4. Show blocking still works after some time has passed

### Script:

"For app blocking to work reliably, LockIn must run continuously in the background. This requires Foreground Service permissions.

We use the Foreground Service Special Use type because our service monitors app launches through Android's Accessibility APIs. This doesn't fit into standard foreground service categories like camera or location - it's a special use case for digital wellbeing.

As you can see, even with the app minimized, when i go to Insagram blocking still works perfectly. Without foreground service permission, Android would terminate our background process, and users would lose their blocking protection. The persistent service ensures uninterrupted digital wellbeing features."

---

## Play Console Declaration Summary

| Permission | Category | Why Required |
|------------|----------|--------------|
| `PACKAGE_USAGE_STATS` | Usage Stats | Display user's screen time and app usage statistics |
| `QUERY_ALL_PACKAGES` | App Visibility | Show installed apps so users can select which to block |
| `BIND_ACCESSIBILITY_SERVICE` | Accessibility | Detect when user opens a blocked app |
| `SYSTEM_ALERT_WINDOW` | Display Over Apps | Show blocking intervention screen over blocked apps |
| `FOREGROUND_SERVICE` | Foreground Service | Keep blocking service running continuously |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Foreground Service | Required for accessibility-based monitoring (Android 14+) |

---

## What is FOREGROUND_SERVICE_SPECIAL_USE?

Starting with **Android 14 (API 34)**, apps must declare a specific foreground service type. The available types are:

- `camera` - Camera access
- `connectedDevice` - Bluetooth, USB, etc.
- `dataSync` - Data synchronization
- `health` - Health/fitness tracking
- `location` - GPS/location access
- `mediaPlayback` - Audio/video playback
- `mediaProjection` - Screen capture
- `microphone` - Audio recording
- `phoneCall` - Phone calls
- `remoteMessaging` - Messaging services
- `shortService` - Quick tasks under 3 min
- `specialUse` - **Anything that doesn't fit above**
- `systemExempted` - System apps only

**LockIn uses `specialUse`** because:
1. We monitor app launches via Accessibility Service
2. This doesn't fit any predefined category
3. It's a legitimate digital wellbeing use case
4. Google allows this for apps that genuinely need background monitoring

When declaring in Play Console, explain that the special use is for **"Accessibility-based app blocking for digital wellbeing purposes"**.

---

## Recording Tips

1. **Use actual device** - Screen record on a real Android phone
2. **Clean notifications** - Clear other notifications before recording
3. **Prepare blocked apps** - Have 2-3 apps already in block list
4. **Show real data** - Use the app for a day first to have real usage stats
5. **Keep it smooth** - Practice the flow before recording
6. **Resolution** - Record in 1080p or higher
7. **Audio** - Can record voiceover separately or add captions
8. **Duration** - Each video should be 30-60 seconds max
