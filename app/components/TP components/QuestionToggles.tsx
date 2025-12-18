import { saveQuestion } from "@/lib/api/quiz";
import { useQuestionDatabase } from "@/lib/db/question";
import { enqueueOfflineAction } from "@/lib/offlineQueue";
import { Question } from "@/types";
import { Bookmark, Lightbulb } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface QuestionTogglesProps {
  currentQuestion: Question;
  currentIconColor: string;
  currentQuestionIndex: number;
  token: string;
  chapterId: string;
  quizId: string;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onHintPress: () => void;
}

const QuestionToggles = ({
  currentQuestion,
  currentIconColor,
  currentQuestionIndex,
  token,
  chapterId,
  quizId,
  setQuestions,
  onHintPress,
}: QuestionTogglesProps) => {
  const {
    toggleSaveQuestionLocal,
  } = useQuestionDatabase();
  const toggleSaveQuestion = async () => {
    const updated = await toggleSaveQuestionLocal(currentQuestion.id);
    setLocalQuestionState("isSaved", updated);

    saveQuestion(token, currentQuestion.id).catch(() =>
      enqueueOfflineAction({
        type: "toggleSave",
        payload: { questionId: currentQuestion.id },
      })
    );
  };

  const setLocalQuestionState = (key: keyof Question, value: boolean) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        [key]: value,
      };
      return updated;
    });
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const hintButton = currentQuestion.hint ? (
    <TouchableOpacity
      onPress={onHintPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? "#374155" : "#e5e7eb",
      }}
    >
      <Lightbulb
        size={20}
        color="#f59e0b"
        fill="#f59e0b"
      />
    </TouchableOpacity>
  ) : null;

  const saveButton = (
    <TouchableOpacity
      onPress={toggleSaveQuestion}
      activeOpacity={0.7}
      style={{
        backgroundColor: currentQuestion.isSaved
          ? (isDark ? "#1e40af" : "#dbeafe")
          : (isDark ? "#1f2937" : "#f3f4f6"),
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: currentQuestion.isSaved
          ? "#06B6D4"
          : (isDark ? "#374155" : "#e5e7eb"),
      }}
    >
      <Bookmark
        size={20}
        color={currentQuestion.isSaved ? "#06B6D4" : (isDark ? "#9ca3af" : "#6b7280")}
        fill={currentQuestion.isSaved ? "#06B6D4" : "transparent"}
      />
    </TouchableOpacity>
  );

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {/* Hint Button */}
      {currentQuestion.hint && hintButton}

      {/* Bookmark Button */}
      {saveButton}
    </View>
  );
};

export default QuestionToggles;
