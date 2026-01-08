import { HelpCard } from '@/components/modals/HelpCarousel';

/**
 * Help content for different screens
 * Each screen can have its own array of cards
 * Cards support optional image or video media
 */

type TFunction = (key: string) => string;

const getHomeHelpCards = (t: TFunction): HelpCard[] => [
  {
    id: 'welcome',
    title: t("helpContent.home.welcome.title"),
    description: t("helpContent.home.welcome.description"),
    animationType: 'wave',
  },
  {
    id: 'orb',
    title: t("helpContent.home.orb.title"),
    description: t("helpContent.home.orb.description"),
    animationType: 'orb',
  },
  {
    id: 'stats',
    title: t("helpContent.home.stats.title"),
    description: t("helpContent.home.stats.description"),
    animationType: 'stats',
  },
  {
    id: 'quick-actions',
    title: t("helpContent.home.quickActions.title"),
    description: t("helpContent.home.quickActions.description"),
    animationType: 'lightning',
  },
  {
    id: 'schedules',
    title: t("helpContent.home.schedules.title"),
    description: t("helpContent.home.schedules.description"),
    animationType: 'calendar',
  },
  {
    id: 'app-usage',
    title: t("helpContent.home.appUsage.title"),
    description: t("helpContent.home.appUsage.description"),
    animationType: 'apps',
  },
  {
    id: 'ready',
    title: t("helpContent.home.ready.title"),
    description: t("helpContent.home.ready.description"),
    animationType: 'checkmark',
  },
];

const getBlockingHelpCards = (t: TFunction): HelpCard[] => [
  {
    id: 'blocking-intro',
    title: t("helpContent.blocking.intro.title"),
    description: t("helpContent.blocking.intro.description"),
    animationType: 'shield',
  },
  {
    id: 'focus-session',
    title: t("helpContent.blocking.focusSession.title"),
    description: t("helpContent.blocking.focusSession.description"),
    animationType: 'focus',
  },
  {
    id: 'schedules-blocking',
    title: t("helpContent.blocking.schedules.title"),
    description: t("helpContent.blocking.schedules.description"),
    animationType: 'calendar',
  },
  {
    id: 'app-limits',
    title: t("helpContent.blocking.appLimits.title"),
    description: t("helpContent.blocking.appLimits.description"),
    animationType: 'timer',
  },
];

const getStatsHelpCards = (t: TFunction): HelpCard[] => [
  {
    id: 'stats-intro',
    title: t("helpContent.stats.intro.title"),
    description: t("helpContent.stats.intro.description"),
    animationType: 'chart',
  },
  {
    id: 'weekly-view',
    title: t("helpContent.stats.weeklyView.title"),
    description: t("helpContent.stats.weeklyView.description"),
    animationType: 'swipe',
  },
  {
    id: 'calendar',
    title: t("helpContent.stats.calendar.title"),
    description: t("helpContent.stats.calendar.description"),
    animationType: 'heatmap',
  },
  {
    id: 'app-breakdown',
    title: t("helpContent.stats.appBreakdown.title"),
    description: t("helpContent.stats.appBreakdown.description"),
    animationType: 'apps',
  },
];

const getDetoxHelpCards = (t: TFunction): HelpCard[] => [
  {
    id: 'detox-intro',
    title: t("helpContent.detox.intro.title"),
    description: t("helpContent.detox.intro.description"),
    animationType: 'detox',
  },
  {
    id: 'detox-timer',
    title: t("helpContent.detox.timer.title"),
    description: t("helpContent.detox.timer.description"),
    animationType: 'timer',
  },
  {
    id: 'detox-unlock',
    title: t("helpContent.detox.unlock.title"),
    description: t("helpContent.detox.unlock.description"),
    animationType: 'lock',
  },
];

const getProfileHelpCards = (t: TFunction): HelpCard[] => [
  {
    id: 'profile-intro',
    title: t("helpContent.profile.intro.title"),
    description: t("helpContent.profile.intro.description"),
    animationType: 'profile',
  },
  {
    id: 'achievements',
    title: t("helpContent.profile.achievements.title"),
    description: t("helpContent.profile.achievements.description"),
    animationType: 'trophy',
  },
  {
    id: 'default-blocks',
    title: t("helpContent.profile.defaultBlocks.title"),
    description: t("helpContent.profile.defaultBlocks.description"),
    animationType: 'settings',
  },
];

// Helper function to get help cards by screen name
export const getHelpCards = (screenName: string, t: TFunction): HelpCard[] => {
  switch (screenName) {
    case 'home':
      return getHomeHelpCards(t);
    case 'blocking':
      return getBlockingHelpCards(t);
    case 'stats':
      return getStatsHelpCards(t);
    case 'detox':
      return getDetoxHelpCards(t);
    case 'profile':
      return getProfileHelpCards(t);
    default:
      return getHomeHelpCards(t);
  }
};
