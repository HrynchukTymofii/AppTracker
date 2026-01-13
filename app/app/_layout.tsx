import { useFonts } from "expo-font";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import "@/i18n/config";
import Toast from "react-native-toast-message";
import toastConfig from "@/components/ui/CustomToast";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { TourProvider } from "@/context/TourContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import { DetoxProvider } from "@/context/DetoxContext";
import { BlockingProvider, useBlocking } from "@/context/BlockingContext";
import { GroupProvider } from "@/context/GroupContext";
import { LockInProvider } from "@/context/LockInContext";
import { EarnedTimeProvider, useEarnedTime } from "@/context/EarnedTimeContext";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQLiteProvider } from "expo-sqlite";
import CustomPreloadScreen from "@/components/ui/CustomPreloadScreen";
import * as Network from "expo-network";
import { PermissionWrapper } from "@/components/PermissionWrapper";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { AppState, Platform } from "react-native";
import { upgradeToPro, removePro } from "@/lib/api/user";
import * as QuickActions from "expo-quick-actions";
import { RouterAction } from "expo-quick-actions/router";
import * as AppBlocker from "@/modules/app-blocker";
import * as UsageStats from "@/modules/usage-stats";
import { initIconCache } from "@/lib/iconCache";

// Clear corrupted app cache on startup (one-time fix for SQLite full error)
// Delayed to not block app startup
setTimeout(() => {
  AsyncStorage.multiRemove([
    "@installed_apps_cache",
    "@installed_apps_cache_time",
    "@installed_apps_cache_v2",
    "@installed_apps_cache_time_v2",
  ]).catch(() => {});
}, 3000);

// Initialize icon cache after app is stable (delayed to not block startup)
setTimeout(() => {
  initIconCache().catch(() => {});
}, 2000);

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

