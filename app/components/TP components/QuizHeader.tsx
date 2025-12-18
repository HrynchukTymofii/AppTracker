import { View, Text, TouchableOpacity, Animated } from "react-native";
import { ArrowLeft, Clock, RotateCcw, LayoutGrid } from "lucide-react-native";
import TimeAlert from "./TimeAlert";
import { Question } from "@/types";
import { useEffect, useImperativeHandle, useState, useRef } from "react";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";

export interface QuizHeaderRef {
  startExam: () => void;
  getTimeElapsed: () => number;
  resumeExam: (elapsedSeconds: number) => void;
}

interface QuizHeaderProps {
  quizTitle: string;
  currentQuestionIndex: number;
  questions: Question[];
  answeredQuestions: Record<string, boolean>;
  pageType: string;
  currentIconColor: string;
  maxFreeIndex: number;
  toggleResetDialog: () => void;
  toggleAllTasksDialog: () => void;
  setCurrentQuestionIndex: (index: number) => void;
  setIsProModalOpen: (isOpen: boolean) => void;
  handleBack: (needSave?: boolean) => void;
  submitQuizResults: () => void;
  ref?: React.Ref<QuizHeaderRef>;
  tourActive?: boolean;
  currentStep?: number;
  handleTourNext?: () => void;
  handleTourPrev?: () => void;
  skipTour?: () => void;
  isNumbersQuiz?: boolean;
}

export default function QuizHeader({
  currentQuestionIndex,
  questions,
  answeredQuestions,
  pageType,
  currentIconColor,
  maxFreeIndex,
  toggleResetDialog,
  toggleAllTasksDialog,
  setCurrentQuestionIndex,
  setIsProModalOpen,
  handleBack,
  submitQuizResults,
  ref,
  tourActive = false,
  currentStep = 0,
  handleTourNext = () => {},
  handleTourPrev = () => {},
  skipTour = () => {},
  isNumbersQuiz = false,
}: QuizHeaderProps) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const timeLimit = 70 * 60; // 70 minutes

  // Animation for glowing effect
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    startExam() {
      setTimeSpent(0);
      setStartTime(Date.now());
      setIsExamStarted(true);
      setIsExamFinished(false);
    },
    getTimeElapsed() {
      return timeSpent;
    },
    resumeExam(elapsedSeconds: number) {
      setTimeSpent(elapsedSeconds);
      setStartTime(Date.now() - elapsedSeconds * 1000);
      setIsExamStarted(true);
      setIsExamFinished(false);
    },
  }));

  useEffect(() => {
    if (!isExamStarted || isExamFinished) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(elapsed);

      if (pageType === "exam" && elapsed >= timeLimit) {
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamStarted, startTime, timeLimit, isExamFinished]);

  // Check if quiz is completed
  const isQuizCompleted = Object.keys(answeredQuestions).length >= questions.length;

  // Glowing animation when quiz is completed
  useEffect(() => {
    if (isQuizCompleted && pageType !== "exam" && pageType !== "saved") {
      // Glow animation (for opacity)
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [isQuizCompleted, pageType]);

  const handleAutoSubmit = () => {
    Toast.show({
      type: "error",
      text1: "Time’s up! The exam has been automatically submitted.",
      position: "top",
      visibilityTime: 2500,
      autoHide: true,
      topOffset: 60,
    });
    submitQuizResults();
  };

  const getBackButtonText = () => {
    if (
      Object.keys(answeredQuestions).length >= questions.length ||
      pageType === "saved"
    )
      return "Back to Topics";
    if (pageType === "exam") return "Stop Exam";
    return "Finish Later";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const timeRemaining = Math.max(0, timeLimit - timeSpent);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flexDirection: "column", gap: 8, marginTop: 8, paddingHorizontal: 12 }}>
      {/* Top Header */}
      <View style={{ flexDirection: "row", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => handleBack()}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "#374155" : "#e5e7eb",
          }}
        >
          <ArrowLeft size={18} color={isDark ? "#06B6D4" : "#0891B2"} />
          <Text style={{
            color: isDark ? "#06B6D4" : "#0891B2",
            fontWeight: "600",
            marginLeft: 8,
            fontSize: 14
          }}>
            {getBackButtonText()}
          </Text>
        </TouchableOpacity>

        {/* All Tasks and Reset Buttons */}
        {pageType !== "wrong" &&
          pageType !== "exam" &&
          Object.keys(answeredQuestions).length > 0 && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* All Tasks Button */}
              <View style={{ position: "relative" }}>
                {isQuizCompleted && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      backgroundColor: "#06B6D4",
                      borderRadius: 16,
                      opacity: glowAnim,
                    }}
                  />
                )}
                <Animated.View
                  style={{
                    transform: [{ scale: isQuizCompleted ? scaleAnim : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={toggleAllTasksDialog}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: isQuizCompleted ? 2 : 1,
                      borderColor: isQuizCompleted
                        ? "#06B6D4"
                        : isDark
                        ? "#374155"
                        : "#e5e7eb",
                    }}
                  >
                    <LayoutGrid size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Reset Button */}
              <View style={{ position: "relative" }}>
                {isQuizCompleted && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      backgroundColor: "#06B6D4",
                      borderRadius: 16,
                      opacity: glowAnim,
                    }}
                  />
                )}
                <Animated.View
                  style={{
                    transform: [{ scale: isQuizCompleted ? scaleAnim : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onPress={toggleResetDialog}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: isQuizCompleted ? 2 : 1,
                      borderColor: isQuizCompleted
                        ? "#06B6D4"
                        : isDark
                        ? "#374155"
                        : "#e5e7eb",
                    }}
                  >
                    <RotateCcw size={20} color={isDark ? "#06B6D4" : "#0891B2"} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}

        {pageType === "exam" && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: timeRemaining < 300 ? "#ef4444" : (isDark ? "#374155" : "#e5e7eb"),
          }}>
            <Clock size={20} color={timeRemaining < 300 ? "#ef4444" : "#06B6D4"} />
            <Text style={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: "600",
              color: timeRemaining < 300 ? "#ef4444" : (isDark ? "#06B6D4" : "#0891B2"),
            }}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Question Number Scroller */}
      {/* <QuestionNumberScroller
        questions={questions}
        answeredQuestions={answeredQuestions}
        currentQuestionIndex={currentQuestionIndex}
        pageType={pageType}
        maxFreeIndex={maxFreeIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        setIsProModalOpen={setIsProModalOpen}
      /> */}

      {/* Alert for last 5 minutes */}
      {pageType === "exam" && timeRemaining < 300 && <TimeAlert />}
    </View>
  );
}
