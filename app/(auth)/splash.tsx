import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ProfessionalSplashScreen() {
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations sequence
    startAnimationSequence();
    
    // Auto navigate after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/intro');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const startAnimationSequence = () => {
    // Container fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Logo animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Title animation (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Loading indicator (delayed)
    setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Language button (delayed)
    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1200);
  };

  const LoadingDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animateDots = () => {
        const createDotAnimation = (dot: Animated.Value, delay: number) => {
          return Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);
        };

        Animated.loop(
          Animated.parallel([
            createDotAnimation(dot1, 0),
            createDotAnimation(dot2, 200),
            createDotAnimation(dot3, 400),
          ])
        ).start();
      };

      const timer = setTimeout(animateDots, 1000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={loadingContainerStyle}>
        <Animated.View style={[dotStyle, { opacity: dot1 }]} />
        <Animated.View style={[dotStyle, { opacity: dot2 }]} />
        <Animated.View style={[dotStyle, { opacity: dot3 }]} />
      </View>
    );
  };

  return (
    <PaperProvider theme={AuthLightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={AuthColors.background} />
      
      <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
        {/* Language Toggle Button */}
        <Animated.View style={[languageContainerStyle, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            onPress={toggleLanguage}
            style={languageButtonStyle}
          >
            <Text style={languageButtonTextStyle}>
              {language === 'fr' ? 'عربي' : 'FR'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Main Content */}
        <View style={contentContainerStyle}>
          {/* Logo */}
          <Animated.View 
            style={[
              logoContainerStyle,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              }
            ]}
          >
            <View style={logoBackgroundStyle}>
              <Ionicons name="car-sport" size={60} color={AuthColors.primary} />
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View
            style={[
              titleContainerStyle,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              }
            ]}
          >
            <Text style={appNameStyle}>
              {translations[language].appName || 'ICar Suite'}
            </Text>
            <Text style={taglineStyle}>
              {translations[language].welcomeDesc || 'Professional Car Management'}
            </Text>
          </Animated.View>

          {/* Loading Animation */}
          <Animated.View style={[loadingWrapperStyle, { opacity: loadingOpacity }]}>
            <LoadingDots />
          </Animated.View>
        </View>

        {/* Bottom Brand Info */}
        <View style={bottomInfoStyle}>
          <View style={brandContainerStyle}>
            <Ionicons name="shield-checkmark" size={20} color={AuthColors.primary} style={brandIconStyle} />
            <Text style={brandTextStyle}>
              Secure & Professional
            </Text>
          </View>
        </View>
      </Animated.View>
    </PaperProvider>
  );
}

// Styles
const containerStyle = {
  flex: 1,
  backgroundColor: AuthColors.background,
};

const languageContainerStyle = {
  position: 'absolute' as const,
  top: 60,
  right: AuthSpacing.lg,
  zIndex: 10,
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

const contentContainerStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  paddingHorizontal: AuthSpacing.xl,
};

const logoContainerStyle = {
  marginBottom: AuthSpacing.xl,
};

const logoBackgroundStyle = {
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  ...AuthShadows.lg,
};

const titleContainerStyle = {
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.xl,
};

const appNameStyle = {
  fontSize: AuthTypography.fontSize['4xl'],
  fontWeight: '700' as const,
  color: AuthColors.text,
  textAlign: 'center' as const,
  marginBottom: AuthSpacing.sm,
};

const taglineStyle = {
  fontSize: AuthTypography.fontSize.lg,
  color: AuthColors.textSecondary,
  textAlign: 'center' as const,
  lineHeight: 24,
  maxWidth: width * 0.8,
};

const loadingWrapperStyle = {
  marginTop: AuthSpacing.xl,
};

const loadingContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const dotStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: AuthColors.primary,
  marginHorizontal: 4,
};

const bottomInfoStyle = {
  alignItems: 'center' as const,
  paddingBottom: AuthSpacing.xl,
};

const brandContainerStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingHorizontal: AuthSpacing.lg,
  paddingVertical: AuthSpacing.md,
  backgroundColor: AuthColors.surface,
  borderRadius: AuthBorderRadius.lg,
  ...AuthShadows.sm,
};

const brandIconStyle = {
  marginRight: AuthSpacing.sm,
};

const brandTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.sm,
  fontWeight: '500' as const,
};