function AppSyncWrapper({ children }: { children: React.ReactNode }) {
  const { token, user, setUser } = useAuth();
  const { dailyLimits } = useBlocking();
  const { syncUsageWithWallet, syncWebsiteUsageWithWallet, syncNativeAppUsageWithWallet } = useEarnedTime();
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  const rootNavigation = useNavigationContainerRef();
  const isNavigatingToBlockedApp = useRef(false);
  const lastProcessedTimestamp = useRef(0);
  const isLayoutMounted = useRef(false);
  const initialCheckDone = useRef(false);

  // Get list of blocked package names for sync
  const blockedPackages = dailyLimits.map(l => l.packageName);

  // Mark layout as mounted after initial render
  useEffect(() => {
    // Use a longer delay to ensure the entire component tree is mounted
    const mountTimer = setTimeout(() => {
      isLayoutMounted.current = true;
      console.log('[Layout] Layout fully mounted');
    }, 500);

    return () => {
      clearTimeout(mountTimer);
      isLayoutMounted.current = false;
    };
  }, []);

  // Check for navigation flags from native blocking screen (Android only)
  const checkNativeNavigationFlags = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    // Check if navigation is ready AND layout is mounted
    if (!rootNavigation?.isReady()) {
      console.log('[Layout] Navigation not ready yet, will retry...');
      return;
    }

    if (!isLayoutMounted.current) {
      console.log('[Layout] Layout not mounted yet, will retry...');
      return;
    }

    // Prevent multiple simultaneous navigations
    if (isNavigatingToBlockedApp.current) {
      console.log('[Layout] Already navigating, skipping...');
      return;
    }

    try {
      // First check navigation flags from native blocking screen
      const flags = await AppBlocker.getNavigationFlags();

      if (flags) {
        if (flags.navigateToLockin) {
          console.log('[Layout] Native requested navigation to LockIn tab');

          isNavigatingToBlockedApp.current = true;
          AppBlocker.clearNavigationFlags();

          await new Promise(resolve => setTimeout(resolve, 100));

          if (!rootNavigation?.isReady()) {
            isNavigatingToBlockedApp.current = false;
            return;
          }

          router.replace('/(tabs)/lockin');

          setTimeout(() => {
            isNavigatingToBlockedApp.current = false;
          }, 1000);
          return;
        }

        if (flags.showCoachChat && flags.packageName) {
          console.log('[Layout] Native requested coach chat for:', flags.packageName);

          isNavigatingToBlockedApp.current = true;
          AppBlocker.clearNavigationFlags();

          await new Promise(resolve => setTimeout(resolve, 100));

          if (!rootNavigation?.isReady()) {
            isNavigatingToBlockedApp.current = false;
            return;
          }

          // Navigate to blocked-app screen (it will show coach chat when limit is reached)
          router.push({
            pathname: '/blocked-app',
            params: {
              packageName: flags.packageName,
              appName: flags.appName || flags.packageName,
              showCoachChat: 'true',
            },
          });

          setTimeout(() => {
            isNavigatingToBlockedApp.current = false;
          }, 1000);
          return;
        }
      }

      // Fallback: check for legacy pending blocked app (shouldn't be needed with native screen)
      const pending = await AppBlocker.getPendingBlockedApp();

      if (pending && pending.packageName) {
        // Prevent processing the same pending app multiple times
        if (pending.timestamp === lastProcessedTimestamp.current) {
          console.log('[Layout] Already processed this pending app, skipping...');
          return;
        }

        console.log('[Layout] Found pending blocked app:', pending.packageName, 'timestamp:', pending.timestamp);

        // Mark as navigating and store timestamp
        isNavigatingToBlockedApp.current = true;
        lastProcessedTimestamp.current = pending.timestamp;

        // Clear pending data first to prevent re-processing
        await AppBlocker.clearPendingBlockedApp();

        // Small delay before navigation to ensure everything is stable
        await new Promise(resolve => setTimeout(resolve, 100));

        // Double-check navigation is still ready
        if (!rootNavigation?.isReady()) {
          console.log('[Layout] Navigation became unready, aborting...');
          isNavigatingToBlockedApp.current = false;
          return;
        }

        // Navigate to blocked-app screen with params
        router.push({
          pathname: '/blocked-app',
          params: {
            packageName: pending.packageName,
            appName: pending.appName,
          },
        });

        // Reset navigation flag after a delay
        setTimeout(() => {
          isNavigatingToBlockedApp.current = false;
          console.log('[Layout] Navigation complete, ready for next blocked app');
        }, 1000);
      }
    } catch (error) {
      console.error('[Layout] Error checking navigation flags:', error);
      isNavigatingToBlockedApp.current = false;
    }
  }, [router, rootNavigation]);

  // Check when navigation becomes ready and when app becomes active
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Wait for both navigation ready AND layout mounted
    const checkWhenReady = () => {
      if (rootNavigation?.isReady() && isLayoutMounted.current) {
        if (!initialCheckDone.current) {
          initialCheckDone.current = true;
          checkNativeNavigationFlags();
        }
      } else {
        // Retry after a short delay if not ready
        setTimeout(checkWhenReady, 150);
      }
    };

    // Initial check with longer delay to ensure everything is mounted
    const initialTimer = setTimeout(checkWhenReady, 600);

    // Also check when app becomes active
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && isLayoutMounted.current) {
        // Delay to ensure app is fully foregrounded and stable
        setTimeout(checkNativeNavigationFlags, 300);
      }
    });

    return () => {
      clearTimeout(initialTimer);
      subscription.remove();
      initialCheckDone.current = false;
    };
  }, [checkNativeNavigationFlags, rootNavigation]);

  // Setup Quick Actions for iOS home screen long-press menu
  // TODO: Re-enable when special offer is configured
  // useEffect(() => {
  //   const setupQuickActions = async () => {
  //     // Only show discount offer if user is NOT a pro subscriber
  //     if (user?.isPro) {
  //       // Clear any existing actions for pro users
  //       QuickActions.setItems([]);
  //       return;
  //     }

  //     // Set up quick actions for non-subscribers
  //     QuickActions.setItems<RouterAction>([
  //       {
  //         id: "special-offer",
  //         title: "🎁 50% Off First Month",
  //         subtitle: "Limited time offer",
  //         icon: Platform.OS === "ios" ? "symbol:gift.fill" : undefined,
  //         params: { href: "/payment?discount=50" },
  //       },
  //     ]);
  //   };

  //   setupQuickActions();
  // }, [user?.isPro]);

  // // Handle quick action press
  // useEffect(() => {
  //   const subscription = QuickActions.addListener<QuickActions.Action>((action) => {
  //     if (action.id === "special-offer") {
  //       router.push("/payment?discount=50");
  //     }
  //   });

  //   // Check if app was launched from a quick action
  //   if (QuickActions.initial?.id === "special-offer") {
  //     router.push("/payment?discount=50");
  //   }

  //   return () => subscription.remove();
  // }, []);

  const syncIfOnline = async () => {
    if (!token) return;

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        setIsOffline(true);
        return;
      }

      setIsOffline(false);

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

  // 1️⃣ Fire-and-forget sync on app start - DELAYED to not overwhelm native bridge
  useEffect(() => {
    // Delay sync to let critical initialization happen first
    const timer = setTimeout(() => {
      syncIfOnline();
    }, 2000);
    return () => clearTimeout(timer);
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
    // Delay Purchases configuration to not block critical startup
    const timer = setTimeout(async () => {
      try {
        if (Platform.OS === "ios") {
          await Purchases.configure({ apiKey: "appl_DXtiSBNTmQOgIEgTfHOiqHSFlbm" });
        } else if (Platform.OS === "android") {
          await Purchases.configure({ apiKey: "goog_uwxUlQUPmydcyqKsYImEqxdbiip" });
        }
        // Set log level after configure to avoid customLogHandler error
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      } catch (error) {
        console.warn("Failed to configure Purchases:", error);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Periodic usage sync - syncs real device usage with wallet every 15 seconds
  // Also syncs immediately when app comes to foreground for faster updates
  // DELAYED to not overwhelm native bridge on startup
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const syncUsage = async () => {
      try {
        // Sync app usage
        if (blockedPackages.length > 0) {
          const todayStats = await UsageStats.getTodayUsageStats();
          if (todayStats.hasPermission && todayStats.apps) {
            const usageMap: Record<string, number> = {};
            for (const app of todayStats.apps) {
              if (blockedPackages.includes(app.packageName)) {
                const usedMins = Math.round(app.timeInForeground / (1000 * 60));
                if (usedMins > 0) {
                  usageMap[app.packageName] = usedMins;
                }
              }
            }
            if (Object.keys(usageMap).length > 0) {
              await syncUsageWithWallet(usageMap);
            }
          }
        }

        // Sync website usage
        const websiteUsage = await AppBlocker.getWebsiteUsageToday();
        if (Object.keys(websiteUsage).length > 0) {
          await syncWebsiteUsageWithWallet(websiteUsage);
        }

        // Sync native app usage (from AccessibilityService session tracking)
        // This is more immediate than UsageStats for blocked apps
        await syncNativeAppUsageWithWallet();
      } catch (error) {
        console.log('[UsageSync] Error syncing usage:', error);
      }
    };

    // Delay initial sync to let critical startup complete
    const initialTimer = setTimeout(() => {
      syncUsage();
    }, 4000);

    // Set up periodic sync every 15 seconds (reduced from 30s for faster updates)
    let syncInterval: ReturnType<typeof setInterval> | null = null;
    const intervalTimer = setTimeout(() => {
      syncInterval = setInterval(syncUsage, 15000);
    }, 4000);

    // Also sync immediately when app comes to foreground
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Small delay to ensure app is fully active
        setTimeout(syncUsage, 500);
      }
    });

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(intervalTimer);
      if (syncInterval) clearInterval(syncInterval);
      appStateSubscription.remove();
    };
  }, [blockedPackages, syncUsageWithWallet, syncWebsiteUsageWithWallet, syncNativeAppUsageWithWallet]);

  return <>{children}</>;
}


