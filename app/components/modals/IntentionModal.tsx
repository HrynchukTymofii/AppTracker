import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Shield, Send, Lightbulb, Target, Clock, X } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { analyzeIntentionChat } from '@/lib/openai';
import { getLocalIcon } from '@/lib/appIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

interface IntentionModalProps {
  visible: boolean;
  appName: string;
  packageName?: string;
  healthScore: number;
  onClose: () => void;
  onAllow: (minutes: number) => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  isTyping?: boolean;
  allowMinutes?: number; // If coach approves, how many minutes
}

export const IntentionModal = ({
  visible,
  appName,
  packageName,
  healthScore,
  onClose,
  onAllow,
}: IntentionModalProps) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTips, setShowTips] = useState(true);

  // Get app icon
  const appIcon = packageName ? getLocalIcon(packageName, appName) : null;

  // Initialize with coach's first message
  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: t("intention.greeting", { appName }),
          sender: 'coach',
        },
      ]);
      setShowTips(true);
    }
  }, [visible, appName, t]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    setShowTips(false);
    Keyboard.dismiss();

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, text: userMessage, sender: 'user' },
    ]);

    // Add typing indicator
    const typingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: typingId, text: '', sender: 'coach', isTyping: true },
    ]);

    setIsProcessing(true);

    try {
      // Get conversation history for context
      const conversationHistory = messages
        .filter((m) => !m.isTyping)
        .map((m) => ({ role: m.sender, text: m.text }));

      const response = await analyzeIntentionChat(
        userMessage,
        appName,
        healthScore,
        conversationHistory
      );

      // Remove typing indicator and add real response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            text: response.message,
            sender: 'coach',
            allowMinutes: response.approved ? response.minutes : undefined,
          },
        ];
      });

      // If approved, show the allow button state
      if (response.approved && response.minutes > 0) {
        // Auto-allow after showing response
        setTimeout(() => {
          onAllow(response.minutes);
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error('[IntentionModal] Error:', error);
      // Remove typing indicator and add error message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            text: t("intention.errorFallback"),
            sender: 'coach',
            allowMinutes: 2,
          },
        ];
      });
      setTimeout(() => {
        onAllow(2);
        handleClose();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInputText('');
    setShowTips(true);
    setIsProcessing(false);
    onClose();
  };

  const handleLeave = () => {
    handleClose();
  };

  const tips = [
    { icon: Lightbulb, textKey: 'intention.tip1', color: '#f59e0b' },
    { icon: Target, textKey: 'intention.tip2', color: '#10b981' },
    { icon: Clock, textKey: 'intention.tip3', color: '#8b5cf6' },
  ];

  if (!visible) return null;

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
          position: 'relative',
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 50 }}>
          {/* App Icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              overflow: 'hidden',
            }}
          >
            {appIcon ? (
              <Image source={appIcon} style={{ width: 32, height: 32 }} />
            ) : (
              <Shield size={24} color={isDark ? '#ffffff' : '#111827'} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827',
              }}
              numberOfLines={1}
            >
              {t("intention.whyApp", { appName })}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#ef4444',
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {t("intention.blockedByLockIn")}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleLeave}
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
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              marginBottom: 12,
            }}
          >
            {message.sender === 'coach' && !message.isTyping && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#3b82f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                  }}
                >
                  <Shield size={10} color="#ffffff" />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: isDark ? '#6b7280' : '#9ca3af',
                    fontWeight: '500',
                  }}
                >
                  {t("intention.lockInCoach")}
                </Text>
              </View>
            )}
            <View
              style={{
                backgroundColor:
                  message.sender === 'user'
                    ? '#3b82f6'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 18,
                borderTopLeftRadius: message.sender === 'coach' ? 4 : 18,
                borderTopRightRadius: message.sender === 'user' ? 4 : 18,
                paddingHorizontal: 16,
                paddingVertical: 12,
                minHeight: message.isTyping ? 40 : undefined,
              }}
            >
              {message.isTyping ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: isDark ? '#6b7280' : '#9ca3af',
                          opacity: 0.7,
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    color: message.sender === 'user' ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                    fontSize: 15,
                    lineHeight: 21,
                  }}
                >
                  {message.text}
                </Text>
              )}
            </View>
            {message.allowMinutes && message.allowMinutes > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignSelf: 'flex-start',
                }}
              >
                <Clock size={12} color="#10b981" />
                <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600', marginLeft: 4 }}>
                  {t("intention.minGranted", { count: message.allowMinutes })}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Tips Section - show only initially */}
        {showTips && messages.length <= 1 && (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: 12,
              }}
            >
              {t("intention.tipsTitle")}
            </Text>
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: index < tips.length - 1 ? 8 : 0,
                  }}
                >
                  <Icon size={14} color={tip.color} style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#d1d5db' : '#4b5563',
                      flex: 1,
                    }}
                  >
                    {t(tip.textKey)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Input */}
      <View
        style={{
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {/* Input Row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 12,
              fontSize: 15,
              color: isDark ? '#ffffff' : '#111827',
              maxHeight: 100,
            }}
            placeholder={t("intention.inputPlaceholder")}
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isProcessing}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor:
                inputText.trim() && !isProcessing
                  ? '#3b82f6'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={isDark ? '#6b7280' : '#9ca3af'} />
            ) : (
              <Send
                size={20}
                color={inputText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Leave Button */}
        <TouchableOpacity
          onPress={handleLeave}
          style={{
            marginTop: 12,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 12,
            padding: 14,
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: isDark ? '#9ca3af' : '#6b7280',
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            {t("intention.leaveApp", { appName })}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
