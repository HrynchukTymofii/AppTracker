/**
 * OpenAI Service Module
 *
 * Centralized service for all OpenAI API interactions including:
 * 1. Task verification with photos
 * 2. Intention analysis for app blocking
 * 3. Smart notification generation
 *
 * Supports 15 languages for all AI interactions
 */

import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import i18n from '@/i18n/config';

// Get API key from expo config (loaded from .env via app.config.ts)
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openAiApiKey || '';

// Debug: Log if API key is configured (first 10 chars only for security)
// if (OPENAI_API_KEY) {
//   console.log('[OpenAI] API key configured:', OPENAI_API_KEY.substring(0, 10) + '...');
// } else {
//   console.warn('[OpenAI] API key NOT configured. Check .env file and restart Metro bundler.');
// }

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Language mapping for OpenAI
const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English',
  'en-GB': 'English',
  'de-DE': 'German',
  'fr-FR': 'French',
  'uk-UA': 'Ukrainian',
  'es-ES': 'Spanish',
  'zh-CN': 'Chinese (Simplified)',
  'ja-JP': 'Japanese',
  'pt-BR': 'Portuguese',
  'it-IT': 'Italian',
  'ko-KR': 'Korean',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'ar-SA': 'Arabic',
  'hi-IN': 'Hindi',
};

/**
 * Get current user language for AI prompts
 */
const getCurrentLanguage = (): string => {
  const currentLang = i18n.language || 'en-US';
  return LANGUAGE_NAMES[currentLang] || 'English';
};

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }>;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Convert image URI to base64
 */
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Make a request to OpenAI API
 */
const makeOpenAIRequest = async (
  messages: OpenAIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set OPEN_AI_API_KEY in .env file.');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('OpenAI API request failed:', error);
    throw error;
  }
};

// ==================== TASK VERIFICATION ====================

export interface TaskVerificationResult {
  isTaskCompleted: boolean;
  confidence: number; // 0-100 (internal use for 70% threshold)
  message: string; // Short friendly response (1-2 sentences)
  earnedMinutes: number; // 5-15 based on task difficulty
}

/**
 * Verify task completion by comparing before/after photos
 */
export const verifyTaskWithPhotos = async (
  beforePhotoUri: string,
  afterPhotoUri: string,
  taskDescription: string
): Promise<TaskVerificationResult> => {
  try {
    const userLanguage = getCurrentLanguage();

    // Convert images to base64
    const beforeBase64 = await imageToBase64(beforePhotoUri);
    const afterBase64 = await imageToBase64(afterPhotoUri);

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a friendly coach verifying if someone completed their task. Compare the before and after photos.

IMPORTANT: Respond in ${userLanguage} language.

Be natural and encouraging! Like a supportive friend, not a robot.

Respond with JSON:
{
  "isTaskCompleted": boolean,
  "confidence": number (0-100, for internal use only),
  "message": "Short friendly response (1-2 sentences max) in ${userLanguage}. Examples:
    - Success: 'Nice work! Your desk looks so much cleaner now 🎉'
    - Success: 'Great job getting that done! 💪'
    - Failed: 'Hmm, I don't see much change yet. Give it another try?'
    - Failed: 'Almost there! Finish up and show me again.'",
  "earnedMinutes": number (5-15 based on task difficulty):
    - 5: Simple tasks (making bed, quick tidy)
    - 8-10: Medium tasks (cleaning room, dishes, organizing)
    - 12-15: Hard tasks (deep cleaning, physical work, big projects)
}

Keep "message" SHORT and HUMAN. No formal language. No mentioning confidence scores or percentages.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Task to verify: "${taskDescription}"

Compare the BEFORE (first image) and AFTER (second image) photos. Did they complete it?

Respond in ${userLanguage} with a short, friendly message.`,
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
    ];

    const response = await makeOpenAIRequest(messages, 0.3, 1000);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result: TaskVerificationResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error verifying task with photos:', error);
    throw error;
  }
};

/**
 * Verify task completion with just an "after" photo (no before photo comparison)
 * Used for tasks like cooking, homework, workouts where no "before" state is needed
 */
export const verifyTaskWithPhoto = async (
  photoUri: string,
  taskDescription: string
): Promise<TaskVerificationResult> => {
  try {
    const userLanguage = getCurrentLanguage();

    // Convert image to base64
    const photoBase64 = await imageToBase64(photoUri);

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a friendly coach verifying if someone completed their task. Look at the photo they took.

IMPORTANT: Respond in ${userLanguage} language.

Be natural and encouraging! Like a supportive friend, not a robot.

The user will show you a photo of their completed task. Verify that the photo shows evidence of the task being done.

Respond with JSON:
{
  "isTaskCompleted": boolean,
  "confidence": number (0-100, for internal use only),
  "message": "Short friendly response (1-2 sentences max) in ${userLanguage}. Examples:
    - Success: 'Looks delicious! Great job cooking that meal 🍳'
    - Success: 'Nice work getting that homework done! 📚'
    - Success: 'Great workout session! 💪'
    - Failed: 'Hmm, I can't quite see the completed task. Can you take another photo?'
    - Failed: 'This doesn't look like the task was finished. Show me the result!'",
  "earnedMinutes": number (5-15 based on task difficulty):
    - 5: Simple tasks (quick tidy, basic meal)
    - 8-10: Medium tasks (homework, cooking proper meal, moderate workout)
    - 12-15: Hard tasks (complex cooking, long study session, intense workout)
}

Keep "message" SHORT and HUMAN. No formal language. No mentioning confidence scores or percentages.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Task to verify: "${taskDescription}"

Here's my photo showing I completed the task. Does it look like I did it?

Respond in ${userLanguage} with a short, friendly message.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${photoBase64}`,
              detail: 'high',
            },
          },
        ],
      },
    ];

    const response = await makeOpenAIRequest(messages, 0.3, 1000);

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result: TaskVerificationResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error verifying task with photo:', error);
    throw error;
  }
};

