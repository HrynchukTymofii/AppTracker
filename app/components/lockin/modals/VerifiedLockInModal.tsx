import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { X, Camera, Check, ChevronRight, ChevronLeft, Shield, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { DEFAULT_BLOCKED_APPS } from "@/lib/blockingConstants";
import { AppSelectionModal } from "./AppSelectionModal";
import { useTranslation } from "react-i18next";

interface VerifiedLockInModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onStart: (
    taskDescription: string,
    minutes: number,
    blockedApps: string[],
    beforePhotoUri?: string
  ) => void;
}

const DURATION_OPTIONS = [
  { value: 30, labelKey: "30m" },
  { value: 60, labelKey: "1h" },
  { value: 90, labelKey: "1.5h" },
  { value: 120, labelKey: "2h" },
];

// Tasks that require before photo for comparison
// - Clean room: need to show messy state vs clean state
// - Read: need to show starting page number
// Tasks that DON'T need before photo:
// - Workout: exercise itself is the proof
// - Cook a meal: the finished dish is the proof
// - Complete homework: completion is the proof
// - Write: the plan itself is the proof
const PRESET_TASKS = [
  { emoji: "🏠", nameKey: "cleanRoom", requiresBeforePhoto: true },
  { emoji: "📚", nameKey: "completeHomework", requiresBeforePhoto: false },
  { emoji: "💪", nameKey: "workoutRoutine", requiresBeforePhoto: false },
  { emoji: "🍳", nameKey: "cookMeal", requiresBeforePhoto: false },
  { emoji: "📖", nameKey: "readPages", requiresBeforePhoto: true },
  { emoji: "✏️", nameKey: "writePlan", requiresBeforePhoto: false },
];

// Check if a custom task requires before photo using AI
// TODO: Implement actual OpenAI API call
const checkIfTaskRequiresBeforePhoto = async (taskDescription: string): Promise<boolean> => {
  // For custom tasks, determine if they need before photo
  // Tasks needing before photo: cleaning, organizing, transformations that need visual comparison
  // Tasks not needing: physical exercises, writing, studying, cooking

  const lowerTask = taskDescription.toLowerCase();

  // Keywords that suggest needing before photo
  const needsBeforeKeywords = [
    'clean', 'organize', 'tidy', 'declutter', 'sort', 'arrange',
    'fix', 'repair', 'paint', 'decorate', 'rearrange', 'room',
    'desk', 'closet', 'garage', 'laundry', 'fold', 'read', 'page', 'book'
  ];

  // Keywords that suggest NOT needing before photo
  const noBeforeKeywords = [
    'workout', 'exercise', 'run', 'walk', 'jog', 'gym', 'stretch',
    'cook', 'meal', 'food', 'write', 'study', 'homework', 'assignment',
    'meditate', 'yoga', 'practice', 'learn', 'code', 'program'
  ];

  // Check for keywords
  for (const keyword of needsBeforeKeywords) {
    if (lowerTask.includes(keyword)) {
      return true;
    }
  }

  for (const keyword of noBeforeKeywords) {
    if (lowerTask.includes(keyword)) {
      return false;
    }
  }

  // Default: require before photo for safety (ensures accountability)
  return true;
};

