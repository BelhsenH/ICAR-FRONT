import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernInput } from '../../components/modern/ModernInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegisterData, authService } from '../../scripts/auth-script';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ProfessionalSignup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+216');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'entreprise'>('personal');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();
  const { register, isRegistering } = useAuthFlow();

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
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      newErrors.lastName = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = translations[language].invalidEmail || 'Invalid email format';
      isValid = false;
    }

    // Validate phone
    if (!phone.trim()) {
      newErrors.phone = translations[language].requiredField || 'Required field';
      isValid = false;
    } else if (!/^\d{8,15}$/.test(phone)) {
      newErrors.phone = translations[language].invalidPhone || 'Invalid phone number';
      isValid = false;
    }

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

  const handleSignup = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again.');
      return;
    }

    const userData: RegisterData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneCode + phone,
      type: accountType,
      password,
    };

    const response = await register(userData);
    
    if (response.success) {
      Alert.alert(
        'Success',
        'Account created successfully! Please verify your phone number.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/verify') }]
      );
    } else {
      const errorMessage = response.error || 'Registration failed. Please try again.';
      if (errorMessage.toLowerCase().includes('already exists')) {
        Alert.alert('Account Exists', 'An account with this email or phone number already exists.');
      } else {
        Alert.alert('Registration Error', errorMessage);
      }
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
                <Ionicons name="car-sport" size={40} color={AuthColors.primary} />
              </View>
              <Text style={titleStyle}>
                {translations[language].signupPage || 'Create Account'}
              </Text>
              <Text style={subtitleStyle}>
                Join us and start your journey
              </Text>
            </View>

            {/* Form Section */}
            <View style={formSectionStyle}>
              {/* Name Fields */}
              <View style={nameRowStyle}>
                <ModernInput
                  label={translations[language].firstName || 'First Name'}
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  style={nameInputStyle}
                />
                <ModernInput
                  label={translations[language].lastName || 'Last Name'}
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  style={nameInputStyle}
                />
              </View>

              {/* Email Input */}
              <ModernInput
                label={translations[language].email || 'Email'}
                placeholder="john.doe@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                error={errors.email}
                style={inputStyle}
              />

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

              {/* Confirm Password Input */}
              <ModernInput
                label="Confirm Password"
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

              {/* Account Type Selector */}
              <Text style={inputLabelStyle}>Account Type</Text>
              <View style={accountTypeContainerStyle}>
                <TouchableOpacity
                  style={[
                    accountTypeButtonStyle,
                    accountType === 'personal' && accountTypeButtonActiveStyle
                  ]}
                  onPress={() => setAccountType('personal')}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={accountType === 'personal' ? AuthColors.primary : AuthColors.textSecondary} 
                  />
                  <Text style={[
                    accountTypeTextStyle,
                    accountType === 'personal' && accountTypeTextActiveStyle
                  ]}>
                    {translations[language].personal || 'Personal'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    accountTypeButtonStyle,
                    accountType === 'entreprise' && accountTypeButtonActiveStyle
                  ]}
                  onPress={() => setAccountType('entreprise')}
                >
                  <Ionicons 
                    name="business" 
                    size={20} 
                    color={accountType === 'entreprise' ? AuthColors.primary : AuthColors.textSecondary} 
                  />
                  <Text style={[
                    accountTypeTextStyle,
                    accountType === 'entreprise' && accountTypeTextActiveStyle
                  ]}>
                    {translations[language].enterprise || 'Enterprise'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Signup Button */}
              <ModernButton
                title={translations[language].signup || 'Create Account'}
                onPress={handleSignup}
                loading={isRegistering}
                disabled={isRegistering}
                style={signupButtonStyle}
              />

              {/* Login Link */}
              <View style={loginLinkContainerStyle}>
                <Text style={loginLinkTextStyle}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={loginLinkStyle}>
                    {translations[language].login || 'Sign In'}
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
  width: 80,
  height: 80,
  borderRadius: 40,
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
};

const formSectionStyle = {
  flex: 1,
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius['2xl'],
  padding: AuthSpacing.xl,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.lg,
};

const nameRowStyle = {
  flexDirection: 'row' as const,
  gap: AuthSpacing.md,
};

const nameInputStyle = {
  flex: 1,
};

const inputLabelStyle = {
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  color: AuthColors.text,
  marginBottom: AuthSpacing.sm,
  marginTop: AuthSpacing.md,
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

const accountTypeContainerStyle = {
  flexDirection: 'row' as const,
  gap: AuthSpacing.md,
  marginBottom: AuthSpacing.xl,
};

const accountTypeButtonStyle = {
  flex: 1,
  paddingVertical: AuthSpacing.lg,
  paddingHorizontal: AuthSpacing.md,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.background,
  borderWidth: 1,
  borderColor: AuthColors.border,
  alignItems: 'center' as const,
  gap: AuthSpacing.sm,
};

const accountTypeButtonActiveStyle = {
  borderColor: AuthColors.primary,
  backgroundColor: AuthColors.surface,
};

const accountTypeTextStyle = {
  fontSize: AuthTypography.fontSize.sm,
  color: AuthColors.textSecondary,
  fontWeight: '500' as const,
};

const accountTypeTextActiveStyle = {
  color: AuthColors.primary,
  fontWeight: '600' as const,
};

const signupButtonStyle = {
  backgroundColor: AuthColors.primary,
  marginTop: AuthSpacing.lg,
  marginBottom: AuthSpacing.xl,
};

const loginLinkContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const loginLinkTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
};

const loginLinkStyle = {
  color: AuthColors.primary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '600' as const,
  textDecorationLine: 'underline' as const,
};