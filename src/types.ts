export interface Theme {
  id: string;
  name: string;
  accent: string;
  bg: string;
  grad1: string;
  grad2: string;
}

export const THEMES: Theme[] = [
  { id: 'noir', name: 'Dark Mode', accent: '#e5e7eb', bg: '#000000', grad1: '#111111', grad2: '#000000' },
  { id: 'light', name: 'Light Mode', accent: '#3b82f6', bg: '#f8fafc', grad1: '#ffffff', grad2: '#f1f5f9' },
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
