# iOS App Blocking Implementation Guide

This module provides app blocking functionality for iOS using **Family Controls** and **Screen Time API**.

## ⚠️ Requirements

### 1. **iOS Version**
- Minimum: iOS 15.0+
- Family Controls framework is only available on iOS 15 and later

### 2. **Apple Developer Account**
- You need an **active Apple Developer Account** ($99/year)
- Individual or Organization account (not Enterprise)

### 3. **Family Controls Entitlement**
You must request this special entitlement from Apple:

1. Go to: https://developer.apple.com/contact/request/family-controls-distribution
2. Fill out the form explaining your use case
3. Wait for Apple's approval (can take 1-4 weeks)
4. Once approved, the entitlement will be automatically added to your developer account

## 📋 Setup Instructions

### Step 1: Update app.json

Add the required entitlements to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.appblocker",
      "infoPlist": {
        "NSFamilyControlsUsageDescription": "This app needs access to Family Controls to help you manage your screen time by blocking distracting apps during focus sessions.",
        "NSUserNotificationsUsageDescription": "We'll notify you when apps are blocked or unblocked."
      },
      "entitlements": {
        "com.apple.developer.family-controls": true
      }
    }
  }
}
```

### Step 2: Update Package.json Dependencies

Ensure you have the required iOS deployment target:

```json
{
  "expo": {
    "ios": {
      "deploymentTarget": "15.0"
    }
  }
}
```

### Step 3: Prebuild for iOS

After adding entitlements, you need to prebuild:

```bash
npx expo prebuild --platform ios --clean
```

This will generate the native iOS project with the correct entitlements.

### Step 4: Open in Xcode

```bash
npx expo run:ios
# Or manually: open ios/YourApp.xcworkspace
```

In Xcode, verify the entitlements:
1. Select your project
2. Go to "Signing & Capabilities"
3. Ensure "Family Controls" capability is present
4. If not, click "+ Capability" and add "Family Controls"

### Step 5: Configure App Groups (Optional but Recommended)

For better data sharing between app and extensions:

1. In Xcode, add "App Groups" capability
2. Create a group: `group.com.yourcompany.appblocker`
3. Update your code to use this group for data persistence

## 🔧 How It Works

### Authorization Flow

1. **Request Permission**
   ```typescript
   import * as AppBlocker from '@/modules/app-blocker';

   await AppBlocker.requestAuthorization();
   ```

2. **Check Authorization Status**
   ```typescript
   const isAuthorized = await AppBlocker.isAccessibilityServiceEnabled();
   ```

3. **Set Blocked Apps**
   ```typescript
   // Note: On iOS, you need to use bundle identifiers
   AppBlocker.setBlockedApps([
     'com.instagram.burbn',     // Instagram
     'com.google.ios.youtube',  // YouTube
     'com.zhiliaoapp.musically', // TikTok
   ]);
   ```

### iOS vs Android Differences

| Feature | Android | iOS |
|---------|---------|-----|
| Permission | Accessibility Service | Family Controls |
| App Identifier | Package Name | Bundle Identifier |
| Block Method | Accessibility Service | Screen Time API |
| App Selection | Any method | FamilyActivityPicker only |
| Overlay | Required | Not needed |

### Important iOS Limitations

1. **FamilyActivityPicker Required**:
   - You cannot hardcode bundle IDs to block
   - Users MUST select apps through Apple's FamilyActivityPicker
   - This is an Apple requirement for privacy

2. **Shield Customization**:
   - Limited customization of block screens
   - Apple controls the blocking UI

3. **Background Restrictions**:
   - The app must have proper background modes
   - Blocking continues even when app is closed

## 📱 iOS Bundle Identifiers (Common Apps)

```swift
// Social Media
"com.instagram.burbn"           // Instagram
"com.facebook.Facebook"         // Facebook
"com.atebits.Tweetie2"         // Twitter/X
"com.toyopagroup.picaboo"      // Snapchat
"com.zhiliaoapp.musically"     // TikTok

// Video
"com.google.ios.youtube"       // YouTube
"com.netflix.Netflix"          // Netflix
"tv.twitch"                    // Twitch

// Messaging
"net.whatsapp.WhatsApp"        // WhatsApp
"com.discord.Discord"          // Discord
"ph.telegra.Telegraph"         // Telegram

// Other
"com.reddit.Reddit"            // Reddit
"com.pinterest"                // Pinterest
"com.spotify.client"           // Spotify
```

## 🧪 Testing Without Entitlement

You can test the UI and flow without the entitlement, but:
- Authorization requests will fail
- App blocking won't actually work
- You'll see permission errors in console

To test properly, you MUST:
1. Request the entitlement from Apple
2. Wait for approval
3. Rebuild with approved entitlement

## 🐛 Troubleshooting

### Error: "This app is not authorized to use Family Controls"
- **Solution**: You need to request and receive the entitlement from Apple

### Error: "The operation couldn't be completed"
- **Solution**: Ensure iOS deployment target is 15.0+
- Check that Family Controls capability is added in Xcode

### Apps not blocking
- **Solution**:
  1. Verify authorization was granted
  2. Check that you're using ApplicationTokens from FamilyActivityPicker
  3. Ensure the app is running with proper entitlements

### Build fails with "Unknown entitlement"
- **Solution**: Your account doesn't have the Family Controls entitlement yet
- Remove the entitlement temporarily or wait for Apple approval

## 📚 Additional Resources

- [Apple Family Controls Documentation](https://developer.apple.com/documentation/familycontrols)
- [Screen Time API Guide](https://developer.apple.com/documentation/screentime)
- [Request Family Controls Entitlement](https://developer.apple.com/contact/request/family-controls-distribution)

## 🔐 Privacy & App Store Submission

When submitting to the App Store:

1. **Privacy Policy Required**: You must have a privacy policy explaining Screen Time data usage
2. **App Review Notes**: Explain clearly how you use Family Controls
3. **Demo Account**: Provide a test account if needed
4. **Screenshots**: Show the permission flow clearly

## ⚡ Next Steps

1. Request Family Controls entitlement from Apple
2. While waiting, build and test the UI
3. Once approved, rebuild with entitlement
4. Test blocking functionality
5. Submit to App Store with proper documentation
