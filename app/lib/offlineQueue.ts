import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetQuiz, saveQuestion, submitQuizAnswers, updateUserPoints } from './api/quiz';

const OFFLINE_QUEUE_KEY = 'offlineQueue';

export async function enqueueOfflineAction(action: any) {
  const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue = queueJson ? JSON.parse(queueJson) : [];
  queue.push(action);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function processOfflineQueue(token: string) {
  const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueJson) return;
  const queue = JSON.parse(queueJson);
  const remaining: any[] = [];

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'updatePoints':
          await updateUserPoints(token, action.payload.points);
          break;
        case 'submitQuiz':
          await submitQuizAnswers(token, action.payload.quizId, action.payload.answers, action.payload.method);
          break;
        case 'toggleSave':
          await saveQuestion(token, action.payload.questionId);
          break;
        case 'resetQuiz':
          await resetQuiz(token, action.payload.quizId);
          break;
        default:
          break;
      }
    } catch (err) {
      remaining.push(action);
    }
  }

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}
