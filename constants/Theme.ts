import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Modern Color Palette
export const Colors = {
  // Primary Colors
  primary: '#3b5998',
  primaryLight: '#4c669f',
  primaryDark: '#192f6a',
  
  // Secondary Colors
  secondary: '#FF6B6B',
  secondaryLight: '#FF8E8E',
  secondaryDark: '#E55555',
  
  // Accent Colors
  accent: '#4ECDC4',
  accentLight: '#7ED9D1',
  accentDark: '#3BA99F',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',
  backgroundDark: '#121212',
  surface: '#F8F9FA',
  surfaceDark: '#1E1E1E',
  
  // Text Colors
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textLight: '#BDC3C7',
  textDark: '#FFFFFF',
  
  // Status Colors
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Gradient Colors
  gradientStart: '#4c669f',
  gradientMiddle: '#3b5998',
  gradientEnd: '#192f6a',
  
  // Glass Effect
  glass: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(0, 0, 0, 0.1)',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
};

// Typography Scale
export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Light Theme
export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryLight,
    tertiary: Colors.accent,
    tertiaryContainer: Colors.accentLight,
    surface: Colors.surface,
    surfaceVariant: Colors.background,
    background: Colors.background,
    error: Colors.error,
    errorContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    onBackground: Colors.text,
    onError: '#FFFFFF',
    outline: Colors.textLight,
    outlineVariant: '#E0E0E0',
    inverseSurface: Colors.text,
    inverseOnSurface: Colors.background,
    inversePrimary: Colors.primaryLight,
    shadow: Colors.shadow,
    scrim: 'rgba(0, 0, 0, 0.5)',
    surfaceTint: Colors.primary,
  },
};

// Dark Theme
export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    primaryContainer: Colors.primary,
    secondary: Colors.secondaryLight,
    secondaryContainer: Colors.secondary,
    tertiary: Colors.accentLight,
    tertiaryContainer: Colors.accent,
    surface: Colors.surfaceDark,
    surfaceVariant: Colors.backgroundDark,
    background: Colors.backgroundDark,
    error: Colors.error,
    errorContainer: '#FFCDD2',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onTertiary: '#000000',
    onSurface: Colors.textDark,
    onSurfaceVariant: Colors.textLight,
    onBackground: Colors.textDark,
    onError: '#000000',
    outline: Colors.textSecondary,
    outlineVariant: '#424242',
    inverseSurface: Colors.background,
    inverseOnSurface: Colors.text,
    inversePrimary: Colors.primary,
    shadow: Colors.shadowDark,
    scrim: 'rgba(0, 0, 0, 0.7)',
    surfaceTint: Colors.primaryLight,
  },
};

// Animation Durations
export const Animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
};

// Breakpoints for responsive design
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};