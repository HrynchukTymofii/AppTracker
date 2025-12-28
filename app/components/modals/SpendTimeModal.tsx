import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Shield, Clock, Dumbbell, X, Play, Lock, Calendar } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { getLocalIcon } from '@/lib/appIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

interface SpendTimeModalProps {
  visible: boolean;
  appName: string;
  packageName?: string;
  dailyLimitMinutes: number;
  isScheduleFreeTime: boolean;
  onClose: () => void;
  onSpend: (minutes: number) => void;
  onEarnTime: () => void;
}

const TIME_OPTIONS = [5, 10, 15, 30];

export const SpendTimeModal = ({
  visible,
  appName,
  packageName,
  dailyLimitMinutes,
  isScheduleFreeTime,
  onClose,
  onSpend,
  onEarnTime,
}: SpendTimeModalProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { wallet, canUseApp, getRemainingLimit } = useEarnedTime();

  const [selectedMinutes, setSelectedMinutes] = useState(15);

  const appIcon = packageName ? getLocalIcon(packageName, appName) : null;
  const remainingLimit = getRemainingLimit(packageName || '', dailyLimitMinutes);
  const { canUse, reason, availableMinutes } = canUseApp(packageName || '', dailyLimitMinutes);

  // Calculate max usable time (minimum of remaining limit and available balance)
  const maxUsableTime = isScheduleFreeTime
    ? remainingLimit
    : Math.min(remainingLimit, availableMinutes);

  const handleSpend = () => {
    const actualMinutes = Math.min(selectedMinutes, maxUsableTime);
    if (actualMinutes > 0) {
      onSpend(actualMinutes);
    }
  };

  if (!visible) return null;

  // If during free schedule time and has remaining limit
  if (isScheduleFreeTime && remainingLimit > 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 40,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>

          {/* App Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            {appIcon ? (
              <Image source={appIcon} style={{ width: 56, height: 56 }} />
            ) : (
              <Shield size={32} color={isDark ? '#ffffff' : '#111827'} />
            )}
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#ffffff' : '#111827',
              textAlign: 'center',
            }}
          >
            {appName}
          </Text>
        </View>

        {/* Free Time Banner */}
        <View style={{ paddingHorizontal: 20, flex: 1, justifyContent: 'center' }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#10b981',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#10b981',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Calendar size={32} color="#ffffff" />
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#10b981',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Free Time Active
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              You're in a scheduled free period. Use the app without spending earned time!
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 16,
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <Clock size={16} color={isDark ? '#d1d5db' : '#374151'} />
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#d1d5db' : '#374151',
                  marginLeft: 8,
                  fontWeight: '600',
                }}
              >
                {remainingLimit} min remaining today
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onSpend(Math.min(30, remainingLimit))}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#10b981',
              borderRadius: 16,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Play size={22} color="#ffffff" fill="#ffffff" />
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: '#ffffff',
                marginLeft: 10,
              }}
            >
              Open {appName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If limit reached
  if (reason === 'limit_reached') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 40,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>

          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Lock size={40} color="#ef4444" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#ef4444',
              textAlign: 'center',
            }}
          >
            Daily Limit Reached
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#9ca3af' : '#6b7280',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            You've used your {dailyLimitMinutes} min limit for {appName} today
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#d1d5db' : '#4b5563',
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Your daily limit helps you maintain healthy habits. Come back tomorrow for a fresh start!
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: isDark ? '#d1d5db' : '#374151',
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If no balance
  if (reason === 'no_balance' || availableMinutes <= 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 40,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={isDark ? '#ffffff' : '#111827'} />
          </TouchableOpacity>

          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            {appIcon ? (
              <Image source={appIcon} style={{ width: 56, height: 56 }} />
            ) : (
              <Shield size={32} color={isDark ? '#ffffff' : '#111827'} />
            )}
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: isDark ? '#ffffff' : '#111827',
              textAlign: 'center',
            }}
          >
            {appName} is Blocked
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#9ca3af' : '#6b7280',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Earn time to unlock this app
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          {/* Balance Display */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: 'rgba(59, 130, 246, 0.2)',
            }}
          >
            <Clock size={32} color="#3b82f6" />
            <Text
              style={{
                fontSize: 48,
                fontWeight: '800',
                color: '#3b82f6',
                marginTop: 12,
              }}
            >
              {availableMinutes.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: isDark ? '#9ca3af' : '#6b7280',
                fontWeight: '500',
              }}
            >
              minutes available
            </Text>
          </View>

          {/* Earn Time CTA */}
          <TouchableOpacity
            onPress={onEarnTime}
            activeOpacity={0.8}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={22} color="#ffffff" />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginLeft: 10,
                }}
              >
                Earn Time Now
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '500',
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Normal flow - can spend time
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#ffffff',
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingHorizontal: 20,
          paddingBottom: 20,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 60 : 40,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={isDark ? '#ffffff' : '#111827'} />
        </TouchableOpacity>

        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          {appIcon ? (
            <Image source={appIcon} style={{ width: 56, height: 56 }} />
          ) : (
            <Shield size={32} color={isDark ? '#ffffff' : '#111827'} />
          )}
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: isDark ? '#ffffff' : '#111827',
            textAlign: 'center',
          }}
        >
          Use {appName}?
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Balance and Limit Info */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#6b7280' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              Balance
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: '#3b82f6',
                marginTop: 4,
              }}
            >
              {availableMinutes.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>min</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: isDark ? '#6b7280' : '#9ca3af',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              Daily Limit
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: '#f59e0b',
                marginTop: 4,
              }}
            >
              {remainingLimit}
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>min left</Text>
          </View>
        </View>

        {/* Time Selection */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isDark ? '#6b7280' : '#9ca3af',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          How long?
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {TIME_OPTIONS.filter(t => t <= maxUsableTime).map((minutes) => (
            <TouchableOpacity
              key={minutes}
              onPress={() => setSelectedMinutes(minutes)}
              style={{
                flex: 1,
                minWidth: '22%',
                paddingVertical: 16,
                borderRadius: 14,
                backgroundColor:
                  selectedMinutes === minutes
                    ? '#3b82f6'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : '#f9fafb',
                alignItems: 'center',
                borderWidth: selectedMinutes === minutes ? 0 : 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color:
                    selectedMinutes === minutes
                      ? '#ffffff'
                      : isDark
                      ? '#ffffff'
                      : '#374151',
                }}
              >
                {minutes}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color:
                    selectedMinutes === minutes
                      ? 'rgba(255, 255, 255, 0.8)'
                      : isDark
                      ? '#6b7280'
                      : '#9ca3af',
                }}
              >
                min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spend Button */}
        <TouchableOpacity
          onPress={handleSpend}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#3b82f6',
            borderRadius: 16,
            padding: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Play size={22} color="#ffffff" fill="#ffffff" />
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#ffffff',
              marginLeft: 10,
            }}
          >
            Spend {selectedMinutes} min
          </Text>
        </TouchableOpacity>

        {/* Earn More Link */}
        <TouchableOpacity
          onPress={onEarnTime}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 16,
            padding: 12,
          }}
        >
          <Dumbbell size={16} color="#10b981" />
          <Text
            style={{
              fontSize: 14,
              color: '#10b981',
              fontWeight: '600',
              marginLeft: 8,
            }}
          >
            Earn more time
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
