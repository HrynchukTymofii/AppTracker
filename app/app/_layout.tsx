import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import "@/i18n/config"; // Initialize i18n
import Toast from "react-native-toast-message";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TourProvider } from "@/context/TourContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import { DetoxProvider } from "@/context/DetoxContext";
import { BlockingProvider } from "@/context/BlockingContext";
import { Suspense, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { SQLiteProvider } from "expo-sqlite";
import CustomPreloadScreen from "@/components/ui/CustomPreloadScreen";
import * as Network from "expo-network";
import { PermissionWrapper } from "@/components/PermissionWrapper";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { AppState, Platform, useColorScheme } from "react-native";
import { useLoadUserInBackground } from "@/lib/user";
import { processOfflineQueue } from "@/lib/offlineQueue";
import { upgradeToPro, removePro } from "@/lib/api/user";
import { scheduleDailyStudyReminder } from "@/lib/notifications";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

function AppSyncWrapper({ children }: { children: React.ReactNode }) {
  const { token, user, setUser } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const { loadUserInBackground } = useLoadUserInBackground();

  const syncIfOnline = async () => {
    if (!token) return;

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        setIsOffline(true);
        return;
      }

      setIsOffline(false);
      await loadUserInBackground({ token, setUser });
      await processOfflineQueue(token);

      if (user) {
        try {
          // Get RevenueCat customer info
          const customerInfo = await Purchases.getCustomerInfo();

          // Check for yearly PRO
          const proForYear = customerInfo.entitlements.all["PRO Yearly"];

          // Check for monthly PRO
          const proForMonth = customerInfo.entitlements.all["PRO Monthly"];

          let shouldHavePro = false;
          let plan: string | null = null;

          // Priority 1: Check for yearly PRO
          if (proForYear && proForYear.latestPurchaseDate) {
            const purchaseDate = new Date(proForYear.latestPurchaseDate);
            const today = new Date();

            // Calculate expiration: purchase date + 1 year + 1 day
            const expirationDate = new Date(purchaseDate);
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            expirationDate.setDate(expirationDate.getDate() + 1);

            // Check if still valid
            if (today < expirationDate) {
              shouldHavePro = true;
              plan = "PRO Yearly";
            }
          }
          // Priority 2: Check for monthly PRO
          else if (proForMonth && proForMonth.latestPurchaseDate) {
            const purchaseDate = new Date(proForMonth.latestPurchaseDate);
            const today = new Date();

            // Calculate expiration: purchase date + 1 month + 1 day
            const expirationDate = new Date(purchaseDate);
            expirationDate.setMonth(expirationDate.getMonth() + 1);
            expirationDate.setDate(expirationDate.getDate() + 1);

            // Check if still valid
            if (today < expirationDate) {
              shouldHavePro = true;
              plan = "PRO Monthly";
            }
          }

          // Now sync with backend and local state
          if (shouldHavePro && plan) {
            // User should have PRO based on RevenueCat
            if (!user.isPro) {
              // Try to sync to backend
              const res = await upgradeToPro(token, plan);

              if (res.success) {
                setUser({ ...user, isPro: true });
                //console.log("✅ User upgraded to PRO via RevenueCat sync");
              } else {
                console.warn("❌ Failed to sync PRO status:", res.error);
              }
            }
          } else {
            // User should NOT have PRO
            if (user.isPro) {
              //console.log("⚠️ PRO expired, removing access");
              setUser({ ...user, isPro: false });
              await removePro(token);
            }
          }
        } catch (err) {
          console.warn("Failed to sync PRO status", err);
        }
      }
    } catch (err) {
      console.error("Background sync failed:", err);
    }
  };

  // 1️⃣ Fire-and-forget sync on app start
  useEffect(() => {
    syncIfOnline();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        syncIfOnline();
      }
    });

    return () => subscription.remove();
  }, [token]);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey: "appl_plYVBUscFYEJQnxkmHBsnMRhbIa" });
    } else if (Platform.OS === "android") {
      Purchases.configure({ apiKey: "goog_RDVEiwhMsfMcTDNFxFdGkPiMLes" });
    }
  }, []);

  // Setup daily study reminder notification
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await scheduleDailyStudyReminder();
        //console.log("Daily study reminder scheduled successfully");
      } catch (error) {
        console.error("Failed to schedule daily reminder:", error);
      }
    };

    setupNotifications();
  }, []);

  return <>{children}</>;
}


export default function RootLayout() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [onboardingDone, setOnboardingDone] = useState<boolean>(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      const done = await SecureStore.getItemAsync("onboardingCompleted");
      setOnboardingDone(!!done);
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (onboardingDone === false) {
      router.replace("/onboarding");
    }
  }, [onboardingDone]);

  // Wait until we know the onboarding status + fonts loaded
  if (!loaded) return <CustomPreloadScreen />;

  // Otherwise show the normal app
  return (

      <AuthProvider>
        <DetoxProvider>
          <BlockingProvider>
          <Suspense fallback={<CustomPreloadScreen />}>
            <SQLiteProvider
              databaseName="satprep.db"
              assetSource={{
                assetId: require("@/assets/databases/satprep.db"),
              }}
              useSuspense
            >
              <AppSyncWrapper>
                 <TourProvider>
                <CustomThemeProvider>
                  <PermissionWrapper>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Main tabs */}
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                      {/* Auth screens */}
                      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                      <Stack.Screen name="login" options={{ headerShown: false }} />
                      <Stack.Screen name="auth" options={{ headerShown: false }} />

                      {/* Profile & Settings */}
                      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="payment" options={{ headerShown: false }} />

                      {/* Calendar */}
                      <Stack.Screen name="calendar" options={{ headerShown: false }} />


                      {/* Not found */}
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <Toast />
                    <StatusBar style="auto" />
                  </PermissionWrapper>
                </CustomThemeProvider>
                </TourProvider>
             </AppSyncWrapper>
            </SQLiteProvider>
          </Suspense>
        </BlockingProvider>
        </DetoxProvider>
      </AuthProvider>

  );
}
