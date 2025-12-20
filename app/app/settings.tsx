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
  Globe,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { updateUser, deleteUserAccount } from "@/lib/api/user";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme } from "@/context/ThemeContext";
import { LanguageSelector } from "@/components/modals/LanguageSelector";
import { useTranslation } from "react-i18next";
import { availableLanguages, getCurrentLanguage } from "@/i18n/config";

export default function SettingsScreen() {
  const router = useRouter();
  const { token, setToken, user, setUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const currentLanguageData = availableLanguages.find((l) => l.code === currentLanguage);
  const currentLanguageName = currentLanguageData?.nativeName || 'English (US)';
  const currentLanguageFlag = currentLanguageData?.flag || '🇺🇸';

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
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: isDark ? "#000000" : "#ffffff",
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
            alignSelf: "flex-start",
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
          <Text style={{ color: isDark ? "#ffffff" : "#111827", fontWeight: "600", marginLeft: 8, fontSize: 16 }}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontSize: 28, fontWeight: "bold", color: isDark ? "#ffffff" : "#111827" }}>
          {t('common.settings')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Password Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            CHANGE PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            secureTextEntry
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
              color: isDark ? "#ffffff" : "#111827",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
            }}
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
          />
        </View>

        {/* Theme Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            APP THEME
          </Text>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
              borderRadius: 12,
              padding: 4,
            }}
          >
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setThemeMode(option.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: themeMode === option.value
                    ? (isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)")
                    : "transparent",
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: themeMode === option.value ? "#3b82f6" : (isDark ? "#6b7280" : "#9ca3af"),
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
                        backgroundColor: "#3b82f6",
                      }}
                    />
                  )}
                </View>
                <Text style={{
                  marginLeft: 12,
                  fontSize: 15,
                  fontWeight: themeMode === option.value ? "600" : "400",
                  color: isDark ? "#ffffff" : "#111827",
                }}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Language Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            {t('language.title').toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 32, marginRight: 12 }}>{currentLanguageFlag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  color: isDark ? "#9ca3af" : "#6b7280",
                  marginBottom: 4,
                }}>
                  {t('language.currentLanguage')}
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}>
                  {currentLanguageName}
                </Text>
              </View>
            </View>
            <Globe size={20} color={isDark ? "#6b7280" : "#9ca3af"} />
          </TouchableOpacity>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: "#3b82f6",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}>
            {t('common.save')}
          </Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <View style={{
          paddingTop: 24,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#EF4444",
            marginBottom: 12,
            letterSpacing: 0.5,
          }}>
            DANGER ZONE
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={{
              borderWidth: 1.5,
              borderColor: "#EF4444",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: "#EF4444", fontWeight: "600", fontSize: 15 }}>
              {t('common.delete')} Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        isDark={isDark}
      />

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
