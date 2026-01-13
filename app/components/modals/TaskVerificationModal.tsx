import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Send,
  Camera,
  CheckCircle,
  AlertCircle,
  Unlock,
  Brain,
  Sparkles,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/useColorScheme';
import { verifyTaskWithPhotos } from '@/lib/openai';

interface Message {
  id: string;
  type: 'user' | 'coach' | 'system';
  text: string;
  image?: string;
  isVerification?: boolean;
  confidence?: number;
  isCompleted?: boolean;
}

interface TaskVerificationModalProps {
  visible: boolean;
  taskDescription: string;
  beforePhotoUri: string;
  onClose: () => void;
  onVerified: () => void;
  onForceUnlock: () => void;
}

export const TaskVerificationModal = ({
  visible,
  taskDescription,
  beforePhotoUri,
  onClose,
  onVerified,
  onForceUnlock,
}: TaskVerificationModalProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [hasVerified, setHasVerified] = useState(false);
  const [showForceUnlock, setShowForceUnlock] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setMessages([
        {
          id: '1',
          type: 'system',
          text: `Task: ${taskDescription}`,
        },
        {
          id: '2',
          type: 'coach',
          text: `Ready to verify your task? Take an "after" photo to show me what you've accomplished! I'll compare it with your "before" photo to see the progress.`,
        },
      ]);
      setAfterPhotoUri(null);
      setMessageCount(0);
      setHasVerified(false);
      setShowForceUnlock(false);
    }
  }, [visible, taskDescription]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Show force unlock after 3 user messages
  useEffect(() => {
    if (messageCount >= 3 && !showForceUnlock) {
      setShowForceUnlock(true);
    }
  }, [messageCount]);

  const takeAfterPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const photoUri = result.assets[0].uri;
      setAfterPhotoUri(photoUri);

      // Add user message with photo
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: 'Here\'s my "after" photo!',
        image: photoUri,
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessageCount((prev) => prev + 1);

      // Analyze the photos
      analyzePhotos(photoUri);
    }
  };

  const analyzePhotos = async (afterUri: string) => {
    setIsAnalyzing(true);

    // Add thinking message
    const thinkingId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        type: 'coach',
        text: 'Analyzing your photos...',
      },
    ]);

    try {
      const result = await verifyTaskWithPhotos(beforePhotoUri, afterUri, taskDescription);

      // Remove thinking message and add result
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        const coachMessage: Message = {
          id: Date.now().toString(),
          type: 'coach',
          text: result.explanation,
          isVerification: true,
          confidence: result.confidence,
          isCompleted: result.isTaskCompleted,
        };
        return [...filtered, coachMessage];
      });

      setHasVerified(true);

      if (result.isTaskCompleted && result.confidence >= 70) {
        // Auto-unlock after a short delay for good verification
        setTimeout(() => {
          onVerified();
        }, 2000);
      }
    } catch (error: any) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            type: 'coach',
            text: `I had trouble analyzing the photos. ${error.message || 'Please try again.'}`,
          },
        ];
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isAnalyzing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setMessageCount((prev) => prev + 1);
    setIsAnalyzing(true);

    // Generate coach response
    try {
      const response = await generateCoachResponse(inputText.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'coach',
          text: response,
        },
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCoachResponse = async (userText: string): Promise<string> => {
    // Simple coaching responses based on context
    const lowerText = userText.toLowerCase();

    if (lowerText.includes('done') || lowerText.includes('finished') || lowerText.includes('completed')) {
      return "That's great to hear! If you feel confident about your progress, you can take another photo or use the unlock button if available.";
    }

    if (lowerText.includes('hard') || lowerText.includes('difficult')) {
      return "I understand it can be challenging. Remember, even small progress counts! Would you like to try taking another photo to show what you've accomplished so far?";
    }

    if (lowerText.includes('photo') || lowerText.includes('picture') || lowerText.includes('again')) {
      return "Sure! Take another photo whenever you're ready. I'll analyze it and compare with your before photo.";
    }

    if (lowerText.includes('wrong') || lowerText.includes('mistake') || lowerText.includes('incorrect')) {
      return "I apologize if my analysis wasn't accurate. Photos can sometimes be tricky to interpret. Feel free to explain what you did or take another photo from a different angle!";
    }

    return "I'm here to help you stay accountable! If you've completed your task, take a photo to verify. If you need more time, that's okay too - focus is about progress, not perfection.";
  };

  const handleForceUnlock = () => {
    onForceUnlock();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
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
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 50 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDark ? '#ffffff' : '#111827',
                }}
              >
                Task Verification
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginTop: 2,
                }}
              >
                AI-powered progress check
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: insets.top + 10,
              right: 20,
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

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Before Photo Preview */}
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
            <Image
              source={{ uri: beforePhotoUri }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Before Photo
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#ffffff' : '#111827',
                  marginTop: 4,
                }}
                numberOfLines={2}
              >
                {taskDescription}
              </Text>
            </View>
          </View>

          {/* Chat Messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                marginBottom: 16,
                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: message.type === 'system' ? '100%' : '85%',
              }}
            >
              {message.type === 'system' ? (
                <View
                  style={{
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: '#8b5cf6',
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {message.text}
                  </Text>
                </View>
              ) : (
                <>
                  {message.type === 'coach' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: '#3b82f6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 6,
                        }}
                      >
                        <Brain size={12} color="#ffffff" />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? '#6b7280' : '#9ca3af',
                          fontWeight: '500',
                        }}
                      >
                        Coach
                      </Text>
                    </View>
                  )}

                  {message.image && (
                    <Image
                      source={{ uri: message.image }}
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 16,
                        marginBottom: 8,
                      }}
                    />
                  )}

                  <View
                    style={{
                      backgroundColor:
                        message.type === 'user'
                          ? '#3b82f6'
                          : message.isVerification
                          ? message.isCompleted
                            ? isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(16, 185, 129, 0.1)'
                            : isDark
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(239, 68, 68, 0.1)'
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      borderRadius: 20,
                      borderTopLeftRadius: message.type === 'coach' ? 4 : 20,
                      borderTopRightRadius: message.type === 'user' ? 4 : 20,
                      padding: 14,
                      borderWidth: message.isVerification ? 1.5 : 0,
                      borderColor: message.isCompleted ? '#10b981' : '#ef4444',
                    }}
                  >
                    {message.isVerification && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        {message.isCompleted ? (
                          <CheckCircle size={18} color="#10b981" />
                        ) : (
                          <AlertCircle size={18} color="#ef4444" />
                        )}
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 14,
                            fontWeight: '700',
                            color: message.isCompleted ? '#10b981' : '#ef4444',
                          }}
                        >
                          {message.isCompleted ? 'Task Completed!' : 'Not Quite There'}
                        </Text>
                        {message.confidence && (
                          <Text
                            style={{
                              marginLeft: 8,
                              fontSize: 12,
                              color: isDark ? '#9ca3af' : '#6b7280',
                            }}
                          >
                            ({message.confidence}% confident)
                          </Text>
                        )}
                      </View>
                    )}
                    <Text
                      style={{
                        color:
                          message.type === 'user' ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      {message.text}
                    </Text>
                  </View>
                </>
              )}
            </View>
          ))}

          {isAnalyzing && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Brain size={12} color="#ffffff" />
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
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text
                  style={{
                    marginLeft: 8,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: 14,
                  }}
                >
                  Thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)',
          }}
        >
          {/* Take Photo Button */}
          {!afterPhotoUri && (
            <TouchableOpacity
              onPress={takeAfterPhoto}
              disabled={isAnalyzing}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Camera size={22} color="#ffffff" />
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#ffffff',
                }}
              >
                Take "After" Photo
              </Text>
            </TouchableOpacity>
          )}

          {/* Force Unlock Button (appears after 3 messages) */}
          {showForceUnlock && (
            <TouchableOpacity
              onPress={handleForceUnlock}
              style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: 16,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 1.5,
                borderColor: '#f59e0b',
              }}
            >
              <Unlock size={20} color="#f59e0b" />
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#f59e0b',
                }}
              >
                I'm Sure I Completed It! Unlock
              </Text>
            </TouchableOpacity>
          )}

          {/* Chat Input */}
          {afterPhotoUri && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={takeAfterPhoto}
                disabled={isAnalyzing}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={22} color={isDark ? '#ffffff' : '#111827'} />
              </TouchableOpacity>

              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Explain or ask questions..."
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
              />

              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputText.trim() || isAnalyzing}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor:
                    inputText.trim() && !isAnalyzing
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
                  color={inputText.trim() && !isAnalyzing ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
