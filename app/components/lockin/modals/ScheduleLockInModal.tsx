import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { X, Clock, Calendar, Shield, ChevronRight, Bell, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLockIn, ScheduledLockIn } from "@/context/LockInContext";
import { DEFAULT_BLOCKED_APPS } from "@/lib/blockingConstants";
import { AppSelectionModal } from "./AppSelectionModal";

interface ScheduleLockInModalProps {
  visible: boolean;
  isDark: boolean;
  scheduled?: ScheduledLockIn | null;
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" },
];

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export const ScheduleLockInModal: React.FC<ScheduleLockInModalProps> = ({
  visible,
  isDark,
  scheduled,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { addScheduledLockIn, updateScheduledLockIn, deleteScheduledLockIn } = useLockIn();

  const [taskName, setTaskName] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [isRepeating, setIsRepeating] = useState(true);
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [blockedApps, setBlockedApps] = useState<string[]>(DEFAULT_BLOCKED_APPS);
  const [showAppSelection, setShowAppSelection] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (visible) {
      if (scheduled) {
        setTaskName(scheduled.taskName);
        const [hours, minutes] = scheduled.scheduledTime.split(":").map(Number);
        const time = new Date();
        time.setHours(hours, minutes);
        setSelectedTime(time);
        setDuration(scheduled.durationMinutes);
        setIsRepeating(scheduled.isRepeating);
        setRepeatDays(scheduled.repeatDays || [1, 2, 3, 4, 5]);
        setRequiresPhoto(scheduled.requiresPhotoVerification);
        setBlockedApps(scheduled.blockedApps || DEFAULT_BLOCKED_APPS);
      } else {
        resetForm();
      }
    }
  }, [scheduled, visible]);

  const resetForm = () => {
    setTaskName("");
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setSelectedTime(defaultTime);
    setDuration(60);
    setIsRepeating(true);
    setRepeatDays([1, 2, 3, 4, 5]);
    setRequiresPhoto(false);
    setBlockedApps(DEFAULT_BLOCKED_APPS);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleSave = async () => {
    if (!taskName.trim()) return;

    const scheduledTime = `${String(selectedTime.getHours()).padStart(2, "0")}:${String(selectedTime.getMinutes()).padStart(2, "0")}`;

    const data = {
      taskName: taskName.trim(),
      scheduledTime,
      isRepeating,
      repeatDays: isRepeating ? repeatDays : undefined,
      durationMinutes: duration,
      requiresPhotoVerification: requiresPhoto,
      blockedApps,
    };

    if (scheduled) {
      await updateScheduledLockIn(scheduled.id, data);
    } else {
      await addScheduledLockIn(data);
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (scheduled) {
      await deleteScheduledLockIn(scheduled.id);
      handleClose();
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
            maxHeight: "92%",
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
                  backgroundColor: "rgba(59, 130, 246, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Calendar size={22} color="#3b82f6" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  {scheduled ? "Edit Schedule" : "Schedule LockIn"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Set a daily reminder
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

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Task Name */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Task Name
            </Text>
            <TextInput
              value={taskName}
              onChangeText={setTaskName}
              placeholder="e.g., Morning study session"
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

            {/* Time Selection */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Start Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={{
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                borderRadius: 14,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.2)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock size={22} color="#3b82f6" />
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#3b82f6",
                    marginLeft: 12,
                  }}
                >
                  {formatTime(selectedTime)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                Change
              </Text>
            </TouchableOpacity>

            {(showTimePicker || Platform.OS === "ios") && Platform.OS === "ios" && (
              <View
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
                  borderRadius: 14,
                  marginBottom: 24,
                  overflow: "hidden",
                }}
              >
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}

            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Duration */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Duration
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDuration(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor:
                      duration === opt.value
                        ? "#3b82f6"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "#f3f4f6",
                    alignItems: "center",
                    borderWidth: duration === opt.value ? 0 : 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color:
                        duration === opt.value ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Repeat Days */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isDark ? "#6b7280" : "#9ca3af",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Repeat On
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: repeatDays.includes(day.value)
                      ? "#3b82f6"
                      : isDark
                      ? "rgba(255, 255, 255, 0.03)"
                      : "#f3f4f6",
                    alignItems: "center",
                    borderWidth: repeatDays.includes(day.value) ? 0 : 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: repeatDays.includes(day.value)
                        ? "#ffffff"
                        : isDark
                        ? "#9ca3af"
                        : "#6b7280",
                    }}
                  >
                    {day.label}
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
                marginBottom: 10,
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
                marginBottom: 24,
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
                  {blockedApps.length} apps selected
                </Text>
              </View>
              <ChevronRight size={20} color="#ef4444" />
            </TouchableOpacity>

            {/* Photo Verification Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "rgba(16, 185, 129, 0.15)",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  Photo Verification
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  Require before/after photos for 1.5x points
                </Text>
              </View>
              <Switch
                value={requiresPhoto}
                onValueChange={setRequiresPhoto}
                trackColor={{ false: isDark ? "#374151" : "#e5e7eb", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={!taskName.trim() || repeatDays.length === 0}
              activeOpacity={0.8}
              style={{
                backgroundColor:
                  taskName.trim() && repeatDays.length > 0
                    ? "#3b82f6"
                    : isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "#e5e7eb",
                paddingVertical: 18,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: taskName.trim() && repeatDays.length > 0 ? "#3b82f6" : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: taskName.trim() && repeatDays.length > 0 ? 4 : 0,
              }}
            >
              <Bell size={20} color={taskName.trim() && repeatDays.length > 0 ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af"} />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: taskName.trim() && repeatDays.length > 0 ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af",
                  marginLeft: 10,
                }}
              >
                {scheduled ? "Update Schedule" : "Create Schedule"}
              </Text>
            </TouchableOpacity>

            {scheduled && (
              <TouchableOpacity
                onPress={handleDelete}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#ef4444",
                    marginLeft: 8,
                  }}
                >
                  Delete Schedule
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
        selectedApps={blockedApps}
        onClose={() => setShowAppSelection(false)}
        onSelect={setBlockedApps}
      />
    </Modal>
  );
};

export default ScheduleLockInModal;
