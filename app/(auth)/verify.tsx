import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernOTPInput } from '../../components/modern/ModernOTPInput';
import { VerifyPhoneData, authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ProfessionalVerify() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get phone number from storage
    const loadPhoneNumber = async () => {
      const phone = await AsyncStorage.getItem('userPhone');
      if (phone) {
        setPhoneNumber(phone);
      }
    };
    loadPhoneNumber();

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
      })
    ]).start();

    // Start countdown timer
    startTimer();
  }, [fadeAnim, slideAnim]);

  const startTimer = () => {
    setCanResend(false);
    setTimer(60);
    
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOTPComplete = async (otpValue: string) => {
    setError(false);
    setLoading(true);

    const phoneFromStorage = await AsyncStorage.getItem('userPhone') as string;

    const data: VerifyPhoneData = {
      phoneNumber: phoneFromStorage,
      code: otpValue,
    };

    try {
      const response = await authService.verifyPhone(data);
      if (response.success) {
        Alert.alert(
          'Success',
          'Phone number verified successfully!',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        setError(true);
        shakeAnimation();
        Alert.alert(
          'Verification Failed', 
          response.error || 'Invalid verification code. Please try again.'
        );
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(true);
      shakeAnimation();
      Alert.alert(
        'Verification Error', 
        'An error occurred during verification. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const phoneFromStorage = await AsyncStorage.getItem('userPhone') as string;
      const response = await authService.resendVerificationCode(phoneFromStorage);
      if (response.success) {
        startTimer();
        Alert.alert('Success', 'Verification code sent successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to resend code.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhoneNumber = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    const lastFour = phone.slice(-4);
    const masked = phone.slice(0, -4).replace(/\d/g, '*');
    return masked + lastFour;
  };

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
                transform: [
                  { translateY: slideAnim },
                  { translateX: shakeAnim }
                ],
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
                <Ionicons name="phone-portrait" size={50} color={AuthColors.primary} />
              </View>
              <Text style={titleStyle}>
                {translations[language].verifyCode || 'Verify Phone'}
              </Text>
              <Text style={subtitleStyle}>
                {translations[language].enterCode || 'Enter the verification code sent to'}
              </Text>
              <Text style={phoneNumberStyle}>
                {maskPhoneNumber(phoneNumber)}
              </Text>
            </View>

            {/* OTP Input Section */}
            <View style={otpSectionStyle}>
              <ModernOTPInput
                length={6}
                onComplete={handleOTPComplete}
                error={error}
                autoFocus={true}
              />

              {loading && (
                <View style={loadingContainerStyle}>
                  <Text style={loadingTextStyle}>Verifying...</Text>
                </View>
              )}
            </View>

            {/* Resend Section */}
            <View style={resendSectionStyle}>
              {!canResend ? (
                <View style={timerContainerStyle}>
                  <Text style={timerTextStyle}>
                    Resend code in {formatTimer(timer)}
                  </Text>
                </View>
              ) : (
                <ModernButton
                  title="Resend Code"
                  onPress={handleResendCode}
                  loading={resendLoading}
                  disabled={resendLoading}
                  style={resendButtonStyle}
                />
              )}
            </View>

            {/* Help Section */}
            <View style={helpSectionStyle}>
              <Text style={helpTextStyle}>
                Didn&apos;t receive the code?
              </Text>
              <TouchableOpacity style={helpButtonStyle}>
                <Text style={helpButtonTextStyle}>
                  Contact Support
                </Text>
              </TouchableOpacity>
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
  marginBottom: AuthSpacing.sm,
};

const phoneNumberStyle = {
  color: AuthColors.primary,
  textAlign: 'center' as const,
  fontWeight: '600' as const,
  fontSize: AuthTypography.fontSize.lg,
};

const otpSectionStyle = {
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius['2xl'],
  padding: AuthSpacing.xl,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.lg,
};

const loadingContainerStyle = {
  alignItems: 'center' as const,
  marginTop: AuthSpacing.lg,
};

const loadingTextStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '500' as const,
};

const resendSectionStyle = {
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.xl,
};

const timerContainerStyle = {
  paddingVertical: AuthSpacing.md,
  paddingHorizontal: AuthSpacing.lg,
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius.lg,
  ...AuthShadows.sm,
};

const timerTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '500' as const,
};

const resendButtonStyle = {
  backgroundColor: AuthColors.surface,
  borderWidth: 1,
  borderColor: AuthColors.primary,
  paddingHorizontal: AuthSpacing.xl,
};

const helpSectionStyle = {
  alignItems: 'center' as const,
  marginTop: 'auto' as const,
  marginBottom: AuthSpacing.xl,
};

const helpTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.sm,
  marginBottom: AuthSpacing.sm,
};

const helpButtonStyle = {
  paddingVertical: AuthSpacing.sm,
  paddingHorizontal: AuthSpacing.md,
};

const helpButtonTextStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.sm,
  fontWeight: '600' as const,
  textDecorationLine: 'underline' as const,
};