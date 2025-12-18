import { ScrollView, Pressable, Text, View } from "react-native";
import { Question } from "@/types";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useRef } from "react";
import { useColorScheme } from "@/hooks/useColorScheme";

interface QuestionNumberScrollerProps {
  questions: Question[];
  answeredQuestions: Record<string, boolean>;
  currentQuestionIndex: number;
  pageType: string;
  maxFreeIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  setIsProModalOpen: (isOpen: boolean) => void;
}

export default function QuestionNumberScroller({
  questions,
  answeredQuestions,
  currentQuestionIndex,
  pageType,
  maxFreeIndex,
  setCurrentQuestionIndex,
  setIsProModalOpen,
}: QuestionNumberScrollerProps) {
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const questionRefs = useRef<(View | null)[]>([]);

  useEffect(() => {
    const index = currentQuestionIndex;
    if (index >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: index * 48, animated: true });
    }
  }, [currentQuestionIndex]);
  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      style={{ marginTop: 8, maxHeight: 50 }}
    >
      {questions.map((_, index) => {
        const questionId = questions[index].id;
        const isAnswered = questionId in answeredQuestions;
        const isCorrect = answeredQuestions[questionId];
        const isLocked =
          pageType === "topic" && !user?.isPro && index > maxFreeIndex;

        return (
          <QuestionNumberButton
            key={index}
            index={index}
            isCurrent={currentQuestionIndex === index}
            questionId={questionId}
            questionRef={questionRefs.current[index]}
            isLocked={isLocked}
            isCorrect={isCorrect}
            isAnswered={isAnswered}
            setIsProModalOpen={setIsProModalOpen}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
          />
        );
      })}
    </ScrollView>
  );
}

interface QuestionNumberButtonProps {
  index: number;
  isCurrent: boolean;
  questionId: string;
  questionRef: View | null;
  isLocked: boolean;
  isAnswered: boolean;
  isCorrect: boolean;
  setIsProModalOpen: (isOpen: boolean) => void;
  setCurrentQuestionIndex: (index: number) => void;
}

const QuestionNumberButton = ({
  index,
  isCurrent,
  questionId,
  questionRef,
  isLocked,
  isAnswered,
  isCorrect,
  setIsProModalOpen,
  setCurrentQuestionIndex,
}: QuestionNumberButtonProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    if (isLocked) {
      //console.log("isLockedNB");
      setIsProModalOpen(true);
      return;
    }
    setCurrentQuestionIndex(index);
  };

  let backgroundColor, borderColor, borderWidth, textColor;

  if (isLocked) {
    backgroundColor = isDark ? "#374155" : "#9ca3af";
    borderColor = "transparent";
    borderWidth = 0;
    textColor = isDark ? "#6b7280" : "#e5e7eb";
  } else if (isAnswered) {
    backgroundColor = isCorrect ? "#22c55e" : "#ef4444";
    borderColor = "transparent";
    borderWidth = 0;
    textColor = "#ffffff";
  } else if (isCurrent) {
    backgroundColor = isDark ? "#1e293b" : "#ffffff";
    borderColor = "#06B6D4";
    borderWidth = 2;
    textColor = "#06B6D4";
  } else {
    backgroundColor = isDark ? "#1f2937" : "#f3f4f6";
    borderColor = isDark ? "#374155" : "#e5e7eb";
    borderWidth = 1;
    textColor = isDark ? "#9ca3af" : "#6b7280";
  }

  return (
    <Pressable
      key={questionId}
      ref={(el) => {
        if (questionRef) questionRef = el;
      }}
      onPress={handlePress}
      style={{
        width: 48,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        borderWidth,
        borderColor,
        opacity: isLocked ? 0.6 : 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: textColor,
        }}
      >
        {index + 1}
      </Text>
    </Pressable>
  );
};
