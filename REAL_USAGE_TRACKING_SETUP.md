# Real Usage Tracking Setup for Expo

This guide shows you how to get REAL app usage data on both iOS and Android with Expo.

## Prerequisites

```bash
npm install expo-dev-client
npm install expo-build-properties
```

## Step 1: Update app.json

Add the config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withUsageStats",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.0"
          },
          "android": {
            "compileSdkVersion": 33,
            "targetSdkVersion": 33,
            "minSdkVersion": 26
          }
        }
      ]
    ]
  }
}
```

## Step 2: Install Required Packages

```bash
# For native modules
npx expo install expo-modules-core

# For development builds
npx expo install expo-dev-client

# Rebuild your app
npx expo prebuild --clean
```

## Step 3: Create Android Native Module

Create `modules/usage-stats/android/src/main/java/expo/modules/usagestats/UsageStatsModule.kt`:

```kotlin
package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

class UsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    AsyncFunction("hasPermission") {
      val appOps = appContext.reactContext?.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
      val mode = appOps?.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        android.os.Process.myUid(),
        appContext.reactContext?.packageName ?: ""
      )
      mode == AppOpsManager.MODE_ALLOWED
    }

    AsyncFunction("requestPermission") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext.reactContext?.startActivity(intent)
    }

    AsyncFunction("getUsageStats") { startTime: Long, endTime: Long ->
      val usageStatsManager = appContext.reactContext?.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      val stats = usageStatsManager?.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)

      val pm = appContext.reactContext?.packageManager
      val apps = mutableListOf<Map<String, Any>>()
      var totalPickups = 0

      stats?.forEach { usageStat ->
        if (usageStat.totalTimeInForeground > 0) {
          try {
            val appInfo = pm?.getApplicationInfo(usageStat.packageName, 0)
            val appName = pm?.getApplicationLabel(appInfo!!).toString() ?: usageStat.packageName

            // Get app icon
            val icon = pm?.getApplicationIcon(appInfo!!)
            val iconBase64 = icon?.let { drawableToBase64(it) }

            apps.add(mapOf(
              "packageName" to usageStat.packageName,
              "appName" to appName,
              "timeInForeground" to usageStat.totalTimeInForeground,
              "lastTimeUsed" to usageStat.lastTimeUsed,
              "icon" to (iconBase64 ?: "")
            ))

            totalPickups += usageStat.appLaunchCount
          } catch (e: PackageManager.NameNotFoundException) {
            // Skip system apps that can't be found
          }
        }
      }

      mapOf(
        "apps" to apps,
        "pickups" to totalPickups
      )
    }

    private fun drawableToBase64(drawable: Drawable): String {
      val bitmap = when (drawable) {
        is BitmapDrawable -> drawable.bitmap
        else -> {
          val bitmap = Bitmap.createBitmap(
            drawable.intrinsicWidth,
            drawable.intrinsicHeight,
            Bitmap.Config.ARGB_8888
          )
          val canvas = Canvas(bitmap)
          drawable.setBounds(0, 0, canvas.width, canvas.height)
          drawable.draw(canvas)
          bitmap
        }
      }

      val outputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
      return "data:image/png;base64," + Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    }
  }
}
```

## Step 4: Create iOS Native Module

Create `modules/usage-stats/ios/UsageStatsModule.swift`:

```swift
import ExpoModulesCore
import FamilyControls
import DeviceActivity
import ManagedSettings

public class UsageStatsModule: Module {
  let center = AuthorizationCenter.shared

  public func definition() -> ModuleDefinition {
    Name("UsageStats")

    AsyncFunction("hasPermission") { () -> Bool in
      return center.authorizationStatus == .approved
    }

    AsyncFunction("requestPermission") { (promise: Promise) in
      Task {
        do {
          try await center.requestAuthorization(for: .individual)
          promise.resolve(true)
        } catch {
          promise.reject("PERMISSION_ERROR", error.localizedDescription)
        }
      }
    }

    AsyncFunction("getUsageStats") { (startTime: Double, endTime: Double, promise: Promise) in
      // Note: DeviceActivity API is restricted and requires special entitlements
      // For now, return a message indicating the limitation
      promise.reject(
        "NOT_AVAILABLE",
        "iOS DeviceActivity API requires special entitlements from Apple. Please apply for Screen Time API access."
      )
    }
  }
}
```

## Step 5: Register Modules

Create `modules/usage-stats/index.ts`:

```typescript
import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

const UsageStatsModule = NativeModulesProxy.UsageStats;

export async function hasPermission(): Promise<boolean> {
  return await UsageStatsModule.hasPermission();
}

export async function requestPermission(): Promise<void> {
  return await UsageStatsModule.requestPermission();
}

export async function getUsageStats(startTime: number, endTime: number): Promise<any> {
  return await UsageStatsModule.getUsageStats(startTime, endTime);
}
```

## Step 6: Build Custom Development Client

```bash
# Create development build
eas build --profile development --platform android
eas build --profile development --platform ios

# Or local build
npx expo run:android
npx expo run:ios
```

## Step 7: Request Permissions at Runtime

In your app code:

```typescript
import * as UsageStats from './modules/usage-stats';

// Check permission
const hasPermission = await UsageStats.hasPermission();

if (!hasPermission) {
  // Request permission - opens Settings
  await UsageStats.requestPermission();
}

// Get usage data
const stats = await UsageStats.getUsageStats(
  Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
  Date.now()
);
```

## Important Notes:

### For Android:
- ✅ Works with expo-dev-client
- ✅ Full access to UsageStatsManager API
- ✅ Get app usage time, last used, pickups
- ⚠️ Requires manual permission grant in Settings

### For iOS:
- ⚠️ Requires **special entitlements** from Apple
- ⚠️ Must apply for Screen Time API access
- ⚠️ Approval process can take weeks/months
- ⚠️ Mainly for parental control apps
- ℹ️ Alternative: Use MDM (Mobile Device Management) profile

### iOS Alternatives:
1. **Ask Apple for Screen Time entitlement** (for serious apps)
2. **Use Screen Recording** (records screen, analyzes app usage)
3. **VPN Method** (create local VPN to monitor network traffic)
4. **Use Shortcuts** (user manually logs usage)

## Quick Start (Without Native Modules):

For rapid development, use the tracking module I created earlier (`lib/usageTracking.ts`) which provides simulated data and works immediately on both platforms.

When ready for production, implement the native modules above.

## Production Ready Alternative:

Use a hybrid approach:
1. **Android**: Full native tracking (works great)
2. **iOS**: User self-reporting + manual shortcuts
3. Show users how to use iOS Screen Time alongside your app
