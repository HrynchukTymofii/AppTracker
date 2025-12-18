import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Plus,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  X,
  Camera,
  Check,
  Lock,
  Unlock,
  Settings,
  Timer,
  Trash2,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBlocking } from '@/context/BlockingContext';
import { BlockSchedule, POPULAR_APPS } from '@/lib/appBlocking';
import { PRESET_TASKS, setOpenAIApiKey, getOpenAIApiKey } from '@/lib/taskVerification';
import * as ImagePicker from 'expo-image-picker';

// App Selection Modal Component
const AppSelectionModal = ({
  visible,
  onClose,
  onSelect,
  selectedApps,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (apps: string[]) => void;
  selectedApps: string[];
  isDark: boolean;
}) => {
  const [selected, setSelected] = useState<string[]>(selectedApps);

  const toggleApp = (packageName: string) => {
    if (selected.includes(packageName)) {
      setSelected(selected.filter((p) => p !== packageName));
    } else {
      setSelected([...selected, packageName]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Select Apps to Block
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            {POPULAR_APPS.map((app) => (
              <TouchableOpacity
                key={app.packageName}
                onPress={() => toggleApp(app.packageName)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: selected.includes(app.packageName)
                    ? isDark
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(59, 130, 246, 0.1)'
                    : 'transparent',
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {app.appName.charAt(0)}
                  </Text>
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '500',
                    color: isDark ? '#ffffff' : '#111827',
                  }}
                >
                  {app.appName}
                </Text>
                {selected.includes(app.packageName) && (
                  <Check size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              onSelect(selected);
              onClose();
            }}
            style={{
              backgroundColor: '#3b82f6',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Confirm Selection ({selected.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Schedule Creation Modal
const ScheduleModal = ({
  visible,
  onClose,
  onSave,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<BlockSchedule, 'id' | 'createdAt'>) => void;
  isDark: boolean;
}) => {
  const [name, setName] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showAppSelection, setShowAppSelection] = useState(false);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a schedule name');
      return;
    }
    if (selectedApps.length === 0) {
      Alert.alert('Error', 'Please select at least one app');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    onSave({
      name,
      apps: selectedApps,
      startTime,
      endTime,
      daysOfWeek: selectedDays,
      isActive: true,
    });

    // Reset form
    setName('');
    setSelectedApps([]);
    setStartTime('09:00');
    setEndTime('17:00');
    setSelectedDays([1, 2, 3, 4, 5]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              New Schedule
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* Schedule Name */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
            }}
          >
            SCHEDULE NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Work Hours"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 20,
            }}
          />

          {/* Apps to Block */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
            }}
          >
            APPS TO BLOCK
          </Text>
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: isDark ? '#ffffff' : '#111827' }}>
              {selectedApps.length > 0
                ? `${selectedApps.length} apps selected`
                : 'Select apps...'}
            </Text>
            <ChevronRight size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>

          {/* Time Range */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 8,
                }}
              >
                START TIME
              </Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                style={{
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  borderRadius: 12,
                  padding: 16,
                  color: isDark ? '#ffffff' : '#111827',
                  textAlign: 'center',
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 8,
                }}
              >
                END TIME
              </Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                style={{
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  borderRadius: 12,
                  padding: 16,
                  color: isDark ? '#ffffff' : '#111827',
                  textAlign: 'center',
                }}
              />
            </View>
          </View>

          {/* Days */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
            }}
          >
            REPEAT ON
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => toggleDay(index)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: selectedDays.includes(index)
                    ? '#3b82f6'
                    : isDark
                    ? '#374151'
                    : '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: selectedDays.includes(index)
                      ? '#ffffff'
                      : isDark
                      ? '#9ca3af'
                      : '#6b7280',
                    fontWeight: '600',
                  }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: '#3b82f6',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Save Schedule
            </Text>
          </TouchableOpacity>
        </View>
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

