import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import { ModernButton } from '../../../components/modern/ModernButton';
import { serviceAPI } from '../../../scripts/service-script';

const { width } = Dimensions.get('window');

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface ServiceType {
  _id: string;
  type: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  price: number;
  duration: string;
  includes: string[];
  includesAr: string[];
  includesFr: string[];
  icon: string;
  serviceFrequency: string;
  irepairId: {
    _id: string;
    nomGarage: string;
    adresse: string;
    geolocation: { lat: number; lng: number };
    typeService: string[];
    verified: boolean;
  };
  distance?: string;
}

interface StepProps {
  current: number;
  total: number;
}

const serviceCategories = [
  {
    id: 'Basic Service',
    nameEn: 'Basic / Interim Service',
    nameFr: 'Service de base / intérimaire',
    nameAr: 'خدمة أساسية / مؤقتة',
    icon: 'construct-outline',
    frequency: 'every 6 months or 5,000–10,000 km',
    frequencyFr: 'tous les 6 mois ou 5 000 à 10 000 km',
    frequencyAr: 'كل 6 أشهر أو 5000-10000 كم',
  },
  {
    id: 'Full Service',
    nameEn: 'Full / Major Service',
    nameFr: 'Service complet / majeur',
    nameAr: 'خدمة كاملة / رئيسية',
    icon: 'build-outline',
    frequency: 'every 12 months or 15,000–20,000 km',
    frequencyFr: 'tous les 12 mois ou 15 000 à 20 000 km',
    frequencyAr: 'كل 12 شهر أو 15000-20000 كم',
  },
  {
    id: 'Manufacturer Service',
    nameEn: 'Manufacturer / Scheduled Service',
    nameFr: 'Service constructeur / programmé',
    nameAr: 'خدمة الصانع / المجدولة',
    icon: 'calendar-outline',
    frequency: 'follows manufacturer schedule',
    frequencyFr: 'suit le programme du constructeur',
    frequencyAr: 'يتبع جدول الصانع',
  },
  {
    id: 'Engine Diagnostic',
    nameEn: 'Engine Diagnostic Service',
    nameFr: 'Service de diagnostic moteur',
    nameAr: 'خدمة تشخيص المحرك',
    icon: 'analytics-outline',
    frequency: 'when check engine light is on',
    frequencyFr: 'quand le voyant moteur est allumé',
    frequencyAr: 'عندما يضيء ضوء فحص المحرك',
  },
  {
    id: 'Car Detailing',
    nameEn: 'Car Detailing / Valet Service',
    nameFr: 'Détaillage auto / Service de nettoyage',
    nameAr: 'تفصيل السيارة / خدمة التنظيف',
    icon: 'sparkles-outline',
    frequency: 'as needed',
    frequencyFr: 'selon les besoins',
    frequencyAr: 'حسب الحاجة',
  },
  {
    id: 'AC Service',
    nameEn: 'Air Conditioning Service',
    nameFr: 'Service de climatisation',
    nameAr: 'خدمة تكييف الهواء',
    icon: 'snow-outline',
    frequency: 'every 1–2 years',
    frequencyFr: 'tous les 1 à 2 ans',
    frequencyAr: 'كل 1-2 سنة',
  },
  {
    id: 'Transmission Service',
    nameEn: 'Transmission Service',
    nameFr: 'Service de transmission',
    nameAr: 'خدمة ناقل الحركة',
    icon: 'settings-outline',
    frequency: 'every 60,000–100,000 km',
    frequencyFr: 'tous les 60 000 à 100 000 km',
    frequencyAr: 'كل 60000-100000 كم',
  },
  {
    id: 'Brake Service',
    nameEn: 'Brake Service',
    nameFr: 'Service de freinage',
    nameAr: 'خدمة الفرامل',
    icon: 'disc-outline',
    frequency: 'when performance drops',
    frequencyFr: 'quand les performances baissent',
    frequencyAr: 'عندما تنخفض الأداء',
  },
  {
    id: 'Tire Service',
    nameEn: 'Tire and Alignment Service',
    nameFr: 'Service pneus et alignement',
    nameAr: 'خدمة الإطارات والمحاذاة',
    icon: 'ellipse-outline',
    frequency: 'every 10,000–15,000 km',
    frequencyFr: 'tous les 10 000 à 15 000 km',
    frequencyAr: 'كل 10000-15000 كم',
  },
  {
    id: 'Battery Service',
    nameEn: 'Battery Service',
    nameFr: 'Service de batterie',
    nameAr: 'خدمة البطارية',
    icon: 'battery-charging-outline',
    frequency: 'every 3–5 years',
    frequencyFr: 'tous les 3 à 5 ans',
    frequencyAr: 'كل 3-5 سنوات',
  },
];


