import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernInput } from '../../components/modern/ModernInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../scripts/auth-script';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ProfessionalNewPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const validateForm = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    // Validate password
    if (!password) {
      newErrors.password = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again.');
      return;
    }

    setLoading(true);
    try {
      // Retrieve phoneNumber and code from AsyncStorage
      const phoneNumber = await AsyncStorage.getItem('resetPhone');
      const code = await AsyncStorage.getItem('resetCode');

      if (!phoneNumber || !code) {
        Alert.alert('Error', 'Missing phone number or code. Please restart the reset process.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }
        ]);
        setLoading(false);
        return;
      }

      // Call the API to reset password
      const response = await authService.resetPassword({
        phoneNumber,
        code,
        newPassword: password,
      });

      if (response.success) {
        // Clear AsyncStorage
        await AsyncStorage.removeItem('resetPhone');
        await AsyncStorage.removeItem('resetCode');
        
        // Success animation
        Animated.spring(successAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();

        Alert.alert(
          'Success!',
          'Your password has been reset successfully.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return AuthColors.error;
      case 2:
      case 3:
        return AuthColors.warning;
      case 4:
      case 5:
        return AuthColors.success;
      default:
        return AuthColors.border;
    }
  };

  const getStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
      case 3:
        return 'Medium';
      case 4:
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const PasswordStrengthIndicator = () => (
    <View style={strengthContainerStyle}>
      <View style={strengthBarStyle}>
        {[1, 2, 3, 4, 5].map((segment) => (
          <View
            key={segment}
            style={[
              strengthSegmentStyle,
              {
                backgroundColor: segment <= passwordStrength 
                  ? getStrengthColor(passwordStrength) 
                  : AuthColors.border,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[strengthTextStyle, { color: getStrengthColor(passwordStrength) }]}>
        {getStrengthText(passwordStrength)}
      </Text>
    </View>
  );

  const PasswordRequirements = () => (
    <View style={requirementsContainerStyle}>
      <Text style={requirementsTitleStyle}>Password Requirements:</Text>
      <View style={requirementsListStyle}>
        <View style={requirementItemStyle}>
          <Ionicons 
            name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={password.length >= 8 ? AuthColors.success : AuthColors.textSecondary}
            style={requirementIconStyle}
          />
          <Text style={requirementTextStyle}>At least 8 characters</Text>
        </View>
        <View style={requirementItemStyle}>
          <Ionicons 
            name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={/[A-Z]/.test(password) ? AuthColors.success : AuthColors.textSecondary}
            style={requirementIconStyle}
          />
          <Text style={requirementTextStyle}>One uppercase letter</Text>
        </View>
        <View style={requirementItemStyle}>
          <Ionicons 
            name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={/[a-z]/.test(password) ? AuthColors.success : AuthColors.textSecondary}
            style={requirementIconStyle}
          />
          <Text style={requirementTextStyle}>One lowercase letter</Text>
        </View>
        <View style={requirementItemStyle}>
          <Ionicons 
            name={/[0-9]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={/[0-9]/.test(password) ? AuthColors.success : AuthColors.textSecondary}
            style={requirementIconStyle}
          />
          <Text style={requirementTextStyle}>One number</Text>
        </View>
      </View>
    </View>
  );

  return (
    <PaperProvider theme={AuthLightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={AuthColors.background} />
      
      <KeyboardAvoidingView 
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={scrollContainerStyle} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              contentStyle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Header */}
            <View style={headerStyle}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={backButtonStyle}
              >
                <Ionicons name="arrow-back" size={24} color={AuthColors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={toggleLanguage}
                style={languageButtonStyle}
              >
                <Text style={languageButtonTextStyle}>
                  {language === 'fr' ? 'عربي' : 'FR'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <View style={logoSectionStyle}>
              <Animated.View 
                style={[
                  logoContainerStyle,
                  { 
                    transform: [{ 
                      scale: Animated.multiply(
                        new Animated.Value(1),
                        successAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] })
                      ) 
                    }] 
                  }
                ]}
              >
                <Ionicons name="lock-closed" size={50} color={AuthColors.primary} />
              </Animated.View>
              <Text style={titleStyle}>
                {translations[language].newPassword || 'Create New Password'}
              </Text>
              <Text style={subtitleStyle}>
                Create a strong password for your account
              </Text>
            </View>

            {/* Form Section */}
            <View style={formSectionStyle}>
              {/* Password Input */}
              <ModernInput
                label={translations[language].newPassword || 'New Password'}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={errors.password}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={AuthColors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
                style={inputStyle}
              />

              {/* Password Strength Indicator */}
              {password.length > 0 && <PasswordStrengthIndicator />}

              {/* Confirm Password Input */}
              <ModernInput
                label={translations[language].confirmPassword || 'Confirm Password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={AuthColors.textSecondary} 
                    />
                  </TouchableOpacity>
                }
                style={inputStyle}
              />

              {/* Reset Button */}
              <ModernButton
                title={translations[language].resetPassword || 'Reset Password'}
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                style={resetButtonStyle}
              />
            </View>

            {/* Password Requirements */}
            <PasswordRequirements />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

// Styles
const containerStyle = {
  flex: 1,
  backgroundColor: AuthColors.background,
};

const scrollContainerStyle = {
  flexGrow: 1,
  minHeight: height,
};

const contentStyle = {
  flex: 1,
  paddingHorizontal: AuthSpacing.lg,
};

const headerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  paddingTop: 60,
  paddingBottom: AuthSpacing.lg,
};

const backButtonStyle = {
  width: 44,
  height: 44,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  ...AuthShadows.sm,
};

const languageButtonStyle = {
  paddingHorizontal: AuthSpacing.md,
  paddingVertical: AuthSpacing.sm,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.surface,
  borderWidth: 1,
  borderColor: AuthColors.border,
  ...AuthShadows.sm,
};

const languageButtonTextStyle = {
  color: AuthColors.text,
  fontSize: AuthTypography.fontSize.sm,
  fontWeight: '500' as const,
};

const logoSectionStyle = {
  alignItems: 'center' as const,
  paddingVertical: AuthSpacing.xl,
};

const logoContainerStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.md,
};

const titleStyle = {
  fontSize: AuthTypography.fontSize['3xl'],
  fontWeight: '700' as const,
  color: AuthColors.text,
  textAlign: 'center' as const,
  marginBottom: AuthSpacing.sm,
};

const subtitleStyle = {
  fontSize: AuthTypography.fontSize.lg,
  color: AuthColors.textSecondary,
  textAlign: 'center' as const,
  lineHeight: 20,
};

const formSectionStyle = {
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius['2xl'],
  padding: AuthSpacing.xl,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.lg,
};

const inputStyle = {
  marginBottom: AuthSpacing.md,
};

const strengthContainerStyle = {
  marginBottom: AuthSpacing.lg,
};

const strengthBarStyle = {
  flexDirection: 'row' as const,
  gap: 4,
  marginBottom: AuthSpacing.xs,
};

const strengthSegmentStyle = {
  flex: 1,
  height: 4,
  borderRadius: 2,
};

const strengthTextStyle = {
  fontSize: AuthTypography.fontSize.sm,
  fontWeight: '500' as const,
  textAlign: 'right' as const,
};

const resetButtonStyle = {
  backgroundColor: AuthColors.primary,
  marginTop: AuthSpacing.md,
};

const requirementsContainerStyle = {
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius.lg,
  padding: AuthSpacing.lg,
  ...AuthShadows.sm,
};

const requirementsTitleStyle = {
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  color: AuthColors.text,
  marginBottom: AuthSpacing.md,
};

const requirementsListStyle = {
  gap: AuthSpacing.sm,
};

const requirementItemStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const requirementIconStyle = {
  marginRight: AuthSpacing.sm,
  width: 20,
};

const requirementTextStyle = {
  fontSize: AuthTypography.fontSize.sm,
  color: AuthColors.textSecondary,
  flex: 1,
};