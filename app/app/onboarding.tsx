import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  useColorScheme,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import {
  Shield,
  Clock,
  Target,
  ChevronRight,
  Check,
  Globe,
  Smartphone,
  Plus,
  X,
  Sparkles,
} from "lucide-react-native";
import {
  POPULAR_APPS,
  setDefaultBlockedApps,
  setDefaultBlockedWebsites,
  setDefaultAppLimitMinutes,
} from "@/lib/appBlocking";
import * as AppBlocker from "@/modules/app-blocker";

const { width, height } = Dimensions.get("window");

// Daily goal options in minutes
const DAILY_GOAL_OPTIONS = [
  { label: "30 min", value: 30, description: "Light usage" },
  { label: "1 hour", value: 60, description: "Moderate" },
  { label: "2 hours", value: 120, description: "Balanced" },
  { label: "3 hours", value: 180, description: "Flexible" },
];

// Common websites to block
const POPULAR_WEBSITES = [
  { domain: "youtube.com", name: "YouTube" },
  { domain: "tiktok.com", name: "TikTok" },
  { domain: "instagram.com", name: "Instagram" },
  { domain: "twitter.com", name: "Twitter/X" },
  { domain: "facebook.com", name: "Facebook" },
  { domain: "reddit.com", name: "Reddit" },
  { domain: "twitch.tv", name: "Twitch" },
  { domain: "netflix.com", name: "Netflix" },
];

