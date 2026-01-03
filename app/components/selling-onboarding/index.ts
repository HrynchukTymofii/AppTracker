// Barrel export for selling-onboarding components

// Design System
export {
  COLORS,
  GRADIENT_COLORS,
  GRADIENT_PALETTE,
  DARK_COLORS,
  LIGHT_COLORS,
  getThemeColors,
  OnboardingThemeContext,
  useOnboardingTheme,
} from "./designSystem";
export type { GradientTuple, ThemeColors, OnboardingTheme } from "./designSystem";

// Animated Components
export { AnimatedCounter, FadeInView, GlowingBorder } from "./AnimatedComponents";

// UI Components
export {
  GlassCard,
  GradientText,
  GradientButton,
  GradientBarChart,
  VideoPlaceholder,
  ToggleButton,
} from "./UIComponents";

// Constants
export {
  SOCIAL_MEDIA_APPS,
  POPULAR_WEBSITES,
  DEFAULT_BLOCKED_APPS,
  DEFAULT_BLOCKED_SITES,
  SOCIAL_PACKAGE_NAMES,
  CURRENT_APP_PACKAGE,
} from "./constants";
export type { UserAnswers } from "./constants";

// Modals
export {
  LearnMoreModal,
  AccessibilityReassuranceModal,
  DeclineWarningModal,
  PaywallModal,
} from "./Modals";

// Steps 1-8
export {
  Step1Welcome,
  Step2Age,
  Step3Hours,
  Step4NewsIntro,
  Step5BadNews,
  Step6GoodNews,
  Step7FirstStep,
  Step8ScreenTimePermission,
} from "./Steps";

// Steps 9-16
export {
  Step9OverlayPermission,
  Step10AccessibilityPermission,
  Step11UsageData,
  Step12Projection,
  Step13Comparison,
  Step14Notifications,
  Step15DailyGoal,
  Step16AppSelection,
} from "./StepsRemaining";
