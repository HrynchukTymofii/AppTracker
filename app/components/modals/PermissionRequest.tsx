import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { BarChart3, Shield, TrendingUp, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { openUsageStatsSettings } from '@/modules/usage-stats';

interface PermissionRequestProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const PermissionRequest = ({ visible, onClose, isDark }: PermissionRequestProps) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: BarChart3,
      title: 'Track Your Usage',
      description: 'See which apps you use most and for how long',
      color: '#3b82f6',
    },
    {
      icon: TrendingUp,
      title: 'Monitor Progress',
      description: 'Track your digital wellness journey over time',
      color: '#10b981',
    },
    {
      icon: Shield,
      title: 'Stay Focused',
      description: 'Block distracting apps and improve productivity',
      color: '#8b5cf6',
    },
  ];

  const handleGrantPermission = () => {
    openUsageStatsSettings();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 60,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* App Logo/Icon */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 48 }}>🔒</Text>
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Welcome to LockIn
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                lineHeight: 24,
              }}
            >
              Take control of your digital life
            </Text>
          </View>

          {/* Permission Request */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 32,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.15)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#3b82f6' + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Settings size={24} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: 4,
                  }}
                >
                  Permission Required
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#9ca3af' : '#6b7280',
                  }}
                >
                  Needed to track your app usage
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#d1d5db' : '#4b5563',
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              LockIn needs access to your usage data to show you insights about your screen time and help you stay focused. This data stays on your device and is never shared.
            </Text>

            <View
              style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Shield size={18} color="#3b82f6" style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontSize: 12,
                  color: '#3b82f6',
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Your privacy is protected. Data never leaves your device.
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
                marginBottom: 16,
              }}
            >
              What you can do with LockIn:
            </Text>

            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: feature.color + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Icon size={20} color={feature.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isDark ? '#ffffff' : '#111827',
                        marginBottom: 4,
                      }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        lineHeight: 18,
                      }}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: 20 }} />

          {/* Buttons */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleGrantPermission}
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 17,
                  fontWeight: '700',
                }}
              >
                Grant Permission
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkip}
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: isDark ? '#9ca3af' : '#6b7280',
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                Skip for Now
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 11,
                color: isDark ? '#6b7280' : '#9ca3af',
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 16,
              }}
            >
              You can enable this permission later in Settings
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
