import { SavedQuiz } from "@/app/tests/saved";
import { WrongQuiz } from "@/app/tests/wrong";
import * as Crypto from "expo-crypto";
// import { SavedQuiz } from "@/app/tests/saved";
// import { WrongQuiz } from "@/app/tests/wrong";
import { useSQLiteContext } from "expo-sqlite";


// Dummy fetchQuizzesByTopicLocal
// export const fetchQuizzesByTopicLocal = async () => {
//   try {
//     // Generate 10 dummy quizzes
//     const quizzes = Array.from({ length: 10 }, (_, i) => {
//       const questionCount = Math.floor(Math.random() * 10) + 5; // 5–14 questions
//       const score = Math.floor(Math.random() * (questionCount + 1)); // 0–questionCount
//       const completed = Math.random() > 0.5;
//       const attemptCount = Math.floor(Math.random() * 5); // 0–4 attempts
//       const lastAttempt = completed
//         ? new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString() // convert to string
//         : undefined;

//       return {
//         id: (i + 1).toString(),
//         title: `Quiz ${i + 1} - Topic ${Math.floor(i / 2) + 1}`,
//         questionCount,
//         progress: Math.round((score / questionCount) * 100),
//         completed,
//         score,
//         attemptCount,
//         lastAttempt,
//       };
//     });

//     return { success: true, quizzes };
//   } catch (error: any) {
//     console.error("❌ Failed to fetch quizzes locally:", error);
//     return { success: false, quizzes: [], error: error.message || "Something went wrong" };
//   }
// };


