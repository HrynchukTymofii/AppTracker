import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Image } from "react-native";
import { Lock, Camera, X, Check, Shield, Sparkles, Trophy } from "lucide-react-native";
import { LockInSession } from "@/context/LockInContext";
import { PhotoVerificationModal } from "./modals/PhotoVerificationModal";

interface ActiveSessionProps {
  session: LockInSession;
  isDark: boolean;
  onComplete: (afterPhotoUri?: string) => void;
  onGiveUp: () => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const ActiveSession: React.FC<ActiveSessionProps> = ({
  session,
  isDark,
  onComplete,
  onGiveUp,
}) => {
  const [remainingTime, setRemainingTime] = useState(0);
  const [showVerification, setShowVerification] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const endTime = session.startedAt + session.durationMinutes * 60 * 1000;
  const totalDuration = session.durationMinutes * 60 * 1000;

  useEffect(() => {
    // Update remaining time every second
    const interval = setInterval(() => {
      const remaining = endTime - Date.now();
      setRemainingTime(remaining);
    }, 1000);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [endTime]);

  const progress = Math.max(0, Math.min(1, 1 - remainingTime / totalDuration));
  const isVerified = session.type === "verified";
  const hasBeforePhoto = !!session.beforePhotoUri;

  const handleCompletePress = () => {
    if (isVerified && hasBeforePhoto) {
      setShowVerification(true);
    } else {
      onComplete();
    }
  };

  const handleVerified = () => {
    setShowVerification(false);
    onComplete();
  };

  const handleForceUnlock = () => {
    setShowVerification(false);
    onComplete();
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 28 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#ef4444",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 24,
            shadowColor: "#ef4444",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Lock size={18} color="#ffffff" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: "#ffffff",
              marginLeft: 8,
              letterSpacing: 1,
            }}
          >
            LOCKED IN
          </Text>
        </View>
      </View>

      {/* Timer Circle */}
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <Animated.View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pulseAnim }],
            borderWidth: 2,
            borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Progress ring background */}
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 8,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          />

          {/* Progress ring */}
          <View
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 8,
              borderColor: "transparent",
              borderTopColor: "#10b981",
              borderRightColor: progress > 0.25 ? "#10b981" : "transparent",
              borderBottomColor: progress > 0.5 ? "#10b981" : "transparent",
              borderLeftColor: progress > 0.75 ? "#10b981" : "transparent",
              transform: [{ rotate: "-90deg" }],
            }}
          />

          {/* Time display */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#111827",
                letterSpacing: -2,
              }}
            >
              {formatTime(remainingTime)}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: isDark ? "#6b7280" : "#9ca3af",
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              remaining
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Task Description */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Sparkles size={16} color="#10b981" />
          <Text
            style={{
              fontSize: 12,
              color: "#10b981",
              fontWeight: "700",
              marginLeft: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Current Task
          </Text>
        </View>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#111827",
            textAlign: "center",
          }}
        >
          {session.taskDescription || "Focus Session"}
        </Text>
      </View>

      {/* Before/After Photos (if verified) */}
      {isVerified && hasBeforePhoto && (
        <View
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
            borderRadius: 16,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
            {/* Before */}
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isDark ? "#6b7280" : "#9ca3af",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Before
              </Text>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: "#10b981",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {session.beforePhotoUri ? (
                  <Image
                    source={{ uri: session.beforePhotoUri }}
                    style={{ width: 80, height: 80 }}
                  />
                ) : (
                  <Check size={32} color="#ffffff" />
                )}
              </View>
            </View>

            {/* Arrow */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: isDark ? "#6b7280" : "#9ca3af" }}>→</Text>
            </View>

            {/* After */}
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isDark ? "#6b7280" : "#9ca3af",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                After
              </Text>
              <TouchableOpacity
                onPress={handleCompletePress}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 14,
                  backgroundColor: "#3b82f6",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#3b82f6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Camera size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 11,
                  color: "#3b82f6",
                  marginTop: 8,
                  fontWeight: "600",
                }}
              >
                Tap when done
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Blocked Apps */}
      {session.blockedApps.length > 0 && (
        <View
          style={{
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.05)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(239, 68, 68, 0.15)",
          }}
        >
          <Shield size={16} color="#ef4444" />
          <Text
            style={{
              fontSize: 14,
              color: "#ef4444",
              marginLeft: 10,
              fontWeight: "600",
            }}
          >
            {session.blockedApps.length} apps blocked
          </Text>
        </View>
      )}

      {/* Points indicator */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
          borderRadius: 14,
          padding: 14,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(245, 158, 11, 0.15)",
        }}
      >
        <Trophy size={16} color="#f59e0b" />
        <Text
          style={{
            fontSize: 14,
            color: "#f59e0b",
            marginLeft: 10,
            fontWeight: "600",
          }}
        >
          Earn {Math.round(session.durationMinutes * (isVerified ? 1.5 : 1))} points on completion
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 12, marginTop: "auto", paddingBottom: 120 }}>
        {/* Complete Button */}
        <TouchableOpacity
          onPress={handleCompletePress}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#10b981",
            paddingVertical: 18,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {isVerified && hasBeforePhoto ? (
            <>
              <Camera size={22} color="#ffffff" />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: "#ffffff",
                  marginLeft: 10,
                }}
              >
                I'm Done - Verify with Photo
              </Text>
            </>
          ) : (
            <>
              <Check size={22} color="#ffffff" />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: "#ffffff",
                  marginLeft: 10,
                }}
              >
                Complete Session
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Give Up Button */}
        <TouchableOpacity
          onPress={onGiveUp}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <X size={20} color="#ef4444" />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#ef4444",
              marginLeft: 10,
            }}
          >
            Give Up (Lose streak)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Verification Modal */}
      {isVerified && hasBeforePhoto && session.beforePhotoUri && (
        <PhotoVerificationModal
          visible={showVerification}
          isDark={isDark}
          taskDescription={session.taskDescription}
          beforePhotoUri={session.beforePhotoUri}
          onClose={() => setShowVerification(false)}
          onVerified={handleVerified}
          onForceUnlock={handleForceUnlock}
        />
      )}
    </View>
  );
};

export default ActiveSession;
