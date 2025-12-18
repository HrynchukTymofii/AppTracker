import { useEffect, useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
  Platform,
  Dimensions,
  // Animated,
  Modal,
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
  GraduationCap,
  BookOpen,
  Award,
  Star,
} from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get("window");

export default function PaywallScreen() {
  const router = useRouter();
  const { token, user, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [packages, setPackages] = useState<{
    monthly: PurchasesPackage | null;
    yearly: PurchasesPackage | null;
  }>({
    monthly: null,
    yearly: null,
  });
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [loading, setLoading] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  // const [spinsLeft, setSpinsLeft] = useState(3);
  // const [currentDiscount, setCurrentDiscount] = useState(0);
  // const [finalDiscount, setFinalDiscount] = useState(0);
  // const rotateAnim = useRef(new Animated.Value(0)).current;
  // const currentRotationRef = useRef(0);
  // const discountCardAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   // Initialize discount card animation to 1 if there's already a discount
  //   if (finalDiscount > 0) {
  //     discountCardAnim.setValue(1);
  //   }
  // }, [finalDiscount]);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();

        // Try to get packages from all offerings
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

        setPackages({ monthly: monthly || null, yearly: yearly || null });
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

      // Check for PRO Yearly or PRO Monthly entitlements
      if (
        customerInfo.entitlements.active["PRO Yearly"] ||
        customerInfo.entitlements.active["PRO Monthly"]
      ) {
        // Determine plan name based on active entitlement
        let planName = "PRO Yearly"; // default
        if (customerInfo.entitlements.active["PRO Monthly"]) {
          planName = "PRO Monthly";
        } else if (customerInfo.entitlements.active["PRO Yearly"]) {
          planName = "PRO Yearly";
        }

        const result = await upgradeToPro(token!, planName);
        if (result.success) {
          if (user) setUser({ ...user, isPro: true });
          Toast.show({
            type: "success",
            text1: "Welcome to SAT Learner PRO! 🎉",
            text2: "Your journey to 1600 starts now",
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
    { text: "Unlimited access to 400+ SAT practice questions" },
    { text: "Full-length practice exams with real SAT scoring" },
    { text: "Personalized wrong answer review & improvement tracking" },
    { text: "Instant explanations for every question" },
    { text: "Study at your own pace, anytime, anywhere" },
  ];

  const handleBackPress = () => {
    setShowUpsellModal(true);
  };

  // const spinRoulette = () => {
  //   if (spinsLeft <= 0) return;

  //   // Define which discounts are available for each spin
  //   let availableDiscounts: number[];
  //   if (spinsLeft === 3) {
  //     // First spin: 5, 10, or 15
  //     availableDiscounts = [5, 10, 15];
  //   } else if (spinsLeft === 2) {
  //     // Second spin: 20, 25, or 30
  //     availableDiscounts = [20, 25, 30];
  //   } else {
  //     // Third spin: 5, 10, 15, or 20
  //     availableDiscounts = [5, 10, 15, 20];
  //   }

  //   const randomDiscount = availableDiscounts[Math.floor(Math.random() * availableDiscounts.length)];

  //   // Calculate the target rotation to land on the selected discount
  //   // Segments are positioned at: 5%=0°, 10%=60°, 15%=120°, 20%=180°, 25%=240°, 30%=300°
  //   const discountAngles: { [key: number]: number } = {
  //     5: 0,
  //     10: 60,
  //     15: 120,
  //     20: 180,
  //     25: 240,
  //     30: 300,
  //   };

  //   const targetAngle = discountAngles[randomDiscount];
  //   const currentRotation = currentRotationRef.current;

  //   // Add 3-4 full rotations (1080-1440 degrees) plus the target angle
  //   const fullRotations = 1080 + Math.floor(Math.random() * 360);
  //   const finalRotation = currentRotation + fullRotations + (360 - targetAngle);

  //   Animated.timing(rotateAnim, {
  //     toValue: finalRotation,
  //     duration: 2000,
  //     useNativeDriver: true,
  //   }).start(() => {
  //     currentRotationRef.current = finalRotation;
  //     setCurrentDiscount(randomDiscount);

  //     const newBestDiscount = Math.max(finalDiscount, randomDiscount);
  //     if (newBestDiscount > finalDiscount) {
  //       // Animate the discount card when it updates
  //       discountCardAnim.setValue(0);
  //       Animated.spring(discountCardAnim, {
  //         toValue: 1,
  //         useNativeDriver: true,
  //         tension: 50,
  //         friction: 7,
  //       }).start();
  //     }

  //     setFinalDiscount(newBestDiscount);
  //     setSpinsLeft(spinsLeft - 1);
  //   });
  // };

  const acceptUpsellOffer = async () => {
    setShowUpsellModal(false);
    await handleSubscribe();
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with SAT Theme Gradient */}
        <LinearGradient
          colors={["#06B6D4", "#0891B2", "#0e7490"]}
          style={{
            height: 150,
            position: "relative",
            overflow: "hidden",
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Elements */}
          <View style={{ position: "absolute", top: 40, left: 30 }}>
            <Star size={12} color="#FCD34D" fill="#FCD34D" />
          </View>
          <View style={{ position: "absolute", top: 40, right: 60 }}>
            <Star size={8} color="#FCD34D" fill="#FCD34D" />
          </View>
          <View
            style={{ position: "absolute", bottom: 20, left: width * 0.65 }}
          >
            <Star size={12} color="#FCD34D" fill="#FCD34D" />
          </View>
          <View style={{ position: "absolute", bottom: 30, left: 50 }}>
            <Star size={10} color="#FCD34D" fill="#FCD34D" />
          </View>

          {/* Floating Icons */}
          <View
            style={{
              position: "absolute",
              top: 50,
              left: 70,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 40,
              width: 48,
              height: 48,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <BookOpen size={24} color="#FFF" />
          </View>

          <View
            style={{
              position: "absolute",
              bottom: 35,
              right: 65,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 40,
              width: 48,
              height: 48,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Award size={22} color="#FFF" />
          </View>

          {/* Central Graduation Cap */}
          <View
            style={{
              position: "absolute",
              top: 60,
              left: width / 2 - 40,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: "#FFF",
                borderRadius: 40,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <GraduationCap size={42} color="#06B6D4" />
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            // onPress={handleBackPress}
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFF",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <X size={22} color="#000" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Content */}
        <View style={{ paddingHorizontal: 24 }}>
          {/* PRO Badge */}
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#06B6D4",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginTop: 24,
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>
              PRO
            </Text>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#1f2937",
              marginBottom: 24,
              lineHeight: 38,
            }}
          >
            Unlock Your Full{"\n"}SAT Potential
          </Text>

          {/* <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 24,
            lineHeight: 24,
          }}>
            Join thousands of students achieving their dream scores with unlimited practice
          </Text> */}

          {/* Features List */}
          <View style={{ marginBottom: 28 }}>
            {features.map((feature, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#06B6D4",
                    borderRadius: 6,
                    padding: 4,
                    marginRight: 12,
                    marginTop: 2,
                  }}
                >
                  <Check size={16} color="#FFF" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: isDark ? "#ffffff" : "#1f2937",
                    lineHeight: 24,
                  }}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Pricing Container */}
          <View style={{ marginBottom: 24 }}>
            {!packages.yearly && !packages.monthly ? (
              <View
                style={{
                  padding: 40,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#06B6D4" />
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
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: selectedPlan === "yearly" ? 3 : 2,
                    borderColor:
                      selectedPlan === "yearly"
                        ? "#06B6D4"
                        : isDark
                          ? "#334155"
                          : "#e5e7eb",
                    backgroundColor: isDark ? "#1e293b" : "#FFF",
                    marginBottom: packages.monthly ? 16 : 0,
                    position: "relative",
                    paddingTop: packages.monthly ? 30 : 20,
                  }}
                  onPress={() => setSelectedPlan("yearly")}
                  activeOpacity={0.7}
                  disabled={!packages.yearly}
                >
                  {/* POPULAR Badge - only show if there's a monthly option */}
                  {packages.monthly && (
                    <View
                      style={{
                        position: "absolute",
                        top: -12,
                        left: 16,
                        backgroundColor: "#FCD34D",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#1f2937",
                          letterSpacing: 0.5,
                        }}
                      >
                        POPULAR
                      </Text>
                    </View>
                  )}

                  {/* Discount Badge - only show if there's a monthly option */}
                  {packages.monthly && packages.yearly && (
                    <View
                      style={{
                        position: "absolute",
                        top: -12,
                        right: 16,
                        backgroundColor: "#10B981",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#FFF",
                          letterSpacing: 0.5,
                        }}
                      >
                        SAVE{" "}
                        {Math.round(
                          ((packages.monthly.product.price -
                            packages.yearly.product.price / 12) /
                            packages.monthly.product.price) *
                            100
                        )}
                        %
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: isDark ? "#ffffff" : "#1f2937",
                        marginBottom: 4,
                      }}
                    >
                      Annual
                    </Text>
                    {packages.yearly && packages.monthly && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: isDark ? "#ffffff" : "#1f2937",
                        }}
                      >
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: packages.yearly.product.currencyCode,
                        }).format(packages.yearly.product.price / 12)}{" "}
                        / MO
                      </Text>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {packages.yearly && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {packages.yearly.product.introPrice && (
                          <Text
                            style={{
                              fontSize: 14,
                              color: isDark ? "#6b7280" : "#9ca3af",
                              textDecorationLine: "line-through",
                            }}
                          >
                            {packages.yearly.product.priceString}
                          </Text>
                        )}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: isDark ? "#ffffff" : "#1f2937",
                          }}
                        >
                          {packages.yearly.product.introPrice?.priceString ||
                            packages.yearly.product.priceString}
                        </Text>
                      </View>
                    )}
                    {packages.monthly && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor:
                            selectedPlan === "yearly"
                              ? "#06B6D4"
                              : isDark
                                ? "#6b7280"
                                : "#d1d5db",
                          backgroundColor:
                            selectedPlan === "yearly"
                              ? "#06B6D4"
                              : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {selectedPlan === "yearly" && (
                          <Check size={16} color="#FFF" />
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Monthly Plan */}
                {packages.monthly && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 20,
                      borderRadius: 16,
                      borderWidth: selectedPlan === "monthly" ? 3 : 2,
                      borderColor:
                        selectedPlan === "monthly"
                          ? "#06B6D4"
                          : isDark
                            ? "#334155"
                            : "#e5e7eb",
                      backgroundColor: isDark ? "#1e293b" : "#FFF",
                    }}
                    onPress={() => setSelectedPlan("monthly")}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: isDark ? "#ffffff" : "#1f2937",
                        }}
                      >
                        Monthly
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {packages.monthly && (
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: isDark ? "#ffffff" : "#1f2937",
                          }}
                        >
                          {packages.monthly.product.priceString} / MO
                        </Text>
                      )}
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor:
                            selectedPlan === "monthly"
                              ? "#06B6D4"
                              : isDark
                                ? "#6b7280"
                                : "#d1d5db",
                          backgroundColor:
                            selectedPlan === "monthly"
                              ? "#06B6D4"
                              : "transparent",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {selectedPlan === "monthly" && (
                          <Check size={16} color="#FFF" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View
            style={{
              marginVertical: 20,
              paddingHorizontal: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textAlign: "center",
                color: isDark ? "#9ca3af" : "#6b7280",
                lineHeight: 18,
              }}
            >
              Payment will be charged to your{" "}
              {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account at
              confirmation of purchase. Subscriptions automatically renew unless
              canceled at least 24 hours before the end of the current period.
            </Text>

            <View
              style={{
                flexDirection: "row",
                marginTop: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://www.satlearner.com/terms-of-service")
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#06B6D4",
                    fontWeight: "500",
                  }}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 12,
                  marginHorizontal: 6,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                •
              </Text>

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://www.satlearner.com/privacy-policy")
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#06B6D4",
                    fontWeight: "500",
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>

           <View style={{ marginBottom: 24 }}>
            <TouchableOpacity
              onPress={handleRestorePurchases}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text
                style={{
                  fontSize: 15,
                  color: "#06B6D4",
                  fontWeight: "600",
                  textAlign: "center",
                  textDecorationLine: "underline",
                }}
              >
                Restore Purchases
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleSubscribe}
          disabled={loading || (!packages.monthly && !packages.yearly)}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 8,
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ["#9ca3af", "#9ca3af"] : ["#06B6D4", "#0891B2"]}
            style={{
              paddingVertical: 16,
              alignItems: "center",
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#FFF",
                }}
              >
                Start Learning Now
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Trial Info */}
        <Text
          style={{
            fontSize: 12,
            color: isDark ? "#6b7280" : "#9ca3af",
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          {selectedPlan === "yearly"
            ? `${packages.yearly?.product.priceString || ""}/year${packages.yearly?.product.introPrice ? " • Save " + Math.round((1 - packages.yearly.product.introPrice.price / packages.yearly.product.price) * 100) + "%" : ""}`
            : `${packages.monthly?.product.priceString || ""}/month`}{" "}
          • Cancel in {Platform.OS === "ios" ? "App Store" : "Google Play"}
        </Text>
      </View>

     

      {/* Upsell Roulette Modal */}
      {/* <Modal
        visible={showUpsellModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpsellModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: isDark ? '#1e293b' : '#FFF',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '700',
              color: isDark ? '#ffffff' : '#1f2937',
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Wait! Don't Go Yet! 🎰
            </Text> */}

      {/* <Text style={{
              fontSize: 16,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 24,
              textAlign: 'center',
            }}>
              Spin the wheel for an exclusive discount!
            </Text> */}

      {/* Roulette Wheel */}
      {/* <View style={{ width: '100%', alignItems: 'center', marginBottom: 24 }}> */}
      {/* Pointer at top */}
      {/* <View style={{
                position: 'absolute',
                top: -12,
                zIndex: 10,
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 12,
                borderRightWidth: 12,
                borderTopWidth: 18,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#EF4444',
              }} /> */}

      {/* <Animated.View style={{
                width: 300,
                height: 300,
                borderRadius: 150,
                borderWidth: 8,
                borderColor: '#FCD34D',
                overflow: 'hidden',
                transform: [{ rotate: rotateAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })}],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}> */}
      {/* Wheel segments */}
      {/* {[
                  { discount: 5, color: '#EF4444' },
                  { discount: 10, color: '#F59E0B' },
                  { discount: 15, color: '#10B981' },
                  { discount: 20, color: '#3B82F6' },
                  { discount: 25, color: '#8B5CF6' },
                  { discount: 30, color: '#EC4899' },
                ].map((segment, idx) => {
                  const rotation = idx * 60;

                  return (
                    <View
                      key={idx}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        transform: [{ rotate: `${rotation}deg` }],
                      }}
                    >
                      {/* Colored segment - triangle wedge */}
      {/* <View style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: 0,
                        height: 0,
                        backgroundColor: 'transparent',
                        borderStyle: 'solid',
                        borderLeftWidth: 86.6,
                        borderRightWidth: 86.6,
                        borderTopWidth: 150,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderTopColor: segment.color,
                        transform: [{ translateX: -86.6 }],
                      }} /> */}

      {/* Text label */}
      {/* <View style={{
                        position: 'absolute',
                        top: 20,
                        left: '50%',
                        transform: [{ translateX: -30 }],
                        width: 60,
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: 28,
                          fontWeight: '800',
                          color: '#FFF',
                          textShadowColor: 'rgba(0, 0, 0, 0.5)',
                          textShadowOffset: { width: 0, height: 2 },
                          textShadowRadius: 3,
                        }}>
                          {segment.discount}%
                        </Text>
                      </View>
                    </View>
                  );
                })} */}

      {/* Center circle */}
      {/* <View style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: isDark ? '#1e293b' : '#FFF',
                  borderWidth: 5,
                  borderColor: '#FCD34D',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                  transform: [{ translateX: -50 }, { translateY: -50 }],
                }}>
                  {currentDiscount > 0 && (
                    <Text style={{
                      fontSize: 26,
                      fontWeight: '800',
                      color: '#10B981',
                    }}>
                      {currentDiscount}%
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View> */}

      {/* Spins Left */}
      {/* <Text style={{
              fontSize: 14,
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 16,
            }}>
              {spinsLeft > 0 ? `${spinsLeft} spin${spinsLeft > 1 ? 's' : ''} remaining` : 'No spins left'}
            </Text> */}

      {/* Best Discount Achieved */}
      {/* {finalDiscount > 0 && (
              <Animated.View style={{
                backgroundColor: '#FCD34D',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                marginBottom: 16,
                opacity: discountCardAnim,
                transform: [{
                  scale: discountCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#1f2937',
                }}>
                  Best Discount: {finalDiscount}% OFF!
                </Text>
              </Animated.View>
            )} */}

      {/* Spin Button */}
      {/* {spinsLeft > 0 ? (
              <TouchableOpacity
                onPress={spinRoulette}
                style={{
                  width: '100%',
                  marginBottom: 12,
                }}
              >
                <LinearGradient
                  colors={['#FCD34D', '#F59E0B']}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1f2937',
                  }}>
                    Spin the Wheel! 🎯
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={acceptUpsellOffer}
                style={{
                  width: '100%',
                  marginBottom: 12,
                }}
              >
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#FFF',
                  }}>
                    Claim {finalDiscount}% Discount!
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )} */}

      {/* No Thanks Button */}
      {/* <TouchableOpacity
              onPress={() => {
                setShowUpsellModal(false);
                router.back();
              }}
              style={{
                paddingVertical: 12,
              }}
            >
              <Text style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
              }}>
                No thanks, I'll pass
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
    </View>
  );
}

// import { useEffect, useState, useRef } from "react";
// import {
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Animated,
//   View,
//   Text,
//   Pressable,
//   Image,
//   Platform,
// } from "react-native";
// import { useRouter } from "expo-router";
// import Purchases, { PurchasesPackage } from "react-native-purchases";
// import { SafeAreaView } from "react-native-safe-area-context";
// import Toast from "react-native-toast-message";
// import { LinearGradient } from "expo-linear-gradient";
// import { useAuth } from "@/context/AuthContext";
// import { upgradeToPro } from "@/lib/api/user";
// import { FontAwesome5 } from "@expo/vector-icons";
// import { BlurView } from "expo-blur";
// import { ArrowLeft } from "lucide-react-native";

// const proFeatures = [
//   "Access to all SAT practice exams",
//   "Full SAT course unlocked",
//   "Track saved and wrong questions",
//   "400+ SAT-grade problems",
// ];

// export default function PaywallScreen() {
//   const router = useRouter();
//   const { token, user, setUser } = useAuth();

//   const [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);
//   const [loading, setLoading] = useState(false);
//   const scaleAnim = useRef(new Animated.Value(1)).current;

//   // Fetch single plan offering
//   useEffect(() => {
//     const fetchOfferings = async () => {
//       try {
//         const offerings = await Purchases.getOfferings();
//         const pkg = offerings.current?.availablePackages?.[0];
//         if (pkg) setProPackage(pkg);
//         else console.warn("No active offering found");
//       } catch (e) {
//         console.log("Error fetching offerings:", e);
//       }
//     };
//     fetchOfferings();
//   }, []);

//   // Button animation
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(scaleAnim, {
//           toValue: 0.95,
//           duration: 1300,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scaleAnim, {
//           toValue: 1,
//           duration: 1300,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//   }, []);

//   const handleSubscribe = async (pkg: PurchasesPackage) => {
//     try {
//       setLoading(true);
//       const { customerInfo } = await Purchases.purchasePackage(pkg);

//       if (customerInfo.entitlements.active["PRO for year"]) {
//         const result = await upgradeToPro(token!, pkg.identifier);
//         if (result.success) {
//           if (user) setUser({ ...user, isPro: true });
//           Toast.show({
//             type: "success",
//             text1: "Thanks for upgrading to PRO 🎉",
//             position: "top",
//             visibilityTime: 3000,
//           });
//           router.push("/");
//         } else {
//           Toast.show({
//             type: "error",
//             text1: result.error,
//             position: "top",
//             visibilityTime: 3000,
//           });
//         }
//       }
//     } catch (e: any) {
//       console.log("Purchase error:", e);
//       if (!e.userCancelled)
//         Toast.show({
//           type: "error",
//           text1: "Purchase failed. Please try again later.",
//           position: "top",
//           visibilityTime: 3000,
//         });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView
//       className="flex-1 bg-white dark:bg-[#0f172a]"
//       edges={["bottom"]}
//     >
//       {/* Header Section */}
//       <View className="flex-1 relative -mb-10">
//         <Image
//           source={require("@/assets/images/paywall.png")} //satCourseImg.jpg
//           className="w-full h-full"
//           resizeMode="cover"
//         />

//         {/* Dark overlay */}
//         <View className="absolute inset-0 bg-black/50 rounded-xl" />

//         {/* Glass Back Button */}
//         <View className="absolute top-12 left-4 z-20">
//           <BlurView
//             intensity={90}
//             tint="dark"
//             className="rounded-xl overflow-hidden"
//           >
//             <Pressable
//               onPress={() => {
//                 if (router.canGoBack()) {
//                   router.back();
//                 } else {
//                   router.push("/");
//                 }
//               }}
//               className="p-2"
//             >
//               <ArrowLeft size={22} color="white" />
//             </Pressable>
//           </BlurView>
//         </View>
//       </View>

//       {/* Main Content */}
//       <LinearGradient
//         colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
//         start={[0, 0]}
//         end={[1, 1]}
//         style={{
//           height: 600,
//           borderTopLeftRadius: 30,
//           borderTopRightRadius: 30,
//           padding: 24,
//         }}
//       >
//         <ScrollView showsVerticalScrollIndicator={false}>
//           <Text className="text-3xl font-extrabold text-white text-center mb-4">
//             Unlock Your Full Potential 🚀
//           </Text>

//           <Text className="text-gray-100 text-base text-center mb-8">
//             Get unlimited access to all tests, lessons.
//           </Text>

//           {/* Feature list */}
//           <View className="mb-6">
//             {proFeatures.map((feature, idx) => (
//               <View
//                 key={idx}
//                 className="flex-row items-center mb-3 bg-white/15 rounded-xl px-4 py-3"
//               >
//                 <FontAwesome5
//                   name="check"
//                   size={16}
//                   color="#fef08a"
//                   style={{ marginRight: 10 }}
//                 />
//                 <Text className="text-white font-medium">{feature}</Text>
//               </View>
//             ))}
//           </View>

//           {/* Price */}
//           <View className="mb-6 items-center">
//             <Text className="text-white text-4xl font-extrabold mb-2">
//               $9.99
//             </Text>
//             <Text className="text-gray-100">
//               One-time payment, lifetime access
//             </Text>
//           </View>

//           {/* Subscribe Button */}
//           <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
//             <TouchableOpacity
//               className="rounded-2xl overflow-hidden shadow-lg"
//               activeOpacity={0.9}
//               onPress={() => proPackage && handleSubscribe(proPackage)}
//             >
//               <LinearGradient
//                 colors={["#facc15", "#fbbf24"]}
//                 start={[0, 0]}
//                 end={[1, 1]}
//                 style={{
//                   paddingVertical: 16,
//                   borderRadius: 16,
//                 }}
//               >
//                 <Text className="text-white font-bold text-center text-xl">
//                   Go PRO
//                 </Text>
//               </LinearGradient>
//             </TouchableOpacity>
//           </Animated.View>

//           <Text className="text-gray-200 text-center text-xs mt-4">
//             Cancel anytime. Secure payments handled by{" "}
//             {Platform.OS === "android" ? "Google" : "Apple"}.
//           </Text>
//         </ScrollView>

//         {loading && (
//           <View className="absolute inset-0 bg-black/50 items-center justify-center rounded-3xl">
//             <ActivityIndicator size="large" color="#fff" />
//           </View>
//         )}
//       </LinearGradient>
//     </SafeAreaView>
//   );
// }
