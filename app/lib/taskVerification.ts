/**
 * Task Verification Module
 *
 * Uses OpenAI Vision API to verify task completion through before/after photos.
 * The system compares two photos to determine if a task has been completed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Storage keys
const TASKS_KEY = '@verification_tasks';
const OPENAI_API_KEY_STORAGE = '@openai_api_key';

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

export interface VerificationResult {
  isTaskCompleted: boolean;
  confidence: number; // 0-100
  explanation: string;
  detectedChanges: string[];
}

export interface OpenAIVisionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Set OpenAI API Key (should be done during app setup)
 */
export const setOpenAIApiKey = async (apiKey: string): Promise<void> => {
  await AsyncStorage.setItem(OPENAI_API_KEY_STORAGE, apiKey);
};

/**
 * Get OpenAI API Key
 */
export const getOpenAIApiKey = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(OPENAI_API_KEY_STORAGE);
};

/**
 * Convert image URI to base64
 */
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Verify task completion using OpenAI Vision API
 */
export const verifyTaskCompletion = async (
  beforePhotoUri: string,
  afterPhotoUri: string,
  taskDescription: string
): Promise<VerificationResult> => {
  const apiKey = await getOpenAIApiKey();

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set it in settings.');
  }

  try {
    // Convert images to base64
    const beforeBase64 = await imageToBase64(beforePhotoUri);
    const afterBase64 = await imageToBase64(afterPhotoUri);

    // Prepare the request
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a task verification assistant. Your job is to compare two photos (before and after) and determine if a task has been completed.

You must respond with a JSON object in this exact format:
{
  "isTaskCompleted": boolean,
  "confidence": number (0-100),
  "explanation": "string explaining your reasoning",
  "detectedChanges": ["list", "of", "observed", "changes"]
}

Be strict but fair in your assessment. Look for meaningful changes that indicate the task was actually done.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Task to verify: "${taskDescription}"

Please compare the BEFORE and AFTER photos and determine if this task has been completed. The first image is BEFORE, the second is AFTER.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${beforeBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${afterBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: OpenAIVisionResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result: VerificationResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error verifying task:', error);
    throw error;
  }
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
    icon: '=Ñ',
  },
  {
    id: 'make_bed',
    title: 'Make Bed',
    description: 'Make your bed neatly',
    icon: '=Ï',
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
    icon: '=ª',
  },
  {
    id: 'read',
    title: 'Read',
    description: 'Read a book or educational material',
    icon: '=Ú',
  },
  {
    id: 'homework',
    title: 'Homework',
    description: 'Complete homework or study assignment',
    icon: '=Ý',
  },
  {
    id: 'organize',
    title: 'Organize',
    description: 'Organize a closet, drawer, or area',
    icon: '=æ',
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

/**
 * Analyze a single image for task context
 */
export const analyzeImage = async (photoUri: string): Promise<string> => {
  const apiKey = await getOpenAIApiKey();

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const base64 = await imageToBase64(photoUri);

    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Briefly describe what you see in this image in 1-2 sentences. Focus on the main subject and its current state.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
      max_tokens: 200,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data: OpenAIVisionResponse = await response.json();
    return data.choices[0]?.message?.content || 'Unable to analyze image';
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};
