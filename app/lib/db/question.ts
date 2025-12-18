import * as Crypto from "expo-crypto";
//import { db} from "./db";
import { useSQLiteContext } from "expo-sqlite";

export function useQuestionDatabase() {
  const db = useSQLiteContext();

  async function toggleSaveQuestionLocal(questionId: string): Promise<boolean> {
    try {
      // Execute the query to check if the record exists
      const existing = await db.getFirstAsync<{ saved: number }>(
        `SELECT saved FROM user_quiz_questions WHERE questionId = ?`,
        [questionId]
      );

      let newSaved: number;

      if (existing) {
        // Record exists: toggle the `saved` status
        newSaved = existing.saved ? 0 : 1;
        await db.runAsync(
          `UPDATE user_quiz_questions SET saved = ? WHERE questionId = ?`,
          [newSaved, questionId]
        );
      } else {
        // Record does NOT exist: insert a new one as saved
        newSaved = 1;
        const id = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO user_quiz_questions (id, questionId, saved) VALUES (?, ?, ?)`,
          [id, questionId, newSaved]
        );
      }

      return Boolean(newSaved);
    } catch (error) {
      console.error("❌ Failed to toggle saved question:", error);
      return false;
    }
  }

  async function toggleLikeQuestionLocal(questionId: string): Promise<boolean> {
    try {
      const existing = await db.getFirstAsync<{ liked: number; disliked: number }>(
        `SELECT liked, disliked FROM user_quiz_questions WHERE questionId = ?`,
        [questionId]
      );

      let newLiked: number;

      if (existing) {
        newLiked = existing.liked ? 0 : 1;

        await db.runAsync(
          `UPDATE user_quiz_questions SET liked = ?, disliked = ? WHERE questionId = ?`,
          [newLiked, newLiked ? 0 : existing.disliked ?? 0, questionId]
        );

        if (newLiked) {
          await db.runAsync(`UPDATE quiz_questions SET likes = likes + 1 WHERE id = ?`, [questionId]);
          if (existing.disliked) {
            await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes - 1 WHERE id = ?`, [questionId]);
          }
        } else {
          await db.runAsync(`UPDATE quiz_questions SET likes = likes - 1 WHERE id = ?`, [questionId]);
        }
      } else {
        // Insert new row with liked = 1
        newLiked = 1;
        const id = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO user_quiz_questions (id, questionId, liked, disliked) VALUES (?, ?, ?, ?)`,
          [id, questionId, 1, 0]
        );
        await db.runAsync(`UPDATE quiz_questions SET likes = likes + 1 WHERE id = ?`, [questionId]);
      }

      return !!newLiked;
    } catch (error) {
      console.error("❌ Failed to toggle like locally:", error);
      return false;
    }
  }

  // 🔹 Toggle Dislike
  async function toggleDislikeQuestionLocal(questionId: string): Promise<boolean> {
    try {
      const existing = await db.getFirstAsync<{ liked: number; disliked: number }>(
        `SELECT liked, disliked FROM user_quiz_questions WHERE questionId = ?`,
        [questionId]
      );

      let newDisliked: number;

      if (existing) {
        newDisliked = existing.disliked ? 0 : 1;

        await db.runAsync(
          `UPDATE user_quiz_questions SET disliked = ?, liked = ? WHERE questionId = ?`,
          [newDisliked, newDisliked ? 0 : existing.liked ?? 0, questionId]
        );

        if (newDisliked) {
          await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes + 1 WHERE id = ?`, [questionId]);
          if (existing.liked) {
            await db.runAsync(`UPDATE quiz_questions SET likes = likes - 1 WHERE id = ?`, [questionId]);
          }
        } else {
          await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes - 1 WHERE id = ?`, [questionId]);
        }
      } else {
        // Insert new row with disliked = 1
        newDisliked = 1;
        const id = Crypto.randomUUID();
        await db.runAsync(
          `INSERT INTO user_quiz_questions (id, questionId, liked, disliked) VALUES (?, ?, ?, ?)`,
          [id, questionId, 0, 1]
        );
        await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes + 1 WHERE id = ?`, [questionId]);
      }

      return !!newDisliked;
    } catch (error) {
      console.error("❌ Failed to toggle dislike locally:", error);
      return false;
    }
  }

  return { toggleSaveQuestionLocal, toggleLikeQuestionLocal, toggleDislikeQuestionLocal };
}

