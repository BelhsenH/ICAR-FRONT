import React, { useRef, useState, useEffect } from 'react';
import { View, Dimensions, Animated, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { AuthColors, AuthTypography, AuthSpacing, AuthBorderRadius, AuthLightTheme, AuthShadows } from '../../constants/AuthTheme';
import { ModernButton } from '../../components/modern/ModernButton';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface SlideData {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  iconName: keyof typeof Ionicons.glyphMap;
  illustration: React.ReactNode;
}

export default function ProfessionalIntro() {
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);
  
  // Animation values
  const slideOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const slides: SlideData[] = [
    {
      id: 1,
      titleKey: 'welcome',
      descriptionKey: 'welcomeDesc',
      icon: '🚗',
      iconName: 'car-sport',
      illustration: <CarIllustration />,
    },
    {
      id: 2,
      titleKey: 'stayInformed',
      descriptionKey: 'stayInformedDesc',
      icon: '🔔',
      iconName: 'notifications',
      illustration: <NotificationIllustration />,
    },
    {
      id: 3,
      titleKey: 'getStarted',
      descriptionKey: 'welcomeDesc',
      icon: '🚀',
      iconName: 'rocket',
      illustration: <RocketIllustration />,
    },
  ];

  const onIndexChanged = (index: number) => {
    setCurrentIndex(index);
    // Animate slide transition
    Animated.sequence([
      Animated.timing(slideOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const handleGetStarted = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/(auth)/login');
    });
  };

  const renderSlide = (slide: SlideData, index: number) => (
    <Animated.View key={slide.id} style={[slideStyle, { opacity: slideOpacity }]}>
      <View style={slideContentStyle}>
        {/* Illustration */}
        <View style={illustrationContainerStyle}>
          {slide.illustration}
        </View>

        {/* Content */}
        <View style={textContentStyle}>
          <View style={iconContainerStyle}>
            <Ionicons name={slide.iconName} size={32} color={AuthColors.primary} />
          </View>
          
          <Text style={slideTitleStyle}>
            {translations[language][slide.titleKey] || slide.titleKey}
          </Text>
          
          <Text style={slideDescriptionStyle}>
            {translations[language][slide.descriptionKey] || slide.descriptionKey}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderPagination = () => (
    <View style={paginationContainerStyle}>
      {slides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            paginationDotStyle,
            {
              backgroundColor: index === currentIndex ? AuthColors.primary : AuthColors.border,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
          onPress={() => swiperRef.current?.scrollTo(index)}
        />
      ))}
    </View>
  );

  return (
    <PaperProvider theme={AuthLightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={AuthColors.background} />
      
      <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={headerStyle}>
          <TouchableOpacity onPress={handleSkip} style={skipButtonStyle}>
            <Text style={skipTextStyle}>Skip</Text>
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

        {/* Swiper */}
        <Swiper
          ref={swiperRef}
          style={wrapperStyle}
          showsPagination={false}
          loop={false}
          onIndexChanged={onIndexChanged}
          scrollEnabled={true}
        >
          {slides.map((slide, index) => renderSlide(slide, index))}
        </Swiper>

        {/* Footer */}
        <View style={footerStyle}>
          {renderPagination()}
          
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <ModernButton
              title={currentIndex === slides.length - 1 ? (translations[language].getStarted || 'Get Started') : (translations[language].continue || 'Continue')}
              onPress={handleNext}
              style={nextButtonStyle}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </PaperProvider>
  );
}

// Illustration Components
const CarIllustration = () => (
  <View style={illustrationStyle}>
    <View style={illustrationCircleStyle}>
      <Ionicons name="car-sport" size={80} color={AuthColors.primary} />
    </View>
  </View>
);

const NotificationIllustration = () => (
  <View style={illustrationStyle}>
    <View style={illustrationCircleStyle}>
      <Ionicons name="notifications" size={80} color={AuthColors.primary} />
    </View>
  </View>
);

const RocketIllustration = () => (
  <View style={illustrationStyle}>
    <View style={illustrationCircleStyle}>
      <Ionicons name="rocket" size={80} color={AuthColors.primary} />
    </View>
  </View>
);

// Styles
const containerStyle = {
  flex: 1,
  backgroundColor: AuthColors.background,
};

const wrapperStyle = {};

const headerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  paddingTop: 60,
  paddingHorizontal: AuthSpacing.lg,
  paddingBottom: AuthSpacing.md,
};

const skipButtonStyle = {
  padding: AuthSpacing.sm,
  borderRadius: AuthBorderRadius.lg,
  backgroundColor: AuthColors.surface,
  ...AuthShadows.sm,
};

const skipTextStyle = {
  color: AuthColors.textSecondary,
  fontSize: AuthTypography.fontSize.base,
  fontWeight: '500' as const,
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

const slideStyle = {
  flex: 1,
  paddingHorizontal: AuthSpacing.xl,
};

const slideContentStyle = {
  flex: 1,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const illustrationContainerStyle = {
  flex: 0.4,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.xl,
};

const illustrationStyle = {
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const illustrationCircleStyle = {
  width: 200,
  height: 200,
  borderRadius: 100,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  ...AuthShadows.lg,
};

const textContentStyle = {
  flex: 0.6,
  alignItems: 'center' as const,
  paddingHorizontal: AuthSpacing.lg,
};

const iconContainerStyle = {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: AuthColors.surface,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.lg,
  ...AuthShadows.md,
};

const slideTitleStyle = {
  fontSize: AuthTypography.fontSize['3xl'],
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  marginBottom: AuthSpacing.md,
  color: AuthColors.text,
};

const slideDescriptionStyle = {
  textAlign: 'center' as const,
  color: AuthColors.textSecondary,
  lineHeight: 24,
  maxWidth: width * 0.8,
  fontSize: AuthTypography.fontSize.lg,
};

const footerStyle = {
  paddingHorizontal: AuthSpacing.xl,
  paddingBottom: 60,
  alignItems: 'center' as const,
};

const paginationContainerStyle = {
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  marginBottom: AuthSpacing.xl,
};

const paginationDotStyle = {
  height: 8,
  borderRadius: 4,
  marginHorizontal: 4,
  backgroundColor: AuthColors.border,
};

const nextButtonStyle = {
  width: width * 0.8,
  backgroundColor: AuthColors.primary,
};