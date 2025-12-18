import api from "../axios";
import { useSQLiteContext } from "expo-sqlite";

export function useUserDatabase() {
  const db = useSQLiteContext();

  async function fetchAndStoreUserData(
    token: string,
    onProgress?: (completed: number, total: number) => void
  ) {
    try {
      // 1. Fetch user results + interactions + lesson progress
      const res = await api.get("/user/expo-sync", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data) throw new Error("No user data returned");

      const { quizResults = [], userQuizQuestions = [], lessonProgress = [] } = res.data;

      const total = quizResults.length + userQuizQuestions.length + lessonProgress.length;
      let completed = 0;

      // 2. Insert quiz results
      for (const r of quizResults) {
        await db.runAsync(`DELETE FROM quiz_results WHERE quizId = ?`, [r.quizId]);
        await db.runAsync(
          `INSERT OR REPLACE INTO quiz_results 
          (id, quizId, answers, score, completed, attemptCount, synced, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id,
            r.quizId,
            JSON.stringify(r.answers || []),
            r.score ?? 0,
            r.completed ? 1 : 0,
            r.attemptCount ?? 0,
            1, // synced
            r.updatedAt,
          ]
        );

        completed++;
        onProgress?.(completed, total);
      }

      // 3. Insert user quiz question interactions
      for (const q of userQuizQuestions) {
        await db.runAsync(`DELETE FROM user_quiz_questions WHERE questionId = ?`, [q.questionId]);
        await db.runAsync(
          `INSERT OR REPLACE INTO user_quiz_questions 
          (id, questionId, liked, disliked, saved)
          VALUES (?, ?, ?, ?, ?)`,
          [
            q.id,
            q.questionId,
            q.liked ? 1 : 0,
            q.disliked ? 1 : 0,
            q.saved ? 1 : 0,
          ]
        );

        completed++;
        onProgress?.(completed, total);
      }

      // 4. Insert lesson progress
      for (const lp of lessonProgress) {
        await db.runAsync(`DELETE FROM lesson_progress WHERE lessonId = ?`, [lp.lessonId]);
        await db.runAsync(
          `INSERT OR REPLACE INTO lesson_progress
          (id, lessonId, completed, synced)
          VALUES (?, ?, ?, ?)`,
          [
            lp.id,
            lp.lessonId,
            lp.completed ? 1 : 0,
            1, // synced
          ]
        );

        completed++;
        onProgress?.(completed, total);
      }

      return { success: true, total };
    } catch (err) {
      console.error("❌ Failed to fetch & store user data:", err);
      return { success: false, error: err instanceof Error ? err.message : err };
    }
  }

  return { fetchAndStoreUserData };
}


// import api from "../axios";
// import {  useSQLiteContext } from "expo-sqlite";


// export function useUserDatabase() {
//   const db = useSQLiteContext();

//   async function fetchAndStoreUserData(
//     token: string,
//     onProgress?: (completed: number, total: number) => void
//   ) {
//     try {
//       // 1. Fetch user results + interactions
//       const res = await api.get("/user/expo-sync", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!res.data) throw new Error("No user data returned");

//       const { quizResults = [], userQuizQuestions = [] } = res.data;

//       const total = quizResults.length + userQuizQuestions.length;
//       let completed = 0;

//       // 2. Insert quiz results
//       for (const r of quizResults) {
//         await db.runAsync(
//           `INSERT OR REPLACE INTO quiz_results 
//           (id, quizId, answers, score, completed, attemptCount, synced, updatedAt)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             r.id,
//             r.quizId,
//             JSON.stringify(r.answers || []),
//             r.score ?? 0,
//             r.completed ? 1 : 0,
//             r.attemptCount ?? 0,
//             1, 
//             r.updatedAt
//           ]
//         );

//         completed++;
//         onProgress?.(completed, total);
//       }

//       // 3. Insert user quiz question interactions
//       for (const q of userQuizQuestions) {
//         await db.runAsync(
//           `INSERT OR REPLACE INTO user_quiz_questions 
//           (id, questionId, liked, disliked, saved)
//           VALUES (?, ?, ?, ?, ?)`,
//           [
//             q.id,
//             q.questionId,
//             q.liked ? 1 : 0,
//             q.disliked ? 1 : 0,
//             q.saved ? 1 : 0,
//           ]
//         );

//         completed++;
//         onProgress?.(completed, total);
//       }

//       return { success: true, total };
//     } catch (err) {
//       console.error("❌ Failed to fetch & store user data:", err);
//       return { success: false, error: err instanceof Error ? err.message : err };
//     }
//   }

//   return {fetchAndStoreUserData}
// }