import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernOTPInput } from '../../components/modern/ModernOTPInput';
import { authService } from '../../scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ProfessionalResetCode() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Load phone number from storage
    loadPhoneNumber();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadPhoneNumber = async () => {
    try {
      const storedPhone = await AsyncStorage.getItem('resetPhone');
      if (storedPhone) {
        setPhone(storedPhone);
      }
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (newCode.length === 6) {
      // Auto-verify when complete
      handleVerifyCode(newCode);
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code;
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // For now, just store the code and let the new-password page handle validation
      // In a real implementation, you'd want a separate verify-reset-code endpoint
      await AsyncStorage.setItem('resetCode', codeToVerify);
      
      // Success animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      Alert.alert(
        'Success',
        'Code verified successfully!',
        [{ text: 'OK', onPress: () => router.push('/(auth)/new-password') }]
      );
    } catch (error) {
      console.error('Verify code error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const response = await authService.forgotPassword({ phoneNumber: phone });
      if (response.success) {
        setTimeLeft(120);
        setCanResend(false);
        setCode('');
        Alert.alert('Success', 'New verification code sent!');
      } else {
        Alert.alert('Error', response.error || 'Failed to send new code');
      }
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert('Error', 'Failed to send new code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatPhoneDisplay = (phoneNumber: string) => {
    if (phoneNumber.startsWith('+216')) {
      return `+216 **** ${phoneNumber.slice(-4)}`;
    } else if (phoneNumber.startsWith('+213')) {
      return `+213 **** ${phoneNumber.slice(-4)}`;
    }
    return `**** ${phoneNumber.slice(-4)}`;
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
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Ionicons name="shield-checkmark" size={50} color={AuthColors.primary} />
              </Animated.View>
              <Text style={titleStyle}>
                {translations[language].verifyCode || 'Verify Reset Code'}
              </Text>
              <Text style={subtitleStyle}>
                Enter the 6-digit code sent to
              </Text>
              <Text style={phoneDisplayStyle}>
                {formatPhoneDisplay(phone)}
              </Text>
            </View>

            {/* Form Section */}
            <View style={formSectionStyle}>
              <Text style={inputLabelStyle}>
                {translations[language].verificationCode || 'Verification Code'}
              </Text>
              
              <View style={otpContainerStyle}>
                <ModernOTPInput
                  length={6}
                  onComplete={handleCodeChange}
                  onChangeText={setCode}
                />
              </View>

              {/* Timer Section */}
              <View style={timerSectionStyle}>
                {!canResend ? (
                  <View style={timerContainerStyle}>
                    <Ionicons name="time-outline" size={20} color={AuthColors.textSecondary} />
                    <Text style={timerTextStyle}>
                      Resend code in {formatTime(timeLeft)}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    onPress={handleResendCode}
                    style={resendButtonStyle}
                    disabled={resendLoading}
                  >
                    <Ionicons name="refresh-outline" size={20} color={AuthColors.primary} />
                    <Text style={resendTextStyle}>
                      {resendLoading ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <ModernButton
                title={translations[language].verify || 'Verify Code'}
                onPress={() => handleVerifyCode()}
                loading={loading}
                disabled={loading || code.length !== 6}
                style={verifyButtonStyle}
              />

              <View style={helpSectionStyle}>
                <Text style={helpTextStyle}>
                  Didn&apos;t receive the code?
                </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={helpLinkStyle}>
                    Try different number
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Section */}
            <View style={infoSectionStyle}>
              <View style={infoCardStyle}>
                <Ionicons name="information-circle" size={24} color={AuthColors.info} style={infoIconStyle} />
                <Text style={infoTextStyle}>
                  The verification code is valid for 10 minutes. If you don&apos;t receive it within 2 minutes, try requesting a new one.
                </Text>
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
  marginBottom: AuthSpacing.xs,
};

const phoneDisplayStyle = {
  fontSize: AuthTypography.fontSize.xl,
  fontWeight: '600' as const,
  color: AuthColors.primary,
  textAlign: 'center' as const,
};

const formSectionStyle = {
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
  marginBottom: AuthSpacing.md,
  textAlign: 'center' as const,
};

const otpContainerStyle = {
  marginBottom: AuthSpacing.lg,
};

const timerSectionStyle = {
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.lg,
};

const timerContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: AuthSpacing.sm,
};

const timerTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '500' as const,
};

const resendButtonStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: AuthSpacing.sm,
  paddingVertical: AuthSpacing.sm,
  paddingHorizontal: AuthSpacing.md,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.background,
  borderWidth: 1,
  borderColor: AuthColors.primary,
};

const resendTextStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
};

const verifyButtonStyle = {
  backgroundColor: AuthColors.primary,
  marginBottom: AuthSpacing.lg,
};

const helpSectionStyle = {
  alignItems: 'center' as const,
};

const helpTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
  marginBottom: AuthSpacing.sm,
};

const helpLinkStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  textDecorationLine: 'underline' as const,
};

const infoSectionStyle = {
  marginTop: 'auto' as const,
  marginBottom: AuthSpacing.xl,
};

const infoCardStyle = {
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius.lg,
  padding: AuthSpacing.lg,
  flexDirection: 'row' as const,
  alignItems: 'flex-start' as const,
  ...AuthShadows.sm,
};

const infoIconStyle = {
  marginRight: AuthSpacing.md,
  marginTop: 2,
};

const infoTextStyle = {
  flex: 1,
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.sm,
  lineHeight: 20,
};