export function useQuizDatabase() {
  const db = useSQLiteContext();

  type QuizRow = {
    quizId: string;
    title: string;
    chapterTitle: string;
    quizPosition: number;
    isPublished: number;
    questionId: string;
    questionText: string;
    questionImageUrl: string | null;
    imageHeight: number;
    options: string;
    answers: string;
    note: string | null;
    hint: string | null;
    hintImageUrl: string | null;
    likes: number;
    dislikes: number;
  };

  type QuizResultRow = {
    id: string;
    userId: string;
    quizId: string;
    answers: string;
    score: number;
    completed: number;
    attemptCount: number;
    synced: number;
  };

  type UserQuizQuestionRow = {
    id: string;
    questionId: string;
    userId: string;
    liked: number;
    disliked: number;
    saved: number;
  };

  async function fetchQuizByIdLocal(quizId: string) {
    try {
      // Get quiz and its questions
      const rows = await db.getAllAsync(
        `
          SELECT q.id AS quizId, q.title, q.position AS quizPosition, q.isPublished,
                  qq.id AS questionId, qq.question AS questionText, qq.questionType, qq.questionImageUrl,
                  qq.position AS questionPosition,
                  qq.imageHeight, qq.options, qq.answers, qq.note, qq.hint, qq.hintImageUrl, qq.localHintImagePath,
                  qq.likes, qq.dislikes, qq.localImagePath, c.title AS chapterTitle
          FROM quizzes q
          JOIN quiz_questions qq ON qq.quizId = q.id
          JOIN chapters c ON q.chapterId = c.id
          WHERE q.id = ?
          ORDER BY qq.position ASC
        `,
        [quizId]
      );

      if (!rows || rows.length === 0) {
        return { success: false, error: "Quiz not found" };
      }

      const typedRows = rows as QuizRow[];

      // Quiz metadata
      const { quizId: id, title, chapterTitle, quizPosition } = typedRows[0];

      // Get user results for this quiz
      const resultsRows = await db.getAllAsync(
          `
          SELECT * FROM quiz_results
          WHERE quizId = ? 
          ORDER BY id DESC
          LIMIT 1
          `,
          [id]
          ) as QuizResultRow[];

          const latestResult = resultsRows.length > 0
          ? {
              score: resultsRows[0].score,
              answers: JSON.parse(resultsRows[0].answers || "{}"),
              }
          : null;

      // Get user question interactions
      const userQuestionRows = await db.getAllAsync(
        `
        SELECT * FROM user_quiz_questions
        `,
        []
      ) as UserQuizQuestionRow[];

      const userQuestionMap: Record<string, any> = {};
      userQuestionRows.forEach((uq) => {
        userQuestionMap[uq.questionId] = {
          isSaved: Boolean(uq.saved),
          isLiked: Boolean(uq.liked),
          isDisliked: Boolean(uq.disliked),
        };
      });

      // Map questions
      const questions = rows.map((q: any) => {
        const userData = userQuestionMap[q.questionId] || {};
        return {
          id: q.questionId,
          position: q.questionPosition,
          question: q.questionText,
          questionType: q.questionType,
          imageHeight: q.imageHeight,
          questionImageUrl: q.localImagePath || q.questionImageUrl,
          options: JSON.parse(q.options),
          answers: JSON.parse(q.answers),
          explanation: q.note ?? "",
          hint: q.hint ?? undefined,
          hintImageUrl: (q.localHintImagePath || q.hintImageUrl) ?? undefined,
          likes: q.likes,
          dislikes: q.dislikes,
          isSaved: userData.isSaved || false,
          isLiked: userData.isLiked || false,
          isDisliked: userData.isDisliked || false,
        };
      });

      // Get next quiz in the same chapter (by position)
      const nextTopicUrl = await getNextQuizUrl(quizId);


      return {
        success: true,
        quiz: {
          id,
          title,
          chapterTitle,
          questions,
        },
        latestResult,
        nextTopicUrl,
      };
    } catch (err: any) {
      console.error("❌ Failed to fetch quiz by ID locally:", err);
      return { success: false, error: "Something went wrong" };
    }
  }


  /**
   * Find the next quiz given a current quizId.
   * 
   * Logic:
   * 1. Try to get the next quiz in the same chapter (by position).
   * 2. If none, get the first quiz of the next published chapter (by chapter.position, then quiz.position).
   * 3. Optionally wrap around (go back to very first quiz).
   */
  async function getNextQuizUrl(currentQuizId: string): Promise<string | null> {
    try {
      // Step 1: Next quiz in the same chapter
      const nextQuizRows = await db.getAllAsync(
        `
          SELECT q.id
          FROM quizzes q
          JOIN chapters c ON q.chapterId = c.id
          WHERE q.isPublished = 1
            AND c.title = (
              SELECT c2.title
              FROM quizzes q2
              JOIN chapters c2 ON q2.chapterId = c2.id
              WHERE q2.id = ?
            )
            AND q.position > (
              SELECT position FROM quizzes WHERE id = ?
            )
          ORDER BY q.position ASC
          LIMIT 1
        `,
        [currentQuizId, currentQuizId]
      ) as { id: string }[];

      if (nextQuizRows.length > 0) {
        return `/tests/by-topic/${nextQuizRows[0].id}`;
      }

      // Step 2: First quiz of the next chapter
      const nextChapterQuizRows = await db.getAllAsync(
        `
          SELECT q.id
          FROM quizzes q
          JOIN chapters c ON q.chapterId = c.id
          WHERE c.isPublished = 1
            AND q.isPublished = 1
            AND c.position > (
              SELECT c2.position
              FROM quizzes q2
              JOIN chapters c2 ON q2.chapterId = c2.id
              WHERE q2.id = ?
            )
          ORDER BY c.position ASC, q.position ASC
          LIMIT 1
        `,
        [currentQuizId]
      ) as { id: string }[];

      if (nextChapterQuizRows.length > 0) {
        return `/tests/by-topic/${nextChapterQuizRows[0].id}`;
      }

      // Step 3 (optional): Wrap around → go to very first quiz
      const firstQuizRows = await db.getAllAsync(
        `
          SELECT q.id
          FROM quizzes q
          JOIN chapters c ON q.chapterId = c.id
          WHERE c.isPublished = 1
            AND q.isPublished = 1
          ORDER BY c.position ASC, q.position ASC
          LIMIT 1
        `
      ) as { id: string }[];

      if (firstQuizRows.length > 0) {
        return `/tests/by-topic/${firstQuizRows[0].id}`;
      }

      return null;
    } catch (err) {
      console.error("❌ Failed to get next quiz:", err);
      return null;
    }
  }


  const fetchQuizzesByTopicLocal = async () => {
    try {
      const rows = await db.getAllAsync(
        `
        SELECT 
          q.id, 
          q.title, 
          q.maxScore, 
          q.position AS quizPosition, 
          c.title AS chapterTitle,
          c.position AS chapterPosition,
          (SELECT COUNT(*) FROM quiz_questions WHERE quizId = q.id) AS questionCount,
          (SELECT score FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS score,
          (SELECT completed FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS completed,
          (SELECT attemptCount FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS attemptCount,
          (SELECT updatedAt FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS lastAttempt
        FROM quizzes q
        JOIN chapters c ON q.chapterId = c.id
        WHERE q.isPublished = 1 AND c.isPublished = 1  
        ORDER BY c.position ASC, q.position ASC
        `
      );

      const quizzes = (rows || []).map((row: any) => {
        const score = row.score ?? 0;
        const maxScore = row.maxScore ?? row.questionCount;
        return {
          id: row.id,
          title: row.title,
          questionCount: row.questionCount,
          progress: maxScore ? Math.round((score / maxScore) * 100) : 0,
          completed: Boolean(row.completed),
          score,
          attemptCount: row.attemptCount ?? 0,
          lastAttempt: row.lastAttempt,
        };
      });

      return { success: true, quizzes };
    } catch (error: any) {
      console.error("❌ Failed to fetch quizzes locally:", error);
      return { success: false, quizzes: [], error: error.message || "Something went wrong" };
    }
  };

  const fetchExamsLocal = async () => {
    try {
      const CHAPTER_ID = "8d3703a4-41ce-46b0-a27c-e25c0a0702e2";

      const rows = await db.getAllAsync(
        `
       SELECT
        q.id,
        q.title,
        q.maxScore,
        q.position AS quizPosition,
        (SELECT COUNT(*) FROM quiz_questions WHERE quizId = q.id) AS questionCount,
        (SELECT score FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS score,
        (SELECT completed FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS completed,
        (SELECT attemptCount FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS attemptCount,
        (SELECT updatedAt FROM quiz_results WHERE quizId = q.id ORDER BY updatedAt DESC LIMIT 1) AS lastAttempt
      FROM quizzes q
      WHERE q.chapterId = ?
      ORDER BY q.position ASC
        `,
        [CHAPTER_ID]
      );

      const quizzes = (rows || []).map((row: any) => {
        const score = row.score ?? 0;
        const maxScore = row.maxScore ?? row.questionCount;
        return {
          id: row.id,
          title: row.title,
          questionCount: row.questionCount,
          progress: maxScore ? Math.round((score / maxScore) * 100) : 0,
          completed: Boolean(row.completed),
          score,
          attemptCount: row.attemptCount ?? 0,
          lastAttempt: row.lastAttempt,
        };
      });

      return { success: true, quizzes };
    } catch (error: any) {
      console.error("❌ Failed to fetch exams locally:", error);
      return { success: false, quizzes: [], error: error.message || "Something went wrong" };
    }
  };


  async function fetchSavedQuizzesLocal() {
    try {
      const savedQuestions = await db.getAllAsync<any>(`
        SELECT 
          qq.id AS questionId,
          qq.question AS questionText,
          qq.quizId,
          q.title AS quizTitle,
          q.position AS quizPosition,
          c.title AS chapterTitle,
          c.position AS chapterPosition,
          uq.saved AS isSaved,
          uq.liked AS isLiked,
          uq.disliked AS isDisliked
        FROM user_quiz_questions uq
        JOIN quiz_questions qq ON uq.questionId = qq.id
        JOIN quizzes q ON qq.quizId = q.id
        JOIN chapters c ON q.chapterId = c.id
        WHERE uq.saved = 1
        ORDER BY c.position ASC, q.position ASC, uq.id DESC
      `);

      // Group by quiz
      const quizMap = new Map<string, SavedQuiz>();
      savedQuestions.forEach((row: any) => {
        if (!quizMap.has(row.quizId)) {
          quizMap.set(row.quizId, {
            id: row.quizId,
            title: row.quizTitle,
            chapterTitle: row.chapterTitle,
            savedCount: 0,
            questions: [],
          });
        }

        const quiz = quizMap.get(row.quizId)!;
        quiz.savedCount += 1;
        quiz.questions.push(row);
      });

      return { success: true, quizzes: Array.from(quizMap.values()) };
    } catch (err: any) {
      console.error("❌ Failed to fetch saved quizzes locally:", err);
      return { success: false, quizzes: [], error: err.message || "Something went wrong" };
    }
  }


  async function fetchWrongQuizzesLocal() {
    try {
      // 1️⃣ Fetch all quiz results
      const results = await db.getAllAsync<any>(`
        SELECT
          qr.id AS resultId,
          qr.quizId,
          qr.answers AS rawAnswers,
          qr.updatedAt,
          q.title AS quizTitle,
          q.position AS quizPosition,
          c.title AS chapterTitle,
          c.position AS chapterPosition
        FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        JOIN chapters c ON q.chapterId = c.id
        ORDER BY c.position ASC, q.position ASC, qr.updatedAt DESC
      `);

      // 2️⃣ Fetch all questions
      const questionsRows = await db.getAllAsync<any>(`
        SELECT *
        FROM quiz_questions
      `);
      const questionMap: Record<string, any> = {};
      questionsRows.forEach((q) => (questionMap[q.id] = q));

      // 3️⃣ Fetch user interaction flags
      const userQuestionRows = await db.getAllAsync<any>(`
        SELECT * FROM user_quiz_questions
      `);
      const userQuestionMap: Record<string, any> = {};
      userQuestionRows.forEach((uq) => {
        userQuestionMap[uq.questionId] = {
          isSaved: Boolean(uq.saved),
          isLiked: Boolean(uq.liked),
          isDisliked: Boolean(uq.disliked),
        };
      });

      const wrongMap = new Map<string, any>();

      for (const res of results) {
        let answers: { questionId: string; selected: string[] }[] = [];
        try {
          const parsed = JSON.parse(res.rawAnswers || "{}");
          answers = Object.entries(parsed).map(([questionId, selected]) => ({
            questionId,
            selected: Array.isArray(selected) ? selected : [],
          }));
        } catch {
          // ignore parse errors
        }

        for (const ans of answers) {
          const question = questionMap[ans.questionId];
          if (!question) continue;

          const correctAnswers = JSON.parse(question.answers || "[]") as string[];
          const selectedAnswers = ans.selected;

          const isCorrect =
            correctAnswers.length === selectedAnswers.length &&
            correctAnswers.every((a) => selectedAnswers.includes(a));

          if (!isCorrect) {
            if (!wrongMap.has(res.quizId)) {
              wrongMap.set(res.quizId, {
                id: res.quizId,
                title: res.quizTitle,
                chapterTitle: res.chapterTitle || "Без розділу",
                wrongCount: 0,
                questions: [],
              });
            }

            const quizData = wrongMap.get(res.quizId);
            if (!quizData.questions.find((q: any) => q.id === question.id)) {
              quizData.wrongCount += 1;
              const userData = userQuestionMap[question.id] || {};
              quizData.questions.push({
                id: question.id,
                question: question.question,
                questionImageUrl: question.localImagePath || question.questionImageUrl,
                options: JSON.parse(question.options || "[]"),
                answers: correctAnswers,
                explanation: question.note || "",
                isSaved: userData.isSaved || false,
                isLiked: userData.isLiked || false,
                isDisliked: userData.isDisliked || false,
              });
            }
          }
        }
      }

      // 4️⃣ Sort quizzes by chapter and quiz position
      const quizzes: WrongQuiz[] = Array.from(wrongMap.values())
        .sort((a, b) => a.chapterPosition - b.chapterPosition || a.quizPosition - b.quizPosition)
        .map((q) => ({
          id: q.id,
          title: q.title,
          chapterTitle: q.chapterTitle,
          wrongCount: q.wrongCount,
          questions: q.questions.map((qt: any) => ({ question: qt.question })),
        }));

      return { success: true, quizzes };
    } catch (err: any) {
      console.error("❌ Failed to fetch wrong quizzes locally:", err);
      return { success: false, quizzes: [], error: err.message || "Something went wrong" };
    }
  }

  async function fetchSavedQuestionsLocal(quizId: string) {
    try {
      const rows = quizId === "all"
        ? await db.getAllAsync<any>(`
            SELECT q.id, q.question, q.questionType, q.options, q.answers, q.quizId, q.questionImageUrl,
                  q.localImagePath, q.imageHeight, q.position, q.note AS explanation,
                  q.hint, q.hintImageUrl, q.localHintImagePath,
                  q.likes, q.dislikes, quiz.title AS quizTitle, chapter.title AS chapterTitle,
                  uq.saved, uq.liked, uq.disliked
            FROM user_quiz_questions uq
            JOIN quiz_questions q ON uq.questionId = q.id
            JOIN quizzes quiz ON q.quizId = quiz.id
            JOIN chapters chapter ON quiz.chapterId = chapter.id
            WHERE uq.saved = 1
            ORDER BY chapter.position ASC, quiz.position ASC, q.position ASC
        `)
        : await db.getAllAsync<any>(`
            SELECT q.id, q.question, q.questionType, q.options, q.answers, q.quizId, q.questionImageUrl,
                  q.localImagePath, q.imageHeight, q.position, q.note AS explanation,
                  q.hint, q.hintImageUrl, q.localHintImagePath,
                  q.likes, q.dislikes, quiz.title AS quizTitle, chapter.title AS chapterTitle,
                  uq.saved, uq.liked, uq.disliked
            FROM user_quiz_questions uq
            JOIN quiz_questions q ON uq.questionId = q.id
            JOIN quizzes quiz ON q.quizId = quiz.id
            JOIN chapters chapter ON quiz.chapterId = chapter.id
            WHERE uq.saved = 1 AND q.quizId = ?
            ORDER BY q.position ASC
        `, quizId === "all" ? [] : [quizId]);

      if (!rows.length) {
        return { success: false, error: "No saved questions found" };
      }

      const questions = rows.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options ? JSON.parse(q.options) : [],
        answers: q.answers ? JSON.parse(q.answers) : [],
        questionImageUrl: q.localImagePath || q.questionImageUrl,
        imageHeight: q.imageHeight ?? 200,
        position: q.position,
        explanation: q.explanation,
        hint: q.hint ?? undefined,
        hintImageUrl: (q.localHintImagePath || q.hintImageUrl) ?? undefined,
        likes: q.likes ?? 0,
        dislikes: q.dislikes ?? 0,
        isSaved: Boolean(q.saved),
        isLiked: Boolean(q.liked),
        isDisliked: Boolean(q.disliked),
        quizTitle: q.quizTitle,
        chapterTitle: q.chapterTitle,
      }));

      const quizTitle = quizId === "all" ? "Усі збережені питання" : rows[0].quizTitle;
      const chapterTitle = quizId === "all" ? "Всі розділи" : rows[0].chapterTitle;

      return {
        success: true,
        id: quizId,
        quizTitle,
        chapterTitle,
        questions,
      };
    } catch (err: any) {
      console.error("❌ Failed to fetch saved questions locally:", err);
      return { success: false, error: err.message || "Something went wrong" };
    }
  }



  async function fetchWrongQuestionsLocal(quizId: string) {
    try {
      // 1️⃣ Fetch all quiz results (filtered by quizId if specified)
      const resultsQuery = quizId === "all"
        ? `SELECT * FROM quiz_results ORDER BY updatedAt DESC`
        : `SELECT * FROM quiz_results WHERE quizId = ? ORDER BY updatedAt DESC`;

      const results = quizId === "all"
        ? await db.getAllAsync<any>(resultsQuery)
        : await db.getAllAsync<any>(resultsQuery, [quizId]);

      const wrongMap = new Map<string, any>();
      let latestResult: { score: number; answers: Record<string, string[]> } | null = null;

      for (const result of results) {
        const rawAnswers = result.answers ? JSON.parse(result.answers) : {};

        // Get only the question IDs that were answered wrong
        const questionIds = Object.keys(rawAnswers);

        for (const questionId of questionIds) {
          // Fetch question details
          const questionRows = await db.getAllAsync<any>(`
            SELECT q.id, q.question, q.questionType, q.options, q.answers, q.questionImageUrl, q.localImagePath,
                  q.imageHeight, q.position, q.note AS explanation, q.hint, q.hintImageUrl, q.localHintImagePath,
                  q.likes, q.dislikes,
                  quiz.title AS quizTitle, chapter.title AS chapterTitle
            FROM quiz_questions q
            JOIN quizzes quiz ON q.quizId = quiz.id
            JOIN chapters chapter ON quiz.chapterId = chapter.id
            WHERE q.id = ?
          `, [questionId]);

          if (!questionRows.length) continue;
          const q = questionRows[0];

          const correctAnswers = q.answers ? JSON.parse(q.answers) : [];
          const selectedAnswers = rawAnswers[questionId] || [];

          const isCorrect =
            correctAnswers.length === selectedAnswers.length &&
            correctAnswers.every((ans: string) => selectedAnswers.includes(ans));

          if (!isCorrect && !wrongMap.has(q.id)) {
            wrongMap.set(q.id, {
              id: q.id,
              question: q.question,
              questionType: q.questionType,
              options: q.options ? JSON.parse(q.options) : [],
              answers: correctAnswers,
              questionImageUrl: q.localImagePath || q.questionImageUrl,
              imageHeight: q.imageHeight ?? 200,
              position: q.position,
              explanation: q.explanation,
              hint: q.hint ?? undefined,
              hintImageUrl: (q.localHintImagePath || q.hintImageUrl) ?? undefined,
              likes: q.likes ?? 0,
              dislikes: q.dislikes ?? 0,
              quizTitle: q.quizTitle,
              chapterTitle: q.chapterTitle,
            });
          }
        }

        // Capture latest result for single quiz
        if (quizId !== "all" && result.quizId === quizId && !latestResult) {
          latestResult = {
            score: result.score ?? 0,
            answers: rawAnswers,
          };
        }
      }

      const wrongQuestions = Array.from(wrongMap.values());

      const quizTitle =
        quizId === "all" ? "Усі неправильні відповіді" : wrongQuestions[0]?.quizTitle || "";
      const chapterTitle =
        quizId === "all" ? "Всі розділи" : wrongQuestions[0]?.chapterTitle || "";

      return {
        success: true,
        id: quizId,
        quizTitle,
        chapterTitle,
        questions: wrongQuestions,
        latestResult,
      };
    } catch (err: any) {
      console.error("❌ Failed to fetch wrong questions locally:", err);
      return { success: false, error: err.message || "Something went wrong" };
    }
  }



  /**
   * Resets a quiz locally in the SQLite database by deleting its results.
   *
   * This function removes all entries from the `quiz_results` table for the given quizId.
   * It does **not** modify the questions themselves or any user interactions stored elsewhere.
   *
   * @param quizId - The ID of the quiz to reset.
   * @returns A promise that resolves to an object indicating success or failure.
   *          - `success: true` if the deletion succeeded.
   *          - `success: false` and `error` message if there was an issue.
   *
   * @example
   * const result = await resetQuizLocal("quiz123");
   * if (result.success) {
   *   console.log("Quiz reset successfully!");
   * } else {
   *   console.error("Failed to reset quiz:", result.error);
   * }
   */
  async function resetQuizLocal(quizId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete all results for the given quizId
      await db.runAsync(
        `DELETE FROM quiz_results WHERE quizId = ?`,
        [quizId]
      );

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to reset quiz locally:", error);
      return { success: false, error: (error as Error).message };
    }
  }




  /**
   * Submits quiz answers locally by creating or updating quiz results in SQLite.
   *
   * @param userId - The ID of the current user.
   * @param quizId - The ID of the quiz.
   * @param answers - A record of questionId to selected answers.
   * @param method - "POST" to create a new result, "PATCH" to update existing one.
   * @returns An object containing totalScore, questionResults, and the saved quizResult.
   */
  async function submitQuizAnswersLocal(
    quizId: string,
    answers: Record<string, string[]>,
    method: "POST" | "PATCH" = "POST"
  ) {
    try {
      if (method === "POST") {
        const existing = await db.getFirstAsync(
          `SELECT * FROM quiz_results WHERE quizId = ? ORDER BY updatedAt DESC LIMIT 1`,
          [quizId]
        );

        if (existing) {
          // fallback to PATCH
          method = "PATCH";
        }
      }

      const quiz = await db.getFirstAsync<{ id: string; questions: any[] }>(
        `SELECT * FROM quizzes WHERE id = ?`,
        [quizId]
      );

      if (!quiz) {
        return { success: false, error: "Quiz not found" };
      }

      // Fetch all questions for this quiz
      const questions = await db.getAllAsync<any>(
        `SELECT * FROM quiz_questions WHERE quizId = ?`,
        [quizId]
      );

      let totalScore = 0;
      const questionResults = questions.map((question) => {
        const userAnswers = answers[question.id] || [];
        const correctAnswers: string[] = question.answers ? JSON.parse(question.answers) : [];
        const isCorrect =
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((a) => userAnswers.includes(a));

        if (isCorrect) totalScore += question.points ?? 5;

        return { questionId: question.id, isCorrect };
      });

      if (method === "POST") {
        // Create new quiz result
        const quizResultId = Crypto.randomUUID();
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO quiz_results (id, quizId, answers, score, completed, attemptCount, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quizResultId, quizId, JSON.stringify(answers), totalScore, totalScore > 0 ? 1 : 0, 1, now, now]
        );

        return { totalScore, questionResults, quizResult: { id: quizResultId, answers, score: totalScore } };
      } else {
        // PATCH: update existing result
        const existingResult = await db.getFirstAsync<any>(
          `SELECT * FROM quiz_results WHERE quizId = ? ORDER BY updatedAt DESC LIMIT 1`,
          [quizId]
        );

        if (!existingResult) {
          return { success: false, error: "No existing quiz result to update" };
        }

        const previousScore = existingResult.score ?? 0;
        const pointsToAdd = Math.max(0, totalScore - previousScore);
        const now = new Date().toISOString();

        await db.runAsync(
          `UPDATE quiz_results SET answers = ?, score = ?, completed = ?, attemptCount = attemptCount + 1, updatedAt = ?
          WHERE id = ?`,
          [JSON.stringify(answers), totalScore, totalScore > 0 ? 1 : 0, now, existingResult.id]
        );

        return { totalScore, questionResults, quizResult: { ...existingResult, answers, score: totalScore } };
      }
    } catch (error) {
      console.error("❌ Failed to submit quiz answers locally:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  async function applyAllQuizUpdatesLocally(updates: any[]) {
  if (!updates || updates.length === 0) {
    //console.log("ℹ️ No quiz updates to apply.");
    return { success: true };
  }

  try {
    await db.execAsync("BEGIN TRANSACTION;");

    for (const quiz of updates) {
      // 1️⃣ Update only the updatedAt for existing quizzes
      await db.runAsync(
        `UPDATE quizzes 
        SET updatedAt = ?, 
            maxScore = ?, 
            totalQuestions = ? 
        WHERE id = ?`,
        [
          quiz.updatedAt || new Date().toISOString(),
          quiz.maxScore,
          quiz.totalQuestions,
          quiz.id
        ]
      );


      // 2️⃣ Insert any new questions that do not exist yet
      if (quiz.questions && quiz.questions.length > 0) {
        for (const q of quiz.questions) {
          // Check if the question exists
          // console.log(q)
          const existing = await db.getAllAsync(
            `SELECT id FROM quiz_questions WHERE id = ?`,
            [q.id]
          );

          if (!existing || existing.length === 0) {
            
            // console.log("Inserting new question:", q.id);
            // Insert new question
            await db.runAsync(
              `INSERT INTO quiz_questions
              (id, question, questionType, questionImageUrl, localImagePath, imageHeight, options, answers, hint, points, position, hintImageUrl, localHintImagePath, note, likes, dislikes, quizId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                q.id,
                q.question,
                q.questionType || "",
                q.questionImageUrl || "",
                q.localImagePath || "",
                q.imageHeight || 200,
                JSON.stringify(q.options || []),
                JSON.stringify(q.answers || []),
                q.hint || "",
                q.points || 1,
                q.position || 0,
                q.hintImageUrl || "",
                q.localHintImagePath || "",
                q.note || "",
                q.likes || 0,
                q.dislikes || 0,
                quiz.id,
              ]
            );
          }
        }
      }
    }

    await db.execAsync("COMMIT;");
    // console.log(`✅ Applied ${updates.length} quiz updates locally.`);
    return { success: true };
  } catch (err) {
    await db.execAsync("ROLLBACK;");
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to apply quiz updates locally:", message);
    return { success: false, error: message };
  }
}



  async function fetchLocalQuizTimestamps() {
    try {

      type QuizRow = { id: string; updatedAt: string };
      const rows = (await db.getAllAsync(
        `SELECT id, updatedAt FROM quizzes`
      )) as QuizRow[];

      const map: Record<string, string> = {};
      for (const row of rows) {
        map[row.id] = row.updatedAt;
      }

      return map;
    } catch (err) {
      console.error("❌ Failed to fetch local quiz timestamps:", err);
      return {};
    }
  }




  /**
   * Fetches saved quiz answers from quiz_results table
   * @param quizId - The ID of the quiz
   * @returns The saved answers or null if not found
   */
  async function fetchSavedQuizAnswersLocal(quizId: string): Promise<Record<string, string[]> | null> {
    try {
      const result = await db.getFirstAsync<{ answers: string }>(
        `SELECT answers FROM quiz_results WHERE quizId = ? ORDER BY updatedAt DESC LIMIT 1`,
        [quizId]
      );

      if (result && result.answers) {
        return JSON.parse(result.answers);
      }
      return null;
    } catch (error) {
      console.error("❌ Failed to fetch saved quiz answers:", error);
      return null;
    }
  }

  return { fetchLocalQuizTimestamps, applyAllQuizUpdatesLocally, submitQuizAnswersLocal, resetQuizLocal, fetchWrongQuizzesLocal, fetchSavedQuizzesLocal, fetchWrongQuestionsLocal, fetchSavedQuestionsLocal,  fetchQuizzesByTopicLocal, fetchQuizByIdLocal, fetchExamsLocal, fetchSavedQuizAnswersLocal}
}
