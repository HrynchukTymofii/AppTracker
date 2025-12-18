import { useEffect, useRef, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { ResetTestDialog } from "./modals/ResetTestDialog";
import AllTasksDialog from "./modals/AllTasksDialog";
import Toast from "react-native-toast-message";
import {
  Animated, 
  BackHandler,
  Dimensions,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { resetQuiz, submitQuizAnswers, updateUserPoints } from "@/lib/api/quiz";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useQuizDatabase } from "@/lib/db/quiz";
import { useAuth } from "@/context/AuthContext";
import { enqueueOfflineAction } from "@/lib/offlineQueue";
import { HintModal } from "./modals/HintModal";
import { wrapHtmlContent } from "@/lib/htmlWrapper";
import { Question } from "@/types";
import QuizHeader, { QuizHeaderRef } from "./TP components/QuizHeader";
import QuestionToggles from "./TP components/QuestionToggles";
import QuestionOptions from "./TP components/QuestionOptionsProps";
import QuestionBottomNav from "./TP components/QuestionBottomNav";
import QuestionImage from "./QuestionImage";
import AutoHeightWebView from "react-native-autoheight-webview";
import GraduationCap3DLoader from "./ui/GraduationCapLoader";
import ResultsModal from "./TP components/ResultsCard";
import { useTour } from "@/context/TourContext";
import { TourTooltip } from "./Tour/TourTooltip";
import { TOUR_STEPS, TOTAL_TOUR_STEPS, getTourStepInfo } from "@/constants/tourSteps";
import * as SecureStore from "expo-secure-store";
import { calculateSATScore } from "@/lib/utils";

interface LatestResult {
  score: number;
  answers: Record<string, string[]>;
}

interface TestsPageProps {
  quiz: {
    id: string;
    title: string;
    chapterId: string;
    chapterTitle: string;
    questions: Question[];
  };
  token: string;
  backUrl?: string;
  nextTopicUrl?: string;
  latestResult?: LatestResult | null;
  pageType?: "wrong" | "saved" | "topic" | "random" | "worst" | "exam";
  onRestart?: () => void;
}


/**
 * Save exam state to SecureStore (exam ID and time elapsed)
 */
const saveExamState = async (examId: string, timeElapsed: number) => {
  try {
    const examState = JSON.stringify({
      examId,
      timeElapsed,
      timestamp: Date.now(),
    });
    await SecureStore.setItemAsync("paused_exam", examState);
  } catch (error) {
    console.error("Failed to save exam state:", error);
  }
};

/**
 * Load exam state from SecureStore
 */
const loadExamState = async (): Promise<{ examId: string; timeElapsed: number } | null> => {
  try {
    const examState = await SecureStore.getItemAsync("paused_exam");
    if (examState) {
      return JSON.parse(examState);
    }
    return null;
  } catch (error) {
    console.error("Failed to load exam state:", error);
    return null;
  }
};

/**
 * Clear exam state from SecureStore
 */
const clearExamState = async () => {
  try {
    await SecureStore.deleteItemAsync("paused_exam");
  } catch (error) {
    console.error("Failed to clear exam state:", error);
  }
};

const TestsPage = ({
  quiz,
  token,
  backUrl = "",
  nextTopicUrl,
  latestResult,
  pageType = "topic",
  onRestart,
}: TestsPageProps) => {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string[]>
  >({});
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<string, boolean>
  >({});

  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasReseted, setWasReseted] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isAllTasksDialogOpen, setIsAllTasksDialogOpen] = useState(false);
  const [enableFinishSaved, setEnableFinishedSaved] = useState(false);

  const [isCompleated, setIsCompleated] = useState(false);
  const { user, setUser } = useAuth();

  const [isConfirmedAS, setIsConfirmedAS] = useState(false);

  const [webViewLoading, setWebViewLoading] = useState(false);

  const quizHeaderRef = useRef<QuizHeaderRef>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { resetQuizLocal, submitQuizAnswersLocal, fetchSavedQuizAnswersLocal } = useQuizDatabase();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);

  const [questions, setQuestions] = useState(quiz.questions);
  const answeredQuestionsRef = useRef(answeredQuestions);
  const selectedAnswersRef = useRef(selectedAnswers);

  // Tour
  const { tourActive, currentStep, setCurrentStep, endTour, skipTour, numbersQuizId } = useTour();
  const isNumbersQuiz = quiz.id === numbersQuizId;

  const handleTourNext = () => {
    if (currentStep === TOTAL_TOUR_STEPS - 1) {
      endTour();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTourPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isSubmittingRef = useRef(false);
  const hasStartedExamRef = useRef(false);

  // useEffect(() => {
  //   console.log("🧠 TestsPage mounted");

  //   return () => {
  //     console.log("🧹 TestsPage unmounted");
  //   };
  // }, []);

  useEffect(() => {
    answeredQuestionsRef.current = answeredQuestions;
  }, [answeredQuestions]);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);
  const currentQuestion = questions[currentQuestionIndex];
  const maxFreeIndex = questions.length - 1;

  /**
   * Initializes the quiz state from the latest quiz result when the component mounts.
   *
   * Conditions:
   * - Runs only once on mount
   * - Only applies for `topic` and `worst` page types.
   *
   * Behavior:
   * 1. Copies the user's previous answers from `latestResult.answers` into `selectedAnswers`.
   * 2. Builds an `answeredQuestions` map where each question ID is marked:
   *    - `true` if all selected answers match the correct answers exactly.
   *    - `false` otherwise.
   * 3. Finds the first unanswered question within the free-access range (`maxFreeIndex`)
   *    and sets it as the current question index state:
   *    - If all free questions are answered, sets the last free question as current.
   */
  useEffect(() => {
    const answers = latestResult?.answers;
    if (!answers || !(pageType === "topic")) return;   //TODO exam prew results  || pageType === "exam"

    const latestResultLength = Object.keys(latestResult?.answers ?? {}).length;
    if (latestResultLength == questions.length) {
      setIsCompleated(true);
    }

    const answeredQuestions: Record<string, boolean> = Object.fromEntries(
      Object.entries(answers).map(([questionId, userAnswers]) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        const isCorrect = question
          ? checkIsCorrect(question.answers, userAnswers)
          : false;
        return [questionId, isCorrect] as const;
      })
    );

    setSelectedAnswers(answers);
    setAnsweredQuestions(answeredQuestions);

    const firstUnansweredFreeIndex = quiz.questions.findIndex(
      (q, idx) => !answers[q.id] && idx <= maxFreeIndex
    );

    setCurrentQuestionIndex(
      firstUnansweredFreeIndex >= 0 ? firstUnansweredFreeIndex : maxFreeIndex
    );
  }, []);

  /**
   * Starts or resumes the exam when the component mounts
   * if the current page type is "exam".
   * Checks SecureStore for saved exam state and quiz_results for saved answers.
   */

  useEffect(() => {
    if (pageType == "exam") startExam();
  }, []);
  // useEffect(() => {
  //   const initializeExam = async () => {
  //     if (pageType !== "exam") return;

  //     // Check if there's a saved exam state
  //     const savedState = await loadExamState();

  //     if (savedState && savedState.examId === quiz.id) {
  //       // Resume the saved exam
  //       try {
  //         // Load saved answers from quiz_results
  //         const savedAnswers = await fetchSavedQuizAnswersLocal(quiz.id);

  //         if (savedAnswers && Object.keys(savedAnswers).length > 0) {
  //           setSelectedAnswers(savedAnswers);

  //           // Mark questions as answered based on correctness
  //           const answeredQs: Record<string, boolean> = {};
  //           for (const questionId in savedAnswers) {
  //             const question = quiz.questions.find(q => q.id === questionId);
  //             if (question) {
  //               const userAnswers = savedAnswers[questionId];
  //               const isCorrect = checkIsCorrect(question.answers, userAnswers);
  //               answeredQs[questionId] = isCorrect;
  //             }
  //           }
  //           setAnsweredQuestions(answeredQs);
  //         }

  //         // Resume exam with saved time
  //         quizHeaderRef.current?.resumeExam(savedState.timeElapsed);

  //         Toast.show({
  //           type: "info",
  //           text1: "Exam resumed",
  //           text2: "Continuing from where you left off",
  //           position: "top",
  //           visibilityTime: 2000,
  //         });
  //       } catch (error) {
  //         console.error("Failed to restore exam state:", error);
  //         // If restoration fails, start fresh
  //         startExam();
  //       }
  //     } else {
  //       // Start fresh exam
  //       startExam();
  //     }
  //   };

  //   initializeExam();
  // }, []);

  // useFocusEffect(
  //   useCallback(() => {
  //     console.log('preStartExam')
  //     if (pageType === "exam") startExam();

  //     return () => {
  //        hasStartedExamRef.current = false;
  //     setSelectedAnswers({});
  //     setAnsweredQuestions({});
  //     setCurrentQuestionIndex(0);
  //     };
  //   }, [pageType])
  // );


  /**
   * Handles the hardware back button navigation for both Android and iOS.
   *
   * - On Android, intercepts the hardware back button and calls `handleBack()`.
   * - On iOS / other platforms, intercepts the navigation "beforeRemove" event
   *   (e.g., back swipe or back button in header) and calls `handleBack()`.
   */
  useEffect(() => {
    if (Platform.OS === "android") {
      const backAction = () => {
        handleBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }

    const onBeforeRemove = (e: any) => {
      e.preventDefault();

      // Remove the listener to avoid recursive firing
      navigation.removeListener("beforeRemove", onBeforeRemove);

      handleBack();
    };

    navigation.addListener("beforeRemove", onBeforeRemove);

    return () => {
      navigation.removeListener("beforeRemove", onBeforeRemove);
    };
  }, []);

  // useEffect(() => {
  //   return () => {
  //     hasStartedExamRef.current = false;
  //   };
  // }, []);

  useEffect(() => {
    if (answeredQuestions[currentQuestion.id]) {
      handleNextQuestion();
    }
  }, [selectedAnswers, answeredQuestions]);

  /**
   * Starts or Restarts the exam by initializing the quiz state.
   *
   * Behavior:
   * - Clears all previously selected answers (`selectedAnswers`, `answeredQuestions`).
   * - Resets the current question index to 0.
   * - Hides the results (`showResults`) and clears the `results` object.
   * - Calls `startExam()` on the quiz header via `quizHeaderRef`.
   * - Shows a success toast notifying the user that the exam has started.
   */
  const startExam = () => {
    // if (hasStartedExamRef.current) return; // 🔒 prevent duplicates
    // hasStartedExamRef.current = true;
    setSelectedAnswers({});
    setAnsweredQuestions({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setResults(null);
    quizHeaderRef.current?.startExam();

    Toast.show({
      type: "success",
      text1: "Exam started! Good luck!",
      position: "top",
      visibilityTime: 1000,
    });
  };

  /**
   * Handles navigating back from the quiz page.
   *
   * Behavior:
   * - For exams: saves current progress to quiz_results and exam state to SecureStore
   * - For other page types: submits the quiz results if needSave is true
   * - Navigates back to the URL specified by `backUrl`.
   *
   * @param needSave - Whether to save/submit the quiz before navigating back (default: true)
   */
  const handleBack = async (needSave: boolean = true) => {
    // if (pageType === "exam" && needSave) {
    //   // For exams, save progress but don't submit final results
    //   try {
    //     // Save answers to quiz_results table
    //     const answersToSave = selectedAnswersRef.current;
    //     if (Object.keys(answersToSave).length > 0) {
    //       await submitQuizAnswersLocal(quiz.id, answersToSave, "PATCH");
    //     }

    //     // Get current time elapsed from QuizHeader
    //     const timeElapsed = quizHeaderRef.current?.getTimeElapsed?.() ?? 0;

    //     // Save exam state to SecureStore
    //     await saveExamState(quiz.id, timeElapsed);

    //     Toast.show({
    //       type: "success",
    //       text1: "Exam paused and saved",
    //       position: "top",
    //       visibilityTime: 1500,
    //     });
    //   } catch (e) {
    //     console.warn("Failed to save exam progress:", e);
    //   }
    // } else 
    if (pageType !== "saved" && needSave) {
      try {
        await submitQuizResults();
      } catch (e) {
        console.warn("submit failed", e);
      }
    }
    //console.log('Pre router')
    if (router.canGoBack()) {
      router.back();
      return; // stop further code
    }
    //console.log("Pre router2");
    if (Platform.OS == "android") {
      router.replace(backUrl as any);
    } else {
      //console.log('do push')
      router.push(backUrl as any);
    }
    //console.log('After router')
  };

  /**
   * Checks if the user's answers match the correct answers exactly.
   *
   * @param correctAnswers - Array of correct answer strings
   * @param userAnswers - Array of user's selected answer strings
   * @returns true if both arrays contain the same items, false otherwise
   */
  const checkIsCorrect = (
    correctAnswers: string[],
    userAnswers: string[]
  ): boolean => {
    return (
      correctAnswers.length === userAnswers.length &&
      correctAnswers.every((a) => userAnswers.includes(a))
    );
  };

  const handleAnswerSelect = (option: string) => {
    const questionId = currentQuestion.id;
    const nextSelected = {
      ...selectedAnswers,
      [questionId]: [option],
    };
    setSelectedAnswers(nextSelected);
    if (pageType == "exam") {
      return;
    }

    //console.log("HAS")

    const isCorrect = checkAnswer(nextSelected[questionId]);

    setAnsweredQuestions((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
    setIsConfirmedAS(false);
  };

  const handleExamAnswerSelect = (option: string) => {
    const questionId = currentQuestion.id;
    if (!isConfirmedAS && option && !(questionId in answeredQuestions)) {
      const isCorrect = checkAnswer([option]);
      setAnsweredQuestions((prev) => ({
        ...prev,
        [questionId]: isCorrect,
      }));
      setIsConfirmedAS(true);
      return;
    }
  };

  const checkAnswer = (userAnswers: string[]) => {
    if (!userAnswers || userAnswers.length === 0) {
      return false;
    }

    const correctAnswers = currentQuestion.answers;
    const isCorrect = checkIsCorrect(correctAnswers, userAnswers);

    if (isCorrect) {
      Toast.show({
        type: "success",
        text1: "Correct! ✅",
        position: "top",
        visibilityTime: 700,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Incorrect ❌",
        position: "top",
        visibilityTime: 700,
      });
    }
    return isCorrect;
  };

  /**
   * Handles retaking or restarting the quiz.
   *
   * Behavior:
   * - For "random" or "exam" page types, simply calls the `onRestart` callback.
   * - For other page types:
   *   1. Resets the quiz locally using `resetQuizLocal`.
   *   2. Attempts to reset the quiz remotely via `resetQuiz`, falling back to
   *      enqueueing an offline action if the request fails.
   *   3. Clears all local quiz state:
   *      - `currentQuestionIndex`
   *      - `selectedAnswers`
   *      - `answeredQuestions`
   *      - `showResults`
   *      - `results`
   *      - Sets `wasReseted` to true.
   * - Shows an error toast if any operation fails.
   */
  const handleRetakeQuiz = async () => {
    if (pageType == "random") {
      onRestart?.();
      return;
    }

    if (pageType == "exam") {
      onRestart?.();
      return;
    }

    try {
      const result = await resetQuizLocal(quiz.id);

      if (result.success === false) {
        throw new Error(result.error || "Failed to reset quiz");
      }

      const latestResultLength = Object.keys(
        latestResult?.answers ?? {}
      ).length;

      if (latestResultLength !== 0) {
        resetQuiz(token!, quiz.id).catch(() =>
          enqueueOfflineAction({
            type: "resetQuiz",
            payload: { quizId: quiz.id },
          })
        );
      }

      setWasReseted(true);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setAnsweredQuestions({});
      setShowResults(false);
      setResults(null);
      setIsCompleated(false);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Something went wrong(:",
        position: "top",
        visibilityTime: 700,
      });
    }
  };

  const handleNextQuestion = () => {
    if (pageType === "saved") {
      const answeredCount = Object.keys(answeredQuestions).length;
      if (!enableFinishSaved && answeredCount == questions.length) {
        setEnableFinishedSaved(true);
      } else if (enableFinishSaved && answeredCount == questions.length) {
        handleBack();
      }
    }

    setIsConfirmedAS(false);

    goToNext();
  };

  type AnsweredQuestions = Record<string, any>;

  const findNextUnanswered = (
    questions: Question[],
    answeredQuestions: AnsweredQuestions,
    startIndex: number = 0,
    endIndex: number = questions.length
  ) => {
    return questions
      .slice(startIndex, endIndex)
      .findIndex((q) => answeredQuestions[q.id] === undefined);
  };

  const goToNext = () => {
    const isPro = user?.isPro;

    if (pageType === "topic" && !isPro) {
      const isLocked = currentQuestionIndex >= maxFreeIndex;

      if (isLocked) {
        //console.log("isLocked");
        setIsProModalOpen(true);
        return;
      }
      const answeredCountFree = Object.keys(answeredQuestions).filter(
        (id) => questions.findIndex((q) => q.id === id) <= maxFreeIndex
      ).length;

      if (answeredCountFree <= maxFreeIndex) {
        // forward search within free range
        const forwardFree = findNextUnanswered(
          questions,
          answeredQuestions,
          currentQuestionIndex + 1,
          maxFreeIndex + 1
        );

        if (forwardFree !== -1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1 + forwardFree);
          return;
        }

        // backward search within free range
        const backwardFree = findNextUnanswered(
          questions,
          answeredQuestions,
          0,
          maxFreeIndex + 1
        );

        if (backwardFree !== -1) {
          setCurrentQuestionIndex(backwardFree);
          return;
        }
      }

      // All free answered → submit quiz
      submitQuizResults();
      return;
    }

    const answeredCount = Object.keys(answeredQuestions).length;

    if (answeredCount < questions.length) {
      // forward search
      const forward = findNextUnanswered(
        questions,
        answeredQuestions,
        currentQuestionIndex + 1
      );

      if (forward !== -1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1 + forward);
        return;
      }

      // backward search
      const backward = findNextUnanswered(questions, answeredQuestions);
      if (backward !== -1) {
        setCurrentQuestionIndex(backward);
        return;
      }
    }

    // All answered → submit
    submitQuizResults();
  };

  const submitQuizResults = async () => {
    // console.log("SubmitQuizResults")
    // if (isSubmittingRef.current) return; // 🔒 prevent duplicate submits
    // isSubmittingRef.current = true;

    if (pageType === "saved") return;

    setIsSubmitting(true);

    const answered = answeredQuestionsRef.current;
    const answeredQuestionsLength = Object.keys(answered).length;
    const latestResultLength = Object.keys(latestResult?.answers ?? {}).length;

    //console.log(answeredQuestionsLength)

    if (
      pageType !== "exam" &&
      (answeredQuestionsLength == 0 ||
        (latestResult &&
          !wasReseted &&
          latestResultLength == answeredQuestionsLength))
    ) {
      //console.log('ok')
      setIsSubmitting(false);
      return;
    }

    if (
      pageType == "exam" && answeredQuestionsLength == 0 
    ) {
      //console.log('ok')
      setIsSubmitting(false);
      return;
    }

    //console.log("submit_1")

    try {
      // For wrong questions page, merge with existing answers
      let answersToSubmit = selectedAnswersRef.current;
      //console.log(answersToSubmit)
      if (pageType === "wrong" && latestResult && !wasReseted) {
        const mergedAnswers = { ...latestResult.answers };
        for (const question of quiz.questions) {
          if (answersToSubmit[question.id]) {
            mergedAnswers[question.id] = answersToSubmit[question.id];
          }
        }
        answersToSubmit = mergedAnswers;
      }

      let correctCount = 0;
      for (const q of quiz.questions) {
        const userAns = answersToSubmit[q.id] || [];
        const correctAns = q.answers;
        const isCorrect = checkIsCorrect(correctAns, userAns);
        if (isCorrect) correctCount++;
      }

      //console.log("submit_2")
      let satScore = null;

      if (pageType === "exam") {
        const totalQuestions = quiz.questions.length;
        const wrongCount = totalQuestions - correctCount;

        // Calculate SAT Math Score (200-800)
        satScore = calculateSATScore(correctCount, totalQuestions);
        //console.log(satScore)

        // Award points based on performance
        let pointsEarned = correctCount; // Base points from correct answers

        // Bonus points
        const passed = wrongCount <= 2;
        if (passed) pointsEarned += 10; // +10 if passed (≤2 wrong)
        if (correctCount === totalQuestions) pointsEarned += 10; // +10 if perfect

        setResults({
          correctCount,
          totalQuestions,
          passed,
          satScore, // SAT score for display
          totalScore: pointsEarned, // Points to award
          percentage: Math.round((correctCount / totalQuestions) * 100),
        });
        setShowResults(true);

        if (pointsEarned > 0) {
          if (user) setUser({ ...user, points: user.points + pointsEarned });
          await updateUserPoints(token, pointsEarned).catch(() =>
            enqueueOfflineAction({
              type: "updatePoints",
              payload: { points: pointsEarned },
            })
          );
        }

        // Clear saved exam state since exam is completed
        //await clearExamState();

        Toast.show({
          type: "success",
          text1: "Exam completed!",
          position: "top",
          visibilityTime: 1500,
        });

        // Exit early for exam mode to prevent results from being overwritten
        // setIsSubmitting(false);
        // return;
      }

      const percentage = Math.round((correctCount / questions.length) * 100);
      const passed = percentage >= 90;

      setResults({
        correctCount,
        totalQuestions: questions.length,
        percentage,
        passed,
        satScore,
        totalScore: correctCount,
      });

      setShowResults(true);

      if (pageType === "random") {
        if (correctCount > 0) {
          if (user) setUser({ ...user, points: user.points + correctCount });
          updateUserPoints(token, correctCount).catch((err: any) =>
            enqueueOfflineAction({
              type: "updatePoints",
              payload: { points: correctCount },
            })
          );
        }
        return;
      } else {
        //console.log("submit_3")
        const method: "POST" | "PATCH" =
          (latestResult && !wasReseted) ||
          (quiz.id === "all" && pageType === "wrong")
            ? "PATCH"
            : "POST";

        //console.log(method)
        const data = await submitQuizAnswersLocal(
          quiz.id,
          answersToSubmit,
          method
        );

        submitQuizAnswers(token!, quiz.id, answersToSubmit, method).catch(() =>
          enqueueOfflineAction({
            type: "submitQuiz",
            payload: { quizId: quiz.id, answers: answersToSubmit, method },
          })
        );
      }

      Toast.show({
        type: "success",
        text1: "Results saved!",
        position: "top",
        visibilityTime: 700,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      Toast.show({
        type: "error",
        text1: "Error saving results",
        position: "top",
        visibilityTime: 700,
      });
    } finally {
      //isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const hideLoader = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200, // faster fade-out for local content
      useNativeDriver: true,
    }).start(() => {
      setWebViewLoading(false);
      fadeAnim.setValue(1); // reset for next loader
    });
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isAnswered = currentQuestion.id in answeredQuestions;
  const screenHeight = Dimensions.get("window").height;
  const currentIconColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const isDark = colorScheme === "dark";

  {
    /* Show results of the quiz */
  }
  if (showResults && results) {
    return (
      <ResultsModal
        results={results}
        pageType={pageType as any}
        backUrl={backUrl}
        nextTopicUrl={nextTopicUrl}
        setIsResetDialogOpen={setIsResetDialogOpen}
        handleRetakeQuiz={handleRetakeQuiz}
        handleBack={handleBack}
        showResults={showResults}
        setShowResults={setShowResults}
        isDark={isDark}
      />
      // <SafeAreaView className="container mx-auto px-4 pt-8 max-w-4xl bg-[#f8fafc] dark:bg-[#0f172a] h-full">
      //   <TopBlur />
      //   <ResetTestDialog
      //     isOpen={isResetDialogOpen}
      //     onClose={() => setIsResetDialogOpen(false)}
      //     onConfirm={handleRetakeQuiz}
      //     testTitle={quiz.title}
      //   />
      //   <ResultsCard
      //     results={results}
      //     pageType={pageType as any}
      //     backUrl={backUrl}
      //     nextTopicUrl={nextTopicUrl}
      //     setIsResetDialogOpen={setIsResetDialogOpen}
      //     handleRetakeQuiz={handleRetakeQuiz}
      //     handleBack={handleBack}
      //   />
      //   <BottomBlur />
      // </SafeAreaView>
    );
  }

  {
    /** Quiz page */
  }
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}
      edges={["top", "bottom"]}
    >
      <ResetTestDialog
        key={wasReseted ? "reset-1" : "reset-0"}
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleRetakeQuiz}
        testTitle={quiz.title}
      />
      <AllTasksDialog
        isOpen={isAllTasksDialogOpen}
        onClose={() => setIsAllTasksDialogOpen(false)}
        questions={questions}
        answeredQuestions={answeredQuestions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionSelect={setCurrentQuestionIndex}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: screenHeight,
          alignItems: "center",
          paddingHorizontal: 4,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingVertical: 8, width: "100%", maxWidth: 800 }}>
          <QuizHeader
            quizTitle={quiz.title}
            currentQuestionIndex={currentQuestionIndex}
            questions={questions}
            answeredQuestions={answeredQuestions}
            pageType={pageType}
            currentIconColor={currentIconColor}
            maxFreeIndex={maxFreeIndex}
            toggleResetDialog={() => setIsResetDialogOpen(true)}
            toggleAllTasksDialog={() => setIsAllTasksDialogOpen(true)}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            setIsProModalOpen={setIsProModalOpen}
            handleBack={handleBack}
            submitQuizResults={submitQuizResults}
            ref={quizHeaderRef}
            tourActive={tourActive}
            currentStep={currentStep}
            handleTourNext={handleTourNext}
            handleTourPrev={handleTourPrev}
            skipTour={skipTour}
            isNumbersQuiz={isNumbersQuiz}
          />

          {/* Question Counter */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 12,
              marginTop: 12,
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderLeftWidth: 2,
                borderLeftColor: "#06B6D4",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: isDark ? "#ffffff" : "#1f2937",
                }}
              >
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>
            <QuestionToggles
              currentQuestion={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              currentIconColor={currentIconColor}
              token={token}
              chapterId={quiz.chapterId}
              quizId={quiz.id}
              setQuestions={setQuestions}
              onHintPress={() => setIsHintModalOpen(true)}
            />
          </View>

          <View style={{ position: "relative", flex: 1 }}>
            {webViewLoading && (
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: isDark ? "#111827" : "#f9fafb",
                  zIndex: 100,
                  opacity: fadeAnim,
                }}
              >
                <GraduationCap3DLoader />
              </Animated.View>
            )}

            <AutoHeightWebView
              //key={`question-${currentQuestion.id}`}
              source={{
                html: wrapHtmlContent(currentQuestion.question || "", { isDark }),
              }}
              style={{
                width: "100%",
                minHeight: 10,
              }}
              scrollEnabled={false}
              // onLoadEnd={() => {
              //   hideLoader();
              // }}
            />
            {currentQuestion.questionImageUrl && (
              <QuestionImage
                uri={currentQuestion.questionImageUrl}
                height={currentQuestion.imageHeight * 1.2}
              />
            )}

            {/* {tourActive && currentStep === TOUR_STEPS.ANSWER_QUESTION && isNumbersQuiz ? (
              <TourTooltip
                visible={true}
                onNext={handleTourNext}
                onPrev={handleTourPrev}
                onSkip={skipTour}
                onClose={() => {}}
                title={getTourStepInfo(TOUR_STEPS.ANSWER_QUESTION).title}
                content={getTourStepInfo(TOUR_STEPS.ANSWER_QUESTION).content}
                stepNumber={TOUR_STEPS.ANSWER_QUESTION + 1}
                totalSteps={TOTAL_TOUR_STEPS}
                placement="bottom"
              >
                <QuestionOptions
                  currentQuestion={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  isAnswered={isAnswered}
                  pageType={pageType}
                  handleAnswerSelect={handleAnswerSelect}
                />
              </TourTooltip>
            ) : ( */}
              <QuestionOptions
                currentQuestion={currentQuestion}
                selectedAnswers={selectedAnswers}
                isAnswered={isAnswered}
                pageType={pageType}
                handleAnswerSelect={handleAnswerSelect}
              />
            {/* )} */}

            {/* Explanation */}
            {isAnswered && currentQuestion.explanation && (
              <>
                 <View
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginTop: 32, 
                  marginHorizontal: 8,
                  alignSelf: "flex-start",
                  borderLeftWidth: 2,
                  borderLeftColor:"#8B5CF6",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#1f2937",
                  }}
                >
                    💡 Explanation
                  </Text>
                </View>
                  <AutoHeightWebView
                    //key={`explanation-${currentQuestion.id}`}
                    source={{
                      html: wrapHtmlContent(currentQuestion.explanation || "", { isDark }),
                    }}
                    style={{
                      width: "100%",
                      minHeight: 10,
                    }}
                    scrollEnabled={false}
                  />
                
                {currentQuestion.hintImageUrl && (
                  <View style={{ marginBottom: 16 }}>
                    <QuestionImage
                      uri={currentQuestion.hintImageUrl}
                      height={currentQuestion.imageHeight * 1.2}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Navigation */}
      <QuestionBottomNav
        pageType={pageType}
        currentQuestionIndex={currentQuestionIndex}
        questions={questions}
        isCompleted={isCompleated}
        isConfirmedAS={isConfirmedAS}
        selectedAnswers={selectedAnswers}
        answeredQuestions={answeredQuestions}
        enableFinishSaved={enableFinishSaved}
        isSubmitting={isSubmitting}
        currentIconColor={currentIconColor}
        currentQuestionId={currentQuestion.id}
        previousQuestion={previousQuestion}
        handleNextQuestion={handleNextQuestion}
        setIsConfirmedAS={setIsConfirmedAS}
        handleExamAnswerSelect={handleExamAnswerSelect}
      />

      {/* Hint Modal */}
      <HintModal
        isOpen={isHintModalOpen}
        onClose={() => setIsHintModalOpen(false)}
        hint={currentQuestion.hint}
        hintImageUrl={currentQuestion.hintImageUrl}
      />

      {/* <GetPremiumModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      /> */}
    </SafeAreaView>
  );
};

export default TestsPage;
