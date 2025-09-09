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

export default function ProfessionalForgotPassword() {
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+216');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const validatePhone = () => {
    if (!phone || !/^\d{8,}$/.test(phone)) {
      setError(translations[language].invalidPhone || 'Invalid phone number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendCode = async () => {
    if (!validatePhone()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword({ phoneNumber: phoneCode + phone });
      if (response.success) {
        await AsyncStorage.setItem('resetPhone', phoneCode + phone);
        Alert.alert(
          'Success',
          'Reset code sent successfully!',
          [{ text: 'OK', onPress: () => router.push('/(auth)/reset-code') }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to send reset code');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
                <Ionicons name="lock-open" size={50} color={AuthColors.primary} />
              </View>
              <Text style={titleStyle}>
                {translations[language].forgotPassword || 'Forgot Password?'}
              </Text>
              <Text style={subtitleStyle}>
                Enter your phone number to receive a reset code
              </Text>
            </View>

            {/* Form Section */}
            <View style={formSectionStyle}>
              <Text style={inputLabelStyle}>
                {translations[language].phone || 'Phone Number'}
              </Text>
              <PhoneCodeSelector />

              <ModernInput
                placeholder="12345678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={error}
                leftIcon={<Text style={phonePrefixStyle}>{phoneCode}</Text>}
                style={inputStyle}
              />

              <ModernButton
                title={translations[language].sendCode || 'Send Reset Code'}
                onPress={handleSendCode}
                loading={loading}
                disabled={loading}
                style={sendButtonStyle}
              />

              <View style={helpSectionStyle}>
                <Text style={helpTextStyle}>
                  Remember your password?
                </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={helpLinkStyle}>
                    {translations[language].login || 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Section */}
            <View style={infoSectionStyle}>
              <View style={infoCardStyle}>
                <Ionicons name="information-circle" size={24} color={AuthColors.info} style={infoIconStyle} />
                <Text style={infoTextStyle}>
                  We&apos;ll send a 6-digit verification code to your phone number to help you reset your password securely.
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
  lineHeight: 20,
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
  marginBottom: AuthSpacing.lg,
};

const sendButtonStyle = {
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
