import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { HelpCircle, Lock, Plus, BarChart3, Shield, Calendar } from "lucide-react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import {
  getTodayUsageStats,
  formatDuration,
  calculateHealthScore,
  getOrbLevel,
  initializeTracking,
} from "@/lib/usageTracking";
import { useBlocking } from "@/context/BlockingContext";

// Local app icons mapping
const APP_ICONS: { [key: string]: any } = {
  instagram: require("@/assets/icons/instagram.png"),
  youtube: require("@/assets/icons/youtube.png"),
  tiktok: require("@/assets/icons/tiktok.png"),
  musically: require("@/assets/icons/tiktok.png"),
  facebook: require("@/assets/icons/facebook.png"),
  telegram: require("@/assets/icons/telegram.png"),
  pinterest: require("@/assets/icons/pinterest.png"),
  linkedin: require("@/assets/icons/linkedin.png"),
  twitter: require("@/assets/icons/x.png"),
  x: require("@/assets/icons/x.png"),
};

// Get local icon for app based on package name or app name
const getLocalIcon = (packageName: string, appName: string): any | null => {
  const packageLower = packageName.toLowerCase();
  const nameLower = appName.toLowerCase();

  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (packageLower.includes(key) || nameLower.includes(key)) {
      return icon;
    }
  }
  return null;
};