// ==================== INTENTION ANALYSIS ====================

export interface IntentionAnalysisResult {
  isProductive: boolean;
  category: 'productive' | 'unproductive' | 'neutral';
  allowedMinutes: number; // 0 for unproductive, 3 for productive, 1 for neutral
  coachingQuestion?: string; // Question to ask if unproductive
  explanation: string;
}

// Chat-based intention analysis for conversational blocking screen
export interface IntentionChatResult {
  approved: boolean;
  minutes: number; // Time granted (0 if not approved)
  message: string; // Human-like response message
}

/**
 * Analyze intention in a chat-like conversational manner
 * Returns human, friendly responses that match the user's request
 */
export const analyzeIntentionChat = async (
  userMessage: string,
  appName: string,
  healthScore: number,
  conversationHistory: Array<{ role: string; text: string }>
): Promise<IntentionChatResult> => {
  try {
    const userLanguage = getCurrentLanguage();

    // Build conversation context
    const historyContext = conversationHistory
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.text}`)
      .join('\n');

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a friendly digital wellness coach in a chat conversation. You help people be mindful about their app usage while being understanding and human.

CRITICAL INSTRUCTIONS:
1. RESPOND IN ${userLanguage} LANGUAGE ONLY
2. Be conversational, warm, and brief (1-2 sentences max)
3. RESPECT the user's stated time needs - if they say "1 minute", give them 1-2 minutes, not more
4. NEVER say robotic things like "The user has been approved for X minutes" or "Access granted"
5. Speak naturally like a supportive friend

RESPONSE GUIDELINES:
- Productive tasks (work, replying to messages, specific needs): APPROVE with the time they asked for
  Examples: "Sure, reply to your client! 👍" or "Go for it, handle that message!"

- Mindless scrolling/boredom: DON'T APPROVE, ask a gentle question
  Examples: "Hmm, is this the best use of your time right now? 🤔" or "Sounds like boredom scrolling... what could you do instead?"

- Vague answers: Ask for clarification
  Examples: "What specifically do you need to do?" or "How long do you actually need?"

TIME RULES (VERY IMPORTANT):
- If user specifies time (e.g., "1 min", "5 minutes"), give them exactly that or slightly more (max +1 min)
- For productive tasks without time specified: 2-5 minutes
- For checking something quickly: 1-2 minutes
- Never give more than 10 minutes at once

You must respond with JSON:
{
  "approved": boolean,
  "minutes": number (0 if not approved, otherwise the appropriate time),
  "message": "your friendly response in ${userLanguage}"
}`,
      },
      {
        role: 'user',
        content: `App: ${appName}
User's health score: ${healthScore}/100 (lower = more screen time today)

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Current message: "${userMessage}"

Respond naturally in ${userLanguage}. Remember: be human, respect their time request, and keep it brief!`,
      },
    ];

    const response = await makeOpenAIRequest(messages, 0.7, 300);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result: IntentionChatResult = JSON.parse(jsonMatch[0]);

    // Ensure minutes is reasonable
    if (result.approved && result.minutes <= 0) {
      result.minutes = 2;
    }
    if (result.minutes > 10) {
      result.minutes = 10;
    }

    return result;
  } catch (error) {
    console.error('Error in intention chat analysis:', error);
    throw error;
  }
};

/**
 * Analyze user's intention for opening an app
 */
