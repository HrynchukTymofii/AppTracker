import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { router } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check } from "lucide-react-native";
import { AppleLoginButton } from "@/components/AppleLoginButton";
import { handleAppleLogin } from "@/hooks/useAppleLogin";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SimpleGradientBackground } from "@/components/ui/ThemedBackground";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "325648358600-5bes4eglrneokj1mts29uk66psivn014.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: false,
  iosClientId:
    "325648358600-kcva5u5mrtng9lqb8va9ba6h7s38lcsi.apps.googleusercontent.com",
});

export default function AuthScreen() {
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setToken, setUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const returnUrl = params.get("returnUrl");
  const safeReturnUrl =
    typeof returnUrl === "string" && returnUrl.startsWith("/")
      ? returnUrl
      : "/";

  // Check if initial mode is set via params
  useEffect(() => {
    const tab = params.get("tab");
    if (tab === "register" || tab === "login") {
      setMode(tab);
    }
  }, []);

  // Load name from onboarding data for register mode
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (mode === "register") {
        try {
          const stored = await SecureStore.getItemAsync("onboardingAnswers");
          if (stored) {
            const data = JSON.parse(stored);
            if (data.name && data.name.trim().length > 0) {
              setName(data.name.trim());
            } else {
              setName("Achiever");
            }
          } else {
            setName("Achiever");
          }
        } catch (err) {
          console.error("Failed to load onboarding data:", err);
          setName("Achiever");
        }
      }
    };
    loadOnboardingData();
  }, [mode]);

  const handleGoogleAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        if (idToken) {
          const res = await fetch(
            "https://www.fibipals.com/api/apps/appBlocker/auth/google",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: idToken }),
            }
          );
          const data = await res.json();
          if (data.token) {
            setToken(data.token);
            const onboarding = await SecureStore.getItemAsync(
              "onboardingCompleted"
            );
            if (onboarding !== "true") {
              await SecureStore.setItemAsync("onboardingCompleted", "true");
            }

            // Check if selling onboarding was completed
            const sellingOnboardingCompleted = await SecureStore.getItemAsync(
              "sellingOnboardingCompleted"
            );
            const needsSellingOnboarding = sellingOnboardingCompleted !== "true";

            Toast.show({
              type: "success",
              text1: mode === "login" ? t("auth.loginSuccessful") : t("auth.signUpSuccessful"),
              text2: mode === "login" ? t("auth.welcomeBack2") : t("auth.welcomeToLockIn2"),
              position: "top",
              visibilityTime: 700,
            });

            // Navigate to selling onboarding if not completed, else go to safe return URL
            if (needsSellingOnboarding) {
              router.replace("/selling-onboarding" as any);
            } else {
              router.replace(safeReturnUrl as any);
            }
          } else {
            Toast.show({
              type: "error",
              text1: t("auth.authenticationFailed"),
              text2: data.error || t("common.error"),
              position: "top",
            });
          }
        }
      }
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            Toast.show({ type: "info", text1: t("auth.googleAuthInProgress") });
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Toast.show({
              type: "info",
              text1: t("auth.googlePlayUnavailable"),
            });
            break;
          default:
            Toast.show({
              type: "error",
              text1: t("auth.googleAuthFailed"),
              text2: err.message || t("common.error"),
            });
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (loading) return;

    // Validation for register mode
    if (mode === "register" && !agreeToTerms) {
      Toast.show({
        type: "error",
        text1: t("auth.termsConditions"),
        text2: t("auth.termsRequired"),
      });
      return;
    }

    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: "error",
        text1: t("auth.invalidEmail"),
        text2: t("auth.invalidEmailDesc"),
      });
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      Toast.show({
        type: "error",
        text1: t("auth.invalidPassword"),
        text2: t("auth.invalidPasswordDesc"),
      });
      setLoading(false);
      return;
    }

    try {
      // Register first if in register mode
      if (mode === "register") {
        const registerRes = await fetch(
          `https://www.fibipals.com/api/apps/appBlocker/auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          }
        );

        if (!registerRes.ok) {
          const errText = await registerRes.text();
          Toast.show({
            type: "error",
            text1: t("auth.registrationFailed"),
            text2: errText,
          });
          setLoading(false);
          return;
        }
      }

      // Login
      const loginRes = await fetch(
        "https://www.fibipals.com/api/apps/appBlocker/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        const errText = errData.error || "Unknown error";

        if (errText === "User not found") {
          Toast.show({
            type: "error",
            text1: t("auth.userNotFound"),
            text2: t("auth.userNotFoundDesc"),
          });
        } else {
          Toast.show({
            type: "error",
            text1: mode === "login" ? t("auth.loginFailed") : t("auth.authenticationFailed"),
            text2: errText,
          });
        }
        setLoading(false);
        return;
      }

      const data = await loginRes.json();
      if (data.token) {
        await setToken(data.token);

        const onboarding = await SecureStore.getItemAsync(
          "onboardingCompleted"
        );
        if (onboarding !== "true") {
          await SecureStore.setItemAsync("onboardingCompleted", "true");
        }

        // Check if selling onboarding was completed
        const sellingOnboardingCompleted = await SecureStore.getItemAsync(
          "sellingOnboardingCompleted"
        );
        const needsSellingOnboarding = sellingOnboardingCompleted !== "true";

        Toast.show({
          type: "success",
          text1: mode === "login" ? t("auth.loginSuccessful") : t("auth.registrationSuccessful"),
          text2: mode === "login" ? t("auth.welcomeBack2") : t("auth.welcomeToLockIn2"),
          position: "top",
          visibilityTime: 700,
        });


        // Navigate to selling onboarding if not completed, else go to safe return URL
        if (needsSellingOnboarding) {
          router.replace("/selling-onboarding" as any);
        } else {
          router.replace(safeReturnUrl as any);
        }
      } else {
        Toast.show({
          type: "error",
          text1: t("auth.authenticationError"),
          text2: t("auth.pleaseTryAgain"),
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: err.message || t("auth.pleaseTryAgain"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <SimpleGradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0 : 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <ArrowLeft size={22} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#0f172a",
                marginBottom: 10,
                letterSpacing: -0.5,
              }}
            >
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                lineHeight: 22,
              }}
            >
              {mode === "login"
                ? t("auth.focusGoalsWaiting")
                : t("auth.startControlScreenTime")}
            </Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 20, flex: 1 }}>
            {/* Email Input */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                  marginBottom: 8,
                }}
              >
                {t("auth.email")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: Platform.OS === "ios" ? 12 : 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Mail size={20} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: 16,
                  }}
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                  marginBottom: 8,
                }}
              >
                {t("auth.password")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: Platform.OS === "ios" ? 12 : 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Lock size={20} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: 16,
                  }}
                  placeholder={t("auth.passwordPlaceholder")}
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
                  ) : (
                    <Eye size={20} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms & Conditions (Register Mode) */}
            {mode === "register" && (
              <TouchableOpacity
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    borderWidth: agreeToTerms ? 0 : 1.5,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "#cbd5e1",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    marginTop: 1,
                    overflow: "hidden",
                  }}
                >
                  {agreeToTerms && (
                    <>
                      <LinearGradient
                        colors={["#3b82f6", "#1d4ed8"]}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </>
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    color: isDark ? "rgba(255,255,255,0.6)" : "#64748b",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {t("auth.agreeToTerms")}
                  <Text
                    style={{ color: isDark ? "#ffffff" : "#0f172a", fontWeight: "600" }}
                    onPress={() => Linking.openURL("https://www.fibipals.com/creator/apps/lockIn/terms-of-service")}
                  >
                    {t("auth.termsConditions")}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                borderRadius: 18,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                overflow: "hidden",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#3b82f6", "#1d4ed8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: 17,
                    letterSpacing: 0.3,
                  }}
                >
                  {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                }}
              />
              <Text
                style={{
                  marginHorizontal: 16,
                  color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  fontSize: 13,
                }}
              >
                {t("auth.orContinueWith")}
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                }}
              />
            </View>

            {/* Social Login Buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 16,
                marginBottom: 32,
              }}
            >
              <TouchableOpacity
                onPress={handleGoogleAuth}
                disabled={googleLoading}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 16,
                  borderWidth: 0.5,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0 : 0.03,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={isDark ? "#ffffff" : "#0f172a"} />
                ) : (
                  <Image
                    source={require("@/assets/images/google-logo.webp")}
                    style={{ width: 24, height: 24 }}
                  />
                )}
              </TouchableOpacity>

              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={() =>
                    handleAppleLogin({
                      setToken,
                      setUser,
                      router,
                      safeReturnUrl,
                    })
                  }
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.03,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Image
                    source={require("@/assets/images/apple-logo.png")}
                    style={{ width: 24, height: 24 }}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle Mode */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "auto",
                marginBottom: 32,
              }}
            >
              <Text style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#64748b", fontSize: 15 }}>
                {mode === "login"
                  ? t("auth.dontHaveAccount")
                  : t("auth.alreadyHaveAccountQuestion")}
              </Text>
              <TouchableOpacity
                onPress={() => setMode(mode === "login" ? "register" : "login")}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: "#3b82f6",
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {mode === "login" ? t("auth.signUp") : t("auth.signIn")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SimpleGradientBackground>
  );
}
