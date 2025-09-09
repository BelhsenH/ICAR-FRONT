import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernInput } from '../../components/modern/ModernInput';
import { authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ProfessionalLogin() {
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+216');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ phone: '', password: '' });
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
    const newErrors = { phone: '', password: '' };
    let isValid = true;

    if (!phone || !/^\d{8,}$/.test(phone)) {
      newErrors.phone = translations[language].invalidPhone || 'Invalid phone number';
      isValid = false;
    }
    if (!password || password.length < 8) {
      newErrors.password = translations[language].invalidPassword || 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        phoneNumber: phoneCode + phone,
        password,
      });

      if (response.success) {
        if (response.data && response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
        }
        Alert.alert(
          'Success',
          'Login successful!',
          [{ text: 'OK', onPress: () => router.replace('/dashboard') }]
        );
      } else {
        // Enhanced error handling for wrong credentials or not signed up
        let errorMessage = translations[language].errorOccurred || 'An error occurred';

        // Combine error and message for keyword search
        const errorText = (response.error || '') + ' ' + (response.message || '');

        if (
          errorText.toLowerCase().includes('invalid') ||
          errorText.toLowerCase().includes('incorrect') ||
          errorText.toLowerCase().includes('unauthorized') ||
          errorText.toLowerCase().includes('forbidden') ||
          errorText.toLowerCase().includes('not found')
        ) {
          errorMessage = 'Invalid credentials or account not found. Please check your phone number and password or sign up first.';
        } else if (response.message) {
          errorMessage = response.message;
        } else if (response.error) {
          errorMessage = response.error;
        }

        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.message) {
        if (
          error.message.toLowerCase().includes('invalid') ||
          error.message.toLowerCase().includes('incorrect') ||
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('forbidden') ||
          error.message.toLowerCase().includes('not found')
        ) {
          errorMessage = 'Invalid credentials or account not found. Please check your phone number and password or sign up first.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const PhoneCodeSelector = () => (
    <View style={phoneCodeContainerStyle}>
      <TouchableOpacity
        style={[
          phoneCodeButtonStyle,
          phoneCode === '+216' && phoneCodeButtonActiveStyle
        ]}
        onPress={() => setPhoneCode('+216')}
      >
        <Text style={[
          phoneCodeTextStyle,
          phoneCode === '+216' && phoneCodeTextActiveStyle
        ]}>
          🇹🇳 +216
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          phoneCodeButtonStyle,
          phoneCode === '+213' && phoneCodeButtonActiveStyle
        ]}
        onPress={() => setPhoneCode('+213')}
      >
        <Text style={[
          phoneCodeTextStyle,
          phoneCode === '+213' && phoneCodeTextActiveStyle
        ]}>
          🇩🇿 +213
        </Text>
      </TouchableOpacity>
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
              <View style={logoContainerStyle}>
                <Ionicons name="car-sport" size={50} color={AuthColors.primary} />
              </View>
              <Text style={welcomeTitleStyle}>
                {translations[language].login || 'Welcome Back'}
              </Text>
              <Text style={welcomeSubtitleStyle}>
                Sign in to continue your journey
              </Text>
            </View>

            {/* Form Section */}
            <View style={formSectionStyle}>
              {/* Phone Code Selector */}
              <Text style={inputLabelStyle}>
                {translations[language].phone || 'Phone Number'}
              </Text>
              <PhoneCodeSelector />

              {/* Phone Input */}
              <ModernInput
                placeholder="12345678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={errors.phone}
                leftIcon={<Text style={phonePrefixStyle}>{phoneCode}</Text>}
                style={inputStyle}
              />

              {/* Password Input */}
              <ModernInput
                label={translations[language].password || 'Password'}
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

              {/* Forgot Password Link */}
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/forgot-password')}
                style={forgotPasswordLinkStyle}
              >
                <Text style={forgotPasswordTextStyle}>
                  {translations[language].forgotPassword || 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <ModernButton
                title={translations[language].login || 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={loginButtonStyle}
              />

              {/* Signup Link */}
              <View style={signupLinkContainerStyle}>
                <Text style={signupLinkTextStyle}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                  <Text style={signupLinkStyle}>
                    {translations[language].signupPage || 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.md,
};

const welcomeTitleStyle = {
  fontSize: AuthTypography.fontSize['3xl'],
  fontWeight: '700' as const,
  color: AuthColors.text,
  textAlign: 'center' as const,
  marginBottom: AuthSpacing.sm,
};

const welcomeSubtitleStyle = {
  fontSize: AuthTypography.fontSize.lg,
  color: AuthColors.textSecondary,
  textAlign: 'center' as const,
};

const formSectionStyle = {
  flex: 1,
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius['2xl'],
  padding: AuthSpacing.xl,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.lg,
};

const inputLabelStyle = {
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  color: AuthColors.text,
  marginBottom: AuthSpacing.sm,
};

const phoneCodeContainerStyle = {
  flexDirection: 'row' as const,
  marginBottom: AuthSpacing.md,
  gap: AuthSpacing.sm,
};

const phoneCodeButtonStyle = {
  flex: 1,
  paddingVertical: AuthSpacing.md,
  paddingHorizontal: AuthSpacing.md,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.background,
  borderWidth: 1,
  borderColor: AuthColors.border,
  alignItems: 'center' as const,
};

const phoneCodeButtonActiveStyle = {
  borderColor: AuthColors.primary,
  backgroundColor: AuthColors.surface,
};

const phoneCodeTextStyle = {
  fontSize: AuthTypography.fontSize.sm,
  color: AuthColors.textSecondary,
  fontWeight: '500' as const,
};

const phoneCodeTextActiveStyle = {
  color: AuthColors.primary,
  fontWeight: '600' as const,
};

const phonePrefixStyle = {
  color: AuthColors.primary,
  fontWeight: '600' as const,
  fontSize: AuthTypography.fontSize.base,
};

const inputStyle = {
  marginBottom: AuthSpacing.md,
};

const forgotPasswordLinkStyle = {
  alignSelf: 'flex-end' as const,
  marginBottom: AuthSpacing.lg,
};

const forgotPasswordTextStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.sm,
  fontWeight: '500' as const,
  textDecorationLine: 'underline' as const,
};

const loginButtonStyle = {
  backgroundColor: AuthColors.primary,
  marginBottom: AuthSpacing.xl,
};

const signupLinkContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const signupLinkTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
};

const signupLinkStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  textDecorationLine: 'underline' as const,
};
