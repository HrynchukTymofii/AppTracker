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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { router } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { AppleLoginButton } from "@/components/AppleLoginButton";
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

export default function RegisterScreen() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setToken, setUser } = useAuth();
  const { loadUserInBackground } = useLoadUserInBackground();

  const returnUrl = params.get("returnUrl");
  const safeReturnUrl =
    typeof returnUrl === "string" && returnUrl.startsWith("/")
      ? returnUrl
      : "/";

  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const stored = await SecureStore.getItemAsync("onboardingAnswers");
        if (stored) {
          const data = JSON.parse(stored);
          if (data.name && data.name.trim().length > 0) {
            setName(data.name.trim());
          } else {
            setName("Student");
          }
        } else {
          setName("Student");
        }
      } catch (err) {
        console.error("Failed to load onboarding data:", err);
        setName("Student");
      }
    };
    loadOnboardingData();
  }, []);

  const handleGoogleSignup = async () => {
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
              text1: "Sign up successful",
              text2: "Welcome to Studify!",
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
            Toast.show({ type: "info", text1: "Google sign up in progress" });
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
              text1: "Google sign up failed",
              text2: err.message || "Error",
            });
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (loading) return;

    if (!agreeToTerms) {
      Toast.show({
        type: "error",
        text1: "Terms & Conditions",
        text2: "Please agree to the Terms & Conditions",
      });
      return;
    }

    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid email",
        text2: "Please enter a valid email address",
      });
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      Toast.show({
        type: "error",
        text1: "Invalid password",
        text2: "Password must be at least 4 characters",
      });
      setLoading(false);
      return;
    }

    try {
      // Register
      const registerRes = await fetch(
        `https://www.satlearner.com/api/auth/register`,
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
          text1: "Registration failed",
          text2: errText,
        });
        setLoading(false);
        return;
      }

      // Login after successful registration
      const loginRes = await fetch(
        "https://www.satlearner.com/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        const errText = errData.error || "Unknown error";
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: errText,
        });
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

        Toast.show({
          type: "success",
          text1: "Registration successful",
          text2: "Welcome to Studify!",
          position: "top",
          visibilityTime: 700,
        });

        router.replace(safeReturnUrl as any);
        loadUserInBackground({ token: data.token, setUser, forceSync: true });
      } else {
        Toast.show({
          type: "error",
          text1: "Authentication error",
          text2: "Please try again",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#ffffff" }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Header with Back Button */}
        <View className="pt-12 px-6 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="mb-6"
          >
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-gray-900">
            Join Studify Today ✨
          </Text>
          <Text className="text-gray-600 mt-2">
            Get personalized study plans and more. Sign up with your email to
            get started
          </Text>
        </View>

        {/* Form Container */}
        <View className="px-6 flex-1">
          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Email</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="andrew.ainsley@yourdomain.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="••••••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View className="flex-row items-start mb-6">
            <TouchableOpacity
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              activeOpacity={0.7}
              className="mr-3 mt-0.5"
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center ${
                  agreeToTerms
                    ? "bg-cyan-500 border-cyan-500"
                    : "border-gray-300 bg-white"
                }`}
              >
                {agreeToTerms && <Text className="text-white text-xs">✓</Text>}
              </View>
            </TouchableOpacity>
            <Text className="flex-1 text-gray-700">
              I agree to Studify{" "}
              <Text className="text-cyan-500 font-medium">
                Terms & Conditions
              </Text>
              .
            </Text>
          </View>

          {/* Already Have Account */}
          <View className="flex-row justify-center items-center mb-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              activeOpacity={0.7}
            >
              <Text className="text-cyan-500 font-medium">Sign in</Text>
            </TouchableOpacity>
          </View>

        

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500">or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social Login Buttons */}
          <View className="flex-row justify-center items-center gap-x-8 mb-6">
            <TouchableOpacity
              onPress={handleGoogleSignup}
              disabled={googleLoading}
              activeOpacity={0.7}
              className="w-20 h-20 rounded-full border border-gray-200 items-center justify-center bg-white"
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#06B6D4" />
              ) : (
                <Image
                  source={require("@/assets/images/google-logo.webp")}
                  style={{ width: 30, height: 30 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleAppleLogin({
                  setToken,
                  setUser,
                  router,
                  safeReturnUrl,
                  loadUserInBackground,
                })
              }
              activeOpacity={0.7}
              className="w-20 h-20 rounded-full border border-gray-200 items-center justify-center bg-white"
            >
              <Image
                source={require("@/assets/images/apple-logo.png")}
                style={{ width: 30, height: 30 }}
              />
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}