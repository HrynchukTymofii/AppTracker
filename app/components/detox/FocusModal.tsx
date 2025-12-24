import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { showErrorToast } from "@/components/ui/CustomToast";
import { Lock, ChevronRight, Camera, Target } from "lucide-react-native";
import { PRESET_TASKS } from "@/lib/taskVerification";
import * as ImagePicker from "expo-image-picker";
import { AppSelectionModal } from "./AppSelectionModal";

interface FocusModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (
    duration: number,
    apps: string[],
    requiresTask: boolean,
    beforePhoto?: string,
    taskDescription?: string
  ) => void;
  isDark: boolean;
}

export const FocusModal = ({
  visible,
  onClose,
  onStart,
  isDark,
}: FocusModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(30);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [requiresTask, setRequiresTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(PRESET_TASKS[0]);
  const [customTaskDescription, setCustomTaskDescription] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [showAppSelection, setShowAppSelection] = useState(false);

  const durations = [15, 30, 45, 60, 90, 120];

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBeforePhoto(result.assets[0].uri);
      }
    }
  };

  const handleStart = () => {
    if (selectedApps.length === 0) {
      showErrorToast(t('common.error'), t('blocking.alerts.selectAtLeastOneAppToBlock'));
      return;
    }

    if (requiresTask && !beforePhoto) {
      showErrorToast(t('common.error'), t('blocking.alerts.takeBeforePhoto'));
      return;
    }

    const taskDesc =
      selectedTask.id === 'custom' ? customTaskDescription : selectedTask.description;

    onStart(duration, selectedApps, requiresTask, beforePhoto || undefined, taskDesc);
    onClose();

    // Reset form
    setBeforePhoto(null);
    setRequiresTask(false);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Target size={40} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Focus Session
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
              }}
            >
              Block distractions and get things done
            </Text>
          </View>

          {/* Duration Selection */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: isDark ? '#9ca3af' : '#6b7280',
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Duration
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDuration(d)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor:
                      duration === d
                        ? '#ef4444'
                        : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)',
                    borderWidth: duration === d ? 0 : 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      color: duration === d ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                      fontWeight: '600',
                      fontSize: 15,
                    }}
                  >
                    {d}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Apps to Block */}
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Lock size={22} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 4,
                  }}
                >
                  Apps to Block
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedApps.length > 0 ? '#ef4444' : isDark ? '#6b7280' : '#9ca3af',
                    fontWeight: selectedApps.length > 0 ? '600' : '400',
                  }}
                >
                  {selectedApps.length > 0
                    ? `${selectedApps.length} apps selected`
                    : 'Tap to select...'}
                </Text>
              </View>
            </View>
            <ChevronRight size={22} color={isDark ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>

          {/* Task Verification Toggle */}
          <View
            style={{
              backgroundColor: requiresTask
                ? isDark
                  ? 'rgba(59,130,246,0.1)'
                  : 'rgba(59,130,246,0.05)'
                : isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.03)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: requiresTask
                ? '#3b82f6'
                : isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Camera size={22} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: isDark ? '#ffffff' : '#111827',
                      marginBottom: 4,
                    }}
                  >
                    Task Verification
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#6b7280' : '#9ca3af',
                    }}
                  >
                    Prove you did something productive
                  </Text>
                </View>
              </View>
              <Switch
                value={requiresTask}
                onValueChange={setRequiresTask}
                trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Task Selection (if required) */}
          {requiresTask && (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 14,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Select Task
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16, marginHorizontal: -4 }}
                contentContainerStyle={{ paddingHorizontal: 4 }}
              >
                {PRESET_TASKS.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => setSelectedTask(task)}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor:
                        selectedTask.id === task.id
                          ? '#3b82f6'
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      marginRight: 10,
                      alignItems: 'center',
                      minWidth: 85,
                      borderWidth: selectedTask.id === task.id ? 0 : 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{task.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          selectedTask.id === task.id
                            ? '#ffffff'
                            : isDark
                            ? '#ffffff'
                            : '#111827',
                        fontWeight: '600',
                      }}
                    >
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedTask.id === 'custom' && (
                <TextInput
                  value={customTaskDescription}
                  onChangeText={setCustomTaskDescription}
                  placeholder="Describe your task..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  multiline
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                    borderRadius: 14,
                    padding: 16,
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 16,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }}
                />
              )}

              {/* Before Photo */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Before Photo
              </Text>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: beforePhoto
                    ? 'transparent'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#ffffff',
                  borderRadius: 16,
                  padding: beforePhoto ? 0 : 28,
                  alignItems: 'center',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: beforePhoto
                    ? '#10b981'
                    : isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                {beforePhoto ? (
                  <Image
                    source={{ uri: beforePhoto }}
                    style={{ width: '100%', height: 180, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Camera size={28} color="#3b82f6" />
                    </View>
                    <Text
                      style={{
                        color: isDark ? '#ffffff' : '#111827',
                        fontSize: 15,
                        fontWeight: '600',
                      }}
                    >
                      Tap to take photo
                    </Text>
                    <Text
                      style={{
                        color: isDark ? '#6b7280' : '#9ca3af',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Show your starting point
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 20 }} />

          {/* Start Button */}
          <TouchableOpacity
            onPress={handleStart}
            style={{
              backgroundColor: '#ef4444',
              padding: 18,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Lock size={22} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700' }}>
              Start Focus ({duration} min)
            </Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text
              style={{
                color: isDark ? '#9ca3af' : '#6b7280',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
