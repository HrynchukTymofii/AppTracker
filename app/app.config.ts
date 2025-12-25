import 'dotenv/config';
import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "App Blocker",
  slug: "app-blocker",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "appblocker",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.hrynchuk.appblocker",
    buildNumber: "1",
    icon: "./assets/images/icon.png",
    entitlements: {
      "com.apple.developer.family-controls": true,
      "com.apple.security.application-groups": ["group.com.hrynchuk.appblocker"],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSFaceIDUsageDescription: "Use Face ID to temporarily unblock apps",
    },
    googleServicesFile: "./GoogleService-Info.plist",
  },

  android: {
    package: "com.hrynchuk.appblocker",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.SCHEDULE_EXACT_ALARM",
    ],
  },

  notification: {
    icon: "./assets/images/icon.png",
    color: "#06b6d4",
    androidMode: "default",
    androidCollapsedTitle: "App Blocker",
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#111827",
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#111827",
        sounds: [],
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.329617813146-3o5aq7gfvejqoi3mudiar02tl4urhivu",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Allow LockIn to access your camera for task verification photos.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow LockIn to access your photos for task verification.",
        cameraPermission: "Allow LockIn to take photos for task verification.",
      },
    ],
    "./plugins/withUsageStats.js",
    "./plugins/withFamilyControls.js",
    "./plugins/withScreenTimeExtensions.js",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.0",
        },
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 26,
        },
      },
    ],
    "expo-sqlite",
    "expo-video",
    "expo-web-browser"
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    androidClientId: process.env.ANDROID_GOOGLE_CLIENT_ID,
    iosClientId: process.env.IOS_GOOGLE_CLIENT_ID,
    webClientId: process.env.GOOGLE_CLIENT_ID,
    openAiApiKey: process.env.OPEN_AI_API_KEY,
    router: {},
    eas: {
      projectId: "0184c7dc-cb6e-4a07-ac66-5f86bfad673e"
    }
  },

  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#111827",
  },
};

export default config;
