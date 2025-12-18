import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColorScheme } from "@/hooks/useColorScheme";

const passionsList = [
  "Science",
  "Technology",
  "Art",
  "Music",
  "Sports",
  "Literature",
  "History",
  "Business",
  "Medicine",
  "Engineering",
  "Travel",
  "Languages",
  "Other",
];

const steps = [
  { type: "text", title: "Change Name", key: "name" },
  {
    type: "select",
    title: "Have you tried SAT before?",
    options: ["Never", "Once", "Multiple times"],
    key: "satExperience",
  },
  {
    type: "timepicker",
    title: "When do you plan to take the SAT?",
    key: "satDate",
  },
  { type: "avatar", title: "Pick an avatar", key: "avatar" },
  { type: "passionSelect", title: "What's your passion?", key: "passion" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { token, user, setUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load stored answers
  useEffect(() => {
    const loadAnswers = async () => {
      const stored = await SecureStore.getItemAsync("onboardingAnswers");
      if (stored) setAnswers(JSON.parse(stored));
      else setAnswers({ name: user?.name || "" });
    };
    loadAnswers();
  }, [user]);

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!token) return alert("User not authorized");
    const result = await updateUser(token, { name: answers.name });
    if (result.success) {
      if (user) setUser({ ...user, name: answers.name });
      Toast.show({
        type: "success",
        text1: "Profile updated",
        position: "top",
        visibilityTime: 700,
      });
      router.back();
      await SecureStore.setItemAsync(
        "onboardingAnswers",
        JSON.stringify(answers)
      );
    } else {
      alert(result.error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: isDark ? "#111827" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1f2937" : "#e5e7eb",
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            borderRadius: 12,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} />
          <Text style={{ color: isDark ? "#06B6D4" : "#0891B2", fontWeight: "600", marginLeft: 6, fontSize: 14 }}>
            Back
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: "bold", color: isDark ? "#ffffff" : "#1f2937", marginBottom: 4 }}>
          Edit Profile
        </Text>
        <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Update your account information
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {steps.map((step) => (
          <View key={step.key} style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#1f2937",
                marginBottom: 8,
              }}
            >
              {step.title}
            </Text>

            {/* Text Input */}
            {step.type === "text" && (
              <TextInput
                placeholder="Enter..."
                value={answers[step.key]}
                onChangeText={(text) => handleAnswer(step.key, text)}
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#ffffff" : "#1f2937",
                  borderColor: isDark ? "#334155" : "#e5e7eb",
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                }}
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              />
            )}

            {/* Select Options */}
            {step.type === "select" && (
              <View
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#e5e7eb",
                }}
              >
                {step.options?.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      marginBottom: 8,
                      backgroundColor:
                        answers[step.key] === option
                          ? "#06B6D4"
                          : "transparent",
                    }}
                    onPress={() => handleAnswer(step.key, option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color:
                          answers[step.key] === option ? "#ffffff" : (isDark ? "#ffffff" : "#1f2937"),
                        fontWeight: answers[step.key] === option ? "600" : "400",
                      }}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Avatar Picker */}
            {step.type === "avatar" && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {["👩‍🎓", "🧑‍🎓", "🎓"].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 3,
                      borderColor: answers[step.key] === emoji ? "#06B6D4" : (isDark ? "#334155" : "#e5e7eb"),
                      backgroundColor: answers[step.key] === emoji ? "#06B6D410" : (isDark ? "#1e293b" : "#ffffff"),
                    }}
                    onPress={() => handleAnswer(step.key, emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 40 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date Picker */}
            {step.type === "timepicker" && (
              <View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderWidth: 1,
                    borderColor: isDark ? "#334155" : "#e5e7eb",
                    padding: 16,
                    borderRadius: 12,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: answers[step.key] ? (isDark ? "#ffffff" : "#1f2937") : (isDark ? "#6b7280" : "#9ca3af"),
                    fontSize: 16,
                  }}>
                    {answers[step.key]
                      ? `📅 ${answers[step.key]}`
                      : "Select your exam date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={
                      answers[step.key]
                        ? new Date(answers[step.key])
                        : new Date()
                    }
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) handleAnswer(step.key, date.toDateString());
                    }}
                  />
                )}
              </View>
            )}

            {/* Passion Input */}
            {step.type === "passionSelect" && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {passionsList.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handleAnswer(step.key, p)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: answers[step.key] === p ? "#06B6D4" : (isDark ? "#1e293b" : "#ffffff"),
                      borderWidth: 1,
                      borderColor: answers[step.key] === p ? "#06B6D4" : (isDark ? "#334155" : "#e5e7eb"),
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: answers[step.key] === p ? "#ffffff" : (isDark ? "#ffffff" : "#1f2937"),
                        fontWeight: answers[step.key] === p ? "600" : "400",
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: "#06B6D4",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
            Save Changes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
