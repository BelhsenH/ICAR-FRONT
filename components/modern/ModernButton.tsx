import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/Theme';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: boolean;
  animation?: string;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  gradient = false,
  animation = 'pulse',
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...Shadows.md,
    };

    // Size variations
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = Spacing.sm;
        baseStyle.paddingHorizontal = Spacing.md;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingVertical = Spacing.lg;
        baseStyle.paddingHorizontal = Spacing.xl;
        baseStyle.minHeight = 56;
        break;
      default:
        baseStyle.paddingVertical = Spacing.md;
        baseStyle.paddingHorizontal = Spacing.lg;
        baseStyle.minHeight = 48;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = Colors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = Colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      default:
        baseStyle.backgroundColor = gradient ? 'transparent' : Colors.primary;
    }

    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return { ...baseStyle, ...style };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600' as const,
      textAlign: 'center',
    };

    // Size variations
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = Typography.fontSize.sm;
        break;
      case 'large':
        baseTextStyle.fontSize = Typography.fontSize.lg;
        break;
      default:
        baseTextStyle.fontSize = Typography.fontSize.base;
    }

    // Variant text colors
    switch (variant) {
      case 'outline':
        baseTextStyle.color = Colors.primary;
        break;
      case 'ghost':
        baseTextStyle.color = Colors.primary;
        break;
      default:
        baseTextStyle.color = '#FFFFFF';
    }

    return { ...baseTextStyle, ...textStyle };
  };

  const ButtonContent = () => (
    <>
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : '#FFFFFF'} 
          style={{ marginRight: icon || title ? Spacing.sm : 0 }}
        />
      )}
      {icon && !loading && (
        <Text style={{ marginRight: title ? Spacing.sm : 0 }}>
          {icon}
        </Text>
      )}
      {title && (
        <Text style={getTextStyle()}>
          {title}
        </Text>
      )}
    </>
  );

  if (gradient && variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getButtonStyle()}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});