import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QuestionBottomNavProps {
  pageType: string;
  currentQuestionIndex: number;
  questions: { id: string }[];
  selectedAnswers: Record<string, string[]>;
  answeredQuestions: Record<string, boolean>;
  enableFinishSaved: boolean;
  isCompleted: boolean;
  isSubmitting: boolean;
  isConfirmedAS: boolean;
  currentIconColor: string;
  currentQuestionId: string;
  previousQuestion: () => void;
  handleNextQuestion: () => void;
  setIsConfirmedAS: (state: boolean) => void;
  handleExamAnswerSelect: (option: string) => void;
}

export default function QuestionBottomNav({
  pageType,
  currentQuestionIndex,
  questions,
  selectedAnswers,
  answeredQuestions,
  enableFinishSaved,
  isSubmitting,
  isCompleted,
  isConfirmedAS,
  currentIconColor,
  currentQuestionId,
  previousQuestion,
  handleNextQuestion,
  setIsConfirmedAS,
  handleExamAnswerSelect,
}: QuestionBottomNavProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  if (isCompleted) {
    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? "#111827" : "#ffffff",
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: "100%",
            backgroundColor: "#06B6D4",
            paddingVertical: 16,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#06B6D4",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
            Finish Review
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // === Normal bottom nav ===
  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDark ? "#111827" : "#ffffff",
        paddingTop: 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Previous */}
      <TouchableOpacity
        onPress={previousQuestion}
        disabled={currentQuestionIndex === 0}
        activeOpacity={0.7}
        style={{
          backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          opacity: currentQuestionIndex === 0 ? 0.4 : 1,
          borderWidth: 1,
          borderColor: isDark ? "#374155" : "#e5e7eb",
        }}
      >
        <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} />
        <Text
          style={{
            color: isDark ? "#06B6D4" : "#0891B2",
            fontWeight: "600",
            marginLeft: 8,
          }}
        >
          Previous
        </Text>
      </TouchableOpacity>

      {/* Next / Answer / Finish */}
      <TouchableOpacity
        disabled={isSubmitting}
        onPress={() => {
          if (pageType === "exam") {
            const qId = questions[currentQuestionIndex].id;
            const selected = selectedAnswers[qId]?.[0];
            handleExamAnswerSelect(selected);
          }
          handleNextQuestion();
        }}
        activeOpacity={0.7}
        style={{
          backgroundColor: isSubmitting
            ? isDark
              ? "#334155"
              : "#d1d5db"
            : "#06B6D4",
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: isSubmitting ? "#000" : "#06B6D4",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "700",
                marginRight: 8,
              }}
            >
              {getNextButtonLabel({
                pageType,
                currentQuestionIndex,
                questions,
                selectedAnswers,
                answeredQuestions,
                enableFinishSaved,
              })}
            </Text>
            {!(
              pageType === "exam" &&
              selectedAnswers[questions[currentQuestionIndex].id]?.[0]
            ) && <ArrowRight size={18} color="#fff" />}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function getNextButtonLabel({
  pageType,
  currentQuestionIndex,
  questions,
  selectedAnswers,
  answeredQuestions,
  enableFinishSaved,
}: {
  pageType: string;
  currentQuestionIndex: number;
  questions: { id: string }[];
  selectedAnswers: Record<string, string[]>;
  answeredQuestions: Record<string, boolean>;
  enableFinishSaved: boolean;
}) {
  const questionId = questions[currentQuestionIndex].id;
  const selectedOption = selectedAnswers[questionId]?.[0];

  if (pageType === "exam") {
    const totalAnswered = Object.keys(answeredQuestions).length;

    if (
      totalAnswered === 5 &&
      questionId in answeredQuestions &&
      selectedOption
    ) {
      return "Finish Exam";
    }

    if (questionId in answeredQuestions) return "Next";
    if (selectedOption) return "Answer";
    return "Next";
  }

  if (Object.keys(answeredQuestions).length < questions.length) {
    return "Next";
  }
  if (currentQuestionIndex === questions.length - 1 && enableFinishSaved) {
    return "Finish Review";
  }
  return "Finish Test";
}
