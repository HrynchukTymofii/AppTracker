import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Key,
  Sun,
  Moon,
  Globe,
  Palette,
  Check,
  Smartphone,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { updateUser, deleteUserAccount } from "@/lib/api/user";
import { showErrorToast, showSuccessToast } from "@/components/ui/CustomToast";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTheme, ACCENT_COLORS, AccentColorName } from "@/context/ThemeContext";
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
  const { themeMode, setThemeMode, accentColor, accentColorName, setAccentColor } = useTheme();
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
    { label: "System Default", value: "system", icon: Smartphone },
    { label: "Light", value: "light", icon: Sun },
    { label: "Dark", value: "dark", icon: Moon },
  ];

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.replace("/");
    showSuccessToast("Account deleted");
  };

  const handleSave = async () => {
    if (!token) {
      showErrorToast(t("common.error"), "User not authorized");
      return;
    }
    const result = await updateUser(token, { password });
    if (result.success) {
      if (user) setUser({ ...user });
      router.back();
      showSuccessToast("Profile updated");
    } else {
      showErrorToast(t("common.error"), result.error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#f8fafc" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderWidth: 0.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <ArrowLeft size={22} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={1.5} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{
          fontSize: 32,
          fontWeight: "800",
          color: isDark ? "#ffffff" : "#0f172a",
          letterSpacing: -0.5,
        }}>
          {t('common.settings')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Accent Color Section */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[accentColor.primary, accentColor.dark]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              <Palette size={16} color="#ffffff" strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              Accent Color
            </Text>
          </View>

          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 20,
              padding: 16,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.03,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {(Object.keys(ACCENT_COLORS) as AccentColorName[]).map((colorName) => {
                const color = ACCENT_COLORS[colorName];
                const isSelected = accentColorName === colorName;

                return (
                  <TouchableOpacity
                    key={colorName}
                    onPress={() => setAccentColor(colorName)}
                    activeOpacity={0.7}
                    style={{
                      width: 64,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isDark ? "#ffffff" : "#0f172a",
                        shadowColor: color.primary,
                        shadowOffset: { width: 0, height: isSelected ? 6 : 2 },
                        shadowOpacity: isSelected ? 0.4 : 0.2,
                        shadowRadius: isSelected ? 12 : 6,
                        elevation: isSelected ? 8 : 3,
                      }}
                    >
                      <LinearGradient
                        colors={[color.primary, color.dark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected && (
                          <Check size={22} color="#ffffff" strokeWidth={3} />
                        )}
                      </LinearGradient>
                    </View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected
                          ? color.primary
                          : (isDark ? "rgba(255,255,255,0.6)" : "#64748b"),
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      {color.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Theme Mode Section */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              {isDark ? (
                <Moon size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={2} />
              ) : (
                <Sun size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={2} />
              )}
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              Appearance
            </Text>
          </View>

          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 20,
              padding: 6,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.03,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            {themeOptions.map((option) => {
              const isSelected = themeMode === option.value;
              const IconComponent = option.icon;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setThemeMode(option.value)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 14,
                    backgroundColor: isSelected
                      ? `rgba(${accentColor.rgb}, ${isDark ? 0.15 : 0.1})`
                      : "transparent",
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? `rgba(${accentColor.rgb}, 0.2)`
                        : (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? accentColor.primary : (isDark ? "rgba(255,255,255,0.5)" : "#94a3b8")}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? accentColor.primary : (isDark ? "#ffffff" : "#0f172a"),
                  }}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LinearGradient
                        colors={[accentColor.primary, accentColor.dark]}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      />
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Language Section */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Globe size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              {t('language.title')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 18,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.03,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 32, marginRight: 14 }}>{currentLanguageFlag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
                  marginBottom: 4,
                }}>
                  {t('language.currentLanguage')}
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#0f172a",
                }}>
                  {currentLanguageName}
                </Text>
              </View>
            </View>
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
              <Globe size={18} color={isDark ? "rgba(255,255,255,0.4)" : "#94a3b8"} strokeWidth={1.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Password Section */}
        <View style={{ marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Key size={16} color={isDark ? "#ffffff" : "#0f172a"} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              Change Password
            </Text>
          </View>

          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
              borderRadius: 18,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0 : 0.03,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              secureTextEntry
              style={{
                color: isDark ? "#ffffff" : "#0f172a",
                paddingHorizontal: 18,
                paddingVertical: 16,
                fontSize: 16,
              }}
              placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"}
            />
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={{
            borderRadius: 18,
            paddingVertical: 18,
            alignItems: "center",
            marginBottom: 28,
            overflow: "hidden",
            shadowColor: accentColor.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={[accentColor.primary, accentColor.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 17, letterSpacing: 0.3 }}>
            {t('common.save')}
          </Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <View style={{ marginTop: 12 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#ef4444",
            marginBottom: 14,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            Danger Zone
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
            style={{
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 0.5,
              borderColor: "rgba(239, 68, 68, 0.3)",
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={isDark
                ? ["rgba(239, 68, 68, 0.12)", "rgba(239, 68, 68, 0.06)"]
                : ["rgba(239, 68, 68, 0.08)", "rgba(239, 68, 68, 0.04)"]
              }
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 16 }}>
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
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          paddingHorizontal: 24,
        }}>
          <View
            style={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderRadius: 24,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              borderWidth: 0.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 12,
                color: "#ef4444",
                letterSpacing: -0.3,
              }}
            >
              Delete Account
            </Text>
            <Text style={{
              fontSize: 15,
              marginBottom: 20,
              color: isDark ? "rgba(255,255,255,0.7)" : "#64748b",
              lineHeight: 22,
            }}>
              This action is irreversible. Type{" "}
              <Text style={{ fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>Delete</Text> to confirm:
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="Type Delete"
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                color: isDark ? "#ffffff" : "#0f172a",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                borderWidth: 0.5,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 14,
                fontSize: 16,
                marginBottom: 20,
              }}
              placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: isDark ? "#ffffff" : "#0f172a", fontWeight: "600", fontSize: 15 }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (confirmText !== "Delete") {
                    showErrorToast(t("common.error"), "Type 'Delete' to confirm.");
                    return;
                  }
                  if (!token) {
                    showErrorToast(t("common.error"), "User not authorized");
                    return;
                  }

                  setIsDeleting(true);
                  const result = await deleteUserAccount(token);
                  setIsDeleting(false);

                  if (result.success) {
                    setShowDeleteModal(false);
                    handleLogout();
                  } else {
                    showErrorToast(t("common.error"), result.error || "Failed to delete account");
                  }
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
