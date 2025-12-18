# Usage Stats Setup Guide

This guide will help you implement the native Android module to get app usage statistics.

## Step 1: Add Permissions to AndroidManifest.xml

Add this to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
    tools:ignore="ProtectedPermissions" />
```

## Step 2: Create UsageStatsModule.java

Create file: `android/app/src/main/java/com/yourapp/UsageStatsModule.java`

```java
package com.yourapp; // Change to your package name

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.provider.Settings;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

public class UsageStatsModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public UsageStatsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "UsageStats";
    }

    @ReactMethod
    public void hasUsageStatsPermission(Promise promise) {
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), reactContext.getPackageName());
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void queryUsageStats(double startTime, double endTime, Promise promise) {
        try {
            UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long start = (long) startTime;
            long end = (long) endTime;

            List<UsageStats> stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, start, end);

            WritableMap result = Arguments.createMap();
            WritableArray appsArray = Arguments.createArray();

            PackageManager pm = reactContext.getPackageManager();
            int totalPickups = 0;

            for (UsageStats usageStat : stats) {
                if (usageStat.getTotalTimeInForeground() > 0) {
                    WritableMap appData = Arguments.createMap();

                    String packageName = usageStat.getPackageName();
                    appData.putString("packageName", packageName);

                    try {
                        ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);
                        String appName = pm.getApplicationLabel(appInfo).toString();
                        appData.putString("appName", appName);

                        // Get app icon as base64
                        Drawable icon = pm.getApplicationIcon(appInfo);
                        String iconBase64 = drawableToBase64(icon);
                        appData.putString("iconUrl", "data:image/png;base64," + iconBase64);
                    } catch (PackageManager.NameNotFoundException e) {
                        appData.putString("appName", packageName);
                    }

                    appData.putDouble("timeInForeground", usageStat.getTotalTimeInForeground());
                    appData.putDouble("lastTimeUsed", usageStat.getLastTimeUsed());

                    // Count pickups (app launches)
                    totalPickups += usageStat.getAppLaunchCount();

                    appsArray.pushMap(appData);
                }
            }

            result.putArray("apps", appsArray);
            result.putInt("pickups", totalPickups);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    private String drawableToBase64(Drawable drawable) {
        if (drawable instanceof BitmapDrawable) {
            Bitmap bitmap = ((BitmapDrawable) drawable).getBitmap();
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            return Base64.encodeToString(byteArray, Base64.NO_WRAP);
        } else {
            Bitmap bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(),
                    drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            return Base64.encodeToString(byteArray, Base64.NO_WRAP);
        }
    }
}
```

## Step 3: Create UsageStatsPackage.java

Create file: `android/app/src/main/java/com/yourapp/UsageStatsPackage.java`

```java
package com.yourapp; // Change to your package name

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class UsageStatsPackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new UsageStatsModule(reactContext));
        return modules;
    }
}
```

## Step 4: Register the Package

Add to `android/app/src/main/java/com/yourapp/MainApplication.java`:

```java
import com.yourapp.UsageStatsPackage; // Add this import

// In getPackages() method, add:
packages.add(new UsageStatsPackage());
```

## Step 5: Request Permission at Runtime

The user needs to manually grant usage stats permission from Settings. You can guide them with a prompt.

## Important Notes:

1. **PACKAGE_USAGE_STATS** is a special permission that requires the user to manually enable it in Settings
2. The permission dialog will open automatically when you call `requestUsageStatsPermission()`
3. Usage stats are only available on Android 5.0+ (API level 21+)
4. App pickups are tracked using `getAppLaunchCount()` from UsageStats

## Testing:

1. Build and run the app
2. Check if permission is granted: `hasUsageStatsPermission()`
3. If not, request it: `requestUsageStatsPermission()`
4. User enables it in Settings
5. Query stats: `queryUsageStats(startTime, endTime)`

## For Development:

Until the native module is implemented, the app will use mock data. The UI is already set up to display real data once the native module is working.