// App Usage Item Component - RESTYLED
const AppUsageItem = ({
  appName,
  duration,
  iconUrl,
  isDark,
}: {
  appName: string;
  duration: string;
  iconUrl: any;
  isDark: boolean;
}) => {
  const imageSource = typeof iconUrl === 'string'
    ? { uri: iconUrl }
    : iconUrl;

  return (
    <View
      style={{
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* App Icon with gradient background */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
          overflow: "hidden",
        }}
      >
        <Image
          source={imageSource}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
            marginBottom: 4,
          }}
        >
          {appName}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: isDark ? "#9ca3af" : "#6b7280",
            fontWeight: "500",
          }}
        >
          Screen time
        </Text>
      </View>

      <View
        style={{
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#3b82f6",
          }}
        >
          {duration}
        </Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [appsUsage, setAppsUsage] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState(75);
  const [totalScreenTime, setTotalScreenTime] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [orbLevel, setOrbLevel] = useState(3);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  // Animation values
  const icon1Anim = useState(new Animated.Value(0))[0];
  const icon2Anim = useState(new Animated.Value(0))[0];
  const icon3Anim = useState(new Animated.Value(0))[0];
  const icon4Anim = useState(new Animated.Value(0))[0];
  const icon5Anim = useState(new Animated.Value(0))[0];

  const text1Anim = useState(new Animated.Value(0))[0];
  const text2Anim = useState(new Animated.Value(0))[0];
  const text3Anim = useState(new Animated.Value(0))[0];
  const text4Anim = useState(new Animated.Value(0))[0];
  const text5Anim = useState(new Animated.Value(0))[0];

  const { focusSession, blockedApps } = useBlocking();

  // Toggle menu animation
  const toggleMenu = () => {
    if (quickMenuOpen) {
      Animated.parallel([
        Animated.timing(icon1Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(icon2Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(icon3Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(icon4Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(icon5Anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(text1Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(text2Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(text3Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(text4Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(text5Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setQuickMenuOpen(false));
    } else {
      setQuickMenuOpen(true);

      Animated.stagger(80, [
        Animated.spring(icon1Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(icon2Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(icon3Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(icon4Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(icon5Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        Animated.stagger(80, [
          Animated.spring(text1Anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
          Animated.spring(text2Anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
          Animated.spring(text3Anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
          Animated.spring(text4Anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
          Animated.spring(text5Anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        ]).start();
      }, 200);
    }
  };

  // Fetch usage data
  const fetchUsageData = useCallback(async () => {
    try {
      setIsLoadingApps(true);
      await initializeTracking();
      const stats = await getTodayUsageStats();

      const score = calculateHealthScore(stats.totalScreenTime, stats.pickups);
      setHealthScore(score);
      setTotalScreenTime(stats.totalScreenTime);
      setPickups(stats.pickups);
      setOrbLevel(getOrbLevel(score));

      const formattedApps = stats.apps.map((app, index) => {
        // Prefer local icon, then device icon, then fallback
        const localIcon = getLocalIcon(app.packageName || '', app.appName);
        return {
          id: app.packageName || index.toString(),
          appName: app.appName,
          duration: formatDuration(app.timeInForeground),
          iconUrl: localIcon || app.iconUrl || require("@/assets/images/splash-icon.png"),
          isBlocked: blockedApps.some(
            (b) => b.packageName === app.packageName && b.isBlocked
          ),
        };
      });

      setAppsUsage(formattedApps);
    } catch (error) {
      console.error("Error fetching usage data:", error);
    } finally {
      setIsLoadingApps(false);
    }
  }, [blockedApps]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsageData();
    setRefreshing(false);
  }, [fetchUsageData]);

  const getOrbImage = () => {
    const orbImages = [
      require("@/assets/images/orb1.png"),
      require("@/assets/images/orb2.png"),
      require("@/assets/images/orb3.jpg"),
      require("@/assets/images/orb4.jpg"),
      require("@/assets/images/orb5.jpg"),
    ];
    return orbImages[Math.min(orbLevel - 1, 4)];
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header - RESTYLED */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t('home.title')}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <HelpCircle size={24} color={isDark ? "#ffffff" : "#111827"} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Active Focus Session Banner - RESTYLED */}
        {focusSession && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: "#ef4444",
              borderRadius: 20,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#ef4444",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Lock size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                {t('home.focusModeActive')}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
                {focusSession.blockedApps.length} {t('home.appsBlocked')}
              </Text>
            </View>
          </View>
        )}

        {/* Main Orb Section - ENHANCED */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 32,
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
            borderRadius: 28,
            padding: 32,
            alignItems: "center",
            shadowColor: isDark ? "#3b82f6" : "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 1,
            borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Orb Image */}
          <Image
            source={getOrbImage()}
            style={{ width: 200, height: 200, marginBottom: 24 }}
            resizeMode="contain"
          />

          {/* Health Score */}
          <Text
            style={{
              fontSize: 56,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              marginBottom: 20,
            }}
          >
            {healthScore}
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              width: "100%",
              height: 14,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
              borderRadius: 7,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${healthScore}%`,
                backgroundColor: "#3b82f6",
                borderRadius: 7,
              }}
            />
          </View>

          {/* Health Label */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: isDark ? "#9ca3af" : "#6b7280",
              letterSpacing: 1.5,
            }}
          >
            {t('home.health')}
          </Text>
        </View>

        {/* Apps Usage List - RESTYLED */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {t('home.appUsageToday')}
            </Text>
            <View
              style={{
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#3b82f6",
                }}
              >
                {appsUsage.length} apps
              </Text>
            </View>
          </View>

          {isLoadingApps ? (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff",
                borderRadius: 20,
                padding: 40,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontWeight: "500",
                }}
              >
                {t('home.loadingApps')}
              </Text>
            </View>
          ) : (
            appsUsage.map((app) => (
              <AppUsageItem
                key={app.id}
                appName={app.appName}
                duration={app.duration}
                iconUrl={app.iconUrl}
                isDark={isDark}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Quick Action Menu - Backdrop */}
      {quickMenuOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleMenu}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={{
              flex: 1,
              backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
            }}
          />
        </TouchableOpacity>
      )}

      {/* Menu Items - ENHANCED STYLING */}
      {quickMenuOpen && (
        <>
          {/* Item 1 - New Schedule */}
          {(() => {
            const iconTranslateY = icon1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -420],
            });
            const textTranslateX = text1Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });
            const textOpacity = text1Anim;

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 128,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  transform: [{ translateY: iconTranslateY }],
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: isDark ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    transform: [{ translateX: textTranslateX }],
                    opacity: textOpacity,
                    shadowColor: "#ec4899",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: "#ec4899",
                    fontWeight: "700",
                    fontSize: 15,
                  }}>
                    {t('home.quickMenu.newSchedule')}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/blocking?openSchedule=true"), 300);
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#ec4899",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#ec4899",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Calendar size={30} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 2 - Stats */}
          {(() => {
            const iconTranslateY = icon2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -340],
            });
            const textTranslateX = text2Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });
            const textOpacity = text2Anim;

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 128,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  transform: [{ translateY: iconTranslateY }],
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    transform: [{ translateX: textTranslateX }],
                    opacity: textOpacity,
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: "#3b82f6",
                    fontWeight: "700",
                    fontSize: 15,
                  }}>
                    {t('home.quickMenu.stats')}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/stats"), 300);
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#3b82f6",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <BarChart3 size={30} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 3 - Blocking */}
          {(() => {
            const iconTranslateY = icon3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -260],
            });
            const textTranslateX = text3Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });
            const textOpacity = text3Anim;

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 128,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  transform: [{ translateY: iconTranslateY }],
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    transform: [{ translateX: textTranslateX }],
                    opacity: textOpacity,
                    shadowColor: "#8b5cf6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: "#8b5cf6",
                    fontWeight: "700",
                    fontSize: 15,
                  }}>
                    {t('home.quickMenu.blocking')}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/blocking"), 300);
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#8b5cf6",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#8b5cf6",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Shield size={30} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 4 - Detox */}
          {(() => {
            const iconTranslateY = icon4Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -180],
            });
            const textTranslateX = text4Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });
            const textOpacity = text4Anim;

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 128,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  transform: [{ translateY: iconTranslateY }],
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    transform: [{ translateX: textTranslateX }],
                    opacity: textOpacity,
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: "#10b981",
                    fontWeight: "700",
                    fontSize: 15,
                  }}>
                    {t('home.quickMenu.detox')}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/(tabs)/detox"), 300);
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#10b981",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Lock size={30} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}

          {/* Item 5 - Calendar */}
          {(() => {
            const iconTranslateY = icon5Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -100],
            });
            const textTranslateX = text5Anim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            });
            const textOpacity = text5Anim;

            return (
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 128,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  transform: [{ translateY: iconTranslateY }],
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    transform: [{ translateX: textTranslateX }],
                    opacity: textOpacity,
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text style={{
                    color: "#f59e0b",
                    fontWeight: "700",
                    fontSize: 15,
                  }}>
                    {t('home.quickMenu.calendar')}
                  </Text>
                </Animated.View>

                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    setTimeout(() => router.push("/calendar"), 300);
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: "#f59e0b",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <Calendar size={30} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </>
      )}

      {/* Main Floating Action Button - ENHANCED */}
      <TouchableOpacity
        onPress={toggleMenu}
        activeOpacity={0.9}
        style={{
          position: "absolute",
          bottom: 140,
          right: 20,
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isDark ? "#ffffff" : "#111827",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isDark ? "#ffffff" : "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.4 : 0.3,
          shadowRadius: 24,
          elevation: 16,
          transform: [{ rotate: quickMenuOpen ? "45deg" : "0deg" }],
        }}
      >
        <Plus size={36} color={isDark ? "#111827" : "#ffffff"} strokeWidth={3} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
