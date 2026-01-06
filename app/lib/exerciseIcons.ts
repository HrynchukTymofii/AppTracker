import { ExerciseType } from './poseUtils';
import { ImageSourcePropType } from 'react-native';

// Exercise emoji fallbacks
export const EXERCISE_EMOJIS: Record<ExerciseType, string> = {
  'pushups': '💪',
  'squats': '🏋️',
  'plank': '🧘',
  'jumping-jacks': '⭐',
  'lunges': '🦵',
  'crunches': '🔥',
  'shoulder-press': '🙆',
  'leg-raises': '🦿',
  'high-knees': '🏃',
  'pull-ups': '💪',
  'wall-sit': '🧱',
  'side-plank': '🔷',
};

// Exercise gradient colors for icons
export const EXERCISE_COLORS: Record<ExerciseType, [string, string]> = {
  'pushups': ['#ef4444', '#dc2626'],
  'squats': ['#8b5cf6', '#7c3aed'],
  'plank': ['#10b981', '#059669'],
  'jumping-jacks': ['#f59e0b', '#d97706'],
  'lunges': ['#06b6d4', '#0891b2'],
  'crunches': ['#ec4899', '#db2777'],
  'shoulder-press': ['#6366f1', '#4f46e5'],
  'leg-raises': ['#14b8a6', '#0d9488'],
  'high-knees': ['#f97316', '#ea580c'],
  'pull-ups': ['#a855f7', '#9333ea'],
  'wall-sit': ['#22c55e', '#16a34a'],
  'side-plank': ['#0ea5e9', '#0284c7'],
};

// Exercise icons - using try/catch pattern for optional images
// To add an icon: place PNG file in assets/icons/exercises/{exercise-type}.png
let exerciseIconsLoaded: Partial<Record<ExerciseType, ImageSourcePropType>> = {};

try {
  // Attempt to load icons if they exist
  // These will fail silently if files don't exist
  exerciseIconsLoaded = {
    // Uncomment and add require statements when icons are available:
    // 'pushups': require('@/assets/icons/exercises/pushups.png'),
    // 'squats': require('@/assets/icons/exercises/squats.png'),
    // 'plank': require('@/assets/icons/exercises/plank.png'),
    // 'jumping-jacks': require('@/assets/icons/exercises/jumping-jacks.png'),
    // 'lunges': require('@/assets/icons/exercises/lunges.png'),
    // 'crunches': require('@/assets/icons/exercises/crunches.png'),
    // 'shoulder-press': require('@/assets/icons/exercises/shoulder-press.png'),
    // 'leg-raises': require('@/assets/icons/exercises/leg-raises.png'),
    // 'high-knees': require('@/assets/icons/exercises/high-knees.png'),
    // 'pull-ups': require('@/assets/icons/exercises/pull-ups.png'),
    // 'wall-sit': require('@/assets/icons/exercises/wall-sit.png'),
    // 'side-plank': require('@/assets/icons/exercises/side-plank.png'),
  };
} catch (e) {
  // Icons not available, will use emoji fallback
}

export const EXERCISE_ICONS = exerciseIconsLoaded;

export interface ExerciseIconInfo {
  image: ImageSourcePropType | null;
  emoji: string;
  colors: [string, string];
}

export function getExerciseIcon(type: ExerciseType): ExerciseIconInfo {
  return {
    image: EXERCISE_ICONS[type] || null,
    emoji: EXERCISE_EMOJIS[type],
    colors: EXERCISE_COLORS[type],
  };
}

// Exercise display info
export interface ExerciseDisplayInfo {
  type: ExerciseType;
  label: string;
  description: string;
  emoji: string;
  colors: [string, string];
  image: ImageSourcePropType | null;
}

export const EXERCISE_DISPLAY_INFO: ExerciseDisplayInfo[] = [
  { type: 'pushups', label: 'Push-ups', description: '0.5 min/rep', emoji: '💪', colors: ['#ef4444', '#dc2626'], image: null },
  { type: 'squats', label: 'Squats', description: '0.5 min/rep', emoji: '🏋️', colors: ['#8b5cf6', '#7c3aed'], image: null },
  { type: 'plank', label: 'Plank', description: '0.1 min/sec', emoji: '🧘', colors: ['#10b981', '#059669'], image: null },
  { type: 'jumping-jacks', label: 'Jumping Jacks', description: '0.3 min/rep', emoji: '⭐', colors: ['#f59e0b', '#d97706'], image: null },
  { type: 'lunges', label: 'Lunges', description: '0.5 min/rep', emoji: '🦵', colors: ['#06b6d4', '#0891b2'], image: null },
  { type: 'crunches', label: 'Crunches', description: '0.4 min/rep', emoji: '🔥', colors: ['#ec4899', '#db2777'], image: null },
  { type: 'shoulder-press', label: 'Shoulder Press', description: '0.5 min/rep', emoji: '🙆', colors: ['#6366f1', '#4f46e5'], image: null },
  { type: 'leg-raises', label: 'Leg Raises', description: '0.4 min/rep', emoji: '🦿', colors: ['#14b8a6', '#0d9488'], image: null },
  { type: 'high-knees', label: 'High Knees', description: '0.2 min/rep', emoji: '🏃', colors: ['#f97316', '#ea580c'], image: null },
  { type: 'pull-ups', label: 'Pull-ups', description: '0.8 min/rep', emoji: '💪', colors: ['#a855f7', '#9333ea'], image: null },
  { type: 'wall-sit', label: 'Wall Sit', description: '0.15 min/sec', emoji: '🧱', colors: ['#22c55e', '#16a34a'], image: null },
  { type: 'side-plank', label: 'Side Plank', description: '0.12 min/sec', emoji: '🔷', colors: ['#0ea5e9', '#0284c7'], image: null },
];

export function getExerciseDisplayInfo(type: ExerciseType): ExerciseDisplayInfo | undefined {
  return EXERCISE_DISPLAY_INFO.find(e => e.type === type);
}
