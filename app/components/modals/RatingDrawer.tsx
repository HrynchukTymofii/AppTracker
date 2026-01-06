import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Star, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as StoreReview from "expo-store-review";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/api/user";
import { useTranslation } from "react-i18next";

interface RatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function RatingDrawer({ isOpen, onClose, isDark }: RatingDrawerProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      // Reset state when closing
      setTimeout(() => {
        setRating(0);
        setShowFeedback(false);
        setFeedbackText("");
      }, 300);
    }
  }, [isOpen]);

  const handleRatingSelect = async (selectedRating: number) => {
    setRating(selectedRating);

    if (selectedRating >= 4) {
      // High rating - open store review
      onClose();

      // Small delay to let the drawer close first
      setTimeout(async () => {
        try {
          // Try native store review first
          const isAvailable = await StoreReview.isAvailableAsync();

          if (isAvailable) {
            await StoreReview.requestReview();
          }

          // Always also try to open store link as fallback/additional option
          if (Platform.OS === "ios") {
            const appStoreLink = "itms-apps://itunes.apple.com/app/id6751187640?action=write-review";
            const webLink = "https://apps.apple.com/app/id6751187640?action=write-review";
            Linking.openURL(appStoreLink).catch(() => Linking.openURL(webLink));
          } else if (Platform.OS === "android") {
            const playStoreLink = "market://details?id=com.hrynchuk.lockin";
            const webLink = "https://play.google.com/store/apps/details?id=com.hrynchuk.lockin";
            Linking.openURL(playStoreLink).catch(() => Linking.openURL(webLink));
          }

          Toast.show({
            type: "success",
            text1: t("profile.thankYouRating") || "Thank you for your rating!",
            position: "top",
            visibilityTime: 2000,
          });
        } catch (error) {
          console.error("Rate app error:", error);
          // Still try to open store link even if error
          if (Platform.OS === "ios") {
            Linking.openURL("https://apps.apple.com/app/id6751187640?action=write-review");
          } else if (Platform.OS === "android") {
            Linking.openURL("https://play.google.com/store/apps/details?id=com.hrynchuk.lockin");
          }
        }
      }, 400);
    } else {
      // Low rating - show feedback form
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !token) return;

    setLoading(true);
    try {
      const success = await sendMessage(token, "problem", `Rating: ${rating}/5\n\n${feedbackText}`);

      if (success) {
        Toast.show({
          type: "success",
          text1: t("profile.feedbackSent") || "Feedback sent!",
          text2: t("profile.feedbackThanks") || "Thank you for helping us improve",
          position: "top",
          visibilityTime: 2000,
        });
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: t("profile.feedbackError") || "Failed to send feedback",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Submit feedback error:", error);
      Toast.show({
        type: "error",
        text1: t("profile.feedbackError") || "Failed to send feedback",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const glassBackground = isDark ? "rgba(20, 20, 25, 0.98)" : "rgba(255, 255, 255, 0.98)";
  const glassBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)";

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View
            style={{
              backgroundColor: glassBackground,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: glassBorder,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {/* Handle bar */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 12,
                paddingBottom: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                }}
              />
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? "#ffffff" : "#1f2937"} />
            </TouchableOpacity>

            <View style={{ padding: 24, paddingTop: 16 }}>
              {!showFeedback ? (
                // Rating selection view
                <>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: isDark ? "#ffffff" : "#1f2937",
                      textAlign: "center",
                      marginBottom: 8,
                      letterSpacing: -0.5,
                    }}
                  >
                    {t("profile.rateExperience") || "Rate Your Experience"}
                  </Text>

                  <Text
                    style={{
                      fontSize: 15,
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6b7280",
                      textAlign: "center",
                      marginBottom: 32,
                      lineHeight: 22,
                    }}
                  >
                    {t("profile.rateDescription") || "How would you rate LockIn?"}
                  </Text>

                  {/* Star rating */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRatingSelect(star)}
                        activeOpacity={0.7}
                        style={{
                          padding: 8,
                        }}
                      >
                        <Star
                          size={40}
                          color={star <= rating ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}
                          fill={star <= rating ? "#fbbf24" : "transparent"}
                          strokeWidth={1.5}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "rgba(255, 255, 255, 0.4)" : "#9ca3af",
                      textAlign: "center",
                    }}
                  >
                    {t("profile.tapToRate") || "Tap a star to rate"}
                  </Text>
                </>
              ) : (
                // Feedback form view
                <>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: isDark ? "#ffffff" : "#1f2937",
                      textAlign: "center",
                      marginBottom: 8,
                      letterSpacing: -0.5,
                    }}
                  >
                    {t("profile.tellUsMore") || "Tell Us More"}
                  </Text>

                  <Text
                    style={{
                      fontSize: 15,
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6b7280",
                      textAlign: "center",
                      marginBottom: 24,
                      lineHeight: 22,
                    }}
                  >
                    {t("profile.helpUsImprove") || "Help us improve your experience"}
                  </Text>

                  {/* Current rating display */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 4,
                      marginBottom: 20,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        color={star <= rating ? "#fbbf24" : isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}
                        fill={star <= rating ? "#fbbf24" : "transparent"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </View>

                  {/* Feedback text input */}
                  <TextInput
                    multiline
                    placeholder={t("profile.describeProblem") || "What can we do better?"}
                    placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.3)" : "#9ca3af"}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    style={{
                      minHeight: 120,
                      borderWidth: 1,
                      borderColor: glassBorder,
                      borderRadius: 16,
                      padding: 16,
                      textAlignVertical: "top",
                      color: isDark ? "#ffffff" : "#1f2937",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                      marginBottom: 20,
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                  />

                  {/* Submit button */}
                  <TouchableOpacity
                    onPress={handleSubmitFeedback}
                    disabled={loading || !feedbackText.trim()}
                    activeOpacity={0.8}
                    style={{ borderRadius: 14, overflow: "hidden" }}
                  >
                    <LinearGradient
                      colors={
                        loading || !feedbackText.trim()
                          ? [isDark ? "#374151" : "#d1d5db", isDark ? "#374151" : "#d1d5db"]
                          : ["#8b5cf6", "#6366f1"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 16,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <Send size={18} color="#ffffff" style={{ marginRight: 8 }} />
                          <Text
                            style={{
                              color: "#ffffff",
                              fontWeight: "600",
                              fontSize: 16,
                            }}
                          >
                            {t("profile.sendFeedback") || "Send Feedback"}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back button */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowFeedback(false);
                      setRating(0);
                    }}
                    style={{ marginTop: 12, paddingVertical: 12 }}
                  >
                    <Text
                      style={{
                        color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280",
                        textAlign: "center",
                        fontSize: 14,
                      }}
                    >
                      {t("profile.changeRating") || "Change rating"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
