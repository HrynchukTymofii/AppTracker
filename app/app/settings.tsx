import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Key,
  Sun,
  Moon,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { updateUser, deleteUserAccount } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { token, setToken, user, setUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { themeMode, setThemeMode } = useTheme();

  const themeOptions: {
    label: string;
    value: "light" | "dark" | "system";
    icon: typeof Sun;
  }[] = [
    { label: "System Default", value: "system", icon: Sun },
    { label: "Light", value: "light", icon: Sun },
    { label: "Dark", value: "dark", icon: Moon },
  ];

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.replace("/");
    Toast.show({
      type: "success",
      text1: "Account deleted",
      position: "top",
      visibilityTime: 700,
    });
  };

  const handleSave = async () => {
    if (!token) return alert("User not authorized");
    const result = await updateUser(token, { password });
    if (result.success) {
      if (user) setUser({ ...user });
      router.back();
      Toast.show({
        type: "success",
        text1: "Profile updated",
        position: "top",
        visibilityTime: 700,
      });
    } else alert(result.error);
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
          Settings
        </Text>
        <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Manage your account preferences
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Password Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Key size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 8,
                color: isDark ? "#ffffff" : "#1f2937",
              }}
            >
              Change Password
            </Text>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            secureTextEntry
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
        </View>

        {/* Theme Section */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Sun size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 8,
                color: isDark ? "#ffffff" : "#1f2937",
              }}
            >
              App Theme
            </Text>
          </View>
          <View
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e5e7eb",
            }}
          >
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setThemeMode(option.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: themeMode === option.value ? "#06B6D4" : (isDark ? "#6b7280" : "#9ca3af"),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {themeMode === option.value && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#06B6D4",
                      }}
                    />
                  )}
                </View>
                <Text style={{
                  marginLeft: 12,
                  fontSize: 16,
                  color: isDark ? "#ffffff" : "#1f2937",
                }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: "#06B6D4",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
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

        {/* Danger Zone */}
        <View style={{
          borderTopWidth: 1,
          borderTopColor: isDark ? "#334155" : "#e5e7eb",
          paddingTop: 24,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#EF4444",
            marginBottom: 12,
          }}>
            Danger Zone
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={{
              borderWidth: 2,
              borderColor: "#EF4444",
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 16 }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="slide" transparent>
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          paddingHorizontal: 24,
        }}>
          <View
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 16,
                color: "#EF4444",
              }}
            >
              Confirm Deletion
            </Text>
            <Text style={{
              fontSize: 16,
              marginBottom: 12,
              color: isDark ? "#ffffff" : "#1f2937",
            }}>
              This action is irreversible. To confirm, type{" "}
              <Text style={{ fontWeight: "bold" }}>Delete</Text> below:
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type Delete"
              style={{
                backgroundColor: isDark ? "#0f172a" : "#f9fafb",
                color: isDark ? "#ffffff" : "#1f2937",
                borderColor: isDark ? "#334155" : "#e5e7eb",
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                marginBottom: 16,
              }}
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#334155" : "#e5e7eb",
                  alignItems: "center",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: isDark ? "#ffffff" : "#1f2937", fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (confirmText !== "Delete") {
                    Alert.alert("Error", "Type 'Delete' to confirm.");
                    return;
                  }
                  if (!token) return alert("User not authorized");

                  setIsDeleting(true);
                  const result = await deleteUserAccount(token);
                  setIsDeleting(false);

                  if (result.success) {
                    setShowDeleteModal(false);
                    handleLogout();
                  } else {
                    alert(result.error || "Failed to delete account");
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#ffffff", fontWeight: "600" }}>
                  {isDeleting ? "Deleting..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
