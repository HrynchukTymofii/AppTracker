import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { X, CheckCircle, XCircle, Circle } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Question } from "@/types";

interface AllTasksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  answeredQuestions: Record<string, boolean>;
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

const AllTasksDialog = ({
  isOpen,
  onClose,
  questions,
  answeredQuestions,
  currentQuestionIndex,
  onQuestionSelect,
}: AllTasksDialogProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleQuestionPress = (index: number) => {
    onQuestionSelect(index);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 500,
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#334155" : "#e5e7eb",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: isDark ? "#ffffff" : "#1f2937",
              }}
            >
              All Questions
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: isDark ? "#334155" : "#f3f4f6",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <X size={24} color={isDark ? "#ffffff" : "#1f2937"} />
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginBottom: 16,
              paddingHorizontal: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CheckCircle size={16} color="#22c55e" />
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: "600",
                }}
              >
                Correct
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <XCircle size={16} color="#ef4444" />
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: "600",
                }}
              >
                Incorrect
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Circle size={16} color={isDark ? "#64748b" : "#94a3b8"} />
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: "600",
                }}
              >
                Unanswered
              </Text>
            </View>
          </View>

          {/* Questions Grid */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: "100%" }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                paddingBottom: 8,
              }}
            >
              {questions.map((question, index) => {
                const isAnswered = question.id in answeredQuestions;
                const isCorrect = answeredQuestions[question.id];
                const isCurrent = index === currentQuestionIndex;

                let bgColor, borderColor, icon;

                if (isCurrent) {
                  bgColor = isDark ? "#1e40af" : "#dbeafe";
                  borderColor = "#3b82f6";
                } else if (isAnswered) {
                  if (isCorrect) {
                    bgColor = isDark ? "#14532d" : "#dcfce7";
                    borderColor = "#22c55e";
                    icon = <CheckCircle size={16} color="#22c55e" />;
                  } else {
                    bgColor = isDark ? "#450a0a" : "#fee2e2";
                    borderColor = "#ef4444";
                    icon = <XCircle size={16} color="#ef4444" />;
                  }
                } else {
                  bgColor = isDark ? "#1e293b" : "#ffffff";
                  borderColor = isDark ? "#475569" : "#cbd5e1";
                }

                return (
                  <Pressable
                    key={question.id}
                    onPress={() => handleQuestionPress(index)}
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: bgColor,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: borderColor,
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    {/* Question Number */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: isCurrent
                          ? "#3b82f6"
                          : isDark
                          ? "#ffffff"
                          : "#1f2937",
                      }}
                    >
                      {index + 1}
                    </Text>

                    {/* Status Icon */}
                    {icon && (
                      <View
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                        }}
                      >
                        {icon}
                      </View>
                    )}

                    {/* Current Indicator */}
                    {isCurrent && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 0,
                          right: 0,
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#3b82f6",
                          }}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Summary */}
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: isDark ? "#334155" : "#e5e7eb",
              flexDirection: "row",
              justifyContent: "space-around",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}
              >
                {Object.keys(answeredQuestions).length}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  marginTop: 2,
                }}
              >
                Answered
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#22c55e",
                }}
              >
                {
                  Object.values(answeredQuestions).filter((correct) => correct)
                    .length
                }
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  marginTop: 2,
                }}
              >
                Correct
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#ef4444",
                }}
              >
                {
                  Object.values(answeredQuestions).filter((correct) => !correct)
                    .length
                }
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  marginTop: 2,
                }}
              >
                Incorrect
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AllTasksDialog;
