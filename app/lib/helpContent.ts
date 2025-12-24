import { HelpCard } from '@/components/modals/HelpCarousel';

/**
 * Help content for different screens
 * Each screen can have its own array of cards
 * Cards support optional image or video media
 */

export const homeHelpCards: HelpCard[] = [
  {
    id: 'welcome',
    title: "Welcome to LockIn",
    description: "Your personal companion for building healthier digital habits. We'll help you stay focused and make the most of your screen time.",
    animationType: 'wave',
  },
  {
    id: 'orb',
    title: "Your Health Orb",
    description: "This orb reflects your digital wellness. It glows green when you're doing great, and shifts to warmer colors when it might be time for a break.",
    animationType: 'orb',
  },
  {
    id: 'stats',
    title: "Track Your Progress",
    description: "Keep an eye on your streak, daily screen time, and how you compare to your weekly average. Small improvements add up to big changes.",
    animationType: 'stats',
  },
  {
    id: 'quick-actions',
    title: "Quick Actions",
    description: "Tap the lightning button at the bottom right for instant access to blocking features, schedules, and focus mode. Everything you need, one tap away.",
    animationType: 'lightning',
  },
  {
    id: 'schedules',
    title: "Smart Schedules",
    description: "Create automatic blocking schedules for work, study, or rest time. Set it once and let the app handle the rest.",
    animationType: 'calendar',
  },
  {
    id: 'app-usage',
    title: "App Insights",
    description: "See which apps are using most of your time. Understanding your habits is the first step to improving them.",
    animationType: 'apps',
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description: "Start by blocking a few distracting apps and watch your focus improve. We're here to support you on this journey.",
    animationType: 'checkmark',
  },
];

export const blockingHelpCards: HelpCard[] = [
  {
    id: 'blocking-intro',
    title: "Blocking Controls",
    description: "This is your command center for managing distractions. Block apps, set schedules, and define daily limits all from one place.",
    animationType: 'shield',
  },
  {
    id: 'focus-session',
    title: "Focus Sessions",
    description: "Need to concentrate right now? Start a focus session to block distracting apps for a set duration. You can even require completing a task before unlocking.",
    animationType: 'focus',
  },
  {
    id: 'schedules-blocking',
    title: "Scheduled Blocking",
    description: "Set up recurring schedules for times when you need to stay focused. Perfect for work hours, study sessions, or bedtime.",
    animationType: 'calendar',
  },
  {
    id: 'app-limits',
    title: "Daily App Limits",
    description: "Not ready to fully block an app? Set a daily time limit instead. Once you reach it, the app is blocked for the rest of the day.",
    animationType: 'timer',
  },
];

export const statsHelpCards: HelpCard[] = [
  {
    id: 'stats-intro',
    title: "Your Weekly Report",
    description: "Get a complete picture of your screen time habits. Track total hours, daily averages, and identify patterns in your usage.",
    animationType: 'chart',
  },
  {
    id: 'weekly-view',
    title: "Week by Week",
    description: "Swipe left and right to compare different weeks. See your progress over time and celebrate your improvements.",
    animationType: 'swipe',
  },
  {
    id: 'calendar',
    title: "Usage Calendar",
    description: "The calendar heatmap shows your daily usage at a glance. Darker colors indicate more screen time.",
    animationType: 'heatmap',
  },
  {
    id: 'app-breakdown',
    title: "App Breakdown",
    description: "See exactly which apps are taking up your time. Use these insights to make informed decisions about what to limit.",
    animationType: 'apps',
  },
];

export const detoxHelpCards: HelpCard[] = [
  {
    id: 'detox-intro',
    title: "Digital Detox",
    description: "Sometimes you need a complete break from your phone. Start a detox session to block all distracting apps and reconnect with the world around you.",
    animationType: 'detox',
  },
  {
    id: 'detox-timer',
    title: "Set Your Duration",
    description: "Choose how long you want to go phone-free. Start with shorter sessions and gradually increase as you build the habit.",
    animationType: 'timer',
  },
  {
    id: 'detox-unlock',
    title: "Stay Committed",
    description: "Once you start a detox session, it runs until completion. This helps you stay committed to your goal without temptation.",
    animationType: 'lock',
  },
];

export const profileHelpCards: HelpCard[] = [
  {
    id: 'profile-intro',
    title: "Your Profile",
    description: "Manage your account, view achievements, and customize your settings. Everything about you in one place.",
    animationType: 'profile',
  },
  {
    id: 'achievements',
    title: "Achievements",
    description: "Unlock badges as you build better habits. Each achievement represents a milestone in your digital wellness journey.",
    animationType: 'trophy',
  },
  {
    id: 'default-blocks',
    title: "Default Settings",
    description: "Set your default blocked apps and time limits. These will be pre-selected when creating new schedules, saving you time.",
    animationType: 'settings',
  },
];

// Helper function to get help cards by screen name
export const getHelpCards = (screenName: string): HelpCard[] => {
  switch (screenName) {
    case 'home':
      return homeHelpCards;
    case 'blocking':
      return blockingHelpCards;
    case 'stats':
      return statsHelpCards;
    case 'detox':
      return detoxHelpCards;
    case 'profile':
      return profileHelpCards;
    default:
      return homeHelpCards;
  }
};
