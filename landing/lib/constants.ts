// Theme colors matching the mobile app
export type AccentColorName = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo';

export interface AccentColor {
  name: AccentColorName;
  label: string;
  primary: string;
  dark: string;
  light: string;
  rgb: string;
}

export const ACCENT_COLORS: Record<AccentColorName, AccentColor> = {
  blue: {
    name: 'blue',
    label: 'Ocean Blue',
    primary: '#3b82f6',
    dark: '#1d4ed8',
    light: 'rgba(59, 130, 246, 0.1)',
    rgb: '59, 130, 246',
  },
  purple: {
    name: 'purple',
    label: 'Royal Purple',
    primary: '#8b5cf6',
    dark: '#6d28d9',
    light: 'rgba(139, 92, 246, 0.1)',
    rgb: '139, 92, 246',
  },
  green: {
    name: 'green',
    label: 'Emerald',
    primary: '#10b981',
    dark: '#059669',
    light: 'rgba(16, 185, 129, 0.1)',
    rgb: '16, 185, 129',
  },
  orange: {
    name: 'orange',
    label: 'Sunset',
    primary: '#f59e0b',
    dark: '#d97706',
    light: 'rgba(245, 158, 11, 0.1)',
    rgb: '245, 158, 11',
  },
  pink: {
    name: 'pink',
    label: 'Rose',
    primary: '#ec4899',
    dark: '#db2777',
    light: 'rgba(236, 72, 153, 0.1)',
    rgb: '236, 72, 153',
  },
  red: {
    name: 'red',
    label: 'Ruby',
    primary: '#ef4444',
    dark: '#dc2626',
    light: 'rgba(239, 68, 68, 0.1)',
    rgb: '239, 68, 68',
  },
  teal: {
    name: 'teal',
    label: 'Teal',
    primary: '#14b8a6',
    dark: '#0d9488',
    light: 'rgba(20, 184, 166, 0.1)',
    rgb: '20, 184, 166',
  },
  indigo: {
    name: 'indigo',
    label: 'Indigo',
    primary: '#6366f1',
    dark: '#4f46e5',
    light: 'rgba(99, 102, 241, 0.1)',
    rgb: '99, 102, 241',
  },
};

export const THEME = {
  light: {
    background: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: 'rgba(0, 0, 0, 0.06)',
    card: '#ffffff',
  },
  dark: {
    background: '#000000',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)',
    card: 'rgba(255, 255, 255, 0.03)',
  },
};

// Orb color themes for each level (1-5)
export const ORB_THEMES = {
  1: {
    core: ['#ff6b6b', '#ee5a5a', '#dc3545'],
    mid: ['#ff8787', '#ff6b6b', '#ee5a5a'],
    outer: ['#ffa8a8', '#ff8787', '#ff6b6b'],
    glow: '#ff6b6b',
    particles: '#ffcdd2',
  },
  2: {
    core: ['#ff9f43', '#f7931e', '#e67e22'],
    mid: ['#ffb347', '#ff9f43', '#f7931e'],
    outer: ['#ffd093', '#ffb347', '#ff9f43'],
    glow: '#ff9f43',
    particles: '#ffe0b2',
  },
  3: {
    core: ['#54a0ff', '#2e86de', '#1e6fba'],
    mid: ['#74b9ff', '#54a0ff', '#2e86de'],
    outer: ['#a8d8ff', '#74b9ff', '#54a0ff'],
    glow: '#54a0ff',
    particles: '#bbdefb',
  },
  4: {
    core: ['#00d2d3', '#00b894', '#009688'],
    mid: ['#55efc4', '#00d2d3', '#00b894'],
    outer: ['#a8f0e8', '#55efc4', '#00d2d3'],
    glow: '#00d2d3',
    particles: '#b2dfdb',
  },
  5: {
    core: ['#a29bfe', '#6c5ce7', '#5f27cd'],
    mid: ['#d5aaff', '#a29bfe', '#6c5ce7'],
    outer: ['#e8daff', '#d5aaff', '#a29bfe'],
    glow: '#a29bfe',
    particles: '#e1bee7',
  },
};

export const MONOCHROME_THEMES = {
  white: {
    core: ['#ffffff', '#f0f0f0', '#e0e0e0'],
    mid: ['#f5f5f5', '#ebebeb', '#e0e0e0'],
    outer: ['#e8e8e8', '#dedede', '#d4d4d4'],
    glow: '#ffffff',
    particles: 'rgba(255, 255, 255, 0.6)',
  },
  dark: {
    core: ['#1a1a1a', '#0f0f0f', '#000000'],
    mid: ['#2a2a2a', '#1f1f1f', '#141414'],
    outer: ['#3a3a3a', '#2f2f2f', '#242424'],
    glow: '#1a1a1a',
    particles: 'rgba(0, 0, 0, 0.6)',
  },
};

export const SCREEN_TIME_OPTIONS = [
  { value: '1-2h', label: '1-2 hours', desc: 'Light user' },
  { value: '2-4h', label: '2-4 hours', desc: 'Moderate' },
  { value: '4-6h', label: '4-6 hours', desc: 'Heavy user' },
  { value: '6-8h', label: '6-8 hours', desc: 'Very heavy' },
  { value: '8+h', label: '8+ hours', desc: 'Screen addict' },
];

export const DEVICE_OPTIONS = [
  { value: 'android', label: 'Android', icon: '🤖' },
  { value: 'ios', label: 'iOS (iPhone/iPad)', icon: '🍎' },
  { value: 'macos', label: 'macOS', icon: '💻' },
];