// Focus Session Modal
const FocusModal = ({
  visible,
  onClose,
  onStart,
  isDark,
}: {
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
}) => {
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
      Alert.alert('Error', 'Please select at least one app to block');
      return;
    }

    if (requiresTask && !beforePhoto) {
      Alert.alert('Error', 'Please take a "before" photo for task verification');
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
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <ScrollView
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
          }}
          contentContainerStyle={{ padding: 20 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Start Focus Session
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* Duration Selection */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 12,
            }}
          >
            DURATION (MINUTES)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {durations.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor:
                    duration === d
                      ? '#3b82f6'
                      : isDark
                      ? '#374151'
                      : '#f3f4f6',
                }}
              >
                <Text
                  style={{
                    color: duration === d ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                    fontWeight: '600',
                  }}
                >
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Apps to Block */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
            }}
          >
            APPS TO BLOCK
          </Text>
          <TouchableOpacity
            onPress={() => setShowAppSelection(true)}
            style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: isDark ? '#ffffff' : '#111827' }}>
              {selectedApps.length > 0
                ? `${selectedApps.length} apps selected`
                : 'Select apps...'}
            </Text>
            <ChevronRight size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>

          {/* Task Verification Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: isDark ? '#ffffff' : '#111827',
                }}
              >
                Require Task Completion
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginTop: 4,
                }}
              >
                Unlock only after completing a real task
              </Text>
            </View>
            <Switch
              value={requiresTask}
              onValueChange={setRequiresTask}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
            />
          </View>

          {/* Task Selection (if required) */}
          {requiresTask && (
            <>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 12,
                }}
              >
                SELECT TASK
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
              >
                {PRESET_TASKS.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => setSelectedTask(task)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor:
                        selectedTask.id === task.id
                          ? '#3b82f6'
                          : isDark
                          ? '#374151'
                          : '#f3f4f6',
                      marginRight: 8,
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{task.icon}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color:
                          selectedTask.id === task.id
                            ? '#ffffff'
                            : isDark
                            ? '#ffffff'
                            : '#111827',
                        fontWeight: '500',
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
                    backgroundColor: isDark ? '#374151' : '#f3f4f6',
                    borderRadius: 12,
                    padding: 16,
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 16,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                />
              )}

              {/* Before Photo */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 8,
                }}
              >
                TAKE "BEFORE" PHOTO
              </Text>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  borderRadius: 12,
                  padding: 24,
                  alignItems: 'center',
                  marginBottom: 20,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: isDark ? '#4b5563' : '#d1d5db',
                }}
              >
                {beforePhoto ? (
                  <Image
                    source={{ uri: beforePhoto }}
                    style={{ width: 120, height: 120, borderRadius: 8 }}
                  />
                ) : (
                  <>
                    <Camera size={32} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text
                      style={{
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 8,
                      }}
                    >
                      Tap to take photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Start Button */}
          <TouchableOpacity
            onPress={handleStart}
            style={{
              backgroundColor: '#ef4444',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <Lock size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Start Focus ({duration} minutes)
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

// Settings Modal
const SettingsModal = ({
  visible,
  onClose,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    const loadKey = async () => {
      const key = await getOpenAIApiKey();
      if (key) {
        setSavedKey(key);
        setApiKey(key);
      }
    };
    if (visible) loadKey();
  }, [visible]);

  const handleSave = async () => {
    if (apiKey.trim()) {
      await setOpenAIApiKey(apiKey.trim());
      setSavedKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 24,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Settings
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: isDark ? '#9ca3af' : '#6b7280',
              marginBottom: 8,
            }}
          >
            OPENAI API KEY (for task verification)
          </Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            secureTextEntry
            style={{
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              borderRadius: 12,
              padding: 16,
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 12,
            }}
          />
          {savedKey && (
            <Text
              style={{
                fontSize: 12,
                color: '#22c55e',
                marginBottom: 12,
              }}
            >
              API key is saved
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: '#3b82f6',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Save Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function BlockingPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    blockedApps,
    schedules,
    focusSession,
    addBlockedApp,
    removeBlockedApp,
    addSchedule,
    editSchedule,
    removeSchedule,
    startFocus,
    endFocus,
    cancelFocus,
    isLoading,
  } = useBlocking();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAppSelection, setShowAppSelection] = useState(false);

  // Calculate remaining time for focus session
  const getFocusTimeRemaining = () => {
    if (!focusSession) return null;
    const endTime = focusSession.startTime + focusSession.durationMinutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEndFocus = async () => {
    if (focusSession?.requiresTaskCompletion) {
      // Need to take "after" photo
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.granted) {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          try {
            const verificationResult = await endFocus(result.assets[0].uri);
            if (verificationResult) {
              if (verificationResult.isTaskCompleted) {
                Alert.alert(
                  'Task Verified!',
                  `Your task was verified successfully.\n\nConfidence: ${verificationResult.confidence}%\n\n${verificationResult.explanation}`
                );
              } else {
                Alert.alert(
                  'Task Not Verified',
                  `The task doesn't appear to be completed.\n\n${verificationResult.explanation}\n\nPlease complete the task and try again.`
                );
              }
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to verify task');
          }
        }
      }
    } else {
      await endFocus();
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#111827',
            }}
          >
            Blocking
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettingsModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={22} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>
        </View>

        {/* Active Focus Session Banner */}
        {focusSession && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: '#ef4444',
              borderRadius: 16,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Lock size={24} color="#ffffff" />
              <Text
                style={{
                  marginLeft: 12,
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                Focus Session Active
              </Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
              {focusSession.blockedApps.length} apps blocked •{' '}
              {focusSession.requiresTaskCompletion
                ? 'Task required to unlock'
                : `${getFocusTimeRemaining()} remaining`}
            </Text>
            <TouchableOpacity
              onPress={handleEndFocus}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                {focusSession.requiresTaskCompletion ? 'Complete Task & Unlock' : 'End Session'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDark ? '#ffffff' : '#111827',
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowFocusModal(true)}
              disabled={!!focusSession}
              style={{
                flex: 1,
                backgroundColor: focusSession
                  ? isDark
                    ? '#374151'
                    : '#e5e7eb'
                  : '#ef4444',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Target size={28} color={focusSession ? '#9ca3af' : '#ffffff'} />
              <Text
                style={{
                  marginTop: 8,
                  fontWeight: '600',
                  color: focusSession ? '#9ca3af' : '#ffffff',
                }}
              >
                Start Focus
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowScheduleModal(true)}
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Calendar size={28} color={isDark ? '#ffffff' : '#111827'} />
              <Text
                style={{
                  marginTop: 8,
                  fontWeight: '600',
                  color: isDark ? '#ffffff' : '#111827',
                }}
              >
                New Schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedules */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Schedules
            </Text>
          </View>

          {schedules.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Calendar size={32} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text
                style={{
                  marginTop: 12,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  textAlign: 'center',
                }}
              >
                No schedules yet.{'\n'}Create one to automatically block apps.
              </Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <View
                key={schedule.id}
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#111827',
                      }}
                    >
                      {schedule.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 4,
                      }}
                    >
                      {schedule.startTime} - {schedule.endTime} • {schedule.apps.length} apps
                    </Text>
                  </View>
                  <Switch
                    value={schedule.isActive}
                    onValueChange={(value) => editSchedule(schedule.id, { isActive: value })}
                    trackColor={{ false: '#767577', true: '#3b82f6' }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Schedule',
                      'Are you sure you want to delete this schedule?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => removeSchedule(schedule.id),
                        },
                      ]
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text style={{ color: '#ef4444', marginLeft: 8, fontSize: 14 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Blocked Apps */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
            >
              Blocked Apps
            </Text>
            <TouchableOpacity
              onPress={() => setShowAppSelection(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Plus size={16} color={isDark ? '#ffffff' : '#111827'} />
              <Text
                style={{
                  marginLeft: 4,
                  color: isDark ? '#ffffff' : '#111827',
                  fontWeight: '500',
                }}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {blockedApps.filter((a) => a.isBlocked).length === 0 ? (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Shield size={32} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text
                style={{
                  marginTop: 12,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  textAlign: 'center',
                }}
              >
                No apps blocked.{'\n'}Add apps to start blocking.
              </Text>
            </View>
          ) : (
            blockedApps
              .filter((a) => a.isBlocked)
              .map((app) => (
                <View
                  key={app.packageName}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: isDark ? '#374151' : '#e5e7eb',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{app.appName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#111827',
                      }}
                    >
                      {app.appName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      {app.blockType === 'manual'
                        ? 'Manually blocked'
                        : app.blockType === 'scheduled'
                        ? 'Scheduled block'
                        : app.blockType === 'focus'
                        ? 'Focus session'
                        : app.blockType === 'task'
                        ? 'Task required'
                        : 'Daily limit'}
                    </Text>
                  </View>
                  {app.blockType === 'manual' && (
                    <TouchableOpacity onPress={() => removeBlockedApp(app.packageName)}>
                      <Unlock size={20} color="#22c55e" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={addSchedule}
        isDark={isDark}
      />

      <FocusModal
        visible={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        onStart={startFocus}
        isDark={isDark}
      />

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isDark={isDark}
      />

      <AppSelectionModal
        visible={showAppSelection}
        onClose={() => setShowAppSelection(false)}
        onSelect={async (apps) => {
          for (const packageName of apps) {
            const appInfo = POPULAR_APPS.find((a) => a.packageName === packageName);
            if (appInfo && !blockedApps.some((a) => a.packageName === packageName)) {
              await addBlockedApp(packageName, appInfo.appName);
            }
          }
        }}
        selectedApps={blockedApps.filter((a) => a.isBlocked).map((a) => a.packageName)}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}
