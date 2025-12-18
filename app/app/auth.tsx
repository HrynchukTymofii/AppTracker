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
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "expo-router/build/hooks";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Mail } from "lucide-react-native";
import { handleAppleLogin } from "@/hooks/useAppleLogin";
import { useLoadUserInBackground } from "@/lib/user";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "329617813146-lmmck18chg6mfgci5i4iddtialht09ij.apps.googleusercontent.com",
  offlineAccess: true,
  forceCodeForRefreshToken: false,
  iosClientId:
    "329617813146-3o5aq7gfvejqoi3mudiar02tl4urhivu.apps.googleusercontent.com",
});

export default function AuthLandingScreen() {
  const params = useSearchParams();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { setToken, setUser } = useAuth();
  const { loadUserInBackground } = useLoadUserInBackground();

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
            "https://www.satlearner.com/api/auth/google",
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
              text1: "Welcome!",
              text2: "Authentication successful",
              position: "top",
              visibilityTime: 700,
            });
            router.replace(safeReturnUrl as any);
            loadUserInBackground({
              token: data.token,
              setUser,
              forceSync: true,
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Authentication failed",
              text2: data.error || "Unknown error",
              position: "top",
            });
          }
        }
      }
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            Toast.show({ type: "info", text1: "Google sign in in progress" });
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Toast.show({
              type: "info",
              text1: "Google Play Services unavailable",
            });
            break;
          default:
            Toast.show({
              type: "error",
              text1: "Google sign in failed",
              text2: err.message || "Error",
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
        loadUserInBackground,
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
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
        bounces={false}
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <View
            className="w-28 h-28 bg-white dark:bg-white/10 rounded-3xl items-center justify-center mb-8"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 30,
              elevation: 15,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            {/* Replace with your actual logo */}
            <Image
              source={require("@/assets/images/splash-icon-light.png")}
              style={{ width: 90, height: 90 }}
              resizeMode="contain"
            />
          </View>

          <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Let's Get Started!
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            Let's dive in into your account
          </Text>
        </View>

        {/* Auth Options */}
        <View className="mb-8">
          {/* Google */}
          <TouchableOpacity
            onPress={handleGoogleAuth}
            disabled={googleLoading}
            activeOpacity={0.7}
            className="flex-row items-center bg-white dark:bg-white/10 rounded-2xl px-6 py-5 mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
              borderTopColor: "rgba(255, 255, 255, 0.5)",
              borderBottomColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            {googleLoading ? (
              <ActivityIndicator
                size="small"
                color="#9CA3AF"
                className="mr-4"
              />
            ) : (
              <Image
                source={require("@/assets/images/google-logo.webp")}
                style={{ width: 26, height: 26, marginRight: 16 }}
              />
            )}
            <Text className="text-gray-900 dark:text-white font-semibold text-base flex-1">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple - iOS only */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={handleAppleAuth}
              disabled={appleLoading}
              activeOpacity={0.7}
              className="flex-row items-center bg-white dark:bg-white/10 rounded-2xl px-6 py-5 mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 10,
                borderWidth: 1.5,
                borderColor: "rgba(255, 255, 255, 0.3)",
                borderTopColor: "rgba(255, 255, 255, 0.5)",
                borderBottomColor: "rgba(0, 0, 0, 0.1)",
              }}
            >
              {appleLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#9CA3AF"
                  className="mr-4"
                />
              ) : (
                <Image
                  source={require("@/assets/images/apple-logo.png")}
                  style={{ width: 26, height: 26, marginRight: 16 }}
                />
              )}
              <Text className="text-gray-900 dark:text-white font-semibold text-base flex-1">
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Email */}
          <TouchableOpacity
            onPress={handleEmailAuth}
            activeOpacity={0.7}
            className="flex-row items-center bg-white dark:bg-white/10 rounded-2xl px-6 py-5"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.3)",
              borderTopColor: "rgba(255, 255, 255, 0.5)",
              borderBottomColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <Mail size={26} color="#9CA3AF" style={{ marginRight: 16 }} />
            <Text className="text-gray-900 dark:text-white font-semibold text-base flex-1">
              Continue with Email
            </Text>
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
          className="bg-gray-900 dark:bg-white rounded-full py-5 items-center justify-center mb-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.3,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          <Text className="text-white dark:text-black font-bold text-base tracking-wide">
            Sign up
          </Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/login", params: { tab: "login" } } as any)
          }
          activeOpacity={0.8}
          className="bg-white dark:bg-white/10 rounded-full py-5 items-center justify-center mb-8"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
            borderWidth: 1.5,
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderTopColor: "rgba(255, 255, 255, 0.5)",
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
          }}
        >
          <Text className="text-gray-900 dark:text-white font-bold text-base tracking-wide">
            Sign in
          </Text>
        </TouchableOpacity>

        {/* Footer Links */}
        <View className="flex-row justify-center items-center">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://www.satlearner.com/privacy-policy")
            }
          >
            <Text className="text-gray-500 dark:text-gray-500 text-sm">
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-400 dark:text-gray-600 mx-2">·</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Linking.openURL("https://www.satlearner.com/terms-of-service")
            }
          >
            <Text className="text-gray-500 dark:text-gray-500 text-sm">
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
