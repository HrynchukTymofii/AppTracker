import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MessageCircle, X, Send, Brain, Lightbulb, Target, Clock, CheckCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { analyzeIntention, generateCoachingResponse, IntentionAnalysisResult } from '@/lib/openai';

interface IntentionModalProps {
  visible: boolean;
  appName: string;
  healthScore: number;
  onClose: () => void;
  onAllow: (minutes: number) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
}

export const IntentionModal = ({
  visible,
  appName,
  healthScore,
  onClose,
  onAllow,
}: IntentionModalProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [intention, setIntention] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [analysisResult, setAnalysisResult] = useState<IntentionAnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmitIntention = async () => {
    if (!intention.trim() || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      console.log('[IntentionModal] Analyzing intention:', intention);
      const result = await analyzeIntention(intention, appName, healthScore);
      console.log('[IntentionModal] Analysis result:', JSON.stringify(result, null, 2));

      setAnalysisResult(result);
      setShowResult(true);

      if (result.category === 'productive') {
        // Show result briefly then allow access
        setTimeout(() => {
          onAllow(result.allowedMinutes);
          handleClose();
        }, 2000);
      } else if (result.category === 'neutral') {
        // Show result briefly then allow 1 minute
        setTimeout(() => {
          onAllow(result.allowedMinutes);
          handleClose();
        }, 2000);
      } else {
        // Unproductive - start coaching conversation after showing result
        setTimeout(() => {
          setShowResult(false);
          setConversationMode(true);
          setMessages([
            {
              id: Date.now().toString(),
              text: intention,
              sender: 'user',
            },
            {
              id: (Date.now() + 1).toString(),
              text: result.coachingQuestion || result.explanation,
              sender: 'coach',
            },
          ]);
        }, 1500);
      }
    } catch (error) {
      console.error('[IntentionModal] Error analyzing intention:', error);
      // On error, allow limited access
      onAllow(1);
      handleClose();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentResponse.trim() || isAnalyzing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentResponse,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentResponse('');
    setIsAnalyzing(true);

    try {
      const lastCoachMessage = messages.filter((m) => m.sender === 'coach').pop();
      console.log('[IntentionModal] Generating coaching response...');
      const response = await generateCoachingResponse(
        lastCoachMessage?.text || '',
        userMessage.text,
        appName
      );
      console.log('[IntentionModal] Coaching response:', response);

      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'coach',
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      console.error('[IntentionModal] Error generating coaching response:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGiveUp = () => {
    // User gave up on their intention - deny access
    handleClose();
  };

  const handleInsist = () => {
    // User insists - give them 1 minute
    onAllow(1);
    handleClose();
  };

  const handleClose = () => {
    setIntention('');
    setConversationMode(false);
    setMessages([]);
    setCurrentResponse('');
    setAnalysisResult(null);
    setShowResult(false);
    onClose();
  };

  const tips = [
    {
      icon: Lightbulb,
      title: 'Be Specific',
      description: 'Clear intentions help you stay focused',
      color: '#f59e0b',
    },
    {
      icon: Target,
      title: 'Set a Goal',
      description: 'What do you want to accomplish?',
      color: '#10b981',
    },
    {
      icon: Clock,
      title: 'Time Limit',
      description: 'How long do you really need?',
      color: '#8b5cf6',
    },
  ];

  // Result screen after analysis
  if (showResult && analysisResult) {
    const getCategoryStyle = () => {
      switch (analysisResult.category) {
        case 'productive':
          return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '✓', label: 'Productive' };
        case 'neutral':
          return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '○', label: 'Neutral' };
        case 'unproductive':
          return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: '!', label: 'Let\'s Reflect' };
        default:
          return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: '?', label: 'Unknown' };
      }
    };

    const style = getCategoryStyle();

    return (
      <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? '#000000' : '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: style.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 48 }}>{style.icon}</Text>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: style.color,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {style.label}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: isDark ? '#d1d5db' : '#4b5563',
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 16,
              paddingHorizontal: 20,
            }}
          >
            {analysisResult.explanation}
          </Text>

          {analysisResult.category !== 'unproductive' && (
            <View
              style={{
                backgroundColor: style.bg,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Clock size={20} color={style.color} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: style.color,
                  marginLeft: 8,
                }}
              >
                {analysisResult.allowedMinutes} minutes granted
              </Text>
            </View>
          )}

          <ActivityIndicator
            color={style.color}
            style={{ marginTop: 24 }}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        {!conversationMode ? (
          // Initial intention screen - styled like PermissionRequest
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingVertical: 60,
              paddingHorizontal: 20,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Icon */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Brain size={48} color="#ffffff" />
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
                Why {appName}?
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  textAlign: 'center',
                  lineHeight: 24,
                }}
              >
                Let's reflect on your intention
              </Text>
            </View>

            {/* Intention Card */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                borderRadius: 20,
                padding: 24,
                marginBottom: 24,
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
                  <MessageCircle size={24} color="#3b82f6" />
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
                    Share Your Intention
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#9ca3af' : '#6b7280',
                    }}
                  >
                    What do you want to do on {appName}?
                  </Text>
                </View>
              </View>

              <TextInput
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 16,
                  color: isDark ? '#ffffff' : '#111827',
                  height: 100,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  textAlignVertical: 'top',
                }}
                placeholder="e.g., 'Reply to a friend's message' or 'Just scrolling...'"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                multiline
                value={intention}
                onChangeText={setIntention}
                autoFocus
              />
            </View>

            {/* Tips */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: isDark ? '#ffffff' : '#111827',
                  marginBottom: 16,
                }}
              >
                Tips for Better Intentions:
              </Text>

              {tips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: tip.color + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Icon size={20} color={tip.color} />
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
                        {tip.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: isDark ? '#9ca3af' : '#6b7280',
                          lineHeight: 18,
                        }}
                      >
                        {tip.description}
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
                onPress={handleSubmitIntention}
                disabled={!intention.trim() || isAnalyzing}
                style={{
                  backgroundColor: intention.trim() && !isAnalyzing ? '#3b82f6' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 16,
                  padding: 18,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  shadowColor: '#3b82f6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: intention.trim() && !isAnalyzing ? 0.3 : 0,
                  shadowRadius: 16,
                  elevation: intention.trim() && !isAnalyzing ? 8 : 0,
                }}
                activeOpacity={0.8}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Brain size={20} color={intention.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'} style={{ marginRight: 8 }} />
                    <Text
                      style={{
                        color: intention.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af',
                        fontSize: 17,
                        fontWeight: '700',
                      }}
                    >
                      Analyze My Intention
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
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
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          // Coaching conversation screen
          <View style={{ flex: 1 }}>
            <View
              style={{
                padding: 20,
                paddingTop: 60,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#3b82f6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Brain size={24} color="#ffffff" />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: isDark ? '#ffffff' : '#111827',
                      }}
                    >
                      Let's Reflect
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginTop: 2,
                      }}
                    >
                      Thinking about {appName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={24} color={isDark ? '#ffffff' : '#111827'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1, padding: 20 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={{
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    marginBottom: 16,
                  }}
                >
                  {message.sender === 'coach' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
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
                  <View
                    style={{
                      backgroundColor:
                        message.sender === 'user'
                          ? '#3b82f6'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: 20,
                      borderTopLeftRadius: message.sender === 'coach' ? 4 : 20,
                      borderTopRightRadius: message.sender === 'user' ? 4 : 20,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: message.sender === 'user' ? '#ffffff' : isDark ? '#ffffff' : '#111827',
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View
              style={{
                padding: 20,
                paddingBottom: 32,
                borderTopWidth: 1,
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={handleGiveUp}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <CheckCircle size={18} color="#10b981" style={{ marginBottom: 4 }} />
                  <Text
                    style={{
                      color: '#10b981',
                      fontSize: 13,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    You're Right
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleInsist}
                  style={{
                    flex: 1,
                    backgroundColor: '#f59e0b',
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                  }}
                >
                  <Clock size={18} color="#ffffff" style={{ marginBottom: 4 }} />
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                  >
                    1 Min Anyway
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                    borderRadius: 24,
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: isDark ? '#ffffff' : '#111827',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  }}
                  placeholder="Continue the conversation..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={currentResponse}
                  onChangeText={setCurrentResponse}
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!currentResponse.trim() || isAnalyzing}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: currentResponse.trim() && !isAnalyzing ? '#3b82f6' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color={isDark ? '#6b7280' : '#9ca3af'} />
                  ) : (
                    <Send size={22} color={currentResponse.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};