export const VerifiedLockInModal: React.FC<VerifiedLockInModalProps> = ({
  visible,
  isDark,
  onClose,
  onStart,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedApps, setSelectedApps] = useState<string[]>(DEFAULT_BLOCKED_APPS);
  const [beforePhotoUri, setBeforePhotoUri] = useState<string | undefined>();
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [requiresBeforePhoto, setRequiresBeforePhoto] = useState(true);
  const [checkingPhotoRequirement, setCheckingPhotoRequirement] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep(1);
      setTaskDescription("");
      setSelectedDuration(60);
      setSelectedApps(DEFAULT_BLOCKED_APPS);
      setBeforePhotoUri(undefined);
      setTakingPhoto(false);
      setRequiresBeforePhoto(true);
      setCheckingPhotoRequirement(false);
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const handleNext = async () => {
    if (step === 1) {
      // Check if the task requires before photo
      setCheckingPhotoRequirement(true);

      // Check if it's a preset task
      const presetTask = PRESET_TASKS.find((task) => t(`verifiedLockIn.presetTasks.${task.nameKey}`) === taskDescription);
      let needsPhoto = true;

      if (presetTask) {
        needsPhoto = presetTask.requiresBeforePhoto;
      } else {
        // Custom task - check using keyword logic (or AI in future)
        needsPhoto = await checkIfTaskRequiresBeforePhoto(taskDescription);
      }

      setRequiresBeforePhoto(needsPhoto);
      setCheckingPhotoRequirement(false);

      if (needsPhoto) {
        setStep(2); // Go to before photo step
      } else {
        setStep(3); // Skip to final step
      }
    } else if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3 && !requiresBeforePhoto) {
      // If before photo was skipped, go back to step 1
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStart = () => {
    onStart(taskDescription, selectedDuration, selectedApps, beforePhotoUri);
    handleClose();
  };

  const takePhoto = async () => {
    try {
      setTakingPhoto(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setTakingPhoto(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setBeforePhotoUri(result.assets[0].uri);
        handleNext();
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setTakingPhoto(false);
    }
  };

  const retakePhoto = async () => {
    try {
      setTakingPhoto(true);

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setTakingPhoto(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setBeforePhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    } finally {
      setTakingPhoto(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
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
        {t("verifiedLockIn.step1.whatAccomplish")}
      </Text>

      <TextInput
        value={taskDescription}
        onChangeText={setTaskDescription}
        placeholder={t("verifiedLockIn.step1.describeTask")}
        placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
        style={{
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
          borderRadius: 14,
          padding: 16,
          fontSize: 16,
          color: isDark ? "#ffffff" : "#111827",
          marginBottom: 24,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
        }}
      />

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
        {t("verifiedLockIn.step1.orChoosePreset")}
      </Text>

      {PRESET_TASKS.map((task) => (
        <TouchableOpacity
          key={task.nameKey}
          onPress={() => setTaskDescription(t(`verifiedLockIn.presetTasks.${task.nameKey}`))}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor:
              taskDescription === t(`verifiedLockIn.presetTasks.${task.nameKey}`)
                ? "rgba(16, 185, 129, 0.12)"
                : isDark
                ? "rgba(255, 255, 255, 0.03)"
                : "#ffffff",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: taskDescription === t(`verifiedLockIn.presetTasks.${task.nameKey}`) ? 1.5 : 1,
            borderColor:
              taskDescription === t(`verifiedLockIn.presetTasks.${task.nameKey}`)
                ? "#10b981"
                : isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 22 }}>{task.emoji}</Text>
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: "500",
              color: isDark ? "#ffffff" : "#111827",
            }}
          >
            {t(`verifiedLockIn.presetTasks.${task.nameKey}`)}
          </Text>
          {taskDescription === t(`verifiedLockIn.presetTasks.${task.nameKey}`) && (
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#10b981",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={16} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1, padding: 20, alignItems: "center", justifyContent: "center" }}>
      <Sparkles size={32} color="#10b981" style={{ marginBottom: 12 }} />
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: isDark ? "#ffffff" : "#111827",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {t("verifiedLockIn.step2.takeBeforePhoto")}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: isDark ? "#9ca3af" : "#6b7280",
          marginBottom: 36,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {t("verifiedLockIn.step2.showCurrentState")}
      </Text>

      {/* Camera preview/placeholder */}
      <TouchableOpacity
        onPress={takePhoto}
        disabled={takingPhoto}
        style={{
          width: 240,
          height: 240,
          borderRadius: 24,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          borderWidth: 2,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
          borderStyle: "dashed",
          overflow: "hidden",
        }}
      >
        {takingPhoto ? (
          <ActivityIndicator size="large" color="#10b981" />
        ) : (
          <>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Camera size={32} color="#10b981" />
            </View>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? "#9ca3af" : "#6b7280",
                fontWeight: "500",
              }}
            >
              {t("verifiedLockIn.step2.tapToTakePhoto")}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Tips */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
          borderRadius: 14,
          padding: 16,
          width: "100%",
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
          <Text style={{ color: "#10b981", fontWeight: "600" }}>{t("verifiedLockIn.step2.tips")} </Text>
          {t("verifiedLockIn.step2.tipsContent")}
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo & Task Summary */}
      <View
        style={{
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        {requiresBeforePhoto && beforePhotoUri ? (
          <TouchableOpacity onPress={retakePhoto} disabled={takingPhoto}>
            <Image
              source={{ uri: beforePhotoUri }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                marginRight: 14,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 10,
                backgroundColor: "#10b981",
                borderRadius: 10,
                padding: 4,
              }}
            >
              <Check size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "#10b981",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Check size={28} color="#ffffff" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              color: "#10b981",
              fontWeight: "600",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {requiresBeforePhoto ? t("verifiedLockIn.step3.beforePhotoReady") : t("verifiedLockIn.step3.taskSelected")}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#111827",
            }}
            numberOfLines={2}
          >
            {taskDescription}
          </Text>
        </View>
      </View>

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
        {t("verifiedLockIn.step3.focusDuration")}
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {DURATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setSelectedDuration(option.value)}
            style={{
              flex: 1,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor:
                selectedDuration === option.value
                  ? "#10b981"
                  : isDark
                  ? "rgba(255, 255, 255, 0.03)"
                  : "#f3f4f6",
              alignItems: "center",
              borderWidth: selectedDuration === option.value ? 0 : 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color:
                  selectedDuration === option.value
                    ? "#ffffff"
                    : isDark
                    ? "#ffffff"
                    : "#374151",
              }}
            >
              {t(`verifiedLockIn.durations.${option.labelKey}`)}
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
        {t("verifiedLockIn.step3.appsToBlock")}
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
            {t("verifiedLockIn.step3.appsWillBeBlocked", { count: selectedApps.length })}
          </Text>
        </View>
        <ChevronRight size={20} color="#ef4444" />
      </TouchableOpacity>
    </ScrollView>
  );

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
            maxHeight: "92%",
            flex: 1,
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
            {step > 1 ? (
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronLeft size={22} color={isDark ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <View style={{ alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Camera size={18} color="#10b981" style={{ marginRight: 8 }} />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {t("verifiedLockIn.title")}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                  gap: 6,
                }}
              >
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={{
                      width: s === step ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        s <= step
                          ? "#10b981"
                          : isDark
                          ? "rgba(255, 255, 255, 0.1)"
                          : "#e5e7eb",
                    }}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          {/* Step Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Footer Buttons */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            {step === 1 && (
              <TouchableOpacity
                onPress={handleNext}
                disabled={!taskDescription.trim() || checkingPhotoRequirement}
                activeOpacity={0.8}
                style={{
                  backgroundColor: taskDescription.trim() && !checkingPhotoRequirement ? "#10b981" : isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e7eb",
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checkingPhotoRequirement ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: taskDescription.trim() ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af",
                        marginRight: 8,
                      }}
                    >
                      {t("verifiedLockIn.buttons.continue")}
                    </Text>
                    <ChevronRight size={20} color={taskDescription.trim() ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af"} />
                  </>
                )}
              </TouchableOpacity>
            )}

            {step === 3 && (
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#10b981",
                  paddingVertical: 18,
                  borderRadius: 14,
                  alignItems: "center",
                  shadowColor: "#10b981",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#ffffff",
                  }}
                >
                  {t("verifiedLockIn.buttons.lockInNow")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255, 255, 255, 0.75)",
                    marginTop: 4,
                  }}
                >
                  {t("verifiedLockIn.buttons.completeToUnlock")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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

export default VerifiedLockInModal;