type OnboardingStep = "welcome" | "apps" | "websites" | "goal" | "complete";

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [customWebsite, setCustomWebsite] = useState("");
  const [dailyGoal, setDailyGoal] = useState<number>(60); // Default 1 hour
  const [iosAppsSelected, setIosAppsSelected] = useState(false);
  const [iosSelectionInfo, setIosSelectionInfo] = useState<{
    appsCount: number;
    categoriesCount: number;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    switch (currentStep) {
      case "welcome":
        animateTransition(() => setCurrentStep("apps"));
        break;
      case "apps":
        animateTransition(() => setCurrentStep("websites"));
        break;
      case "websites":
        animateTransition(() => setCurrentStep("goal"));
        break;
      case "goal":
        animateTransition(() => setCurrentStep("complete"));
        break;
      case "complete":
        handleComplete();
        break;
    }
  };

  const handleComplete = async () => {
    try {
      // Save all selections
      await setDefaultBlockedApps(selectedApps);
      await setDefaultBlockedWebsites(selectedWebsites);
      await setDefaultAppLimitMinutes(dailyGoal);

      // Mark onboarding as completed
      await SecureStore.setItemAsync("onboardingCompleted", "true");
      await SecureStore.setItemAsync("dailyGoal", dailyGoal.toString());

      // On iOS, apply blocking immediately if apps were selected
      if (Platform.OS === "ios" && iosAppsSelected) {
        AppBlocker.applyBlocking();
      }

      // Navigate to auth
      router.replace("/auth" as any);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.replace("/auth" as any);
    }
  };

  const toggleApp = (packageName: string) => {
    setSelectedApps((prev) =>
      prev.includes(packageName)
        ? prev.filter((p) => p !== packageName)
        : [...prev, packageName]
    );
  };

  const toggleWebsite = (domain: string) => {
    setSelectedWebsites((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  const addCustomWebsite = () => {
    if (customWebsite.trim()) {
      const domain = customWebsite
        .trim()
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .split("/")[0];
      if (domain && !selectedWebsites.includes(domain)) {
        setSelectedWebsites((prev) => [...prev, domain]);
      }
      setCustomWebsite("");
    }
  };

  const handleIOSAppPicker = async () => {
    try {
      // First request authorization
      const authorized = await AppBlocker.requestAuthorization();
      if (!authorized) {
        console.log("iOS authorization denied");
        return;
      }

      // Show the app picker
      const result = await AppBlocker.showAppPicker();
      if (result) {
        setIosSelectionInfo(result);
        setIosAppsSelected(true);
      }
    } catch (error) {
      console.error("Error with iOS app picker:", error);
    }
  };

  const getStepProgress = () => {
    const steps: OnboardingStep[] = ["welcome", "apps", "websites", "goal", "complete"];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const canProceed = () => {
    switch (currentStep) {
      case "apps":
        return Platform.OS === "ios" ? iosAppsSelected : selectedApps.length > 0;
      case "websites":
        return true; // Websites are optional
      case "goal":
        return dailyGoal > 0;
      default:
        return true;
    }
  };

  const renderWelcome = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <Shield size={48} color="#3b82f6" />
      </View>

      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          color: isDark ? "#ffffff" : "#111827",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Take Control of{"\n"}Your Screen Time
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: isDark ? "#9ca3af" : "#6b7280",
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 40,
        }}
      >
        Block distracting apps and earn time back through healthy activities. You're in control.
      </Text>

      <View style={{ width: "100%", gap: 16 }}>
        {[
          { icon: Smartphone, text: "Choose apps to limit" },
          { icon: Target, text: "Set your daily goal" },
          { icon: Sparkles, text: "Earn time through exercise" },
        ].map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <item.icon size={20} color="#3b82f6" />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAppsSelection = () => (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Smartphone size={32} color="#ef4444" />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Select Apps to Block
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "#9ca3af" : "#6b7280",
            textAlign: "center",
          }}
        >
          These apps will be blocked until you earn time
        </Text>
      </View>

      {Platform.OS === "ios" ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleIOSAppPicker}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Plus size={20} color="#ffffff" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#ffffff",
                marginLeft: 8,
              }}
            >
              {iosAppsSelected ? "Change Selection" : "Select Apps"}
            </Text>
          </TouchableOpacity>

          {iosSelectionInfo && (
            <View
              style={{
                marginTop: 24,
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.1)",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Check size={24} color="#10b981" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#10b981",
                  marginTop: 8,
                }}
              >
                {iosSelectionInfo.appsCount} apps selected
              </Text>
              {iosSelectionInfo.categoriesCount > 0 && (
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginTop: 4,
                  }}
                >
                  {iosSelectionInfo.categoriesCount} categories included
                </Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {POPULAR_APPS.map((app) => {
              const isSelected = selectedApps.includes(app.packageName);
              return (
                <TouchableOpacity
                  key={app.packageName}
                  onPress={() => toggleApp(app.packageName)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: isSelected
                      ? "#ef4444"
                      : isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#f3f4f6",
                    borderWidth: 1,
                    borderColor: isSelected
                      ? "#ef4444"
                      : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isSelected ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                    }}
                  >
                    {app.appName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={{
              marginTop: 20,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#9ca3af" : "#6b7280",
                textAlign: "center",
              }}
            >
              {selectedApps.length} app{selectedApps.length !== 1 ? "s" : ""} selected
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderWebsitesSelection = () => (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Globe size={32} color="#8b5cf6" />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Block Websites
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "#9ca3af" : "#6b7280",
            textAlign: "center",
          }}
        >
          Optional: Block distracting websites in browsers
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {POPULAR_WEBSITES.map((site) => {
            const isSelected = selectedWebsites.includes(site.domain);
            return (
              <TouchableOpacity
                key={site.domain}
                onPress={() => toggleWebsite(site.domain)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isSelected
                    ? "#8b5cf6"
                    : isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "#f3f4f6",
                  borderWidth: 1,
                  borderColor: isSelected
                    ? "#8b5cf6"
                    : isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isSelected ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                  }}
                >
                  {site.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom website input */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#374151",
              marginBottom: 8,
            }}
          >
            Add custom website
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={customWebsite}
              onChangeText={setCustomWebsite}
              placeholder="example.com"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              style={{
                flex: 1,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: isDark ? "#ffffff" : "#111827",
              }}
              onSubmitEditing={addCustomWebsite}
            />
            <TouchableOpacity
              onPress={addCustomWebsite}
              activeOpacity={0.7}
              style={{
                backgroundColor: "#8b5cf6",
                borderRadius: 12,
                width: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected custom websites */}
        {selectedWebsites.filter(
          (w) => !POPULAR_WEBSITES.find((pw) => pw.domain === w)
        ).length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
              }}
            >
              Custom websites:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {selectedWebsites
                .filter((w) => !POPULAR_WEBSITES.find((pw) => pw.domain === w))
                .map((domain) => (
                  <View
                    key={domain}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#8b5cf6",
                      paddingVertical: 8,
                      paddingLeft: 12,
                      paddingRight: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#ffffff",
                        marginRight: 6,
                      }}
                    >
                      {domain}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleWebsite(domain)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>
        )}

        <View
          style={{
            marginTop: 20,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
            padding: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
            }}
          >
            {selectedWebsites.length} website{selectedWebsites.length !== 1 ? "s" : ""} selected
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderGoalSelection = () => (
    <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Target size={32} color="#10b981" />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#111827",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Set Your Daily Goal
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "#9ca3af" : "#6b7280",
            textAlign: "center",
          }}
        >
          How much screen time do you want per app?
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {DAILY_GOAL_OPTIONS.map((option) => {
          const isSelected = dailyGoal === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setDailyGoal(option.value)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                backgroundColor: isSelected
                  ? isDark
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(16, 185, 129, 0.1)"
                  : isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f3f4f6",
                borderWidth: 2,
                borderColor: isSelected ? "#10b981" : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isSelected
                      ? "#10b981"
                      : isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#e5e7eb",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Clock
                    size={20}
                    color={isSelected ? "#ffffff" : isDark ? "#9ca3af" : "#6b7280"}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isSelected
                        ? "#10b981"
                        : isDark
                        ? "#ffffff"
                        : "#111827",
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#10b981",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={16} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text
        style={{
          fontSize: 13,
          color: isDark ? "#6b7280" : "#9ca3af",
          textAlign: "center",
          marginTop: 24,
        }}
      >
        You can change this anytime in settings
      </Text>
    </View>
  );

  const renderComplete = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <Check size={48} color="#10b981" />
      </View>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: isDark ? "#ffffff" : "#111827",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        You're All Set!
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: isDark ? "#9ca3af" : "#6b7280",
          textAlign: "center",
          lineHeight: 24,
          marginBottom: 40,
        }}
      >
        Your selected apps are now blocked.{"\n"}Earn time through exercises to use them!
      </Text>

      <View
        style={{
          width: "100%",
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
          borderRadius: 16,
          padding: 20,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
            Apps blocked
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#ffffff" : "#111827" }}>
            {Platform.OS === "ios" ? (iosSelectionInfo?.appsCount || 0) : selectedApps.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
            Websites blocked
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#ffffff" : "#111827" }}>
            {selectedWebsites.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
            Daily limit per app
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#10b981" }}>
            {dailyGoal >= 60 ? `${dailyGoal / 60}h` : `${dailyGoal}m`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (currentStep) {
      case "welcome":
        return renderWelcome();
      case "apps":
        return renderAppsSelection();
      case "websites":
        return renderWebsitesSelection();
      case "goal":
        return renderGoalSelection();
      case "complete":
        return renderComplete();
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case "welcome":
        return "Get Started";
      case "apps":
        return "Continue";
      case "websites":
        return selectedWebsites.length > 0 ? "Continue" : "Skip";
      case "goal":
        return "Continue";
      case "complete":
        return "Start Using App";
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#000000" : "#ffffff",
      }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Progress bar */}
      {currentStep !== "welcome" && (
        <View
          style={{
            height: 4,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
            marginHorizontal: 24,
            marginTop: 8,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${getStepProgress()}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              borderRadius: 2,
            }}
          />
        </View>
      )}

      {/* Content */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          paddingTop: 24,
        }}
      >
        {renderContent()}
      </Animated.View>

      {/* Bottom button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
          style={{
            backgroundColor: canProceed() ? "#3b82f6" : isDark ? "#374151" : "#e5e7eb",
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: canProceed() ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            {getButtonText()}
          </Text>
          {currentStep !== "complete" && (
            <ChevronRight
              size={20}
              color={canProceed() ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af"}
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
