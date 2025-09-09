import { MD3LightTheme } from 'react-native-paper';

// Professional Black & White Color Palette for Auth
export const AuthColors = {
  // Primary Colors - Black & White
  primary: '#000000',
  primaryLight: '#1a1a1a',
  primaryDark: '#000000',
  
  // Secondary Colors - Grays
  secondary: '#666666',
  secondaryLight: '#999999',
  secondaryDark: '#333333',
  
  // Accent Colors - Professional Blue-Gray
  accent: '#2c3e50',
  accentLight: '#34495e',
  accentDark: '#1a252f',
  
  // Base Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#FFFFFF',
  backgroundDark: '#000000',
  surface: '#FAFAFA',
  surfaceDark: '#0a0a0a',
  
  // Text Colors
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  textDark: '#FFFFFF',
  textMuted: '#CCCCCC',
  
  // Status Colors - Monochrome
  success: '#2d5a27',
  warning: '#8b7355',
  error: '#721c24',
  info: '#1e3a5f',
  
  // Gradient Colors - Black to Gray
  gradientStart: '#000000',
  gradientMiddle: '#1a1a1a',
  gradientEnd: '#333333',
  
  // Glass Effect
  glass: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(0, 0, 0, 0.05)',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
  
  // Input Colors
  inputBackground: '#FFFFFF',
  inputBorder: '#E0E0E0',
  inputBorderFocus: '#000000',
  inputPlaceholder: '#999999',
  
  // Button Colors
  buttonPrimary: '#000000',
  buttonSecondary: '#FFFFFF',
  buttonDisabled: '#CCCCCC',
  
  // Border Colors
  border: '#E0E0E0',
  borderDark: '#333333',
};

// Professional Typography
export const AuthTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// Spacing
export const AuthSpacing = {
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
export const AuthBorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 50,
};

// Professional Shadows
export const AuthShadows = {
  sm: {
    shadowColor: AuthColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: AuthColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: AuthColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: AuthColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
};

// Professional Light Theme
export const AuthLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: AuthColors.primary,
    primaryContainer: AuthColors.primaryLight,
    secondary: AuthColors.secondary,
    secondaryContainer: AuthColors.secondaryLight,
    tertiary: AuthColors.accent,
    tertiaryContainer: AuthColors.accentLight,
    surface: AuthColors.surface,
    surfaceVariant: AuthColors.background,
    background: AuthColors.background,
    error: AuthColors.error,
    errorContainer: '#FFEBEE',
    onPrimary: AuthColors.white,
    onSecondary: AuthColors.white,
    onTertiary: AuthColors.white,
    onSurface: AuthColors.text,
    onSurfaceVariant: AuthColors.textSecondary,
    onBackground: AuthColors.text,
    onError: AuthColors.white,
    outline: AuthColors.border,
    outlineVariant: '#F0F0F0',
    inverseSurface: AuthColors.text,
    inverseOnSurface: AuthColors.background,
    inversePrimary: AuthColors.primaryLight,
    shadow: AuthColors.shadow,
    scrim: 'rgba(0, 0, 0, 0.5)',
    surfaceTint: AuthColors.primary,
  },
};

// Animation Durations
export const AuthAnimations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
};
