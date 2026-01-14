import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  PanResponder,
  Animated,
} from "react-native";
import { X, Check, Clock, Crown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useLockIn, LockInTask, TaskCategory } from "@/context/LockInContext";
import { useAuth } from "@/context/AuthContext";

interface AddTaskModalProps {
  visible: boolean;
  isDark: boolean;
  task?: LockInTask | null;
  onClose: () => void;
}

const CATEGORIES: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: "study", label: "Study", emoji: "📚" },
  { value: "health", label: "Health", emoji: "💪" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "creative", label: "Creative", emoji: "🎨" },
  { value: "reading", label: "Reading", emoji: "📖" },
  { value: "custom", label: "Custom", emoji: "✏️" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" },
];

const DAYS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  isDark,
  task,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addTask, updateTask, deleteTask } = useLockIn();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<TaskCategory>("study");
  const [duration, setDuration] = useState(60);
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [hasScheduledTime, setHasScheduledTime] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

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
            handleClose();
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

  // Populate form when editing
  useEffect(() => {
    if (visible) {
      if (task) {
        setName(task.name);
        setCategory(task.category);
        setDuration(task.durationMinutes);
        setIsRepeating(task.isRepeating);
        setRepeatDays(task.repeatDays || [1, 2, 3, 4, 5]);
        setRequiresPhoto(task.requiresPhotoVerification);
        if (task.scheduledTime) {
          setHasScheduledTime(true);
          const [hours, minutes] = task.scheduledTime.split(":").map(Number);
          const time = new Date();
          time.setHours(hours, minutes, 0, 0);
          setScheduledTime(time);
        } else {
          setHasScheduledTime(false);
        }
      } else {
        resetForm();
      }
    }
  }, [task, visible]);

  const resetForm = () => {
    setName("");
    setCategory("study");
    setDuration(60);
    setIsRepeating(false);
    setRepeatDays([1, 2, 3, 4, 5]);
    setRequiresPhoto(false);
    setHasScheduledTime(false);
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setScheduledTime(defaultTime);
    setShowTimePicker(false);
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
      setScheduledTime(date);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    const taskData = {
      name: name.trim(),
      category,
      durationMinutes: duration,
      isRepeating,
      repeatDays: isRepeating ? repeatDays : undefined,
      requiresPhotoVerification: requiresPhoto,
      scheduledTime: hasScheduledTime
        ? `${String(scheduledTime.getHours()).padStart(2, "0")}:${String(scheduledTime.getMinutes()).padStart(2, "0")}`
        : undefined,
    };

    if (task) {
      await updateTask(task.id, taskData);
    } else {
      await addTask(taskData);
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (task) {
      await deleteTask(task.id);
      handleClose();
    }
  };

  const handlePhotoToggle = (value: boolean) => {
    if (value && !user?.isPro) {
      // User wants to enable photo verification but is not Pro
      handleClose();
      router.push("/payment");
      return;
    }
    setRequiresPhoto(value);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <Animated.View
          style={{
            backgroundColor: isDark ? "#000000" : "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            paddingBottom: Math.max(insets.bottom, 20),
            maxHeight: "90%",
            transform: [{ translateY }],
          }}
        >
          {/* Handle bar - swipe area */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.1)",
                borderRadius: 2,
              }}
            />
          </View>
          {/* Header */}
          <View
            style={{
              position: "relative",
              padding: 20,
              paddingTop: 8,
              borderBottomWidth: 1,
              borderBottomColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111827",
                paddingRight: 50,
              }}
            >
              {task ? "Edit LockIn" : "New LockIn"}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {/* Task Name */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Task Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter task name..."
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.05)",
              }}
            />

            {/* Category */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Category
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor:
                      category === cat.value
                        ? "#3b82f6"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "#f3f4f6",
                    borderWidth: category === cat.value ? 0 : 1,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 6 }}>{cat.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: category === cat.value ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Duration
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDuration(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
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
                      fontSize: 14,
                      fontWeight: "600",
                      color:
                        duration === opt.value ? "#ffffff" : isDark ? "#ffffff" : "#374151",
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Scheduled Time Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                ⏰ Set reminder time
              </Text>
              <Switch
                value={hasScheduledTime}
                onValueChange={setHasScheduledTime}
                trackColor={{ false: "#767577", true: "#3b82f6" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Time Picker */}
            {hasScheduledTime && (
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.08)",
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(59, 130, 246, 0.2)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Clock size={18} color="#3b82f6" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#3b82f6",
                      marginLeft: 10,
                    }}
                  >
                    {formatTime(scheduledTime)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#3b82f6",
                    fontWeight: "500",
                  }}
                >
                  Change
                </Text>
              </TouchableOpacity>
            )}

            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {hasScheduledTime && Platform.OS === "ios" && (
              <View
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <DateTimePicker
                  value={scheduledTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  themeVariant={isDark ? "dark" : "light"}
                />
              </View>
            )}

            {/* Repeat Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                🔄 Repeat this task
              </Text>
              <Switch
                value={isRepeating}
                onValueChange={setIsRepeating}
                trackColor={{ false: "#767577", true: "#3b82f6" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Repeat Days */}
            {isRepeating && (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 10,
                      backgroundColor: repeatDays.includes(day.value)
                        ? "#3b82f6"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "#f3f4f6",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: repeatDays.includes(day.value) ? 0 : 1,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: repeatDays.includes(day.value)
                          ? "#ffffff"
                          : isDark
                          ? "#ffffff"
                          : "#374151",
                      }}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Photo Verification Toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !user?.isPro && handlePhotoToggle(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f3f4f6",
                borderRadius: 12,
                padding: 14,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  📸 Require before/after photos
                </Text>
                {!user?.isPro && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(234, 179, 8, 0.15)",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      marginLeft: 8,
                    }}
                  >
                    <Crown size={12} color="#eab308" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#eab308",
                        marginLeft: 3,
                      }}
                    >
                      PRO
                    </Text>
                  </View>
                )}
              </View>
              <Switch
                value={requiresPhoto}
                onValueChange={handlePhotoToggle}
                trackColor={{ false: "#767577", true: "#10b981" }}
                thumbColor="#ffffff"
              />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: name.trim() ? "#3b82f6" : "#9ca3af",
                paddingVertical: 16,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={20} color="#ffffff" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#ffffff",
                  marginLeft: 8,
                }}
              >
                {task ? "Update LockIn" : "Save LockIn"}
              </Text>
            </TouchableOpacity>

            {task && (
              <TouchableOpacity
                onPress={handleDelete}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#ef4444",
                  }}
                >
                  Delete LockIn
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default AddTaskModal;
