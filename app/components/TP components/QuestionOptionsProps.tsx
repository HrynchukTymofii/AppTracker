import React from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { CheckCircle, XCircle } from "lucide-react-native";
import { Question } from "@/types";
import { useColorScheme } from "@/hooks/useColorScheme";

interface QuestionOptionsProps {
  currentQuestion: Question;
  selectedAnswers: Record<string, string[]>;
  isAnswered: boolean;
  pageType: string;
  handleAnswerSelect: (option: string) => void;
}

const QuestionOptions = ({
  currentQuestion,
  selectedAnswers,
  isAnswered,
  pageType,
  handleAnswerSelect,
}: QuestionOptionsProps) => {
  const [scale] = React.useState(new Animated.Value(1));
  const [gridInValue, setGridInValue] = React.useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Initialize grid-in value from selectedAnswers
  React.useEffect(() => {
    if (currentQuestion.questionType === "grid_in") {
      const currentAnswer = selectedAnswers[currentQuestion.id]?.[0] || "";
      setGridInValue(currentAnswer);
    }
  }, [currentQuestion.id, selectedAnswers]);

  // Handle grid-in input submission
  const handleGridInSubmit = () => {
    if (gridInValue.trim()) {
      handleAnswerSelect(gridInValue.trim());
    }
  };

  // If this is a grid-in question, render input field
  if (currentQuestion.questionType === "grid_in") {
    const userAnswer = selectedAnswers[currentQuestion.id]?.[0];
    const correctAnswer = currentQuestion.answers[0];
    const isCorrect = isAnswered && userAnswer === correctAnswer;
    const isIncorrect = isAnswered && userAnswer !== correctAnswer;

    return (
      <View style={{ gap: 16, paddingHorizontal: 8 }}>
        {/* Instructional Text */}
        {!isAnswered && <View
          style={{
            backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
            borderLeftWidth: 3,
            borderLeftColor: "#3b82f6",
          }}
        >
          <Text
            style={{
              color: isDark ? "#93c5fd" : "#1e40af",
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            💡 Write your answer as a decimal using a dot (e.g., 3.14 or 42)
          </Text>
        </View>}

        {/* Input Field Container */}
        <View style={{ gap: 12 }}>
          <TextInput
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderWidth: isAnswered ? 2 : 1,
              borderColor: isCorrect
                ? "#22c55e"
                : isIncorrect
                ? "#ef4444"
                : isDark
                ? "#334155"
                : "#e5e7eb",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 16,
              fontSize: 18,
              fontWeight: "500",
              color: isDark ? "#ffffff" : "#1f2937",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
            placeholder="Enter your answer..."
            placeholderTextColor={isDark ? "#64748b" : "#9ca3af"}
            value={gridInValue}
            onChangeText={setGridInValue}
            keyboardType="numeric"
            editable={!isAnswered}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Submit Button */}
          {!isAnswered && (
            <Pressable
              onPress={handleGridInSubmit}
              disabled={!gridInValue.trim()}
              style={{
                backgroundColor: gridInValue.trim()
                  ? "#06B6D4"
                  : isDark
                  ? "#334155"
                  : "#e5e7eb",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: gridInValue.trim()
                    ? "#ffffff"
                    : isDark
                    ? "#64748b"
                    : "#9ca3af",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Submit Answer
              </Text>
            </Pressable>
          )}

          {/* Feedback Display */}
          {isAnswered && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: isCorrect
                  ? isDark
                    ? "#14532d"
                    : "#dcfce7"
                  : isDark
                  ? "#450a0a"
                  : "#fee2e2",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isCorrect ? "#22c55e" : "#ef4444",
              }}
            >
              {isCorrect ? (
                <CheckCircle size={24} color="#22c55e" />
              ) : (
                <XCircle size={24} color="#ef4444" />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isDark ? "#ffffff" : "#1f2937",
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  {isCorrect ? "Correct!" : "Incorrect"}
                </Text>
                {isIncorrect && (
                  <Text
                    style={{
                      color: isDark ? "#fca5a5" : "#dc2626",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    Correct answer: {correctAnswer}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Check if all options are short (10 characters or less)
  const allOptionsShort = currentQuestion.options.every(
    (option) => option.length <= 10
  );

  // If all options are short, display in 2 columns
  if (allOptionsShort) {
    return (
      <View style={{ gap: 16, paddingHorizontal: 8 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Left column */}
          <View style={{ flex: 1, gap: 12 }}>
            {currentQuestion.options
              .filter((_, index) => index % 2 === 0)
              .map((option, idx) => {
                const index = idx * 2;
                const isSelected =
                  selectedAnswers[currentQuestion.id]?.includes(option) || false;
                const isCorrectOption = currentQuestion.answers.includes(option);

                let bgColor, borderColor, borderWidth;

                if (!isAnswered) {
                  bgColor = isSelected
                    ? (isDark ? "#1e293b" : "#ffffff")
                    : (isDark ? "#1e293b" : "#ffffff");
                  borderColor = isSelected ? "#06B6D4" : (isDark ? "#334155" : "#e5e7eb");
                  borderWidth = isSelected ? 2 : 1;
                } else if (isCorrectOption) {
                  bgColor = isDark ? "#14532d" : "#dcfce7";
                  borderColor = "#22c55e";
                  borderWidth = 2;
                } else if (isSelected) {
                  bgColor = isDark ? "#450a0a" : "#fee2e2";
                  borderColor = "#ef4444";
                  borderWidth = 2;
                } else {
                  bgColor = isDark ? "#1e293b" : "#ffffff";
                  borderColor = isDark ? "#334155" : "#e5e7eb";
                  borderWidth = 1;
                }

                return (
                  <Animated.View key={index} style={{ transform: [{ scale }] }}>
                    <Pressable
                      onPress={() => !isAnswered && handleAnswerSelect(option)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth,
                        borderColor,
                        backgroundColor: bgColor,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {isAnswered && isCorrectOption && (
                        <CheckCircle
                          size={20}
                          color="#22c55e"
                          style={{ position: "absolute", top: 8, right: 8 }}
                        />
                      )}
                      {isAnswered && !isCorrectOption && isSelected && (
                        <XCircle
                          size={20}
                          color="#ef4444"
                          style={{ position: "absolute", top: 8, right: 8 }}
                        />
                      )}
                      <Text
                        style={{
                          color: isDark ? "#ffffff" : "#1f2937",
                          fontWeight: "400",
                          fontSize: 18,
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
          </View>

          {/* Right column */}
          <View style={{ flex: 1, gap: 12 }}>
            {currentQuestion.options
              .filter((_, index) => index % 2 === 1)
              .map((option, idx) => {
                const index = idx * 2 + 1;
                const isSelected =
                  selectedAnswers[currentQuestion.id]?.includes(option) || false;
                const isCorrectOption = currentQuestion.answers.includes(option);

                let bgColor, borderColor, borderWidth;

                if (!isAnswered) {
                  bgColor = isSelected
                    ? (isDark ? "#1e293b" : "#ffffff")
                    : (isDark ? "#1e293b" : "#ffffff");
                  borderColor = isSelected ? "#06B6D4" : (isDark ? "#334155" : "#e5e7eb");
                  borderWidth = isSelected ? 2 : 1;
                } else if (isCorrectOption) {
                  bgColor = isDark ? "#14532d" : "#dcfce7";
                  borderColor = "#22c55e";
                  borderWidth = 2;
                } else if (isSelected) {
                  bgColor = isDark ? "#450a0a" : "#fee2e2";
                  borderColor = "#ef4444";
                  borderWidth = 2;
                } else {
                  bgColor = isDark ? "#1e293b" : "#ffffff";
                  borderColor = isDark ? "#334155" : "#e5e7eb";
                  borderWidth = 1;
                }

                return (
                  <Animated.View key={index} style={{ transform: [{ scale }] }}>
                    <Pressable
                      onPress={() => !isAnswered && handleAnswerSelect(option)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth,
                        borderColor,
                        backgroundColor: bgColor,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {isAnswered && isCorrectOption && (
                        <CheckCircle
                          size={20}
                          color="#22c55e"
                          style={{ position: "absolute", top: 8, right: 8 }}
                        />
                      )}
                      {isAnswered && !isCorrectOption && isSelected && (
                        <XCircle
                          size={20}
                          color="#ef4444"
                          style={{ position: "absolute", top: 8, right: 8 }}
                        />
                      )}
                      <Text
                        style={{
                          color: isDark ? "#ffffff" : "#1f2937",
                          fontWeight: "400",
                          fontSize: 18,
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
          </View>
        </View>
      </View>
    );
  }

  // Default single column layout for longer options
  return (
    <View style={{ gap: 16, paddingHorizontal: 8 }}>
      {currentQuestion.options.map((option, index) => {
        const isSelected =
          selectedAnswers[currentQuestion.id]?.includes(option) || false;
        const isCorrectOption = currentQuestion.answers.includes(option);

        let bgColor, borderColor, borderWidth;

        if (!isAnswered) {
          bgColor = isSelected
            ? (isDark ? "#1e293b" : "#ffffff")
            : (isDark ? "#1e293b" : "#ffffff");
          borderColor = isSelected ? "#06B6D4" : (isDark ? "#334155" : "#e5e7eb");
          borderWidth = isSelected ? 2 : 1;
        } else if (isCorrectOption) {
          bgColor = isDark ? "#14532d" : "#dcfce7";
          borderColor = "#22c55e";
          borderWidth = 2;
        } else if (isSelected) {
          bgColor = isDark ? "#450a0a" : "#fee2e2";
          borderColor = "#ef4444";
          borderWidth = 2;
        } else {
          bgColor = isDark ? "#1e293b" : "#ffffff";
          borderColor = isDark ? "#334155" : "#e5e7eb";
          borderWidth = 1;
        }

        return (
          <Animated.View key={index} style={{ transform: [{ scale }] }}>
            <Pressable
              onPress={() => !isAnswered && handleAnswerSelect(option)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth,
                borderColor,
                backgroundColor: bgColor,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {isAnswered && isCorrectOption && (
                <CheckCircle size={20} color="#22c55e" />
              )}
              {isAnswered && !isCorrectOption && isSelected && (
                <XCircle size={20} color="#ef4444" />
              )}
              <Text style={{
                flex: 1,
                color: isDark ? "#ffffff" : "#1f2937",
                fontWeight: "500",
                fontSize: 15,
                lineHeight: 22,
              }}>
                {option}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default QuestionOptions;
