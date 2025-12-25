import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Shield, X, Check, ChevronRight, Globe } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/components/ui/CustomToast";
import { BlockSchedule, getDefaultBlockedApps, getDefaultBlockedWebsites } from "@/lib/appBlocking";
import { POPULAR_WEBSITES } from "@/lib/blockingConstants";
import { SUGGESTED_SCHEDULES } from "./constants";
import { AppSelectionModal } from "./AppSelectionModal";

interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<BlockSchedule, "id" | "createdAt">) => void;
  isDark: boolean;
  editSchedule?: BlockSchedule | null;
  initialValues?: {
    name?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
  existingSchedules?: BlockSchedule[];
}

export const ScheduleModal = ({
  visible,
  onClose,
  onSave,
  isDark,
  editSchedule,
  initialValues,
  existingSchedules = [],
}: ScheduleModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'websites'>('apps');
  const nameInputRef = useRef<any>(null);

  // Load initial values or edit schedule when modal opens
  useEffect(() => {
    if (visible) {
      if (editSchedule) {
        setName(editSchedule.name);
        setSelectedApps(editSchedule.apps);
        setSelectedWebsites(editSchedule.websites || []);
        setStartTime(editSchedule.startTime);
        setEndTime(editSchedule.endTime);
        setSelectedDays(editSchedule.daysOfWeek);
      } else if (initialValues) {
        setName(initialValues.name || "");
        setStartTime(initialValues.startTime || "09:00");
        setEndTime(initialValues.endTime || "17:00");
        setSelectedDays(initialValues.daysOfWeek || [1, 2, 3, 4, 5]);
        loadDefaults();
      } else {
        loadDefaults();
      }
    }
  }, [visible, editSchedule, initialValues]);

  const loadDefaults = async () => {
    try {
      const [defaultApps, defaultWebsites] = await Promise.all([
        getDefaultBlockedApps(),
        getDefaultBlockedWebsites(),
      ]);
      if (selectedApps.length === 0) {
        setSelectedApps(defaultApps);
      }
      if (selectedWebsites.length === 0) {
        setSelectedWebsites(defaultWebsites);
      }
    } catch (error) {
      console.error('Error loading defaults:', error);
    }
  };

  const days = [
    { short: "S", full: t("days.sunday") || "Sunday" },
    { short: "M", full: t("days.monday") || "Monday" },
    { short: "T", full: t("days.tuesday") || "Tuesday" },
    { short: "W", full: t("days.wednesday") || "Wednesday" },
    { short: "T", full: t("days.thursday") || "Thursday" },
    { short: "F", full: t("days.friday") || "Friday" },
    { short: "S", full: t("days.saturday") || "Saturday" },
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleWebsite = (website: string) => {
    if (selectedWebsites.includes(website)) {
      setSelectedWebsites(selectedWebsites.filter((w) => w !== website));
    } else {
      setSelectedWebsites([...selectedWebsites, website]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showErrorToast(t("common.error"), t("blocking.alerts.enterScheduleName"));
      return;
    }
    // On iOS, apps are selected via native picker, so we check differently
    if (Platform.OS === "android") {
      if (selectedApps.length === 0 && selectedWebsites.length === 0) {
        showErrorToast(t("common.error"), t("blocking.alerts.selectAtLeastOneApp") || "Please select at least one app or website");
        return;
      }
    }
    // On iOS, we don't track selectedApps count since it uses native picker tokens
    if (selectedDays.length === 0) {
      showErrorToast(t("common.error"), t("blocking.alerts.selectAtLeastOneDay"));
      return;
    }

    onSave({
      name,
      apps: selectedApps,
      websites: Platform.OS === "android" ? selectedWebsites : [], // No website blocking on iOS
      startTime,
      endTime,
      daysOfWeek: selectedDays,
      isActive: true,
    });

    // Reset form
    setName("");
    setSelectedApps([]);
    setSelectedWebsites([]);
    setStartTime("09:00");
    setEndTime("17:00");
    setSelectedDays([1, 2, 3, 4, 5]);
    setActiveTab('apps');
    onClose();
  };

  // Filter available templates
  const usedTemplateNames = existingSchedules.map(s => s.name.toLowerCase());
  const availableTemplates = SUGGESTED_SCHEDULES.filter(template => {
    const templateName = (t(template.nameKey) || template.defaultName).toLowerCase();
    return !usedTemplateNames.some(usedName =>
      usedName.includes(templateName) || templateName.includes(usedName)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={{
              backgroundColor: isDark ? "#000000" : "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: 600,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                }}
              >
                {editSchedule
                  ? (t("blocking.modals.editSchedule") || "Edit Schedule")
                  : t("blocking.modals.newSchedule")}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
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
                <X size={20} color={isDark ? "#ffffff" : "#111827"} />
              </TouchableOpacity>
            </View>

            {/* Templates Section */}
            {!editSchedule && availableTemplates.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 10,
                  }}
                >
                  {t("blocking.modals.templates") || "TEMPLATES"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {availableTemplates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      onPress={() => {
                        setName(t(template.nameKey) || template.defaultName);
                        setStartTime(template.startTime);
                        setEndTime(template.endTime);
                        setSelectedDays(template.daysOfWeek);
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: isDark
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(59, 130, 246, 0.1)",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isDark
                          ? "rgba(59, 130, 246, 0.3)"
                          : "rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{template.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: "#3b82f6",
                        }}
                      >
                        {t(template.nameKey) || template.defaultName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Schedule Name */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
              }}
            >
              {t("blocking.modals.scheduleName")}
            </Text>
            <TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder={t("blocking.modals.scheduleNamePlaceholder")}
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                borderRadius: 12,
                padding: 16,
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              }}
            />

            {/* Apps & Websites Tabs - Hide websites tab on iOS */}
            {Platform.OS === "android" ? (
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 12,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                  borderRadius: 10,
                  padding: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveTab('apps')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: activeTab === 'apps'
                      ? isDark ? "#1f2937" : "#ffffff"
                      : "transparent",
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Shield size={16} color={activeTab === 'apps' ? "#3b82f6" : isDark ? "#9ca3af" : "#6b7280"} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: activeTab === 'apps'
                        ? "#3b82f6"
                        : isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {t("blocking.modals.apps") || "Apps"} ({selectedApps.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab('websites')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: activeTab === 'websites'
                      ? isDark ? "#1f2937" : "#ffffff"
                      : "transparent",
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Globe size={16} color={activeTab === 'websites' ? "#3b82f6" : isDark ? "#9ca3af" : "#6b7280"} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: activeTab === 'websites'
                        ? "#3b82f6"
                        : isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    {t("blocking.modals.websites") || "Websites"} ({selectedWebsites.length})
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Apps Selection - Always show on iOS, tab-based on Android */}
            {(Platform.OS === "ios" || activeTab === 'apps') && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  {t("blocking.modals.appsToBlock")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAppSelection(true)}
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#ffffff" : "#111827",
                      fontSize: 16,
                    }}
                  >
                    {Platform.OS === "ios"
                      ? (t("blocking.modals.selectAppsIOS") || "Tap to select apps to block")
                      : selectedApps.length > 0
                        ? t("blocking.modals.appsSelected", {
                            count: selectedApps.length,
                          })
                        : t("blocking.modals.selectAppsPlaceholder")}
                  </Text>
                  <ChevronRight size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                </TouchableOpacity>
              </>
            )}

            {/* Websites Selection - Android only */}
            {Platform.OS === "android" && activeTab === 'websites' && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  {t("blocking.modals.websitesToBlock") || "Websites to Block"}
                </Text>
                <View
                  style={{
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    maxHeight: 200,
                  }}
                >
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {POPULAR_WEBSITES.map((website) => (
                      <TouchableOpacity
                        key={website.id}
                        onPress={() => toggleWebsite(website.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          paddingHorizontal: 8,
                          backgroundColor: selectedWebsites.includes(website.id)
                            ? isDark
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(59, 130, 246, 0.1)"
                            : "transparent",
                          borderRadius: 8,
                          marginBottom: 4,
                        }}
                      >
                        {website.icon ? (
                          <Image
                            source={website.icon}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              marginRight: 12,
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: isDark ? "#374151" : "#e5e7eb",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <Globe size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
                          </View>
                        )}
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 14,
                            fontWeight: "500",
                            color: isDark ? "#ffffff" : "#111827",
                          }}
                        >
                          {website.name}
                        </Text>
                        {selectedWebsites.includes(website.id) && (
                          <Check size={18} color="#3b82f6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Time Range */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  {t("blocking.modals.startTime")}
                </Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f9fafb",
                    borderRadius: 12,
                    padding: 16,
                    color: isDark ? "#ffffff" : "#111827",
                    textAlign: "center",
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  {t("blocking.modals.endTime")}
                </Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f9fafb",
                    borderRadius: 12,
                    padding: 16,
                    color: isDark ? "#ffffff" : "#111827",
                    textAlign: "center",
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  }}
                />
              </View>
            </View>

            {/* Days */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 8,
              }}
            >
              {t("blocking.modals.repeatOn")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: selectedDays.includes(index)
                      ? "#3b82f6"
                      : isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "#f9fafb",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: selectedDays.includes(index)
                      ? "#3b82f6"
                      : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: selectedDays.includes(index)
                        ? "#ffffff"
                        : isDark
                          ? "#9ca3af"
                          : "#6b7280",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: "#3b82f6",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
                {t("blocking.modals.saveSchedule")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <AppSelectionModal
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onSelect={setSelectedApps}
        selectedApps={selectedApps}
        isDark={isDark}
      />
    </Modal>
  );
};
