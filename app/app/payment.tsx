import { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { upgradeToPro } from "@/lib/api/user";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Check,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Target,
  Star,
  Users,
  TrendingDown,
  Lock,
} from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/context/ThemeContext";
import AnimatedOrb from "@/components/AnimatedOrb";

const { width } = Dimensions.get("window");

export default function PaywallScreen() {
  const router = useRouter();
  const { token, user, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { accentColor } = useTheme();

  const [packages, setPackages] = useState<{
    monthly: PurchasesPackage | null;
    yearly: PurchasesPackage | null;
  }>({
    monthly: null,
    yearly: null,
  });
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [wantsTrial, setWantsTrial] = useState(true);
  const [loading, setLoading] = useState(false);

  // Animation for orb
  const orbFloat = useRef(new Animated.Value(0)).current;
  const orbOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Floating animation for orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloat, {
          toValue: 10,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbFloat, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbOpacity, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orbOpacity, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();

        let allPackages = offerings.current?.availablePackages || [];

        // Combine packages from all offerings if needed
        if (allPackages.length < 2) {
          Object.values(offerings.all).forEach((offering: any) => {
            if (offering.availablePackages) {
              allPackages = [...allPackages, ...offering.availablePackages];
            }
          });
        }

        const monthly = allPackages.find(
          (pkg) =>
            pkg.identifier.toLowerCase().includes("monthly") ||
            pkg.identifier.toLowerCase().includes("month")
        );
        const yearly = allPackages.find(
          (pkg) =>
            pkg.identifier.toLowerCase().includes("yearly") ||
            pkg.identifier.toLowerCase().includes("annual") ||
            pkg.identifier.toLowerCase().includes("year")
        );

        setPackages({
          monthly: monthly || null,
          yearly: yearly || null,
        });
      } catch (e) {
        console.error("Error fetching offerings:", e);
      }
    };
    fetchOfferings();
  }, []);

  const handleSubscribe = async () => {
    const pkg = selectedPlan === "monthly" ? packages.monthly : packages.yearly;
    if (!pkg) return;

    try {
      setLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Check for PRO entitlements
      if (
        customerInfo.entitlements.active["PRO Yearly"] ||
        customerInfo.entitlements.active["PRO Monthly"]
      ) {
        let planName = "PRO Yearly";
        if (customerInfo.entitlements.active["PRO Monthly"]) {
          planName = "PRO Monthly";
        }

        const result = await upgradeToPro(token!, planName);
        if (result.success) {
          if (user) setUser({ ...user, isPro: true });
          Toast.show({
            type: "success",
            text1: "Welcome to LockIn PRO!",
            text2: "Your focus journey starts now",
            position: "top",
            visibilityTime: 3000,
          });
          router.push("/");
        } else {
          Toast.show({
            type: "error",
            text1: result.error,
            position: "top",
            visibilityTime: 3000,
          });
        }
      }
    } catch (e: any) {
      console.error("Purchase error:", e);
      if (!e.userCancelled)
        Toast.show({
          type: "error",
          text1: "Purchase failed. Please try again.",
          position: "top",
          visibilityTime: 3000,
        });
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);

      const customerInfo = await Purchases.restorePurchases();

      const hasPro =
        customerInfo.entitlements.active["PRO Yearly"] ||
        customerInfo.entitlements.active["PRO Monthly"];

      if (hasPro) {
        let planName = "PRO Yearly";
        if (customerInfo.entitlements.active["PRO Monthly"]) {
          planName = "PRO Monthly";
        }

        const result = await upgradeToPro(token!, planName);
        if (result.success) {
          if (user) setUser({ ...user, isPro: true });

          Toast.show({
            type: "success",
            text1: "Purchases restored",
            text2: "Your PRO access has been restored",
            position: "top",
          });

          router.replace("/");
        }
      } else {
        Toast.show({
          type: "info",
          text1: "No purchases found",
          text2: "No previous subscriptions were detected",
          position: "top",
        });
      }
    } catch (e) {
      console.error("Restore error:", e);
      Toast.show({
        type: "error",
        text1: "Restore failed",
        text2: "Please try again later",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, text: "Unlimited app & website blocking" },
    { icon: Clock, text: "Advanced scheduling & time limits" },
    { icon: Target, text: "Focus sessions with task verification" },
    { icon: Zap, text: "Priority support & early features" },
    { icon: TrendingDown, text: "Detailed usage analytics & insights" },
  ];

  const socialProof = [
    { rating: 5, text: "Finally broke my phone addiction!", author: "Sarah M." },
    { rating: 5, text: "My screen time dropped 3 hours/day", author: "James K." },
    { rating: 5, text: "Best focus app I've ever used", author: "Emily R." },
  ];

  // Calculate savings
  const monthlyPrice = packages.monthly?.product.price || 0;
  const yearlyPrice = packages.yearly?.product.price || 0;
  const yearlyMonthlyEquivalent = yearlyPrice / 12;
  const savingsPercent = monthlyPrice > 0
    ? Math.round(((monthlyPrice - yearlyMonthlyEquivalent) / monthlyPrice) * 100)
    : 50;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}>
      {/* Decorative Orb - Top Right */}
      <Animated.View
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          opacity: orbOpacity,
          transform: [{ translateY: orbFloat }],
          zIndex: 0,
        }}
      >
        <AnimatedOrb size={120} level={5} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View style={{ width: 44 }} />

          {/* PRO Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[accentColor.primary, accentColor.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "800" }}>
              PRO
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <X size={22} color={isDark ? "#ffffff" : "#000000"} />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              marginBottom: 12,
              letterSpacing: -1,
              lineHeight: 42,
            }}
          >
            Take Control of{"\n"}Your Screen Time
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: isDark ? "rgba(255,255,255,0.6)" : "#64748b",
              lineHeight: 24,
            }}
          >
            Join thousands who've reclaimed their focus and reduced screen time by 50%+
          </Text>
        </View>

        {/* Social Proof Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Users size={18} color={accentColor.primary} style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
              }}
            >
              10,000+ users love LockIn
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {socialProof.map((review, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  width: width * 0.7,
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}
              >
                <View style={{ flexDirection: "row", marginBottom: 8 }}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} color="#fbbf24" fill="#fbbf24" />
                  ))}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#ffffff" : "#0f172a",
                    marginBottom: 8,
                    fontWeight: "500",
                  }}
                >
                  "{review.text}"
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
                  }}
                >
                  — {review.author}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Features List */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          {features.map((feature, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `rgba(${accentColor.rgb}, 0.1)`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <feature.icon size={18} color={accentColor.primary} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontWeight: "500",
                }}
              >
                {feature.text}
              </Text>
              <Check size={18} color="#10b981" />
            </View>
          ))}
        </View>

        {/* Trial Toggle */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setWantsTrial(!wantsTrial)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: wantsTrial
                ? `rgba(${accentColor.rgb}, 0.1)`
                : (isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
              borderRadius: 16,
              padding: 18,
              borderWidth: wantsTrial ? 1.5 : 0.5,
              borderColor: wantsTrial
                ? accentColor.primary
                : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"),
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Lock size={16} color={accentColor.primary} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#0f172a",
                  }}
                >
                  Not sure? Try 3 days free
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                }}
              >
                Cancel anytime during trial, no charge
              </Text>
            </View>

            {/* Toggle */}
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                backgroundColor: wantsTrial ? accentColor.primary : (isDark ? "#374151" : "#d1d5db"),
                padding: 3,
              }}
            >
              <Animated.View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                  marginLeft: wantsTrial ? 22 : 0,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Pricing Plans */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#0f172a",
              marginBottom: 16,
            }}
          >
            Choose Your Plan
          </Text>

          {!packages.yearly && !packages.monthly ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={accentColor.primary} />
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Loading plans...
              </Text>
            </View>
          ) : (
            <>
              {/* Annual Plan */}
              <TouchableOpacity
                onPress={() => setSelectedPlan("yearly")}
                activeOpacity={0.8}
                disabled={!packages.yearly}
                style={{
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 12,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  borderWidth: selectedPlan === "yearly" ? 2 : 0.5,
                  borderColor: selectedPlan === "yearly"
                    ? accentColor.primary
                    : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"),
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Best Value Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderBottomLeftRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#ffffff" }}>
                    SAVE {savingsPercent}%
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {/* Radio */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedPlan === "yearly" ? accentColor.primary : (isDark ? "#6b7280" : "#d1d5db"),
                      backgroundColor: selectedPlan === "yearly" ? accentColor.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    {selectedPlan === "yearly" && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: isDark ? "#ffffff" : "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      Annual
                    </Text>
                    {packages.yearly && packages.monthly && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                        }}
                      >
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: packages.yearly.product.currencyCode,
                        }).format(packages.yearly.product.price / 12)}/mo billed annually
                      </Text>
                    )}
                  </View>

                  {packages.yearly && (
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      {packages.yearly.product.priceString}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Monthly Plan */}
              {packages.monthly && (
                <TouchableOpacity
                  onPress={() => setSelectedPlan("monthly")}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    borderWidth: selectedPlan === "monthly" ? 2 : 0.5,
                    borderColor: selectedPlan === "monthly"
                      ? accentColor.primary
                      : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"),
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Radio */}
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selectedPlan === "monthly" ? accentColor.primary : (isDark ? "#6b7280" : "#d1d5db"),
                        backgroundColor: selectedPlan === "monthly" ? accentColor.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      {selectedPlan === "monthly" && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: isDark ? "#ffffff" : "#0f172a",
                        }}
                      >
                        Monthly
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      {packages.monthly.product.priceString}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Legal Links */}
        <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 11,
              textAlign: "center",
              color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
              lineHeight: 16,
              marginBottom: 12,
            }}
          >
            {wantsTrial
              ? "After your 3-day free trial, "
              : ""}
            Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account.
            Subscriptions auto-renew unless canceled 24 hours before the period ends.
          </Text>

          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://www.fibipals.com/creator/apps/lockIn/terms-of-service")}
            >
              <Text style={{ fontSize: 12, color: accentColor.primary, fontWeight: "500" }}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, marginHorizontal: 8, color: isDark ? "#6b7280" : "#9ca3af" }}>
              •
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://www.fibipals.com/creator/apps/lockIn/privacy-policy")}
            >
              <Text style={{ fontSize: 12, color: accentColor.primary, fontWeight: "500" }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRestorePurchases} disabled={loading}>
            <Text
              style={{
                fontSize: 14,
                color: accentColor.primary,
                fontWeight: "600",
                textDecorationLine: "underline",
              }}
            >
              Restore Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        }}
      >
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={loading || (!packages.monthly && !packages.yearly)}
          activeOpacity={0.9}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: accentColor.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={loading ? ["#9ca3af", "#9ca3af"] : [accentColor.primary, accentColor.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 18,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#ffffff" }}>
                {wantsTrial ? "Start 3-Day Free Trial" : "Subscribe Now"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 12,
            color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {wantsTrial
            ? `Then ${selectedPlan === "yearly" ? packages.yearly?.product.priceString + "/year" : packages.monthly?.product.priceString + "/month"}`
            : `${selectedPlan === "yearly" ? packages.yearly?.product.priceString + "/year" : packages.monthly?.product.priceString + "/month"}`}
          {" "}• Cancel in {Platform.OS === "ios" ? "App Store" : "Google Play"}
        </Text>
      </View>
    </View>
  );
}
