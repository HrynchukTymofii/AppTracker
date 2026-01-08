import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "expo-router/build/hooks";
import { useColorScheme } from "@/hooks/useColorScheme";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Mail, ChevronRight } from "lucide-react-native";
import { handleAppleLogin } from "@/hooks/useAppleLogin";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedOrb from "@/components/AnimatedOrb";
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

export default function AuthLandingScreen() {
  const params = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { setToken, setUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const returnUrl = params.get("returnUrl");
  const safeReturnUrl =
    typeof returnUrl === "string" && returnUrl.startsWith("/")
      ? returnUrl
      : "/";

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
            Toast.show({
              type: "success",
              text1: t("auth.welcome"),
              text2: t("auth.authenticationSuccessful"),
              position: "top",
              visibilityTime: 700,
            });
            router.replace(safeReturnUrl as any);
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

  const handleAppleAuth = async () => {
    if (appleLoading) return;
    setAppleLoading(true);
    try {
      await handleAppleLogin({
        setToken,
        setUser,
        router,
        safeReturnUrl,
      });
    } catch (err) {
      console.error("Apple login error:", err);
    } finally {
      setAppleLoading(false);
    }
  };

  const handleEmailAuth = () => {
    router.push({ pathname: "/login", params: { tab: "register" } } as any);
  };

  return (
    <SimpleGradientBackground style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View style={{ marginBottom: 32 }}>
            <AnimatedOrb size={120} level={3} />
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: isDark ? "#ffffff" : "#0f172a",
              marginBottom: 10,
              letterSpacing: -0.5,
            }}
          >
            {t("auth.welcomeToLockIn")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {t("auth.takeControl")}
          </Text>
        </View>

        {/* Auth Options */}
        <View style={{ marginBottom: 32 }}>
          {/* Google */}
          <TouchableOpacity
            onPress={handleGoogleAuth}
            disabled={googleLoading}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 18,
              paddingHorizontal: 20,
              paddingVertical: 18,
              marginBottom: 12,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {googleLoading ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#ffffff" : "#0f172a"}
                style={{ marginRight: 16 }}
              />
            ) : (
              <Image
                source={require("@/assets/images/google-logo.webp")}
                style={{ width: 24, height: 24, marginRight: 16 }}
              />
            )}
            <Text
              style={{
                color: isDark ? "#ffffff" : "#0f172a",
                fontWeight: "600",
                fontSize: 16,
                flex: 1,
              }}
            >
              {t("auth.continueWithGoogle")}
            </Text>
            <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#cbd5e1"} strokeWidth={1.5} />
          </TouchableOpacity>

          {/* Apple - iOS only */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleAppleAuth}
              disabled={appleLoading}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                borderRadius: 18,
                paddingHorizontal: 20,
                paddingVertical: 18,
                marginBottom: 12,
                borderWidth: 0.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0 : 0.04,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              {appleLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#ffffff" : "#0f172a"}
                  style={{ marginRight: 16 }}
                />
              ) : (
                <Image
                  source={require("@/assets/images/apple-logo.png")}
                  style={{ width: 24, height: 24, marginRight: 16 }}
                />
              )}
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontWeight: "600",
                  fontSize: 16,
                  flex: 1,
                }}
              >
                {t("auth.continueWithApple")}
              </Text>
              <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#cbd5e1"} strokeWidth={1.5} />
            </TouchableOpacity>
          )}

          {/* Email */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 18,
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Mail size={24} color={isDark ? "#ffffff" : "#64748b"} strokeWidth={1.5} style={{ marginRight: 16 }} />
            <Text
              style={{
                color: isDark ? "#ffffff" : "#0f172a",
                fontWeight: "600",
                fontSize: 16,
                flex: 1,
              }}
            >
              {t("auth.continueWithEmail")}
            </Text>
            <ChevronRight size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#cbd5e1"} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/login",
              params: { tab: "register" },
            } as any)
          }
          activeOpacity={0.8}
          style={{
            borderRadius: 18,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
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
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontSize: 17,
              letterSpacing: 0.3,
            }}
          >
            {t("auth.getStarted")}
          </Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/login", params: { tab: "login" } } as any)
          }
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
            borderRadius: 18,
            paddingVertical: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            borderWidth: 0.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: isDark ? "#ffffff" : "#0f172a",
              fontWeight: "700",
              fontSize: 17,
              letterSpacing: 0.3,
            }}
          >
            {t("auth.alreadyHaveAccount")}
          </Text>
        </TouchableOpacity>

        {/* Footer Links */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://www.fibipals.com/creator/apps/lockIn/privacy-policy")
            }
          >
            <Text
              style={{
                color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                fontSize: 13,
              }}
            >
              {t("auth.privacyPolicy")}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1",
              marginHorizontal: 12,
            }}
          >
            •
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://www.fibipals.com/creator/apps/lockIn/terms-of-service")
            }
          >
            <Text
              style={{
                color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                fontSize: 13,
              }}
            >
              {t("auth.termsOfService")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </SimpleGradientBackground>
  );
}
