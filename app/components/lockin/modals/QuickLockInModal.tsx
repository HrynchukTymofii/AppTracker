import React, { useState, useEffect, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, PanResponder, Animated } from "react-native";
import { X, Zap, Shield, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEFAULT_BLOCKED_APPS } from "@/lib/blockingConstants";
import { AppSelectionModal } from "./AppSelectionModal";

interface QuickLockInModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onStart: (minutes: number, blockedApps: string[]) => void;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15m", desc: "Quick sprint" },
  { value: 30, label: "30m", desc: "Power session" },
  { value: 45, label: "45m", desc: "Deep focus" },
  { value: 60, label: "1h", desc: "Full session" },
  { value: 90, label: "1.5h", desc: "Extended" },
  { value: 120, label: "2h", desc: "Marathon" },
];

export const QuickLockInModal: React.FC<QuickLockInModalProps> = ({
  visible,
  isDark,
  onClose,
  onStart,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedApps, setSelectedApps] = useState<string[]>(DEFAULT_BLOCKED_APPS);
  const [showAppSelection, setShowAppSelection] = useState(false);

  // Swipe-to-close gesture
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDuration(30);
      setSelectedApps(DEFAULT_BLOCKED_APPS);
    }
  }, [visible]);

  const handleStart = () => {
    onStart(selectedDuration, selectedApps);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={{
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: Math.max(insets.bottom, 20),
            maxHeight: "85%",
            borderTopWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            transform: [{ translateY }],
          }}
        >
          {/* Handle - swipe area */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              position: "relative",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", paddingRight: 50 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Zap size={22} color="#f59e0b" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  Quick LockIn
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  No verification needed
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Duration Selection */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              How long will you focus?
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 28,
              }}
            >
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSelectedDuration(option.value)}
                  style={{
                    width: "31%",
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor:
                      selectedDuration === option.value
                        ? "#f59e0b"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "#f9fafb",
                    alignItems: "center",
                    borderWidth: selectedDuration === option.value ? 0 : 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color:
                        selectedDuration === option.value
                          ? "#ffffff"
                          : isDark
                          ? "#ffffff"
                          : "#374151",
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color:
                        selectedDuration === option.value
                          ? "rgba(255, 255, 255, 0.8)"
                          : isDark
                          ? "#6b7280"
                          : "#9ca3af",
                      marginTop: 4,
                    }}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apps to Block */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Apps to Block
            </Text>

            <TouchableOpacity
              onPress={() => setShowAppSelection(true)}
              style={{
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)",
                borderRadius: 14,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.15)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Shield size={20} color="#ef4444" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#ef4444",
                    marginLeft: 10,
                  }}
                >
                  {selectedApps.length} apps will be blocked
                </Text>
              </View>
              <ChevronRight size={20} color="#ef4444" />
            </TouchableOpacity>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                borderRadius: 14,
                padding: 16,
                marginTop: 20,
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.15)",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  lineHeight: 20,
                }}
              >
                <Text style={{ color: "#f59e0b", fontWeight: "600" }}>Quick tip: </Text>
                Selected apps will be blocked until the timer ends. Stay focused and earn points!
              </Text>
            </View>
          </ScrollView>

          {/* Start Button */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <TouchableOpacity
              onPress={handleStart}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#f59e0b",
                paddingVertical: 18,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#f59e0b",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Zap size={22} color="#ffffff" />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: "#ffffff",
                  marginLeft: 10,
                }}
              >
                Start {DURATION_OPTIONS.find(o => o.value === selectedDuration)?.label} Focus
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* App Selection Modal */}
      <AppSelectionModal
        visible={showAppSelection}
        isDark={isDark}
        selectedApps={selectedApps}
        onClose={() => setShowAppSelection(false)}
        onSelect={setSelectedApps}
      />
    </Modal>
  );
};

export default QuickLockInModal;