export default function RootLayout() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [sellingOnboardingDone, setSellingOnboardingDone] = useState<boolean>(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      const done = await SecureStore.getItemAsync("sellingOnboardingCompleted");
      setSellingOnboardingDone(!!done);
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (sellingOnboardingDone === false) {
      router.replace("/selling-onboarding");
    }
  }, [sellingOnboardingDone]);

  // Wait until we know the onboarding status + fonts loaded
  if (!loaded) return <CustomPreloadScreen />;

  // Otherwise show the normal app
  return (

      <AuthProvider>
        <DetoxProvider>
          <BlockingProvider>
          <EarnedTimeProvider>
          <LockInProvider>
          <Suspense fallback={<CustomPreloadScreen />}>
            <SQLiteProvider
              databaseName="satprep.db"
              assetSource={{
                assetId: require("@/assets/databases/satprep.db"),
              }}
              useSuspense
            >
              <AppSyncWrapper>
                <GroupProvider>
                
                <CustomThemeProvider>
                 
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Main tabs */}
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                      {/* Auth screens */}
                      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                      <Stack.Screen name="login" options={{ headerShown: false }} />
                      <Stack.Screen name="auth" options={{ headerShown: false }} />
                      <Stack.Screen name="selling-onboarding" options={{ headerShown: false, gestureEnabled: false }} />

                      {/* Profile & Settings */}
                      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="payment" options={{ headerShown: false }} />

                      {/* Calendar */}
                      <Stack.Screen name="calendar" options={{ headerShown: false }} />

                      {/* Blocked App Screen (deep linked from native module) */}
                      <Stack.Screen
                        name="blocked-app"
                        options={{
                          headerShown: false,
                          animation: 'fade',
                          presentation: 'transparentModal',
                        }}
                      />

                      {/* Not found */}
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <Toast config={toastConfig} />
                    <StatusBar style="auto" />
                </CustomThemeProvider>
            
                </GroupProvider>
             </AppSyncWrapper>
            </SQLiteProvider>
          </Suspense>
          </LockInProvider>
          </EarnedTimeProvider>
        </BlockingProvider>
        </DetoxProvider>
      </AuthProvider>

  );
}