export const analyzeIntention = async (
  intention: string,
  appName: string,
  userHealthScore: number
): Promise<IntentionAnalysisResult> => {
  try {
    const userLanguage = getCurrentLanguage();

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a digital wellness coach analyzing why someone wants to use an app. Your job is to determine if their intention is productive or a distraction.

IMPORTANT: Respond in ${userLanguage} language.

You must respond with a JSON object in this exact format:
{
  "isProductive": boolean,
  "category": "productive" | "unproductive" | "neutral",
  "allowedMinutes": number,
  "coachingQuestion": "string in ${userLanguage} (only if unproductive)",
  "explanation": "string in ${userLanguage}"
}

Guidelines:
- Productive intentions (work, answering messages, specific tasks): allowedMinutes = 3, no coaching
- Unproductive intentions (scrolling, boredom, procrastination): allowedMinutes = 0, provide a thoughtful coaching question in ${userLanguage}
- Neutral intentions (checking notifications quickly): allowedMinutes = 1, no coaching

The coaching question should be empathetic but direct, helping them reflect on their choice.`,
      },
      {
        role: 'user',
        content: `App: ${appName}
User's health score: ${userHealthScore}/100
User's stated intention: "${intention}"

Analyze this intention and provide guidance in ${userLanguage}.`,
      },
    ];

    const response = await makeOpenAIRequest(messages, 0.5, 500);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from OpenAI');
    }

    const result: IntentionAnalysisResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Error analyzing intention:', error);
    throw error;
  }
};

/**
 * Generate follow-up coaching question based on user's response
 */
export const generateCoachingResponse = async (
  previousQuestion: string,
  userResponse: string,
  appName: string
): Promise<string> => {
  try {
    const userLanguage = getCurrentLanguage();

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a digital wellness coach having a conversation with someone about their app usage. Be empathetic but help them recognize unproductive patterns.

IMPORTANT: Respond in ${userLanguage} language.

Keep responses short (1-2 sentences). Ask thought-provoking questions or provide gentle challenges to their reasoning.`,
      },
      {
        role: 'user',
        content: `App: ${appName}
Your previous question: "${previousQuestion}"
Their response: "${userResponse}"

Provide a brief, thoughtful follow-up in ${userLanguage} that helps them reflect on their choice.`,
      },
    ];

    const response = await makeOpenAIRequest(messages, 0.7, 200);
    return response.trim();
  } catch (error) {
    console.error('Error generating coaching response:', error);
    throw error;
  }
};

// ==================== SMART NOTIFICATIONS ====================

export interface NotificationContext {
  appName: string;
  timeSpentMinutes: number;
  healthScore: number;
  notificationCount: number; // How many notifications already sent today
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * Generate a contextual notification message
 */
export const generateSmartNotification = async (
  context: NotificationContext
): Promise<string> => {
  try {
    const userLanguage = getCurrentLanguage();

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a digital wellness assistant generating brief notification messages to encourage users to reduce screen time.

IMPORTANT: Generate notification in ${userLanguage} language.

Guidelines:
- Keep messages SHORT (max 15 words in ${userLanguage})
- Be friendly and motivating, not preachy
- Escalate urgency as notificationCount increases (1st gentle, 2nd firmer, 3rd+ urgent)
- Reference the specific app and time spent
- For notification count 1-2: gentle nudge
- For notification count 3-4: stronger reminder with time context
- For notification count 5+: urgent appeal with life perspective

Return ONLY the notification text in ${userLanguage}, nothing else.`,
      },
      {
        role: 'user',
        content: `App: ${context.appName}
Time spent: ${context.timeSpentMinutes} minutes
Health score: ${context.healthScore}/100
Notification #${context.notificationCount} today
Time of day: ${context.timeOfDay}

Generate an appropriate notification message in ${userLanguage}.`,
      },
    ];

    const response = await makeOpenAIRequest(messages, 0.8, 100);
    return response.trim().replace(/['"]/g, ''); // Remove quotes if present
  } catch (error) {
    console.error('Error generating smart notification:', error);
    // Fallback messages
    const fallbacks = [
      'Time to take a break from the screen',
      `You've been on ${context.appName} for ${context.timeSpentMinutes} minutes`,
      "Maybe it's time to do something else?",
    ];
    return fallbacks[context.notificationCount % fallbacks.length];
  }
};

/**
 * Pre-generate a batch of notification messages for offline use
 */
export const pregenerateNotifications = async (
  appNames: string[],
  count: number = 50
): Promise<Record<string, string[]>> => {
  const notifications: Record<string, string[]> = {};

  for (const appName of appNames) {
    notifications[appName] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const context: NotificationContext = {
          appName,
          timeSpentMinutes: Math.floor(Math.random() * 120) + 10, // 10-130 minutes
          healthScore: Math.floor(Math.random() * 100),
          notificationCount: i,
          timeOfDay: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)] as any,
        };

        const message = await generateSmartNotification(context);
        notifications[appName].push(message);

        // Rate limit to avoid API issues
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error generating notification ${i} for ${appName}:`, error);
      }
    }
  }

  return notifications;
};

export default {
  verifyTaskWithPhotos,
  verifyTaskWithPhoto,
  analyzeIntention,
  analyzeIntentionChat,
  generateCoachingResponse,
  generateSmartNotification,
  pregenerateNotifications,
};
