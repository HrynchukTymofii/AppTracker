import {
  Target,
  CheckCircle,
  Trophy,
  Sun,
  Moon,
  Star,
  LucideIcon,
} from "lucide-react-native";

export interface Achievement {
  id: number | string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  color: string;
}

export interface AchievementStats {
  blockedAppsCount: number;
  focusSessionsCount: number;
  tasksCompleted: number;
  schedulesCount: number;
  currentStreak: number;
  maxFocusDuration: number;
  healthScore: number;
  totalAppsBlocked: number;
  weekendBlockingDays: number;
  focusSessionsToday: number;
  morningBlockingStreak: number;
  screenTimeReduction: number;
}

export function getDynamicAchievements(t: any, stats: AchievementStats): Achievement[] {
  return [
    {
      id: 'firstBlock',
      title: t('achievements.list.firstBlock.title'),
      description: t('achievements.list.firstBlock.description'),
      icon: Target,
      unlocked: stats.blockedAppsCount >= 1,
      color: "#3b82f6",
    },
    {
      id: 'focusBeginner',
      title: t('achievements.list.focusBeginner.title'),
      description: t('achievements.list.focusBeginner.description'),
      icon: CheckCircle,
      unlocked: stats.focusSessionsCount >= 1,
      color: "#10b981",
    },
    {
      id: 'taskMaster',
      title: t('achievements.list.taskMaster.title'),
      description: t('achievements.list.taskMaster.description'),
      icon: Trophy,
      unlocked: stats.tasksCompleted >= 1,
      color: "#f59e0b",
    },
    {
      id: 'earlyBird',
      title: t('achievements.list.earlyBird.title'),
      description: t('achievements.list.earlyBird.description'),
      icon: Sun,
      unlocked: false,
      color: "#f97316",
    },
    {
      id: 'nightOwl',
      title: t('achievements.list.nightOwl.title'),
      description: t('achievements.list.nightOwl.description'),
      icon: Moon,
      unlocked: false,
      color: "#6366f1",
    },
    {
      id: 'discipline',
      title: t('achievements.list.discipline.title'),
      description: t('achievements.list.discipline.description'),
      icon: Star,
      unlocked: stats.currentStreak >= 7,
      color: "#8b5cf6",
    },
  ];
}
