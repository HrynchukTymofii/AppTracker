import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { CheckCircle, AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react-native";

interface ResultsCardProps {
  results: {
    passed: boolean;
    percentage: number;
    correctCount: number;
    totalQuestions: number;
    satScore?: number;
  };
  pageType: "exam" | "topic" | "saved" | "random" | "wrong";
  backUrl: string;
  nextTopicUrl?: string;
  setIsResetDialogOpen: (open: boolean) => void;
  handleRetakeQuiz: () => void;
  handleBack: (needSave?: boolean) => void;
  showResults: boolean;
  setShowResults: (show: boolean) => void;
  isDark?: boolean;
}

export default function ResultsModal({
  results,
  pageType,
  backUrl,
  nextTopicUrl,
  setIsResetDialogOpen,
  handleRetakeQuiz,
  handleBack,
  showResults,
  setShowResults,
  isDark = false,
}: ResultsCardProps) {
  const router = useRouter();

  if (!showResults || !results) return null;
  //console.log(results)

  const getGradientColors = (
  percentage: number,
  isDark: boolean
): readonly [string, string] => {
    if (percentage >= 90) {
      // Green
      return isDark ? ["#22c55e", "#16a34a"] : ["#22c55e", "#16a34a"];
    } else if (percentage >= 60) {
      // Yellow
      return isDark ? ["#facc15", "#ca8a04"] : ["#fef08a", "#facc15"];
    } else if (percentage >= 30) {
      // Blue
      return isDark ? ["#3b82f6", "#2563eb"] : ["#60a5fa", "#3b82f6"];
    } else {
      // Slate gray
      return isDark ? ["#64748b", "#475569"] : ["#cbd5e1", "#94a3b8"];
    }
  };

  const getResultText = (percentage: number, pageType: string): string => {
    if (pageType === "exam") {
      if (percentage >= 90) return "Exam Passed! 🎉";
      if (percentage >= 60) return "Almost Passed…";
      if (percentage >= 30) return "Keep Trying!";
      return "Unfortunately, you did not pass";
    } else {
      if (percentage >= 90) return "Excellent! 🌟";
      if (percentage >= 60) return "Good Job!";
      if (percentage >= 30) return "Keep Going!";
      return "Needs Improvement…";
    }
  };

  const getResultDescription = (percentage: number, pageType: string): string => {
    if (pageType === "exam") {
      if (percentage >= 90) return "Congratulations! You successfully completed the exam!";
      if (percentage >= 60) return "Good effort! Review a few points and try again.";
      if (percentage >= 30) return "Keep practicing and improve your skills!";
      return "Try again after reviewing the material.";
    } else {
      if (percentage >= 90) return "You successfully passed the test!";
      if (percentage >= 60) return "Nice work! Keep practicing to master it.";
      if (percentage >= 30) return "Keep studying and improving!";
      return "Don't worry, keep practicing and you’ll get it!";
    }
  };

  //console.log(results)


  return (
    <Animated.View
      entering={SlideInDown.delay(50)}
      exiting={SlideOutDown}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: isDark ? "#111827" : "#f9fafb",
        zIndex: 9999,
        paddingTop: 46,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => {setShowResults(false);}}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: isDark ? "#374155" : "#e5e7eb",
          }}
        >
          <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} />
          <Text style={{
            color: isDark ? "#06B6D4" : "#0891B2",
            fontWeight: "600",
            marginLeft: 8,
          }}>
            Back to questions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Results Card */}
        <View
          style={{
            backgroundColor: results.passed ? "#22c55e" : "#f59e0b",
            padding: 32,
            borderRadius: 16,
            marginBottom: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {results.passed ? (
            <CheckCircle size={80} color="white" style={{ marginBottom: 16 }} />
          ) : (
            <AlertTriangle
              size={80}
              color="white"
              style={{ marginBottom: 16 }}
            />
          )}

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: "#fff",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
           {getResultText(results.percentage, pageType)}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#fff",
              opacity: 0.95,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {getResultDescription(results.percentage, pageType)}
          </Text>
        </View>

        {/* Result Numbers */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginBottom: 24,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#111",
                marginBottom: 4,
              }}
            >
              {pageType === "exam" && results.satScore ? results.satScore : `${results.percentage}%`}
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? "#ccc" : "#555" }}>
              {pageType === "exam" ? "SAT Score" : "Score"}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#111",
                marginBottom: 4,
              }}
            >
              {results.correctCount}/{results.totalQuestions}
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? "#ccc" : "#555" }}>
              Correct
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "column", gap: 12 }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => handleBack(false)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#374155" : "#e5e7eb",
            }}
          >
            <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} style={{ marginRight: 8 }} />
            <Text style={{
              color: isDark ? "#06B6D4" : "#0891B2",
              fontWeight: "700",
              fontSize: 16,
            }}>
              {backUrl === "/" ? "Back to Course" : "Back to Topics"}
            </Text>
          </TouchableOpacity>

          {/* Retake Quiz Button */}
          {pageType !== "wrong" && (
            <TouchableOpacity
              onPress={() => {
                handleRetakeQuiz();
              }}
              activeOpacity={0.7}
              style={{
                backgroundColor: "#06B6D4",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 16,
                borderRadius: 12,
                shadowColor: "#06B6D4",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <RotateCcw size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 16,
              }}>
                Retake Quiz
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}
