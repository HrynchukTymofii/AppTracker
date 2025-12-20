/**
 * Task Verification Module
 *
 * Uses OpenAI Vision API to verify task completion through before/after photos.
 * The system compares two photos to determine if a task has been completed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyTaskWithPhotos, TaskVerificationResult as OpenAIVerificationResult } from './openai';

// Storage keys
const TASKS_KEY = '@verification_tasks';

// Types
export interface VerificationTask {
  id: string;
  title: string;
  description: string;
  beforePhotoUri: string;
  afterPhotoUri?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  verificationResult?: VerificationResult;
  blockedApps: string[];
  focusSessionId?: string;
}

export type VerificationResult = OpenAIVerificationResult;

/**
 * Verify task completion using OpenAI Vision API
 */
export const verifyTaskCompletion = async (
  beforePhotoUri: string,
  afterPhotoUri: string,
  taskDescription: string
): Promise<VerificationResult> => {
  return await verifyTaskWithPhotos(beforePhotoUri, afterPhotoUri, taskDescription);
};

/**
 * Create a new verification task
 */
export const createVerificationTask = async (
  title: string,
  description: string,
  beforePhotoUri: string,
  blockedApps: string[],
  focusSessionId?: string
): Promise<VerificationTask> => {
  const tasks = await getVerificationTasks();

  const newTask: VerificationTask = {
    id: Date.now().toString(),
    title,
    description,
    beforePhotoUri,
    status: 'in_progress',
    createdAt: Date.now(),
    blockedApps,
    focusSessionId,
  };

  tasks.push(newTask);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  return newTask;
};

/**
 * Get all verification tasks
 */
export const getVerificationTasks = async (): Promise<VerificationTask[]> => {
  try {
    const stored = await AsyncStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting verification tasks:', error);
    return [];
  }
};

/**
 * Get a specific task by ID
 */
export const getVerificationTask = async (id: string): Promise<VerificationTask | null> => {
  const tasks = await getVerificationTasks();
  return tasks.find((t) => t.id === id) || null;
};

/**
 * Complete a verification task
 */
export const completeVerificationTask = async (
  taskId: string,
  afterPhotoUri: string
): Promise<VerificationResult> => {
  const tasks = await getVerificationTasks();
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    throw new Error('Task not found');
  }

  const task = tasks[taskIndex];

  // Verify the task
  const result = await verifyTaskCompletion(task.beforePhotoUri, afterPhotoUri, task.description);

  // Update task status
  task.afterPhotoUri = afterPhotoUri;
  task.status = result.isTaskCompleted ? 'completed' : 'failed';
  task.completedAt = Date.now();
  task.verificationResult = result;

  tasks[taskIndex] = task;
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

  return result;
};

/**
 * Delete a verification task
 */
export const deleteVerificationTask = async (id: string): Promise<void> => {
  const tasks = await getVerificationTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
};

/**
 * Get active tasks (in progress)
 */
export const getActiveTasks = async (): Promise<VerificationTask[]> => {
  const tasks = await getVerificationTasks();
  return tasks.filter((t) => t.status === 'in_progress');
};

/**
 * Quick task verification for common tasks
 */
export const PRESET_TASKS = [
  {
    id: 'clean_desk',
    title: 'Clean Desk',
    description: 'Clean and organize your desk/workspace',
    icon: '=�',
  },
  {
    id: 'make_bed',
    title: 'Make Bed',
    description: 'Make your bed neatly',
    icon: '=�',
  },
  {
    id: 'do_dishes',
    title: 'Do Dishes',
    description: 'Wash the dishes or load the dishwasher',
    icon: '<}',
  },
  {
    id: 'exercise',
    title: 'Exercise',
    description: 'Complete a workout or exercise session',
    icon: '=�',
  },
  {
    id: 'read',
    title: 'Read',
    description: 'Read a book or educational material',
    icon: '=�',
  },
  {
    id: 'homework',
    title: 'Homework',
    description: 'Complete homework or study assignment',
    icon: '=�',
  },
  {
    id: 'organize',
    title: 'Organize',
    description: 'Organize a closet, drawer, or area',
    icon: '=�',
  },
  {
    id: 'cook',
    title: 'Cook a Meal',
    description: 'Prepare and cook a healthy meal',
    icon: '<s',
  },
  {
    id: 'custom',
    title: 'Custom Task',
    description: 'Define your own task',
    icon: '(',
  },
];

