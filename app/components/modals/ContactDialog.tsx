import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, Linking, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { X, Mail, Send } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const SUPPORT_EMAIL = "lockin@fibipals.com";

export function ContactDialog({ isOpen, onClose, isDark }: ContactDialogProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailPress = () => {
    const subject = encodeURIComponent("LockIn App Support");
    const body = encodeURIComponent(message || "");
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      // Open email with the message
      handleEmailPress();
      setMessage("");
      onClose();
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const glassBackground = isDark ? 'rgba(30, 30, 40, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal visible={isOpen} onRequestClose={onClose} transparent animationType="fade">
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 20,
      }}>
        {/* Glassy Card */}
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: glassBackground,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: glassBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Header with gradient accent */}
          <LinearGradient
            colors={isDark ? ['rgba(139, 92, 246, 0.15)', 'rgba(6, 182, 212, 0.1)'] : ['rgba(139, 92, 246, 0.08)', 'rgba(6, 182, 212, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 24,
              paddingBottom: 20,
            }}
          >
            {/* Close Button */}
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <X size={18} color={isDark ? "#ffffff" : "#1f2937"} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Mail size={28} color="#8b5cf6" />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 24,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#1f2937",
              marginBottom: 8,
              letterSpacing: -0.5,
            }}>
              Contact Support
            </Text>

            <Text style={{
              fontSize: 15,
              color: isDark ? "rgba(255, 255, 255, 0.6)" : "#6b7280",
              lineHeight: 22,
            }}>
              We're here to help. Send us a message and we'll get back to you soon.
            </Text>
          </LinearGradient>

          {/* Content */}
          <View style={{ padding: 24, paddingTop: 16 }}>
            {/* Email Button */}
            <TouchableOpacity
              onPress={handleEmailPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: glassBorder,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
                <Mail size={20} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: isDark ? "rgba(255, 255, 255, 0.5)" : "#9ca3af",
                  marginBottom: 2,
                }}>
                  Email us at
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#8b5cf6",
                }}>
                  {SUPPORT_EMAIL}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Message Input */}
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: isDark ? "rgba(255, 255, 255, 0.5)" : "#6b7280",
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Your Message
            </Text>
            <TextInput
              multiline
              placeholder="Describe your issue or question..."
              placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.3)" : "#9ca3af"}
              value={message}
              onChangeText={setMessage}
              style={{
                minHeight: 140,
                borderWidth: 1,
                borderColor: glassBorder,
                borderRadius: 16,
                padding: 16,
                textAlignVertical: "top",
                color: isDark ? "#ffffff" : "#1f2937",
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                marginBottom: 20,
                fontSize: 16,
                lineHeight: 24,
              }}
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !message.trim()}
              activeOpacity={0.8}
              style={{ borderRadius: 14, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={loading || !message.trim()
                  ? [isDark ? '#374151' : '#d1d5db', isDark ? '#374151' : '#d1d5db']
                  : ['#8b5cf6', '#6366f1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      fontSize: 16,
                    }}>
                      Send Message
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
