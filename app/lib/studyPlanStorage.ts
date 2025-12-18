import * as SecureStore from "expo-secure-store";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  type?: "lesson" | "quiz" | "review" | null;
}

export interface StudyPlan {
  date: string;
  goals: string;
  tasks: Task[];
}

const PLAN_PREFIX = "learningPlan_";
const ALL_PLANS_KEY = "allPlanDates";

/**
 * Format date as YYYY-MM-DD string
 */
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Get study plan for a specific date
 */
export const getStudyPlan = async (date: Date | string): Promise<StudyPlan | null> => {
  try {
    const dateKey = typeof date === "string" ? date : formatDateKey(date);
    const key = `${PLAN_PREFIX}${dateKey}`;
    const stored = await SecureStore.getItemAsync(key);

    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error("Failed to get study plan:", error);
    return null;
  }
};

/**
 * Save study plan for a specific date
 */
export const saveStudyPlan = async (
  date: Date | string,
  plan: Omit<StudyPlan, "date">
): Promise<boolean> => {
  try {
    const dateKey = typeof date === "string" ? date : formatDateKey(date);
    const key = `${PLAN_PREFIX}${dateKey}`;

    const studyPlan: StudyPlan = {
      date: dateKey,
      ...plan,
    };

    await SecureStore.setItemAsync(key, JSON.stringify(studyPlan));

    // Update the list of all plan dates
    await addPlanDate(dateKey);

    return true;
  } catch (error) {
    console.error("Failed to save study plan:", error);
    return false;
  }
};

/**
 * Delete study plan for a specific date
 */
export const deleteStudyPlan = async (date: Date | string): Promise<boolean> => {
  try {
    const dateKey = typeof date === "string" ? date : formatDateKey(date);
    const key = `${PLAN_PREFIX}${dateKey}`;

    await SecureStore.deleteItemAsync(key);
    await removePlanDate(dateKey);

    return true;
  } catch (error) {
    console.error("Failed to delete study plan:", error);
    return false;
  }
};

/**
 * Get all dates that have study plans
 */
export const getAllPlanDates = async (): Promise<string[]> => {
  try {
    const stored = await SecureStore.getItemAsync(ALL_PLANS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Failed to get all plan dates:", error);
    return [];
  }
};

/**
 * Add a date to the list of plan dates
 */
const addPlanDate = async (dateKey: string): Promise<void> => {
  try {
    const dates = await getAllPlanDates();
    if (!dates.includes(dateKey)) {
      dates.push(dateKey);
      await SecureStore.setItemAsync(ALL_PLANS_KEY, JSON.stringify(dates));
    }
  } catch (error) {
    console.error("Failed to add plan date:", error);
  }
};

/**
 * Remove a date from the list of plan dates
 */
const removePlanDate = async (dateKey: string): Promise<void> => {
  try {
    const dates = await getAllPlanDates();
    const filtered = dates.filter((d) => d !== dateKey);
    await SecureStore.setItemAsync(ALL_PLANS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove plan date:", error);
  }
};

/**
 * Get count of tasks for a specific date
 */
export const getTaskCount = async (date: Date | string): Promise<{ total: number; completed: number }> => {
  try {
    const plan = await getStudyPlan(date);
    if (!plan || !plan.tasks) {
      return { total: 0, completed: 0 };
    }

    const total = plan.tasks.length;
    const completed = plan.tasks.filter((task) => task.completed).length;

    return { total, completed };
  } catch (error) {
    console.error("Failed to get task count:", error);
    return { total: 0, completed: 0 };
  }
};

/**
 * Check if a date has a study plan
 */
export const hasStudyPlan = async (date: Date | string): Promise<boolean> => {
  const plan = await getStudyPlan(date);
  return plan !== null && (plan.tasks.length > 0 || plan.goals.trim().length > 0);
};

/**
 * Get default study plan suggestion based on SAT preparation
 */
export const getDefaultPlanSuggestion = (): Task[] => {
  return [
    {
      id: "default-1",
      text: "Complete 1-2 lessons in a chosen chapter",
      completed: false,
      type: "lesson",
    },
    {
      id: "default-2",
      text: "Practice quiz questions from completed lessons",
      completed: false,
      type: "quiz",
    },
    {
      id: "default-3",
      text: "Review incorrect answers and study explanations",
      completed: false,
      type: "review",
    },
  ];
};
