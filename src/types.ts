export interface Theme {
  id: string;
  name: string;
  accent: string;
  bg: string;
  grad1: string;
  grad2: string;
}

export const THEMES: Theme[] = [
  { id: 'noir', name: 'Original', accent: '#e5e7eb', bg: '#000000', grad1: '#111111', grad2: '#000000' },
  { id: 'light', name: 'Alabaster', accent: '#3b82f6', bg: '#f8fafc', grad1: '#ffffff', grad2: '#f1f5f9' },
  { id: 'social-x', name: 'Social X', accent: '#1d9bf0', bg: '#000000', grad1: '#15202b', grad2: '#000000' },
  { id: 'meta-blue', name: 'Social Meta', accent: '#0064e0', bg: '#020617', grad1: '#071025', grad2: '#020617' },
  { id: 'tiktok', name: 'Tokyo Pop', accent: '#ff0050', bg: '#010101', grad1: '#00f2ea', grad2: '#010101' },
  { id: 'vogue', name: 'Editorial', accent: '#ffffff', bg: '#0a0a0a', grad1: '#262626', grad2: '#0a0a0a' },
  { id: 'silicon', name: 'Silicon Valley', accent: '#06b6d4', bg: '#082f49', grad1: '#0c4a6e', grad2: '#082f49' },
  { id: 'crimson', name: 'Ruby', accent: '#e11d48', bg: '#180202', grad1: '#4c0519', grad2: '#180202' },
  { id: 'emerald', name: 'Kyoto Green', accent: '#10b981', bg: '#022c22', grad1: '#064e3b', grad2: '#022c22' },
];

export interface AppSettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  themeId: string;
  glassmorphism: boolean;
}

export const FONT_SIZES = [
  { id: 'normal', name: 'Normal', scale: '16px' },
  { id: 'large', name: 'Large', scale: '19px' },
  { id: 'extra-large', name: 'Premium', scale: '22px' }
];

export const DISPLAY_UNIT_MAP: Record<string, string> = {
  g: 'grams',
  kg: 'kilograms',
  ml: 'milliliters',
  L: 'liters',
  tsp: 'teaspoons',
  tbsp: 'tablespoons',
  cup: 'cups',
  piece: 'pieces',
  pinch: 'pinches',
  bunch: 'bunches'
};
