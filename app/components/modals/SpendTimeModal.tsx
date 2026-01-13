import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Shield, Clock, Dumbbell, X, Play, Lock, Calendar, AlertTriangle, Send, Sparkles } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEarnedTime } from '@/context/EarnedTimeContext';
import { getLocalIcon } from '@/lib/appIcons';
import { analyzeIntentionChat } from '@/lib/openai';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoachMessage {
  id: string;
  type: 'user' | 'coach';
  text: string;
}

interface SpendTimeModalProps {
  visible: boolean;
  appName: string;
  packageName?: string;
  dailyLimitMinutes: number;
  realUsedMinutes: number; // Actual usage from device stats
  isScheduleFreeTime: boolean;
  forceCoachChat?: boolean; // Force showing coach chat (from native urgent access button)
  nativeWalletBalance?: number | null; // Direct from native, overrides context if provided
  onClose: () => void;
  onSpend: (minutes: number) => void;
  onEarnTime: () => void;
  onUrgentAccess?: (minutes: number) => void; // For emergency access (deducts from balance, can go negative)
}

export const SpendTimeModal = ({
  visible,
  appName,
  packageName,
  dailyLimitMinutes,
  realUsedMinutes,
  isScheduleFreeTime,
  forceCoachChat,
  nativeWalletBalance,
  onClose,
  onSpend,
  onEarnTime,
  onUrgentAccess,
}: SpendTimeModalProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { wallet, getTotalRemainingLimit } = useEarnedTime();
  const { accentColor } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const appIcon = packageName ? getLocalIcon(packageName, appName) : null;

  // Coach chat state
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Calculate health score (0-100, lower = more usage today)
  const healthScore = Math.max(0, Math.min(100, Math.round((1 - realUsedMinutes / Math.max(dailyLimitMinutes, 1)) * 100)));

  // Initialize coach messages when limit is reached or forceCoachChat is true
  useEffect(() => {
    if (visible && (realUsedMinutes >= dailyLimitMinutes || forceCoachChat)) {
      setCoachMessages([
        {
          id: '1',
          type: 'coach',
          text: t("spend.coachLimitReached", { minutes: dailyLimitMinutes, appName }),
        },
        {
          id: '2',
          type: 'coach',
          text: t("spend.coachBlockedUntilTomorrow"),
        },
      ]);
    }
  }, [visible, realUsedMinutes, dailyLimitMinutes, appName, forceCoachChat, t]);

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [coachMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput.trim();
    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: userText,
    };

    setCoachMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory = coachMessages.map(msg => ({
        role: msg.type,
        text: msg.text,
      }));

      // Call OpenAI API
      const result = await analyzeIntentionChat(
        userText,
        appName,
        healthScore,
        conversationHistory
      );

      // Add coach response
      setCoachMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'coach',
          text: result.message,
        },
      ]);
      setIsTyping(false);

      // If approved, automatically open the app with granted time
      if (result.approved && result.minutes > 0 && onUrgentAccess) {
        setTimeout(() => {
          onUrgentAccess(result.minutes);
        }, 800);
      }
    } catch (error) {
      console.error('[SpendTimeModal] OpenAI error:', error);
      // Fallback response on error
      setCoachMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'coach',
          text: t("spend.coachError"),
        },
      ]);
      setIsTyping(false);
    }
  };

  // Use REAL device usage for limit calculations
  const realRemainingLimit = Math.max(0, dailyLimitMinutes - realUsedMinutes);
  const isLimitReached = realUsedMinutes >= dailyLimitMinutes;
  const totalRemaining = getTotalRemainingLimit();
  const isTotalLimitReached = totalRemaining <= 0;
  // Use native wallet balance if provided (single source of truth), otherwise fall back to context
  const availableMinutes = nativeWalletBalance !== null && nativeWalletBalance !== undefined
    ? nativeWalletBalance
    : wallet.availableMinutes;
  // Match native logic: need at least 0.5 min for one deduction cycle
  const hasNoBalance = availableMinutes < 0.5;

  // Calculate max usable time (minimum of remaining limit and available balance)
  const maxUsableTime = isScheduleFreeTime
    ? realRemainingLimit
    : Math.min(realRemainingLimit, Math.floor(availableMinutes));

  console.log('[SpendTimeModal] State:', {
    appName,
    dailyLimitMinutes,
    realUsedMinutes,
    realRemainingLimit,
    availableMinutes,
    maxUsableTime,
    isScheduleFreeTime,
    isLimitReached,
    isTotalLimitReached,
    hasNoBalance,
  });

  if (!visible) return null;

  // If during free schedule time and has remaining limit
  if (isScheduleFreeTime && realRemainingLimit > 0) {
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
              {t("spend.freeTimeActive")}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {t("spend.freeTimeDesc")}
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
                {t("spend.minRemainingToday", { count: realRemainingLimit })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onSpend(Math.min(30, realRemainingLimit))}
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
              {t("spend.openApp", { appName })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If TOTAL daily limit reached (all apps combined) - but skip if forceCoachChat is true
  if (isTotalLimitReached && !forceCoachChat) {
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
            <AlertTriangle size={40} color="#ef4444" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#ef4444',
              textAlign: 'center',
            }}
          >
            {t("spend.totalLimitReached")}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: isDark ? '#9ca3af' : '#6b7280',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {t("spend.usedAllScreenTime")}
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: isDark ? '#d1d5db' : '#4b5563',
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              {t("spend.allAppsBlockedExplanation")}
            </Text>

            <View
              style={{
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  fontWeight: '600',
                }}
              >
                {t("spend.totalRemaining", { count: totalRemaining })}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#374151',
              }}
            >
              {t("spend.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If individual app limit reached (based on REAL device usage) OR forceCoachChat - Show Coach Chat
  if (isLimitReached || forceCoachChat) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Lock size={22} color="#ffffff" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#ef4444',
                  }}
                >
                  {t("spend.dailyLimitReached")}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginTop: 2,
                  }}
                >
                  {t("spend.usedOfLimit", { used: realUsedMinutes, limit: dailyLimitMinutes })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Coach Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* App Info Card */}
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: 16,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {appIcon ? (
              <Image
                source={appIcon}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Shield size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#ffffff' : '#111827',
                }}
              >
                {appName}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: '#ef4444',
                  fontWeight: '600',
                  marginTop: 2,
                }}
              >
                {t("spend.blockedUntilTomorrow")}
              </Text>
            </View>
          </View>

          {/* Chat Messages */}
          {coachMessages.map((message) => (
            <View
              key={message.id}
              style={{
                marginBottom: 16,
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {message.type === 'coach' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#10b981',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Sparkles size={12} color="#ffffff" />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? '#6b7280' : '#9ca3af',
                      fontWeight: '500',
                    }}
                  >
                    {t("spend.coach")}
                  </Text>
                </View>
              )}

              <View
                style={{
                  backgroundColor:
                    message.type === 'user'
                      ? '#3b82f6'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                  borderRadius: 20,
                  borderTopLeftRadius: message.type === 'coach' ? 4 : 20,
                  borderTopRightRadius: message.type === 'user' ? 4 : 20,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    color: message.type === 'user' ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                >
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#10b981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Sparkles size={12} color="#ffffff" />
              </View>
              <View
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 16,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="small" color="#10b981" />
                <Text
                  style={{
                    marginLeft: 8,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: 14,
                  }}
                >
                  {t("spend.coachTyping")}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chat Input */}
        <View
          style={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)',
          }}
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder={t("spend.chatPlaceholder")}
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={{
                flex: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 12,
                fontSize: 15,
                color: isDark ? '#ffffff' : '#111827',
              }}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!chatInput.trim() || isTyping}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor:
                  chatInput.trim() && !isTyping
                    ? '#3b82f6'
                    : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send
                size={20}
                color={chatInput.trim() && !isTyping ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // If no balance - Premium Glassy Design
  if (hasNoBalance) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={isDark
            ? ['#0a0a0a', '#1a0f0f', '#0a0a0a']
            : ['#f8fafc', '#fef2f2', '#f8fafc']
          }
          style={{ flex: 1 }}
        >
          {/* Decorative orbs */}
          <View
            style={{
              position: 'absolute',
              top: -80,
              left: -80,
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: '#ef4444',
              opacity: 0.06,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#10b981',
              opacity: 0.08,
            }}
          />

          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 20,
              paddingHorizontal: 20,
              paddingBottom: 20,
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: 'absolute',
                top: insets.top + 20,
                right: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <X size={20} color={isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'} />
            </TouchableOpacity>

            {/* App Icon with red tint */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: '#ef4444',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 28,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                {appIcon ? (
                  <Image source={appIcon} style={{ width: 64, height: 64, opacity: 0.5 }} />
                ) : (
                  <Shield size={40} color="#ef4444" />
                )}
                {/* Lock overlay */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#ef4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={16} color="#ffffff" />
                </View>
              </View>
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: isDark ? '#ffffff' : '#111827',
                textAlign: 'center',
                letterSpacing: -0.5,
              }}
            >
              {t("spend.appBlocked", { appName })}
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              {t("spend.earnToUnlock")}
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
            {/* Glassy Balance Card */}
            <View
              style={{
                borderRadius: 28,
                overflow: 'hidden',
                marginBottom: 28,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={{ overflow: 'hidden' }}
              >
                <View
                  style={{
                    padding: 32,
                    alignItems: 'center',
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: 28,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Clock size={28} color="#ef4444" />
                  </View>

                  <Text
                    style={{
                      fontSize: 64,
                      fontWeight: '800',
                      color: '#ef4444',
                      letterSpacing: -2,
                    }}
                  >
                    {availableMinutes.toFixed(1)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                      fontWeight: '600',
                      marginTop: 4,
                    }}
                  >
                    {t("spend.minutesAvailable")}
                  </Text>

                  <View
                    style={{
                      width: 60,
                      height: 3,
                      backgroundColor: '#ef4444',
                      borderRadius: 2,
                      marginTop: 20,
                      marginBottom: 16,
                      opacity: 0.3,
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                      textAlign: 'center',
                      lineHeight: 18,
                    }}
                  >
                    {t("spend.completeExercises")}
                  </Text>
                </View>
              </BlurView>
            </View>

            {/* Earn Time CTA - Gradient */}
            <TouchableOpacity
              onPress={onEarnTime}
              activeOpacity={0.85}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Dumbbell size={24} color="#ffffff" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#ffffff',
                    marginLeft: 12,
                    letterSpacing: -0.3,
                  }}
                >
                  {t("spend.earnTimeNow")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Go Back */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                padding: 16,
                borderRadius: 14,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                  fontWeight: '600',
                }}
              >
                {t("spend.goBack")}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Normal flow - can spend time - Glassy Premium Design
  return (
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <LinearGradient
        colors={isDark
          ? ['#0a0a0a', '#0f1520', '#0a0a0a']
          : ['#f8fafc', '#e0f2fe', '#f8fafc']
        }
        style={{ flex: 1 }}
      >
        {/* Decorative gradient orbs */}
        <View
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: accentColor.primary,
            opacity: 0.08,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: '#10b981',
            opacity: 0.06,
          }}
        />

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: 'center',
          }}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: insets.top + 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <X size={20} color={isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'} />
          </TouchableOpacity>

          {/* App Icon with glow */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: accentColor.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 28,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              {appIcon ? (
                <Image source={appIcon} style={{ width: 64, height: 64 }} />
              ) : (
                <Shield size={40} color={accentColor.primary} />
              )}
            </View>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: isDark ? '#ffffff' : '#111827',
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {appName}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            {t("spend.readyToUse")}
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
          {/* Glassy Time Card */}
          <View
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              marginBottom: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={{ overflow: 'hidden' }}
            >
              <View
                style={{
                  padding: 32,
                  alignItems: 'center',
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(255, 255, 255, 0.7)',
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 28,
                }}
              >
                {/* Clock icon with accent glow */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: `${accentColor.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Clock size={28} color={accentColor.primary} />
                </View>

                <Text
                  style={{
                    fontSize: 64,
                    fontWeight: '800',
                    color: accentColor.primary,
                    letterSpacing: -2,
                  }}
                >
                  {maxUsableTime}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  {t("spend.minutesAvailable")}
                </Text>

                {/* Subtle divider */}
                <View
                  style={{
                    width: 60,
                    height: 3,
                    backgroundColor: accentColor.primary,
                    borderRadius: 2,
                    marginTop: 20,
                    marginBottom: 16,
                    opacity: 0.3,
                  }}
                />

                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                    textAlign: 'center',
                    lineHeight: 18,
                  }}
                >
                  {t("spend.timeTrackedAutomatically")}
                </Text>
              </View>
            </BlurView>
          </View>

          {/* Open Button - Gradient with glow */}
          <TouchableOpacity
            onPress={() => onSpend(maxUsableTime)}
            activeOpacity={0.85}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: accentColor.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={[accentColor.primary, accentColor.secondary || accentColor.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={24} color="#ffffff" fill="#ffffff" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#ffffff',
                  marginLeft: 12,
                  letterSpacing: -0.3,
                }}
              >
                {t("spend.openApp", { appName })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Go Back - Glassy button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                fontWeight: '600',
              }}
            >
              {t("spend.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};
