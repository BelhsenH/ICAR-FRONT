import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Animated, StatusBar, Dimensions, Image, Linking, Platform, PanResponder, TouchableOpacity, Text } from 'react-native';
// Kitten UI removed to avoid compatibility issues
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { getUserCars } from '@/scripts/car-script';
import { authService } from '@/scripts/auth-script';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatbotButton } from '../../components/ChatbotButton';

const { width } = Dimensions.get('window');

interface Car {
  id: string;
  marque: string;
  modele: string;
  vin: string;
  immatriculation: string;
  fuelType: string;
  dateAdded: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
}


export default function ModernDashboard() {
  const [cars, setCars] = useState<Car[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState('Dashboard');
  const router = useRouter();
  const { language, toggleLanguage, translations } = useLanguage();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const menuItemAnims = useRef(new Map()).current;

  // Add a new opacity animation for the sidebar
  const sidebarOpacity = useRef(new Animated.Value(0)).current;

  // Pan responder for sidebar gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Detect swipe from left edge or on sidebar
        const { dx, dy } = gestureState;
        const { pageX } = evt.nativeEvent;
        return (
          Math.abs(dx) > Math.abs(dy) && 
          (pageX < 50 || sidebarVisible) && 
          Math.abs(dx) > 10
        );
      },
      onPanResponderGrant: () => {
        // Set initial value for animation
        slideAnim.stopAnimation((value) => {
          slideAnim.setOffset(value);
          slideAnim.setValue(0);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        if (sidebarVisible) {
          // If sidebar is visible, allow dragging to close
          if (dx < 0) {
            slideAnim.setValue(dx);
            sidebarOpacity.setValue(1 + dx / (width * 0.8));
          }
        } else {
          // If sidebar is hidden, allow dragging to open
          if (dx > 0) {
            slideAnim.setValue(-width * 0.8 + dx);
            sidebarOpacity.setValue(dx / (width * 0.8));
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        slideAnim.flattenOffset();
        
        if (sidebarVisible) {
          // Close sidebar if swiped left enough or with velocity
          if (dx < -width * 0.2 || vx < -0.5) {
            closeSidebar();
          } else {
            openSidebar();
          }
        } else {
          // Open sidebar if swiped right enough or with velocity
          if (dx > width * 0.2 || vx > 0.5) {
            openSidebar();
          } else {
            closeSidebar();
          }
        }
      },
    })
  ).current;

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    // Use requestAnimationFrame to ensure proper timing
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(sidebarOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [slideAnim, sidebarOpacity]);

  const closeSidebar = useCallback(() => {
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -width * 0.8,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(sidebarOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSidebarVisible(false);
      });
    });
  }, [slideAnim, sidebarOpacity]);

  useEffect(() => {
    // Start entrance animations
    const startAnimations = () => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };

    // Use setTimeout to defer animations to next frame
    const timeoutId = setTimeout(() => {
      startAnimations();
      // Load cars and user profile
      loadCars();
      loadUserProfile();
    }, 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to run only once on mount

  const loadCars = async () => {
    try {
      const response = await getUserCars();
      if (response.success && response.data) {
        const mappedCars = response.data.map(car => ({
          id: car._id,
          marque: car.marque,
          modele: car.modele,
          vin: car.vin,
          immatriculation: car.numeroImmatriculation,
          fuelType: car.fuelType,
          dateAdded: new Date(car.datePremiereMiseEnCirculation).toLocaleDateString('fr-FR'),
        }));
        setCars(mappedCars);
      } else {
        console.error('Failed to fetch cars:', response.message);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUserProfile({
          id: response.data._id,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
        });
      } else {
        console.error('Failed to fetch user profile:', response.message);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };


  const toggleSidebar = useCallback(() => {
    if (sidebarVisible) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }, [sidebarVisible, closeSidebar, openSidebar]);

  const getMenuItemAnim = useCallback((item: string) => {
    if (!menuItemAnims.has(item)) {
      menuItemAnims.set(item, new Animated.Value(1));
    }
    return menuItemAnims.get(item);
  }, [menuItemAnims]);

  const animateMenuItem = useCallback((item: string, scale: number) => {
    // Use setTimeout to defer animation to next tick
    setTimeout(() => {
      Animated.spring(getMenuItemAnim(item), {
        toValue: scale,
        tension: 120,
        friction: 14,
        useNativeDriver: true,
      }).start();
    }, 0);
  }, [getMenuItemAnim]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>🚗</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {translations[language].noCarsAdded}
      </Text>
      <Text style={styles.emptyDescription}>
        {translations[language].addFirstCar}
      </Text>
    </View>
  );

  const CarCard = ({ car }: { car: Car }) => (
    <TouchableOpacity 
      style={styles.carCardEnhanced}
      onPress={() => router.push(`/(app)/car-profile/${car.id}`)}
      activeOpacity={0.92}
    >
      <LinearGradient
        colors={['#f5f7fa', Colors.primary + '15']}
        style={styles.carCardGradient}
      >
        <View style={styles.carCardHeader}>
          {/* Placeholder for car logo */}
          <View style={styles.carLogoContainer}>
            <Image
              source={require('../../assets/images/car-placeholder.png')}
              style={styles.carLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.carBrandInfo}>
            <Text style={styles.carBrandTextEnhanced}>{car.marque}</Text>
            <Text style={styles.carModelEnhanced}>{car.modele}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{car.dateAdded}</Text>
          </View>
        </View>
        <View style={styles.carDetailsEnhanced}>
          <View style={styles.carDetailItemEnhanced}>
            <Text style={styles.carDetailLabelEnhanced}>VIN</Text>
            <Text style={styles.carDetailValueEnhanced}>{car.vin}</Text>
          </View>
          <View style={styles.carDetailItemEnhanced}>
            <Text style={styles.carDetailLabelEnhanced}>{translations[language].registrationNumber}</Text>
            <Text style={styles.carDetailValueEnhanced}>{car.immatriculation}</Text>
          </View>
          <View style={styles.carDetailItemEnhanced}>
            <Text style={styles.carDetailLabelEnhanced}>{translations[language].fuelType}</Text>
            <Text style={styles.carDetailValueEnhanced}>{car.fuelType}</Text>
          </View>
        </View>
        <View style={styles.carFooterEnhanced}>
          <ModernButton
            title={translations[language].requestService}
            onPress={() => router.push(`/(app)/book-service-v2/${car.id}`)}
            variant="primary"
            size="small"
            style={styles.footerButton}
          />
          <ModernButton
            title={translations[language].carDetails}
            onPress={() => router.push(`/(app)/car-profile/${car.id}`)}
            variant="outline"
            size="small"
            style={styles.footerButton}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const Sidebar = () => {
    const menuItems = [
      { name: translations[language].dashboard, icon: '🏠', path: '/(app)/dashboard' },
      { name: translations[language].myCars, icon: '🚗', path: '/(app)/my-cars' },
      { name: translations[language].serviceHistory, icon: '🔧', path: '/(app)/service-history' },
      { name: translations[language].findMechanics || 'Find Mechanics', icon: '📍', path: '/(app)/mechanics-map' },
      { name: translations[language].conversations || 'Conversations', icon: '💬', path: '/(app)/conversations' },
      { name: translations[language].spareParts, icon: '🛠️', path: '/(app)/create-parts-request' },
      { name: translations[language].partsRequests || 'My Parts Requests', icon: '📋', path: '/(app)/parts-requests' },
      { name: translations[language].profile, icon: '👤', path: '/(app)/profile' },
      { name: translations[language].settings, icon: '⚙️', path: '/(app)/settings' },
      { 
        name: translations[language].logout, 
        icon: '🚪', 
        path: '/(auth)/login',
        action: async () => {
          await authService.logout();
          await AsyncStorage.removeItem('AuthToken');
        }
      },
    ];

    return sidebarVisible ? (
      <Animated.View 
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }], opacity: sidebarOpacity, zIndex: 1001 }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sidebarContainer}>
            {/* Professional Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userProfile ? `${userProfile.firstName[0]}${userProfile.lastName[0]}` : translations[language].defaultUser[0].toUpperCase() + translations[language].defaultUser[1]}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : translations[language].defaultUser}
                  </Text>
                  <Text style={styles.userEmail}>
                    {userProfile?.email || translations[language].defaultEmail}
                  </Text>
                  <View style={styles.userStatusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{translations[language].online}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Menu */}
            <ScrollView style={styles.sidebarMenu} contentContainerStyle={styles.sidebarMenuContent}>
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{translations[language].dashboard.toUpperCase()}</Text>
              {/* First 7 items: dashboard, cars, service history, mechanics map, spare parts, parts requests */}
              {menuItems.slice(0, 7).map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.menuItem, activeMenuItem === item.name && styles.menuItemActive]}
                  onPress={async () => {
                    setActiveMenuItem(item.name);
                    if (item.action) {
                      await item.action();
                      router.replace(item.path as any);
                    } else {
                      router.push(item.path as any);
                    }
                    closeSidebar();
                  }}
                  onPressIn={() => animateMenuItem(item.name, 0.95)}
                  onPressOut={() => animateMenuItem(item.name, 1)}
                >
                  <Animated.View style={[styles.menuItemContent, { transform: [{ scale: getMenuItemAnim(item.name) }] }]}>
                    <View style={styles.menuItemLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={[styles.menuText, activeMenuItem === item.name && styles.menuTextActive]}>
                        {typeof item.name === 'string' ? item.name : String(item.name ?? 'Unnamed')}
                      </Text>
                    </View>
                    {activeMenuItem === item.name && <View style={styles.activeIndicator} />}
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{translations[language].profile.toUpperCase()}</Text>
              {/* Profile section: profile and settings */}
              {menuItems.slice(7, 9).map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.menuItem, activeMenuItem === item.name && styles.menuItemActive]}
                  onPress={async () => {
                    setActiveMenuItem(item.name);
                    if (item.action) {
                      await item.action();
                      router.replace(item.path as any);
                    } else {
                      router.push(item.path as any);
                    }
                    closeSidebar();
                  }}
                  onPressIn={() => animateMenuItem(item.name, 0.95)}
                  onPressOut={() => animateMenuItem(item.name, 1)}
                >
                  <Animated.View style={[styles.menuItemContent, { transform: [{ scale: getMenuItemAnim(item.name) }] }]}>
                    <View style={styles.menuItemLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={[styles.menuText, activeMenuItem === item.name && styles.menuTextActive]}>
                        {item.name}
                      </Text>
                    </View>
                    {activeMenuItem === item.name && <View style={styles.activeIndicator} />}
                  </Animated.View>
                </TouchableOpacity>
              ))}
              
              {/* Language Toggle */}
              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    toggleLanguage();
                    closeSidebar();
                  }}
                  onPressIn={() => animateMenuItem('language', 0.95)}
                  onPressOut={() => animateMenuItem('language', 1)}
                >
                  <Animated.View style={[styles.menuItemContent, { transform: [{ scale: getMenuItemAnim('language') }] }]}>
                    <View style={styles.menuItemLeft}>
                      <Text style={styles.menuIcon}>🌐</Text>
                      <Text style={styles.menuText}>
                        {translations[language].language}
                      </Text>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              </View>

              <View style={styles.menuDivider} />

              {/* Logout Section */}
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={async () => {
                  const logoutItem = menuItems[menuItems.length - 1];
                  if (logoutItem.action) {
                    await logoutItem.action();
                    router.replace(logoutItem.path as any);
                  }
                }}
                onPressIn={() => animateMenuItem('logout', 0.95)}
                onPressOut={() => animateMenuItem('logout', 1)}
              >
                <Animated.View style={[styles.menuItemContent, { transform: [{ scale: getMenuItemAnim('logout') }] }]}>
                  <View style={styles.menuItemLeft}>
                    <Text style={[styles.menuIcon, styles.logoutIcon]}>🚪</Text>
                    <Text style={[styles.menuText, styles.logoutText]}>
                      {translations[language].logout}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      ) : null;
  };

  const ADS = [
    { id: 1, image: require('../../assets/images/ad.png'), url: 'https://www.shell.com/' },
    { id: 2, image: require('../../assets/images/ad.png'), url: 'https://www.shell.com/' },
    { id: 3, image: require('../../assets/images/ad.png'), url: 'https://www.shell.com/' },
  ];

  // Quick Access Actions


  // Enhanced Quick Access Buttons with animations and better design
  const QuickAccessButtons = () => {
    const [buttonAnimations] = useState(() => new Map());
    const [pulseAnimation] = useState(new Animated.Value(0));

    const getButtonAnim = useCallback((id: string) => {
      if (!buttonAnimations.has(id)) {
        buttonAnimations.set(id, {
          scale: new Animated.Value(1),
          opacity: new Animated.Value(1),
          rotate: new Animated.Value(0),
        });
      }
      return buttonAnimations.get(id);
    }, [buttonAnimations]);

    const animateButton = useCallback((id: string, pressed: boolean) => {
      const anims = getButtonAnim(id);
      Animated.parallel([
        Animated.spring(anims.scale, {
          toValue: pressed ? 0.92 : 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(anims.opacity, {
          toValue: pressed ? 0.9 : 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(anims.rotate, {
          toValue: pressed ? 1 : 0,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }, [getButtonAnim]);

    // Start pulse animation for indicators
    React.useEffect(() => {
      const startPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      
      startPulse();
    }, [pulseAnimation]);

    const quickActions = [
      {
        id: 'my-cars',
        title: translations[language].myCars,
        subtitle: cars.length > 0 ? `${cars.length} ${translations[language].vehicles}` : translations[language].addVehicle,
        icon: '🚗',
        color: Colors.primary,
        onPress: () => router.push('/(app)/my-cars'),
      },
      {
        id: 'book-service',
        title: translations[language].bookService,
        subtitle: translations[language].scheduleService,
        icon: '🔧',
        color: Colors.info,
        onPress: () => {
          if (cars.length > 0) {
            router.push(`/(app)/book-service-v2/${cars[0].id}`);
          } else {
            router.push('/(app)/add-car');
          }
        },
      },
      {
        id: 'mechanics-map',
        title: translations[language].findMechanics || 'Find Mechanics',
        subtitle: translations[language].nearbyMechanics || 'View nearby mechanics',
        icon: '📍',
        color: Colors.success,
        onPress: () => router.push('/(app)/mechanics-map'),
      },
      {
        id: 'spare-parts',
        title: translations[language].spareParts,
        subtitle: translations[language].orderParts,
        icon: '🛠️',
        color: Colors.warning,
        onPress: () => router.push('/(app)/create-parts-request'),
      },
    ];

    return (
      <View style={styles.quickAccessSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {translations[language].quickActions || 'Quick Actions'}
          </Text>
          <View style={styles.quickActionsBadge}>
            <Text style={styles.quickActionsBadgeText}>{quickActions.length}</Text>
          </View>
        </View>
        <View style={styles.quickAccessGrid}>
          {quickActions.map((action) => {
            const anims = getButtonAnim(action.id);
            return (
              <Animated.View
                key={action.id}
                style={[
                  styles.quickAccessButton,
                  {
                    transform: [{ scale: anims.scale }],
                    opacity: anims.opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={action.onPress}
                  onPressIn={() => animateButton(action.id, true)}
                  onPressOut={() => animateButton(action.id, false)}
                  activeOpacity={1}
                  accessible={true}
                  accessibilityLabel={`${action.title} - ${action.subtitle}`}
                  accessibilityRole="button"
                  style={styles.quickAccessTouchable}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.98)',
                      'rgba(255, 255, 255, 0.92)',
                      action.color + '12'
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickAccessGradient}
                  >
                    {/* Background blur effect */}
                    <View style={styles.quickAccessBackdrop} />
                    
                    {/* Content container */}
                    <View style={styles.quickAccessContainer}>
                      {/* Enhanced icon with glow effect */}
                      <Animated.View 
                        style={[
                          styles.quickAccessIconContainer,
                          {
                            transform: [{
                              rotate: anims.rotate.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '5deg']
                              })
                            }]
                          }
                        ]}
                      >
                        <LinearGradient
                          colors={[action.color + '25', action.color + '15']}
                          style={styles.quickAccessIcon}
                        >
                          <Text style={styles.quickAccessIconText}>
                            {action.icon}
                          </Text>
                        </LinearGradient>
                        {/* Glow effect */}
                        <View style={[styles.iconGlow, { backgroundColor: action.color + '20' }]} />
                      </Animated.View>
                      
                      {/* Content */}
                      <View style={styles.quickAccessContent}>
                        <Text style={styles.quickAccessTitle}>{action.title}</Text>
                        <Text style={styles.quickAccessSubtitle}>{action.subtitle}</Text>
                      </View>
                      
                      {/* Enhanced indicator with pulse effect */}
                      <View style={styles.quickAccessIndicatorContainer}>
                        <LinearGradient
                          colors={[action.color, action.color + '80']}
                          style={styles.quickAccessIndicator}
                        />
                        <Animated.View 
                          style={[
                            styles.indicatorPulse, 
                            { 
                              backgroundColor: action.color + '30',
                              opacity: pulseAnimation,
                              transform: [{
                                scale: pulseAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.5]
                                })
                              }]
                            }
                          ]} 
                        />
                      </View>
                    </View>
                    
                    {/* Shimmer effect overlay */}
                    <LinearGradient
                      colors={[
                        'transparent',
                        'rgba(255, 255, 255, 0.3)',
                        'transparent'
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shimmerOverlay}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const AdsCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event: any) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / (width * 0.95 + 16)
      );
      setActiveIndex(index);
    };

    const openAd = (url: string) => {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        Linking.openURL(url);
      }
    };

    return (
      <View style={styles.adsSection}>
        <View style={styles.adsSectionHeader}>
          <Text style={styles.sectionTitle}>
            {translations[language].promotions}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width * 0.95 + 16}
          decelerationRate="fast"
          style={styles.adsCarousel}
          contentContainerStyle={styles.adsCarouselContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {ADS.map((ad, idx) => (
            <TouchableOpacity
              key={ad.id}
              activeOpacity={0.93}
              onPress={() => openAd(ad.url)}
              style={[
                styles.adCard,
                { marginRight: idx === ADS.length - 1 ? 0 : 16 }
              ]}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
                style={styles.adOverlay}
              />
              <Image
                source={ad.image}
                style={styles.adImage}
                resizeMode="cover"
              />
              <View style={styles.adContent}>
                <Text style={styles.adTitle}>{translations[language].specialOffer}</Text>
                <Text style={styles.adSubtitle}>{translations[language].saveUpTo30}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Dots Indicator */}
        <View style={styles.carouselDots}>
          {ADS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.carouselDot,
                activeIndex === idx && styles.carouselDotActive
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {translations[language].dashboard}
          </Text>
          
          <TouchableOpacity 
            onPress={toggleLanguage} 
            style={styles.languageButton}
          >
            <Text style={styles.languageButtonText}>
              {translations[language].language}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hello Message Section */}
            <View style={styles.helloSection}>
              <Text style={styles.helloText}>
                {translations[language].hello} {userProfile?.firstName || translations[language].defaultUser} 👋
              </Text>
              <Text style={styles.helloSubtext}>
                {translations[language].welcomeBack}
              </Text>
            </View>

            {/* Ads Carousel Section */}
            <AdsCarousel />

            {/* Quick Access Buttons */}
            <QuickAccessButtons />

            {/* Add spacing between quick access and cars section */}
            <View style={{ height: 40 }} />

            {/* Cars Section */}
            <View style={styles.carsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {translations[language].myCars}
                </Text>
                {cars.length > 0 && (
                  <TouchableOpacity onPress={() => router.push('/(app)/my-cars')}>
                    <Text style={styles.seeAllText}>{translations[language].seeAll}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cars.length === 0 ? (
                <EmptyState />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>
        </Animated.View>

        

        {/* Sidebar */}
        <Sidebar />

        {/* Sidebar Overlay */}
        {sidebarVisible && (
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={closeSidebar}
            activeOpacity={1}
          />
        )}

        {/* Chatbot Button */}
        <ChatbotButton />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    backgroundColor: '#1E3A8A',
    ...Shadows.lg,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  languageButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.sm,
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32, // reduced from 100
  },
  helloSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  helloText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  helloSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  quickAccessSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg, // reduced from xl
    marginTop: 0, // remove extra space above
  },
  quickAccessGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginTop: Spacing.md,
},

gridItem: {
  width: '48%', // roughly half of the container width (with spacing)
  aspectRatio: 1, // makes it a square (equal width & height)
  marginBottom: Spacing.sm,
},

  quickActionsBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  quickActionsBadgeText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  quickAccessButton: {
    width: (width - (Spacing.lg * 2) - 12) / 2,
    marginHorizontal: 2,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  quickAccessTouchable: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  quickAccessGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 140,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  quickAccessBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.xl,
  },
  quickAccessContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
  quickAccessIconContainer: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  quickAccessIconText: {
    fontSize: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 34,
    opacity: 0.6,
    zIndex: -1,
  },
  quickAccessContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  quickAccessSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickAccessIndicatorContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.4,
    zIndex: -1,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    opacity: 0.3,
  },
  quickAccessButtonMinimal: {
    width: (width - (Spacing.lg * 2) - 12) / 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 2,
    elevation: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  quickAccessIconMinimal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  quickAccessIconTextMinimal: {
    fontSize: 18,
  },
  quickAccessTitleMinimal: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 0,
    letterSpacing: 0.2,
  },
  adsSection: {
    marginBottom: Spacing.lg,
    marginTop: 0,
  },
  adsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md, // reduced from lg
  },
  adsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  adsBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  adOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  adContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 2,
  },
  adTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  adSubtitle: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    opacity: 0.9,
  },
  trendBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  trendText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  carsSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontWeight: '600',
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: width * 0.8,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
  },
  carCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    width: width * 0.8,
    ...Shadows.md,
  },
  carCardEnhanced: {
    marginRight: Spacing.md,
    width: width * 0.85,
    maxWidth: 320,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary + '25',
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  carCardGradient: {
    flex: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  carCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.3)',
    flexWrap: 'wrap',
  },
  carLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(248, 250, 252, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Shadows.md,
  },
  carLogo: {
    width: 32,
    height: 32,
  },
  carBrandInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '60%',
  },
  carBrandTextEnhanced: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    flex: 1,
    flexWrap: 'wrap',
  },
  carModelEnhanced: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    flex: 1,
    flexWrap: 'wrap',
  },
  dateBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-end',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginTop: Spacing.xs,
  },
  dateBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  carDetailsEnhanced: {
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    ...Shadows.sm,
  },
  carDetailItemEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    minHeight: 32,
  },
  carDetailLabelEnhanced: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    maxWidth: '50%',
    flexWrap: 'wrap',
  },
  carDetailValueEnhanced: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  carFooterEnhanced: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerButton: {
    width: '100%',
    minHeight: 44,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Shadows.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '300',
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.8,
    height: '100%',
    zIndex: 1001, // Ensure sidebar is above overlay
    elevation: 20,
  },
  sidebarContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.textLight,
  },
  sidebarGradient: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  userStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  sidebarMenu: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  sidebarMenuContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  menuSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuSectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  menuItem: {
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: Colors.primary + '10',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: Spacing.lg,
    width: 24,
    color: Colors.textSecondary,
  },
  menuText: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  menuTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.textLight,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  logoutItem: {
    backgroundColor: Colors.error + '05',
    borderWidth: 1,
    borderColor: Colors.error + '20',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutIcon: {
    color: Colors.error,
  },
  logoutText: {
    color: Colors.error,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Overlay below sidebar
    elevation: 10,
  },
  adsCarousel: {
    paddingLeft: Spacing.lg,
  },
  adsCarouselContent: {
    alignItems: 'center',
    paddingRight: Spacing.lg,
  },
  adCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: width * 0.95,
    height: 200,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  carouselDotActive: {
    backgroundColor: Colors.primary,
    opacity: 1,
    width: 16,
  },
});