// 🔹 Toggle Save
// export async function toggleSaveQuestionLocal(questionId: string): Promise<boolean> {
//   try {
//     const existing = await db.getFirstAsync<{ saved: number }>(
//       `SELECT saved FROM user_quiz_questions WHERE questionId = ?`,
//       [questionId]
//     );

//     let newSaved: number;

//     if (existing) {
//       // record exists → toggle it
//       newSaved = existing.saved ? 0 : 1;
//       await db.runAsync(
//         `UPDATE user_quiz_questions SET saved = ? WHERE questionId = ?`,
//         [newSaved, questionId]
//       );
//     } else {
//       // record does NOT exist → insert as saved
//       newSaved = 1;
//       const id = Crypto.randomUUID();
//       await db.runAsync(
//         `INSERT INTO user_quiz_questions (id, questionId, saved) VALUES (?, ?, ?)`,
//         [id, questionId, newSaved]
//       );
//     }

//     return Boolean(newSaved);
//   } catch (error) {
//     console.error("❌ Failed to toggle saved question:", error);
//     return false;
//   }
// }


// // 🔹 Toggle Like
// export async function toggleLikeQuestionLocal(questionId: string): Promise<boolean> {
//   try {
//     const existing = await db.getFirstAsync<{ liked: number; disliked: number }>(
//       `SELECT liked, disliked FROM user_quiz_questions WHERE questionId = ?`,
//       [questionId]
//     );

//     let newLiked: number;

//     if (existing) {
//       newLiked = existing.liked ? 0 : 1;

//       await db.runAsync(
//         `UPDATE user_quiz_questions SET liked = ?, disliked = ? WHERE questionId = ?`,
//         [newLiked, newLiked ? 0 : existing.disliked ?? 0, questionId]
//       );

//       if (newLiked) {
//         await db.runAsync(`UPDATE quiz_questions SET likes = likes + 1 WHERE id = ?`, [questionId]);
//         if (existing.disliked) {
//           await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes - 1 WHERE id = ?`, [questionId]);
//         }
//       } else {
//         await db.runAsync(`UPDATE quiz_questions SET likes = likes - 1 WHERE id = ?`, [questionId]);
//       }
//     } else {
//       // Insert new row with liked = 1
//       newLiked = 1;
//       const id = Crypto.randomUUID();
//       await db.runAsync(
//         `INSERT INTO user_quiz_questions (id, questionId, liked, disliked) VALUES (?, ?, ?, ?)`,
//         [id, questionId, 1, 0]
//       );
//       await db.runAsync(`UPDATE quiz_questions SET likes = likes + 1 WHERE id = ?`, [questionId]);
//     }

//     return !!newLiked;
//   } catch (error) {
//     console.error("❌ Failed to toggle like locally:", error);
//     return false;
//   }
// }

// // 🔹 Toggle Dislike
// export async function toggleDislikeQuestionLocal(questionId: string): Promise<boolean> {
//   try {
//     const existing = await db.getFirstAsync<{ liked: number; disliked: number }>(
//       `SELECT liked, disliked FROM user_quiz_questions WHERE questionId = ?`,
//       [questionId]
//     );

//     let newDisliked: number;

//     if (existing) {
//       newDisliked = existing.disliked ? 0 : 1;

//       await db.runAsync(
//         `UPDATE user_quiz_questions SET disliked = ?, liked = ? WHERE questionId = ?`,
//         [newDisliked, newDisliked ? 0 : existing.liked ?? 0, questionId]
//       );

//       if (newDisliked) {
//         await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes + 1 WHERE id = ?`, [questionId]);
//         if (existing.liked) {
//           await db.runAsync(`UPDATE quiz_questions SET likes = likes - 1 WHERE id = ?`, [questionId]);
//         }
//       } else {
//         await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes - 1 WHERE id = ?`, [questionId]);
//       }
//     } else {
//       // Insert new row with disliked = 1
//       newDisliked = 1;
//       const id = Crypto.randomUUID();
//       await db.runAsync(
//         `INSERT INTO user_quiz_questions (id, questionId, liked, disliked) VALUES (?, ?, ?, ?)`,
//         [id, questionId, 0, 1]
//       );
//       await db.runAsync(`UPDATE quiz_questions SET dislikes = dislikes + 1 WHERE id = ?`, [questionId]);
//     }

//     return !!newDisliked;
//   } catch (error) {
//     console.error("❌ Failed to toggle dislike locally:", error);
//     return false;
//   }
// }

