import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Mail, Send, MessageSquare } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { sendMessage } from "@/lib/api/user";
import { useTranslation } from "react-i18next";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const SUPPORT_EMAIL = "lockin@fibipals.com";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ContactDialog({ isOpen, onClose, isDark }: ContactDialogProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
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
        setMessage("");
      }, 300);
    }
  }, [isOpen]);

  const handleEmailPress = () => {
    const subject = encodeURIComponent("LockIn App Support");
    const body = encodeURIComponent(message || "");
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !token) return;

    setLoading(true);
    try {
      const success = await sendMessage(token, "problem", message);

      if (success) {
        Toast.show({
          type: "success",
          text1: t("profile.messageSent") || "Message sent!",
          text2: t("profile.messageThankYou") || "We'll get back to you soon",
          position: "top",
          visibilityTime: 2000,
        });
        setMessage("");
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: t("profile.messageError") || "Failed to send message",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      Toast.show({
        type: "error",
        text1: t("profile.messageError") || "Failed to send message",
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
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={["#8b5cf6", "#6366f1"]}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <MessageSquare size={22} color="#ffffff" strokeWidth={1.5} />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      color: isDark ? "#ffffff" : "#1f2937",
                      letterSpacing: -0.5,
                    }}
                  >
                    {t("profile.contactUs") || "Contact Us"}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280",
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                {t("profile.contactDescription") || "Send us a message and we'll get back to you soon"}
              </Text>

              {/* Message Input */}
              <TextInput
                multiline
                placeholder={t("profile.writeMessage") || "Write your message..."}
                placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.3)" : "#9ca3af"}
                value={message}
                onChangeText={setMessage}
                style={{
                  minHeight: 120,
                  borderWidth: 1,
                  borderColor: glassBorder,
                  borderRadius: 16,
                  padding: 16,
                  textAlignVertical: "top",
                  color: isDark ? "#ffffff" : "#1f2937",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                  marginBottom: 16,
                  fontSize: 16,
                  lineHeight: 24,
                }}
              />

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={loading || !message.trim()}
                activeOpacity={0.8}
                style={{ borderRadius: 14, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={
                    loading || !message.trim()
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
                        {t("profile.sendMessage") || "Send Message"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Or Divider */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 20,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                  }}
                />
                <Text
                  style={{
                    paddingHorizontal: 16,
                    fontSize: 13,
                    color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
                    fontWeight: "500",
                  }}
                >
                  {t("common.or") || "or"}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                  }}
                />
              </View>

              {/* Email Button */}
              <TouchableOpacity
                onPress={handleEmailPress}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: glassBorder,
                }}
              >
                <Mail size={20} color="#8b5cf6" style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#8b5cf6",
                  }}
                >
                  {t("profile.emailUs") || "Email Us"}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
                    marginLeft: 8,
                  }}
                >
                  {SUPPORT_EMAIL}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
