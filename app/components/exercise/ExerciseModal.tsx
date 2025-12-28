import React, { useState, useEffect, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, Animated, Easing } from "react-native";
import { X, Dumbbell, Check, Clock, Flame, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useEarnedTime } from "@/context/EarnedTimeContext";
import { ExerciseCamera } from "./ExerciseCamera";
import {
  ExerciseType,
  ExerciseState,
  createExerciseState,
  calculateEarnedMinutes,
  getExerciseInfo,
  DEFAULT_EXERCISE_REWARDS,
} from "@/lib/poseUtils";

interface ExerciseModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
}

type ModalStep = 'select' | 'instructions' | 'exercise' | 'complete';

const EXERCISES: ExerciseType[] = ['pushups', 'squats', 'plank'];

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  visible,
  isDark,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const { earnTime, wallet } = useEarnedTime();

  const [step, setStep] = useState<ModalStep>('select');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushups');
  const [exerciseState, setExerciseState] = useState<ExerciseState>(createExerciseState('pushups'));
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [earnedMinutes, setEarnedMinutes] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the exercise indicator
  useEffect(() => {
    if (step === 'exercise' && isExerciseActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [step, isExerciseActive]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('select');
      setSelectedExercise('pushups');
      setExerciseState(createExerciseState('pushups'));
      setIsExerciseActive(false);
      setEarnedMinutes(0);
    }
  }, [visible]);

  const handleSelectExercise = (type: ExerciseType) => {
    setSelectedExercise(type);
    setExerciseState(createExerciseState(type));
    setStep('instructions');
  };

  const handleStartExercise = () => {
    setStep('exercise');
    setIsExerciseActive(true);
  };

  const handleExerciseStateUpdate = (state: ExerciseState) => {
    setExerciseState(state);
    const minutes = calculateEarnedMinutes(state);
    setEarnedMinutes(minutes);
  };

  const handleFinishExercise = async () => {
    setIsExerciseActive(false);
    const minutes = calculateEarnedMinutes(exerciseState);
    setEarnedMinutes(minutes);

    if (minutes > 0) {
      const details = exerciseState.type === 'plank'
        ? `${Math.floor(exerciseState.holdTime)}s hold`
        : `${exerciseState.repCount} reps`;

      await earnTime(exerciseState.type, minutes, details);
      setStep('complete');
    } else {
      setStep('complete');
    }
  };

  const handleClose = () => {
    if (isExerciseActive) {
      handleFinishExercise();
    } else {
      onClose();
    }
  };

  const exerciseInfo = getExerciseInfo(selectedExercise);
  const rewards = DEFAULT_EXERCISE_REWARDS[selectedExercise];

  const renderSelectStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Current Balance */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderColor: "rgba(59, 130, 246, 0.2)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Clock size={20} color="#3b82f6" />
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              marginLeft: 8,
            }}
          >
            Current Balance
          </Text>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#3b82f6",
          }}
        >
          {wallet.availableMinutes.toFixed(1)} min
        </Text>
      </View>

      {/* Exercise Options */}
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
        Choose an Exercise
      </Text>

      {EXERCISES.map((type) => {
        const info = getExerciseInfo(type);
        const reward = DEFAULT_EXERCISE_REWARDS[type];
        const gradientColors = getExerciseGradient(type);

        return (
          <TouchableOpacity
            key={type}
            onPress={() => handleSelectExercise(type)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
              borderRadius: 20,
              padding: 18,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              overflow: "hidden",
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.15 : 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Icon with gradient */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Text style={{ fontSize: 28 }}>{info.icon}</Text>
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#0f172a",
                  letterSpacing: -0.3,
                }}
              >
                {info.name}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
                  marginTop: 4,
                  lineHeight: 18,
                }}
              >
                {info.description}
              </Text>
            </View>

            {/* Arrow */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight
                size={18}
                color={isDark ? "rgba(255,255,255,0.4)" : "#cbd5e1"}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Info Box */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
          borderRadius: 14,
          padding: 16,
          marginTop: 12,
          borderWidth: 1,
          borderColor: "rgba(16, 185, 129, 0.15)",
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: isDark ? "#9ca3af" : "#6b7280",
            lineHeight: 20,
          }}
        >
          <Text style={{ color: "#10b981", fontWeight: "600" }}>Earn screen time </Text>
          by completing exercises. The more you do, the more time you earn!
        </Text>
      </View>
    </ScrollView>
  );

  const renderInstructionsStep = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Exercise Header */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 64 }}>{exerciseInfo.icon}</Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: isDark ? "#ffffff" : "#111827",
            marginTop: 12,
          }}
        >
          {exerciseInfo.name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? "#9ca3af" : "#6b7280",
            marginTop: 4,
          }}
        >
          {exerciseInfo.description}
        </Text>
      </View>

      {/* Instructions */}
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
        Instructions
      </Text>

      {exerciseInfo.instructions.map((instruction, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 12,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: accentColor.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {index + 1}
            </Text>
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: isDark ? "#d1d5db" : "#374151",
              lineHeight: 20,
            }}
          >
            {instruction}
          </Text>
        </View>
      ))}

      {/* Rewards Info */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
          borderRadius: 14,
          padding: 16,
          marginTop: 16,
          borderWidth: 1,
          borderColor: "rgba(245, 158, 11, 0.15)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Flame size={18} color="#f59e0b" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#f59e0b",
              marginLeft: 8,
            }}
          >
            Rewards
          </Text>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: isDark ? "#9ca3af" : "#6b7280",
            lineHeight: 20,
          }}
        >
          {selectedExercise === 'plank'
            ? `Earn ${rewards.minutesPerSecond} min per second. Minimum ${rewards.minimumSeconds}s to earn. 1.5x bonus for holding ${(rewards.minimumSeconds || 20) * 2}s+!`
            : `Earn ${rewards.minutesPerRep} min per rep. Minimum ${rewards.minimumReps} reps to earn. 1.2x bonus for ${(rewards.minimumReps || 5) * 2}+ reps!`}
        </Text>
      </View>
    </ScrollView>
  );

  const renderExerciseStep = () => (
    <View style={{ flex: 1 }}>
      <ExerciseCamera
        exerciseType={selectedExercise}
        isDark={isDark}
        onStateUpdate={handleExerciseStateUpdate}
        isActive={isExerciseActive}
      />
    </View>
  );

  const renderCompleteStep = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: earnedMinutes > 0 ? "#10b981" : "#ef4444",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          shadowColor: earnedMinutes > 0 ? "#10b981" : "#ef4444",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Check size={48} color="#ffffff" strokeWidth={3} />
      </View>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: isDark ? "#ffffff" : "#111827",
          textAlign: "center",
        }}
      >
        {earnedMinutes > 0 ? "Great Work!" : "Try Again"}
      </Text>

      <Text
        style={{
          fontSize: 15,
          color: isDark ? "#9ca3af" : "#6b7280",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {exerciseState.type === 'plank'
          ? `You held for ${Math.floor(exerciseState.holdTime)} seconds`
          : `You completed ${exerciseState.repCount} ${exerciseState.type}`}
      </Text>

      {earnedMinutes > 0 ? (
        <View
          style={{
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
            borderRadius: 20,
            paddingHorizontal: 32,
            paddingVertical: 20,
            marginTop: 32,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#10b981",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#10b981",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Time Earned
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "800",
              color: "#10b981",
              marginTop: 4,
            }}
          >
            +{earnedMinutes.toFixed(1)}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#10b981",
              fontWeight: "600",
            }}
          >
            minutes
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
            borderRadius: 16,
            padding: 16,
            marginTop: 32,
            borderWidth: 1,
            borderColor: "rgba(239, 68, 68, 0.2)",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {exerciseState.type === 'plank'
              ? `You need to hold for at least ${DEFAULT_EXERCISE_REWARDS.plank.minimumSeconds}s to earn time.`
              : `You need at least ${DEFAULT_EXERCISE_REWARDS[exerciseState.type].minimumReps} reps to earn time.`}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBottomButton = () => {
    switch (step) {
      case 'instructions':
        return (
          <TouchableOpacity
            onPress={handleStartExercise}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#10b981",
              paddingVertical: 18,
              borderRadius: 14,
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
            <Dumbbell size={22} color="#ffffff" />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#ffffff",
                marginLeft: 10,
              }}
            >
              Start Exercise
            </Text>
          </TouchableOpacity>
        );

      case 'exercise':
        return (
          <TouchableOpacity
            onPress={handleFinishExercise}
            activeOpacity={0.8}
            style={{
              backgroundColor: earnedMinutes > 0 ? "#10b981" : "#6b7280",
              paddingVertical: 18,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={22} color="#ffffff" />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#ffffff",
                marginLeft: 10,
              }}
            >
              {earnedMinutes > 0 ? `Finish (+${earnedMinutes.toFixed(1)} min)` : "Finish Exercise"}
            </Text>
          </TouchableOpacity>
        );

      case 'complete':
        return (
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={{
              backgroundColor: accentColor.primary,
              paddingVertical: 18,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#ffffff",
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
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
        <View
          style={{
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: Math.max(insets.bottom, 20),
            height: step === 'exercise' ? "95%" : "85%",
            borderTopWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12 }}>
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
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Dumbbell size={22} color="#10b981" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {step === 'select' ? 'Earn Time' : exerciseInfo.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  {step === 'select'
                    ? 'Choose an exercise'
                    : step === 'exercise'
                    ? 'Keep going!'
                    : step === 'complete'
                    ? 'Exercise complete'
                    : 'Read the instructions'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={{
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

          {/* Content */}
          <View style={{ flex: 1 }}>
            {step === 'select' && renderSelectStep()}
            {step === 'instructions' && renderInstructionsStep()}
            {step === 'exercise' && renderExerciseStep()}
            {step === 'complete' && renderCompleteStep()}
          </View>

          {/* Bottom Button */}
          {step !== 'select' && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              {renderBottomButton()}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

function getExerciseGradient(type: ExerciseType): [string, string] {
  switch (type) {
    case 'pushups':
      return ['#ef4444', '#dc2626'];
    case 'squats':
      return ['#8b5cf6', '#7c3aed'];
    case 'plank':
      return ['#10b981', '#059669'];
  }
}

export default ExerciseModal;
