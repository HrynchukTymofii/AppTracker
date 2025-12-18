import { useSQLiteContext } from "expo-sqlite";
import { calculateSATScore } from "@/lib/utils";

interface CompletedLessonsRow {
  completedCount: number;
}

interface CompletedQuizzesRow {
  completedCount: number;
}

interface AverageScoreRow {
  avgScore: number;
}

interface ChapterRow {
  id: string;
  title: string;
  position: number;
}

export type CourseItem = {
  id: string;
  title: string;
  type: "lesson" | "quiz";
  chapterId: string;
  position: number;
  isFree: boolean; // Whether this item is free for non-PRO users
  points?: number; // for lessons
  maxScore?: number; // for quizzes
  questionCount?: number; // for quizzes - number of questions
  videoUrl?: string; // for lessons
  progress?: {
    id: string;
    completed: boolean;
  }[];
  results?: {
    id: string;
    score: number;
    completed: boolean;
    attemptCount: number;
  }[];
};

export type ChapterWithItems = {
  id: string;
  title: string;
  position: number;
  items: CourseItem[];
};

export function useCourseDatabase() {
  const db = useSQLiteContext();

  /**
   * Get all chapters with lessons and quizzes (no user progress).
   */
  async function getFullCourse(): Promise<{
    success: boolean;
    chapters?: ChapterWithItems[];
    error?: string;
  }> {
    try {
      // 1. Get all chapters
      const chapters = (await db.getAllAsync(
        `SELECT * FROM chapters WHERE isPublished = 1 ORDER BY position ASC`
      )) as ChapterRow[];

      const allChapters: ChapterWithItems[] = [];

      for (const chapter of chapters) {
        const chapterId = chapter.id;

        // 2. Get lessons for the chapter
        const lessons = (await db.getAllAsync(
          `
          SELECT *
          FROM lessons
          WHERE chapterId = ?
          ORDER BY position ASC
          `,
          [chapterId]
        )) as CourseItem[];

        const lessonItems: CourseItem[] = lessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          type: "lesson",
          chapterId: l.chapterId,
          position: l.position,
          isFree: !!l.isFree,
          points: l.points ?? 0,
          progress: [], // no progress info
        }));

        // 3. Get quizzes for the chapter
        const quizzes = (await db.getAllAsync(
          `
          SELECT *
          FROM quizzes
          WHERE chapterId = ?
          ORDER BY position ASC
          `,
          [chapterId]
        )) as CourseItem[];

        const quizItems: CourseItem[] = quizzes.map((q: any) => ({
          id: q.id,
          title: q.title,
          type: "quiz",
          chapterId: q.chapterId,
          position: q.position,
          isFree: !!q.isFree,
          maxScore: q.maxScore ?? 0,
          results: [], // no result info
        }));

        // 4. Combine & sort
        const combinedItems = [...lessonItems, ...quizItems].sort(
          (a, b) => a.position - b.position
        );

        allChapters.push({
          id: chapter.id,
          title: chapter.title,
          position: chapter.position,
          items: combinedItems,
        });
      }

      return { success: true, chapters: allChapters };
    } catch (err) {
      console.error("❌ Failed to load course (no progress):", err);
      return { success: false, error: "Failed to fetch course" };
    }
  }

  
  
  /**
   * Get all chapters with lessons and quizzes,
   * both ordered by position, and including progress/results.
   */
  async function getFullCourseWithProgress(): Promise<{
    success: boolean;
    chapters?: ChapterWithItems[];
    error?: string;
  }> {
    try {
      // --- 1. Get all chapters ordered by position ---
      const chapters = (await db.getAllAsync(
        `SELECT * FROM chapters WHERE isPublished = 1 ORDER BY position ASC`
      )) as ChapterRow[];

      const allChapters: ChapterWithItems[] = [];

      for (const chapter of chapters) {
        const chapterId = chapter.id;

        // --- 2. Get lessons for the chapter ---
        const lessons = (await db.getAllAsync(
          `
          SELECT l.*, lp.id AS progressId, lp.completed
          FROM lessons l
          LEFT JOIN lesson_progress lp ON lp.lessonId = l.id
          WHERE l.chapterId = ?
          ORDER BY l.position ASC
          `,
          [chapterId]
        )) as (CourseItem & { progressId?: string; completed?: number })[];

        const lessonItems: CourseItem[] = lessons.map((l: any) => ({
          id: l.id,
          title: l.title,
          type: "lesson",
          chapterId: l.chapterId,
          position: l.position,
          isFree: !!l.isFree,
          points: l.points ?? 0,
          progress: l.progressId
            ? [{ id: l.progressId, completed: !!l.completed }]
            : [],
        }));

        // --- 3. Get quizzes for the chapter ---
        const quizzes = (await db.getAllAsync(
          `
          SELECT q.*, qr.id AS resultId, qr.score, qr.completed, qr.attemptCount
          FROM quizzes q
          LEFT JOIN quiz_results qr ON qr.quizId = q.id
          WHERE q.chapterId = ?
          ORDER BY q.position ASC
          `,
          [chapterId]
        )) as (CourseItem & {
          resultId?: string;
          score?: number;
          completed?: number;
          attemptCount?: number;
        })[];

        const quizItems: CourseItem[] = quizzes.map((q: any) => ({
          id: q.id,
          title: q.title,
          type: "quiz",
          chapterId: q.chapterId,
          position: q.position,
          isFree: !!q.isFree,
          maxScore: q.maxScore ?? 0,
          results: q.resultId
            ? [
                {
                  id: q.resultId,
                  score: q.score ?? 0,
                  completed: !!q.completed,
                  attemptCount: q.attemptCount ?? 0,
                },
              ]
            : [],
        }));

        // --- 4. Combine and sort by position ---
        const combinedItems = [...lessonItems, ...quizItems].sort(
          (a, b) => a.position - b.position
        );

        allChapters.push({
          id: chapter.id,
          title: chapter.title,
          position: chapter.position,
          items: combinedItems,
        });
      }

      return { success: true, chapters: allChapters };
    } catch (err) {
      console.error("❌ Failed to load full course:", err);
      return { success: false, error: "Failed to fetch course" };
    }
  }

  async function getCompletedLessonsCount() {
    try {
      const rows = await db.getAllAsync(
        `
        SELECT COUNT(*) as completedCount
        FROM lesson_progress
        WHERE completed = 1
        `
      ) as CompletedLessonsRow[];

      // Check if any completed lesson has a video
      const videoRows = await db.getAllAsync(
        `
        SELECT COUNT(*) as hasVideoCount
        FROM lesson_progress lp
        JOIN lessons l ON lp.lessonId = l.id
        WHERE lp.completed = 1
        AND (l.videoUrl IS NOT NULL AND l.videoUrl != '')
        `
      ) as { hasVideoCount: number }[];

      const count = rows?.[0]?.completedCount ?? 0;
      const hasVideoLessons = (videoRows?.[0]?.hasVideoCount ?? 0) > 0;

      return { success: true, count, hasVideoLessons };
    } catch (err) {
      console.error("❌ Failed to get completed lessons count:", err);
      return { success: false, error: "Failed to count completed lessons" };
    }
  }

  async function getCompletedQuizzesCount() {
    try {
      const rows = (await db.getAllAsync(
        `
        SELECT COUNT(*) as completedCount
        FROM quiz_results
        WHERE completed = 1
        `
      )) as CompletedQuizzesRow[];

      const count = rows?.[0]?.completedCount ?? 0;
      return { success: true, count };
    } catch (err) {
      console.error("❌ Failed to get completed quizzes count:", err);
      return { success: false, error: "Failed to count completed quizzes" };
    }
  }

  /**
   * Calculate average SAT score for completed exams in a chapter (SAT exams only)
   * Uses the calculateSATScore function to convert raw scores to SAT scaled scores
   */
  async function getAverageScoreByChapter(chapterId: string) {
    try {
      // Get all completed quiz results with their questions and answers
      const rows = (await db.getAllAsync(
        `
        SELECT qr.id as resultId, qr.answers, q.id as quizId, q.totalQuestions
        FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        WHERE q.chapterId = ?
          AND qr.completed = 1
        `,
        [chapterId]
      )) as { resultId: string; answers: string; quizId: string; totalQuestions: number }[];

      if (!rows || rows.length === 0) {
        return { success: true, average: 0 };
      }

      // Calculate SAT score for each exam result
      let totalSATScore = 0;
      let validExamCount = 0;

      for (const row of rows) {
        try {
          const userAnswers = JSON.parse(row.answers);

          // Get all questions for this quiz to check correctness
          const questions = await db.getAllAsync(
            `SELECT id, answers FROM quiz_questions WHERE quizId = ?`,
            [row.quizId]
          ) as { id: string; answers: string }[];

          // Count correct answers
          let correctCount = 0;
          for (const question of questions) {
            const userAns = userAnswers[question.id] || [];
            const correctAns = JSON.parse(question.answers);

            // Check if answer is correct
            const isCorrect = correctAns.length === userAns.length &&
              correctAns.every((a: string) => userAns.includes(a));

            if (isCorrect) correctCount++;
          }

          const totalQuestions = row.totalQuestions;
          if (totalQuestions > 0) {
            const satScore = calculateSATScore(correctCount, totalQuestions);
            totalSATScore += satScore;
            validExamCount++;
          }
        } catch (parseError) {
          console.warn("Failed to parse answers for exam:", parseError);
        }
      }

      const averageSATScore = validExamCount > 0 ? Math.round(totalSATScore / validExamCount) : 0;
      return { success: true, average: averageSATScore };
    } catch (err) {
      console.error("❌ Failed to get average SAT score for chapter:", err);
      return { success: false, error: "Failed to calculate average SAT score" };
    }
  }

  /**
   * Check if user has at least one completed exam with SAT score >= 700
   */
  async function hasHighSATScore(chapterId: string) {
    try {
      // Get all completed quiz results with their questions and answers
      const rows = (await db.getAllAsync(
        `
        SELECT qr.id as resultId, qr.answers, q.id as quizId, q.totalQuestions
        FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        WHERE q.chapterId = ?
          AND qr.completed = 1
        `,
        [chapterId]
      )) as { resultId: string; answers: string; quizId: string; totalQuestions: number }[];

      if (!rows || rows.length === 0) {
        return { success: true, hasHighScore: false };
      }

      // Check if any exam has SAT score >= 700
      for (const row of rows) {
        try {
          const userAnswers = JSON.parse(row.answers);

          // Get all questions for this quiz to check correctness
          const questions = await db.getAllAsync(
            `SELECT id, answers FROM quiz_questions WHERE quizId = ?`,
            [row.quizId]
          ) as { id: string; answers: string }[];

          // Count correct answers
          let correctCount = 0;
          for (const question of questions) {
            const userAns = userAnswers[question.id] || [];
            const correctAns = JSON.parse(question.answers);

            // Check if answer is correct
            const isCorrect = correctAns.length === userAns.length &&
              correctAns.every((a: string) => userAns.includes(a));

            if (isCorrect) correctCount++;
          }

          const totalQuestions = row.totalQuestions;
          if (totalQuestions > 0) {
            const satScore = calculateSATScore(correctCount, totalQuestions);
            if (satScore >= 700) {
              return { success: true, hasHighScore: true };
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse answers for exam:", parseError);
        }
      }

      return { success: true, hasHighScore: false };
    } catch (err) {
      console.error("❌ Failed to check high SAT score:", err);
      return { success: false, error: "Failed to check high SAT score" };
    }
  }

  async function hasPerfectScoreInPublishedChapters() {
    try {
      const rows = (await db.getAllAsync(
        `
        SELECT qr.score, q.maxScore
        FROM quiz_results qr
        JOIN quizzes q ON qr.quizId = q.id
        JOIN chapters c ON q.chapterId = c.id
        WHERE qr.completed = 1
          AND q.isPublished = 1
          AND c.isPublished = 1
        `
      )) as { score: number | null; maxScore: number | null }[];

      let hasPerfectScore = false;

      for (const row of rows) {
        const score = row.score ?? 0;
        const maxScore = row.maxScore ?? 0;
        if (maxScore > 0 && score / maxScore === 1) {
          hasPerfectScore = true;
          break;
        }
      }

      return { success: true, hasPerfectScore };
    } catch (err) {
      console.error("❌ Failed to check perfect score in published chapters:", err);
      return { success: false, error: "Failed to check perfect scores" };
    }
  }




  /**
   * Get a single chapter with its lessons and quizzes, including progress/results.
   */
  async function getChapterItems(chapterId: string): Promise<{
    success: boolean;
    chapter?: ChapterWithItems;
    error?: string;
  }> {
    try {
      // --- 1. Get the chapter ---
      const chapterRows = (await db.getAllAsync(
        `SELECT * FROM chapters WHERE id = ? AND isPublished = 1`,
        [chapterId]
      )) as ChapterRow[];

      if (!chapterRows || chapterRows.length === 0) {
        return { success: false, error: "Chapter not found" };
      }

      const chapter = chapterRows[0];

      // --- 2. Get lessons for the chapter ---
      const lessons = (await db.getAllAsync(
        `
        SELECT l.*, lp.id AS progressId, lp.completed
        FROM lessons l
        LEFT JOIN lesson_progress lp ON lp.lessonId = l.id
        WHERE l.chapterId = ?
        ORDER BY l.position ASC
        `,
        [chapterId]
      )) as (CourseItem & { progressId?: string; completed?: number })[];

      const lessonItems: CourseItem[] = lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        type: "lesson",
        chapterId: l.chapterId,
        position: l.position,
        isFree: !!l.isFree,
        points: l.points ?? 0,
        videoUrl: l.videoUrl,
        progress: l.progressId
          ? [{ id: l.progressId, completed: !!l.completed }]
          : [],
      }));

      // --- 3. Get quizzes for the chapter ---
      const quizzes = (await db.getAllAsync(
        `
        SELECT q.*, qr.id AS resultId, qr.score, qr.completed, qr.attemptCount
        FROM quizzes q
        LEFT JOIN quiz_results qr ON qr.quizId = q.id
        WHERE q.chapterId = ?
        ORDER BY q.position ASC
        `,
        [chapterId]
      )) as (CourseItem & {
        resultId?: string;
        score?: number;
        maxScore: number;
        totalQuestions?: number;
        completed?: number;
        attemptCount?: number;
      })[];

      const quizItems: CourseItem[] = quizzes.map((q: any) => ({
        id: q.id,
        title: q.title,
        type: "quiz",
        chapterId: q.chapterId,
        position: q.position,
        isFree: !!q.isFree,
        maxScore: q.maxScore ?? 0,
        questionCount: q.totalQuestions ?? 0,
        results: q.resultId
          ? [
              {
                id: q.resultId,
                score: q.score ?? 0,
                maxScore: q.maxScore,
                completed: !!q.completed,
                attemptCount: q.attemptCount ?? 0,
              },
            ]
          : [],
      }));

      // --- 4. Combine and sort by position ---
      const combinedItems = [...lessonItems, ...quizItems].sort(
        (a, b) => a.position - b.position
      );

      return {
        success: true,
        chapter: {
          id: chapter.id,
          title: chapter.title,
          position: chapter.position,
          items: combinedItems,
        },
      };
    } catch (err) {
      console.error("❌ Failed to load chapter items:", err);
      return { success: false, error: "Failed to fetch chapter items" };
    }
  }

  /**
   * Get the 3 most recent chapters the user has interacted with.
   * Returns chapters ordered by most recent activity (lesson_progress or quiz_results).
   */
  async function getRecentChapters(): Promise<{
    success: boolean;
    chapters?: Array<{
      id: string;
      title: string;
      position: number;
      progress: number;
      lastActivity: string;
    }>;
    error?: string;
  }> {
    try {
      // Get chapters with recent activity from either lessons or quizzes
      const recentChapters = await db.getAllAsync<{
        chapterId: string;
        title: string;
        position: number;
        lastActivity: string;
      }>(
        `
        SELECT
          c.id as chapterId,
          c.title,
          c.position,
          MAX(activity.updatedAt) as lastActivity
        FROM chapters c
        INNER JOIN (
          -- Get lesson progress activities
          SELECT l.chapterId, lp.updatedAt
          FROM lesson_progress lp
          JOIN lessons l ON lp.lessonId = l.id
          WHERE lp.completed = 1

          UNION ALL

          -- Get quiz result activities
          SELECT q.chapterId, qr.updatedAt
          FROM quiz_results qr
          JOIN quizzes q ON qr.quizId = q.id
          WHERE qr.completed = 1
        ) as activity ON activity.chapterId = c.id
        WHERE c.isPublished = 1
        GROUP BY c.id, c.title, c.position
        ORDER BY lastActivity DESC
        LIMIT 3
        `
      );

      //console.log(recentChapters)

      if (!recentChapters || recentChapters.length === 0) {
        return { success: true, chapters: [] };
      }

      // Calculate progress for each chapter based on points
      const chaptersWithProgress = await Promise.all(
        recentChapters.map(async (chapter) => {
          // Get total points from lessons in this chapter
          const lessonPointsResult = await db.getFirstAsync<{ totalPoints: number }>(
            `
            SELECT COALESCE(SUM(points), 0) as totalPoints
            FROM lessons
            WHERE chapterId = ?
            `,
            [chapter.chapterId]
          );

          // Get earned points from completed lessons
          const earnedLessonPointsResult = await db.getFirstAsync<{ earnedPoints: number }>(
            `
            SELECT COALESCE(SUM(l.points), 0) as earnedPoints
            FROM lessons l
            JOIN lesson_progress lp ON lp.lessonId = l.id
            WHERE l.chapterId = ? AND lp.completed = 1
            `,
            [chapter.chapterId]
          );

          // Get total max scores from quizzes in this chapter
          const quizMaxScoreResult = await db.getFirstAsync<{ totalMaxScore: number }>(
            `
            SELECT COALESCE(SUM(maxScore), 0) as totalMaxScore
            FROM quizzes
            WHERE chapterId = ?
            `,
            [chapter.chapterId]
          );

          // Get earned points from quiz results
          const earnedQuizPointsResult = await db.getFirstAsync<{ earnedPoints: number }>(
            `
            SELECT COALESCE(SUM(qr.score), 0) as earnedPoints
            FROM quizzes q
            JOIN quiz_results qr ON qr.quizId = q.id
            WHERE q.chapterId = ? AND qr.completed = 1
            `,
            [chapter.chapterId]
          );

          const totalPoints = (lessonPointsResult?.totalPoints ?? 0) + (quizMaxScoreResult?.totalMaxScore ?? 0);
          const earnedPoints = (earnedLessonPointsResult?.earnedPoints ?? 0) + (earnedQuizPointsResult?.earnedPoints ?? 0);
          const progress = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

          return {
            id: chapter.chapterId,
            title: chapter.title,
            position: chapter.position,
            progress,
            lastActivity: chapter.lastActivity,
          };
        })
      );

      return { success: true, chapters: chaptersWithProgress };
    } catch (err) {
      console.error("❌ Failed to get recent chapters:", err);
      return { success: false, error: "Failed to fetch recent chapters" };
    }
  }

  return { getCompletedLessonsCount, hasPerfectScoreInPublishedChapters, getCompletedQuizzesCount, getAverageScoreByChapter, hasHighSATScore, getFullCourse, getFullCourseWithProgress, getChapterItems, getRecentChapters }
}
