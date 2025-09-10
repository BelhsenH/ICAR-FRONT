import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface MechanicDetails {
  _id: string;
  nomGarage: string;
  adresse: string;
  geolocation: { lat: number; lng: number };
  typeService: string[];
  verified: boolean;
  phone?: string;
  email?: string;
  rating?: number;
  distance?: string;
}

export default function MechanicDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [mechanic, setMechanic] = useState<MechanicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceStep, setServiceStep] = useState(0);

  const fetchMechanicDetails = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to fetch mechanic details
      // const response = await fetch(`/api/mechanics/${id}`);
      // const mechanicData = await response.json();
      
      // Mock data for now
      const mockMechanic: MechanicDetails = {
        _id: id as string,
        nomGarage: 'Auto Service Center',
        adresse: '123 Main Street, City',
        geolocation: { lat: 36.8065, lng: 10.1815 },
        typeService: ['Basic Service', 'Full Service', 'AC Service'],
        verified: true,
        phone: '+216 12 345 678',
        email: 'contact@autoservice.tn',
        rating: 4.5,
        distance: '2.3 km'
      };
      
      setMechanic(mockMechanic);
    } catch (error) {
      console.error('Error fetching mechanic details:', error);
      Alert.alert(t.error || 'Error', 'Failed to fetch mechanic details');
    } finally {
      setLoading(false);
    }
  }, [id, t.error]);

  useEffect(() => {
    fetchMechanicDetails();
  }, [fetchMechanicDetails]);

  if (loading) {
    return (
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'تفاصيل الميكانيكي' : language === 'fr' ? 'Détails du mécanicien' : 'Mechanic Details'}
          </Text>
        </View>
        
        <View style={styles.content}>
          <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
        </View>
      </LinearGradient>
    );
  }

  if (!mechanic) {
    return (
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'تفاصيل الميكانيكي' : language === 'fr' ? 'Détails du mécanicien' : 'Mechanic Details'}
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.errorText}>
            {language === 'ar' ? 'لم يتم العثور على الميكانيكي' : language === 'fr' ? 'Mécanicien non trouvé' : 'Mechanic not found'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Theme.colors.primary, Theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تفاصيل الميكانيكي' : language === 'fr' ? 'Détails du mécanicien' : 'Mechanic Details'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mechanicCard}>
          <View style={styles.mechanicHeader}>
            <Text style={styles.garageName}>{mechanic.nomGarage}</Text>
            {mechanic.verified && (
              <Ionicons name="checkmark-circle" size={24} color={Theme.colors.success} />
            )}
          </View>
          
          <Text style={styles.address}>{mechanic.adresse}</Text>
          
          {mechanic.distance && (
            <Text style={styles.distance}>
              {language === 'ar' ? `المسافة: ${mechanic.distance}` : language === 'fr' ? `Distance: ${mechanic.distance}` : `Distance: ${mechanic.distance}`}
            </Text>
          )}

          {mechanic.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color={Theme.colors.warning} />
              <Text style={styles.rating}>{mechanic.rating.toFixed(1)}</Text>
            </View>
          )}


          <View style={styles.servicesContainer}>
            <Text style={styles.servicesTitle}>
              {language === 'ar' ? 'الخدمات:' : language === 'fr' ? 'Services:' : 'Services:'}
            </Text>
            {mechanic.typeService.length > 0 && (
              <View style={styles.serviceCardStepContainer}>
                <View style={styles.serviceCard}>
                  <Text style={styles.serviceCardText}>{mechanic.typeService[serviceStep]}</Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    style={[styles.stepperButton, serviceStep === 0 && styles.stepperButtonDisabled]}
                    onPress={() => setServiceStep((prev) => Math.max(prev - 1, 0))}
                    disabled={serviceStep === 0}
                  >
                    <Ionicons name="chevron-back" size={24} color={serviceStep === 0 ? Theme.colors.textLight : Theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperLabel}>
                    {`${serviceStep + 1} / ${mechanic.typeService.length}`}
                  </Text>
                  <TouchableOpacity
                    style={[styles.stepperButton, serviceStep === mechanic.typeService.length - 1 && styles.stepperButtonDisabled]}
                    onPress={() => setServiceStep((prev) => Math.min(prev + 1, mechanic.typeService.length - 1))}
                    disabled={serviceStep === mechanic.typeService.length - 1}
                  >
                    <Ionicons name="chevron-forward" size={24} color={serviceStep === mechanic.typeService.length - 1 ? Theme.colors.textLight : Theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.contactContainer}>
            {mechanic.phone && (
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="call" size={20} color={Theme.colors.primary} />
                <Text style={styles.contactText}>{mechanic.phone}</Text>
              </TouchableOpacity>
            )}
            
            {mechanic.email && (
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="mail" size={20} color={Theme.colors.primary} />
                <Text style={styles.contactText}>{mechanic.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 50,
  },
  mechanicCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    ...Theme.shadows.md,
  },
  mechanicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  garageName: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  address: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
  },
  distance: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginLeft: 5,
  },
  servicesContainer: {
    marginBottom: 20,
  },
  serviceCardStepContainer: {
    alignItems: 'center',
  },
  serviceCard: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  serviceCardText: {
    fontSize: 18,
    color: Theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  stepperButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.white,
    marginHorizontal: 8,
    // Removed Theme.shadows.xs as it does not exist
  },
  stepperButtonDisabled: {
    backgroundColor: Theme.colors.textLight,
  },
  stepperLabel: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  serviceItem: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 5,
  },
  contactContainer: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    paddingTop: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 10,
  },
});
