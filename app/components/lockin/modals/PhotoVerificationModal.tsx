import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  Camera,
  Send,
  CheckCircle,
  AlertCircle,
  Unlock,
  Sparkles,
  Bot,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { verifyTaskWithPhotos, verifyTaskWithPhoto } from "@/lib/openai";

interface Message {
  id: string;
  type: "user" | "coach" | "system";
  text: string;
  image?: string;
  isVerification?: boolean;
  confidence?: number;
  isCompleted?: boolean;
}

interface PhotoVerificationModalProps {
  visible: boolean;
  isDark: boolean;
  taskDescription: string;
  beforePhotoUri?: string; // Optional - some tasks don't have before photo
  onClose: () => void;
  onVerified: (earnedMinutes: number) => void;
  onForceUnlock: () => void;
}

export const PhotoVerificationModal: React.FC<PhotoVerificationModalProps> = ({
  visible,
  isDark,
  taskDescription,
  beforePhotoUri,
  onClose,
  onVerified,
  onForceUnlock,
}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [showForceUnlock, setShowForceUnlock] = useState(false);
  const [earnedMinutesResult, setEarnedMinutesResult] = useState<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      const hasBeforePhoto = !!beforePhotoUri;
      setMessages([
        {
          id: "1",
          type: "system",
          text: taskDescription,
        },
        {
          id: "2",
          type: "coach",
          text: hasBeforePhoto
            ? `Great job getting to this point! Ready to verify your progress? Take an "after" photo and I'll compare it with your before photo to see what you've accomplished.`
            : `Nice work! Ready to verify? Take a photo showing you completed the task and I'll check it out.`,
        },
      ]);
      setAfterPhotoUri(null);
      setMessageCount(0);
      setShowForceUnlock(false);
      setInputText("");
      setEarnedMinutesResult(null);
    }
  }, [visible, taskDescription, beforePhotoUri]);

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
    try {
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
          type: "user",
          text: 'Here\'s my "after" photo!',
          image: photoUri,
        };
        setMessages((prev) => [...prev, userMessage]);
        setMessageCount((prev) => prev + 1);

        // Analyze the photos
        analyzePhotos(photoUri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
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
        type: "coach",
        text: beforePhotoUri ? "Analyzing your photos..." : "Checking your photo...",
      },
    ]);

    try {
      // Use different verification based on whether we have a before photo
      const result = beforePhotoUri
        ? await verifyTaskWithPhotos(beforePhotoUri, afterUri, taskDescription)
        : await verifyTaskWithPhoto(afterUri, taskDescription);

      // Calculate earned minutes (default to 5 if not provided, cap at 15)
      const earnedMinutes = Math.min(Math.max(result.earnedMinutes || 5, 5), 15);
      setEarnedMinutesResult(earnedMinutes);

      // Build success message with earned minutes
      const successMessage = result.isTaskCompleted && result.confidence >= 70
        ? `${result.message}\n\n+${earnedMinutes} minutes earned! 🎉`
        : result.message;

      // Remove thinking message and add result
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        const coachMessage: Message = {
          id: Date.now().toString(),
          type: "coach",
          text: successMessage,
          isVerification: true,
          isCompleted: result.isTaskCompleted,
        };
        return [...filtered, coachMessage];
      });

      if (result.isTaskCompleted && result.confidence >= 70) {
        // Auto-unlock after a short delay for good verification
        setTimeout(() => {
          onVerified(earnedMinutes);
        }, 2500);
      }
    } catch (error: any) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            type: "coach",
            text: `I had trouble analyzing the photo. ${error.message || "Please try again or take another photo."}`,
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
      type: "user",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setMessageCount((prev) => prev + 1);
    setIsAnalyzing(true);

    // Generate coach response
    try {
      const response = await generateCoachResponse(inputText.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "coach",
          text: response,
        },
      ]);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCoachResponse = async (userText: string): Promise<string> => {
    const lowerText = userText.toLowerCase();

    if (lowerText.includes("done") || lowerText.includes("finished") || lowerText.includes("completed")) {
      return "Awesome! If you've completed your task, take an after photo so I can verify your progress. The photo comparison helps confirm the real work you've done!";
    }

    if (lowerText.includes("hard") || lowerText.includes("difficult") || lowerText.includes("struggling")) {
      return "I understand it can be challenging. Remember, even small progress counts! Would you like to take a photo to show what you've accomplished so far? Every step forward matters.";
    }

    if (lowerText.includes("photo") || lowerText.includes("picture") || lowerText.includes("again")) {
      return "Ready when you are! Take another photo whenever you'd like. I'll analyze it and compare with your before photo to see your progress.";
    }

    if (lowerText.includes("wrong") || lowerText.includes("mistake") || lowerText.includes("incorrect")) {
      return "I apologize if my analysis wasn't accurate. Photos can sometimes be tricky to interpret. Feel free to explain what you did or take another photo from a different angle!";
    }

    if (lowerText.includes("help") || lowerText.includes("stuck")) {
      return "I'm here to help! You can take an after photo to verify your task, or if you've genuinely completed it, the force unlock option will appear after a few messages. Stay focused!";
    }

    return "Keep going! When you're ready to verify, take an after photo and I'll compare it with your before photo. Focus is about progress, not perfection.";
  };

  const renderMessage = (message: Message) => {
    if (message.type === "system") {
      return (
        <View
          key={message.id}
          style={{
            backgroundColor: isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.08)",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "rgba(139, 92, 246, 0.2)",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: "#8b5cf6",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Your Task
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#ffffff" : "#111827",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {message.text}
          </Text>
        </View>
      );
    }

    const isUser = message.type === "user";

    return (
      <View
        key={message.id}
        style={{
          marginBottom: 16,
          alignSelf: isUser ? "flex-end" : "flex-start",
          maxWidth: "85%",
        }}
      >
        {!isUser && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#10b981",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Bot size={14} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "600",
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
              width: 180,
              height: 180,
              borderRadius: 16,
              marginBottom: 8,
            }}
          />
        )}

        <View
          style={{
            backgroundColor: isUser
              ? "#10b981"
              : message.isVerification
              ? message.isCompleted
                ? isDark
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(16, 185, 129, 0.08)"
                : isDark
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(239, 68, 68, 0.08)"
              : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "#f3f4f6",
            borderRadius: 18,
            borderTopLeftRadius: !isUser ? 6 : 18,
            borderTopRightRadius: isUser ? 6 : 18,
            padding: 14,
            borderWidth: message.isVerification ? 1.5 : 0,
            borderColor: message.isCompleted ? "#10b981" : "#ef4444",
          }}
        >
          {message.isVerification && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              {message.isCompleted ? (
                <CheckCircle size={20} color="#10b981" />
              ) : (
                <AlertCircle size={20} color="#ef4444" />
              )}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 15,
                  fontWeight: "700",
                  color: message.isCompleted ? "#10b981" : "#ef4444",
                }}
              >
                {message.isCompleted ? "Task Verified!" : "Keep Going"}
              </Text>
            </View>
          )}
          <Text
            style={{
              color: isUser ? "#ffffff" : isDark ? "#ffffff" : "#111827",
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: isDark ? "#000000" : "#ffffff",
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            backgroundColor: isDark ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.03)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#10b981",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Sparkles size={22} color="#ffffff" />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                >
                  Task Verification
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#9ca3af" : "#6b7280",
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
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={isDark ? "#ffffff" : "#111827"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Before Photo Preview (only if we have one) */}
          {beforePhotoUri ? (
            <View
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f9fafb",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
              }}
            >
              <Image
                source={{ uri: beforePhotoUri }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  marginRight: 12,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isDark ? "#6b7280" : "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Before Photo
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#ffffff" : "#111827",
                    marginTop: 4,
                    fontWeight: "500",
                  }}
                  numberOfLines={2}
                >
                  {taskDescription}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(16, 185, 129, 0.15)",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#10b981",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Your Task
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#ffffff" : "#111827",
                  fontWeight: "600",
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {taskDescription}
              </Text>
            </View>
          )}

          {/* Chat Messages */}
          {messages.map(renderMessage)}

          {/* Typing indicator */}
          {isAnalyzing && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#10b981",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <Bot size={14} color="#ffffff" />
              </View>
              <View
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                  borderRadius: 16,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color="#10b981" />
                <Text
                  style={{
                    marginLeft: 10,
                    color: isDark ? "#9ca3af" : "#6b7280",
                    fontSize: 14,
                  }}
                >
                  Analyzing...
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
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
            backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          }}
        >
          {/* Take Photo Button */}
          {!afterPhotoUri && (
            <TouchableOpacity
              onPress={takeAfterPhoto}
              disabled={isAnalyzing}
              style={{
                backgroundColor: "#10b981",
                borderRadius: 14,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: showForceUnlock ? 12 : 0,
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
                opacity: isAnalyzing ? 0.6 : 1,
              }}
            >
              <Camera size={22} color="#ffffff" />
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                Take "After" Photo
              </Text>
            </TouchableOpacity>
          )}

          {/* Force Unlock Button */}
          {showForceUnlock && (
            <TouchableOpacity
              onPress={onForceUnlock}
              style={{
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
                borderRadius: 14,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: afterPhotoUri ? 12 : 0,
                borderWidth: 1.5,
                borderColor: "#f59e0b",
              }}
            >
              <Unlock size={20} color="#f59e0b" />
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#f59e0b",
                }}
              >
                I Completed It - Force Unlock
              </Text>
            </TouchableOpacity>
          )}

          {/* Chat Input */}
          {afterPhotoUri && (
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <TouchableOpacity
                onPress={takeAfterPhoto}
                disabled={isAnalyzing}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={22} color={isDark ? "#ffffff" : "#374151"} />
              </TouchableOpacity>

              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Explain or ask questions..."
                placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                  borderRadius: 24,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: isDark ? "#ffffff" : "#111827",
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
                      ? "#10b981"
                      : isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send
                  size={20}
                  color={inputText.trim() && !isAnalyzing ? "#ffffff" : isDark ? "#6b7280" : "#9ca3af"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PhotoVerificationModal;