const StepIndicator: React.FC<StepProps> = ({ current, total }) => (
  <View style={styles.stepIndicator}>
    {Array.from({ length: total }, (_, index) => (
      <View key={index} style={styles.stepContainer}>
        <View
          style={[
            styles.stepCircle,
            index < current ? styles.stepCompleted : styles.stepInactive,
            index === current - 1 ? styles.stepActive : {},
          ]}
        >
          <Text
            style={[
              styles.stepText,
              index < current || index === current - 1 ? styles.stepTextActive : {},
            ]}
          >
            {index + 1}
          </Text>
        </View>
        {index < total - 1 && (
          <View
            style={[
              styles.stepLine,
              index < current - 1 ? styles.stepLineCompleted : styles.stepLineInactive,
            ]}
          />
        )}
      </View>
    ))}
  </View>
);

export default function BookServiceScreen() {
  const { carId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [allServices, setAllServices] = useState<ServiceType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [paymentMethod] = useState<string>('cash');
  const [categoryStep, setCategoryStep] = useState(0);

  const totalSteps = 2; // Reduced from 3 steps to 2 (removed date selection)

  // Fetch all services on component mount
  const fetchAllServices = useCallback(async () => {
    try {
      setLoading(true);
      // Temporarily include inactive services for testing
      const response = await serviceAPI.getAllServices({ includeInactive: true });
      const servicesData = response.success ? response.data : response;
      setAllServices(servicesData || []);
      setServices(servicesData || []); // Initially show all services
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert(t.error || 'Error', 'Failed to fetch services');
      setAllServices([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  // Filter services by category
  const filterServicesByCategory = useCallback((category: string) => {
    if (!category || category === '') {
      setServices(allServices);
    } else {
      const filtered = allServices.filter(service => service.type === category);
      setServices(filtered);
    }
  }, [allServices]);

  useEffect(() => {
    fetchAllServices();
  }, [fetchAllServices]);

  // Update services when category filter changes
  useEffect(() => {
    filterServicesByCategory(selectedCategory);
  }, [selectedCategory, filterServicesByCategory]);

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookService = async () => {
    if (!selectedService) {
      Alert.alert(t.error || 'Error', 'Please select a service');
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        serviceId: selectedService._id,
        time: '09:00', // Default time, could be made configurable
        paymentMethod: paymentMethod as 'cash' | 'card',
        description: `Service booking for ${selectedService.name}`,
      };

      const response = await serviceAPI.createServiceRequest(carId as string, requestBody);

      Alert.alert(
        t.serviceBooked || 'Service Booked',
        t.serviceBookedDesc || 'Your service has been booked successfully',
        [
          {
            text: t.ok || 'OK',
            onPress: () => router.back(),
          },
          {
            text: language === 'ar' ? 'إضافة حالة السيارة' : language === 'fr' ? 'Ajouter l\'état du véhicule' : 'Add Car State',
            onPress: () => {
              // Navigate to maintenance car state form with the created request ID
              if (response && response._id) {
                router.replace(`/(app)/maintenance-car-state/${carId}/${response._id}` as any);
              } else {
                router.back();
              }
            },
            style: 'default'
          },
        ]
      );
    } catch (error) {
      console.error('Error booking service:', error);
      Alert.alert(t.error || 'Error', 'Failed to book service');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderServiceSelection();
      case 2:
        return renderConfirmation();
      default:
        return null;
    }
  };

  const renderServiceSelection = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>
        {language === 'ar' ? 'اختر الخدمة والميكانيكي' : language === 'fr' ? 'Choisir le service et le mécanicien' : 'Choose Service & Mechanic'}
      </Text>
      
      {/* Category Filter - Card Stepper */}
      <View style={styles.categoryFilterContainer}>
        <Text style={styles.filterLabel}>
          {language === 'ar' ? 'تصفية حسب النوع:' : language === 'fr' ? 'Filtrer par type:' : 'Filter by type:'}
        </Text>
        
        <View style={styles.categoryGridContainer}>
          {/* Enhanced 3x3 Grid Layout */}
          <View style={styles.categoryGrid}>
            {/* All categories option - always first */}
            <TouchableOpacity
              style={[
                styles.categoryGridCard,
                selectedCategory === '' && styles.selectedCategoryCard,
              ]}
              onPress={() => {
                setSelectedCategory('');
                filterServicesByCategory('');
              }}
            >
              <LinearGradient
                colors={selectedCategory === '' ? [Theme.colors.primary, Theme.colors.secondary] : [Theme.colors.white, Theme.colors.white]}
                style={styles.categoryCardGradient}
              >
                <View style={styles.categoryCardContent}>
                  <View style={[
                    styles.categoryIconContainer,
                    selectedCategory === '' && styles.selectedIconContainer
                  ]}>
                    <Ionicons 
                      name="grid-outline" 
                      size={24} 
                      color={selectedCategory === '' ? Theme.colors.white : Theme.colors.primary} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.categoryCardName,
                      selectedCategory === '' && styles.selectedCategoryText,
                    ]}
                    numberOfLines={2}
                  >
                    {language === 'ar' ? 'جميع الخدمات' : language === 'fr' ? 'Tous les services' : 'All Services'}
                  </Text>
                  <Text 
                    style={[
                      styles.categoryCardFrequency,
                      selectedCategory === '' && styles.selectedCategoryText,
                    ]}
                    numberOfLines={2}
                  >
                    {language === 'ar' ? 'عرض الكل' : language === 'fr' ? 'Voir tout' : 'View All'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Display 8 categories starting from categoryStep (3x3 grid minus the "All" card) */}
            {serviceCategories.slice(categoryStep, categoryStep + 8).map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryGridCard,
                  selectedCategory === category.id && styles.selectedCategoryCard,
                ]}
                onPress={() => {
                  if (selectedCategory === category.id) {
                    setSelectedCategory('');
                    filterServicesByCategory('');
                  } else {
                    setSelectedCategory(category.id);
                    filterServicesByCategory(category.id);
                  }
                }}
              >
                <LinearGradient
                  colors={selectedCategory === category.id 
                    ? [Theme.colors.primary, Theme.colors.secondary] 
                    : [Theme.colors.white, Theme.colors.white]
                  }
                  style={styles.categoryCardGradient}
                >
                  <View style={styles.categoryCardContent}>
                    <View style={[
                      styles.categoryIconContainer,
                      selectedCategory === category.id && styles.selectedIconContainer
                    ]}>
                      <Ionicons 
                        name={category.icon as any} 
                        size={24} 
                        color={selectedCategory === category.id ? Theme.colors.white : Theme.colors.primary} 
                      />
                    </View>
                    <Text 
                      style={[
                        styles.categoryCardName,
                        selectedCategory === category.id && styles.selectedCategoryText,
                      ]}
                      numberOfLines={2}
                    >
                      {language === 'ar' 
                        ? category.nameAr 
                        : language === 'fr' 
                        ? category.nameFr 
                        : category.nameEn
                      }
                    </Text>
                    <Text 
                      style={[
                        styles.categoryCardFrequency,
                        selectedCategory === category.id && styles.selectedCategoryText,
                      ]}
                      numberOfLines={2}
                    >
                      {language === 'ar' 
                        ? category.frequencyAr 
                        : language === 'fr' 
                        ? category.frequencyFr 
                        : category.frequency
                      }
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}

            {/* Fill empty slots if there are fewer than 8 categories */}
            {Array.from({ length: Math.max(0, 8 - serviceCategories.slice(categoryStep, categoryStep + 8).length) }, (_, index) => (
              <View key={`empty-${index}`} style={[styles.categoryGridCard, styles.emptyCard]}>
                <View style={styles.categoryCardContent}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons 
                      name="ellipsis-horizontal" 
                      size={24} 
                      color={Theme.colors.textLight} 
                    />
                  </View>
                  <Text style={styles.emptyCategoryName}>
                    {language === 'ar' ? 'فارغ' : language === 'fr' ? 'Vide' : 'Empty'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Enhanced Stepper Controls - only show if there are more than 8 categories */}
          {serviceCategories.length > 8 && (
            <View style={styles.categoryStepperControls}>
              <TouchableOpacity
                style={[styles.categoryStepperButton, categoryStep === 0 && styles.categoryStepperButtonDisabled]}
                onPress={() => setCategoryStep((prev) => Math.max(prev - 8, 0))}
                disabled={categoryStep === 0}
              >
                <Ionicons name="chevron-back" size={20} color={categoryStep === 0 ? Theme.colors.textLight : Theme.colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.stepperIndicator}>
                <Text style={styles.categoryStepperLabel}>
                  {`${Math.floor(categoryStep / 8) + 1} / ${Math.ceil(serviceCategories.length / 8)}`}
                </Text>
                <View style={styles.stepperDots}>
                  {Array.from({ length: Math.ceil(serviceCategories.length / 8) }, (_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.stepperDot,
                        index === Math.floor(categoryStep / 8) && styles.activeStepperDot
                      ]}
                    />
                  ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.categoryStepperButton, categoryStep + 8 >= serviceCategories.length && styles.categoryStepperButtonDisabled]}
                onPress={() => setCategoryStep((prev) => Math.min(prev + 8, serviceCategories.length - 1))}
                disabled={categoryStep + 8 >= serviceCategories.length}
              >
                <Ionicons name="chevron-forward" size={20} color={categoryStep + 8 >= serviceCategories.length ? Theme.colors.textLight : Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
      ) : services.length === 0 ? (
        <View style={styles.noServicesContainer}>
          <Ionicons name="search-outline" size={48} color={Theme.colors.textSecondary} />
          <Text style={styles.noServicesText}>
            {language === 'ar' ? 'لا توجد خدمات متاحة' : language === 'fr' ? 'Aucun service disponible' : 'No services available'}
          </Text>
          <Text style={styles.noServicesSubtext}>
            {selectedCategory 
              ? (language === 'ar' ? 'جرب فئة أخرى' : language === 'fr' ? 'Essayez une autre catégorie' : 'Try another category')
              : (language === 'ar' ? 'لا توجد خدمات مسجلة' : language === 'fr' ? 'Aucun service enregistré' : 'No services registered')
            }
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.servicesScrollContainer}
          contentContainerStyle={styles.servicesContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {services.map((service) => (
            <TouchableOpacity
              key={service._id}
              style={[
                styles.serviceCard,
                selectedService?._id === service._id && styles.selectedCard,
              ]}
              onPress={() => setSelectedService(service)}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.mechanicInfo}>
                  <View style={styles.mechanicTitleRow}>
                    <Text style={styles.mechanicName}>{service.irepairId.nomGarage}</Text>
                    {service.irepairId.verified && (
                      <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                    )}
                  </View>
                  <Text style={styles.mechanicAddress}>{service.irepairId.adresse}</Text>
                  {service.distance && (
                    <Text style={styles.distanceText}>📍 {service.distance}</Text>
                  )}
                </View>
                <View style={styles.servicePriceContainer}>
                  <Text style={styles.servicePrice}>{service.price} TND</Text>
                </View>
              </View>
              <View style={styles.serviceDetails}>
                <View style={styles.serviceTypeContainer}>
                  <Text style={styles.serviceType}>{service.type}</Text>
                </View>
                <Text style={styles.serviceName}>
                  {language === 'ar' ? service.nameAr : language === 'fr' ? service.nameFr : service.name}
                </Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {language === 'ar' ? service.descriptionAr : language === 'fr' ? service.descriptionFr : service.description}
                </Text>
                <View style={styles.serviceIncludes}>
                  
                  <View style={styles.includesList}>
                    {(language === 'ar' ? service.includesAr : language === 'fr' ? service.includesFr : service.includes)
                      ?.slice(0, 3)
                      .map((item, index) => (
                        <Text key={index} style={styles.includeItem}>• {item}</Text>
                      ))}
                  </View>
                </View>
                <View style={styles.serviceMeta}>
                  <Text style={styles.serviceDuration}>⏱️ {service.duration}</Text>
                  <Text style={styles.serviceFrequency}>📅 {service.serviceFrequency}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );

  const renderConfirmation = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>
        {language === 'ar' ? 'تأكيد الحجز' : language === 'fr' ? 'Confirmer la réservation' : 'Confirm Booking'}
      </Text>
      
      {selectedService && (
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>
            {language === 'ar' ? 'تفاصيل الحجز' : language === 'fr' ? 'Détails de la réservation' : 'Booking Details'}
          </Text>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>
              {language === 'ar' ? 'الميكانيكي:' : language === 'fr' ? 'Mécanicien:' : 'Mechanic:'}
            </Text>
            <Text style={styles.confirmationValue}>{selectedService.irepairId.nomGarage}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>
              {language === 'ar' ? 'الخدمة:' : language === 'fr' ? 'Service:' : 'Service:'}
            </Text>
            <Text style={styles.confirmationValue}>
              {language === 'ar' ? selectedService.nameAr : language === 'fr' ? selectedService.nameFr : selectedService.name}
            </Text>
          </View>
          
          <View style={[styles.confirmationRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>
              {language === 'ar' ? 'المجموع:' : language === 'fr' ? 'Total:' : 'Total:'}
            </Text>
            <Text style={styles.totalValue}>{selectedService.price} TND</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.container}
      >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => currentStep === 1 ? router.back() : handlePrevStep()}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'حجز خدمة' : language === 'fr' ? 'Réserver un service' : 'Book Service'}
        </Text>
      </View>

      <View style={styles.content}>
        <StepIndicator current={currentStep} total={totalSteps} />
        {renderStepContent()}
        
        <View style={styles.buttonContainer}>
          {currentStep < totalSteps ? (
            <ModernButton
              title={language === 'ar' ? 'التالي' : language === 'fr' ? 'Suivant' : 'Next'}
              onPress={handleNextStep}
              disabled={!canProceed() || loading}
              style={styles.nextButton}
            />
          ) : (
            <ModernButton
              title={loading ? 
                (language === 'ar' ? 'جاري الحجز...' : language === 'fr' ? 'Réservation...' : 'Booking...') :
                (language === 'ar' ? 'تأكيد الحجز' : language === 'fr' ? 'Confirmer' : 'Confirm Booking')
              }
              onPress={handleBookService}
              disabled={!canProceed() || loading}
              style={styles.bookButton}
            />
          )}
        </View>
      </View>
    </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
  },
  stepActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  stepCompleted: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  stepInactive: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.textLight,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  stepTextActive: {
    color: Theme.colors.white,
  },
  stepLine: {
    width: 30,
    height: 2,
    marginHorizontal: 5,
  },
  stepLineCompleted: {
    backgroundColor: Theme.colors.success,
  },
  stepLineInactive: {
    backgroundColor: Theme.colors.textLight,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.md,
  },
  selectedCard: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryIcon: {
    marginBottom: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryFrequency: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedText: {
    color: Theme.colors.white,
  },
  loader: {
    marginTop: 50,
  },
  noServicesText: {
    textAlign: 'center',
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 50,
  },
  serviceCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  mechanicAddress: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginTop: 4,
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    paddingTop: 15,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 12,
  },
  serviceIncludes: {
    marginBottom: 15,
  },
  includesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  includeItem: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: 0.5,
  },
  selectedDateBanner: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    ...Theme.shadows.sm,
    elevation: 3,
  },
  selectedDateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  selectedDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  monthHeaderContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  monthHeaderGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  selectedDayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekendDay: {
    backgroundColor: Theme.colors.primary + '08',
    borderColor: Theme.colors.primary + '20',
  },
  weekendDayText: {
    color: Theme.colors.primary + 'CC',
  },
  weekendDayName: {
    color: Theme.colors.primary + '99',
  },
  // Enhanced Calendar styles
  calendarScrollView: {
    maxHeight: 600,
    flex: 1,
  },
  monthContainer: {
    marginBottom: 30,
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 5,
    ...Theme.shadows.lg,
    elevation: 8,
  },
  monthHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary + '30',
    letterSpacing: 0.5,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    paddingVertical: 8,
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (width - 80) / 7 - 8,
    minHeight: 60,
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.textLight + '60',
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Theme.shadows.sm,
    elevation: 2,
  },
  selectedCalendarDay: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    ...Theme.shadows.md,
    elevation: 6,
  },
  otherMonthDay: {
    backgroundColor: Theme.colors.textLight + '15',
    borderColor: Theme.colors.textLight + '30',
    opacity: 0.6,
  },
  calendarDayText: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  selectedCalendarDayText: {
    color: Theme.colors.white,
    fontWeight: '800',
    fontSize: 19,
  },
  otherMonthDayText: {
    color: Theme.colors.textSecondary + '80',
    fontWeight: '500',
  },
  calendarDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  selectedCalendarDayName: {
    color: Theme.colors.white + 'F0',
    fontWeight: '700',
    fontSize: 11,
  },
  otherMonthDayName: {
    color: Theme.colors.textSecondary + '60',
    fontWeight: '500',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 15,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.sm,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
    marginTop: 8,
  },
  confirmationCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    ...Theme.shadows.md,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.textLight,
  },
  confirmationLabel: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: Theme.colors.primary,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    paddingTop: 20,
  },
  nextButton: {
    backgroundColor: Theme.colors.primary,
  },
  bookButton: {
    backgroundColor: Theme.colors.success,
  },
  // Category filter styles
  categoryFilterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  categoryGridContainer: {
    gap: 15,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryGridCard: {
    width: (width - 64) / 3, // Exactly 1/3 of available width
    height: 110, // Fixed height for consistent rows
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8, // Space between rows
    ...Theme.shadows.md,
    elevation: 4,
  },
  categoryCardGradient: {
    flex: 1,
    borderRadius: 16,
  },
  categoryCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryCardName: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 12,
  },
  categoryCardFrequency: {
    fontSize: 8,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 9,
  },
  selectedCategoryCard: {
    transform: [{ scale: 1.05 }],
  },
  selectedCategoryText: {
    color: Theme.colors.white,
  },
  previewCard: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  previewCategoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 8,
    color: Theme.colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyCard: {
    opacity: 0.3,
  },
  emptyCategoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  categoryStepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: Theme.colors.white,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Theme.shadows.sm,
  },
  categoryStepperButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
  },
  categoryStepperButtonDisabled: {
    backgroundColor: Theme.colors.textLight,
    borderColor: Theme.colors.textLight,
  },
  stepperIndicator: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  categoryStepperLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepperDots: {
    flexDirection: 'row',
    gap: 4,
  },
  stepperDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.textLight,
  },
  activeStepperDot: {
    backgroundColor: Theme.colors.primary,
    transform: [{ scale: 1.2 }],
  },
  categoryStepContainer: {
    gap: 15,
  },
  categoryStepperContainer: {
    alignItems: 'center',
  },
  categoryFilterList: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 5,
  },
  categoryFilterChip: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
    ...Theme.shadows.sm,
  },
  selectedChip: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.text,
  },
  selectedChipText: {
    color: Theme.colors.white,
  },
  // No services styles
  noServicesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noServicesSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Services container
  servicesScrollContainer: {
    flex: 1,
    maxHeight: 400,
  },
  servicesContainer: {
    gap: 15,
    paddingBottom: 20,
  },
  // Updated service card styles
  mechanicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  serviceTypeContainer: {
    marginBottom: 8,
  },
  serviceType: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  includesList: {
    marginTop: 4,
  },
  serviceFrequency: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
});
