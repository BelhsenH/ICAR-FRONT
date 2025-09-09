import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { getUserCars } from '../../scripts/car-script';
import { ModernButton } from '../../components/modern/ModernButton';
import { authService } from '../../scripts/auth-script'; // Import authService
import { useLanguage } from '../../contexts/LanguageContext'; // Add this import

interface Car {
  id: string;
  marque: string;
  modele: string;
  vin: string;
  immatriculation: string;
  fuelType: string;
  kilometrage: string;
  datePremiereMiseEnCirculation: string;
}

export default function MyCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const router = useRouter();
  const { language, translations } = useLanguage(); // Use the language context

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setUserType(profileResponse.data.type);
        }

        // Fetch cars
        const response = await getUserCars();
        if (response.success && response.data) {
          const mappedCars = response.data.map(car => ({
            id: car._id,
            marque: car.marque,
            modele: car.modele,
            vin: car.vin,
            immatriculation: car.numeroImmatriculation,
            fuelType: car.fuelType,
            kilometrage: car.kilometrage?.toString() || '0',
            datePremiereMiseEnCirculation: new Date(car.datePremiereMiseEnCirculation).toLocaleDateString('fr-FR'),
          }));
          setCars(mappedCars);
        } else {
          console.error('Failed to fetch cars:', response.message);
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCarPress = (id: string) => {
    router.push(`/(app)/car-profile/${id}`);
  };

  const handleAddCar = () => {
    router.push('/(app)/add-car');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.header}>{translations[language].myCars}</Text>
      <ModernButton
        title={translations[language].addNewCar}
        onPress={handleAddCar}
        gradient={true}
        size="large"
        style={styles.addButton}
        disabled={userType === 'personal' && cars.length >= 2}
      />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : cars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>{translations[language].noCarsAdded}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {cars.map(car => (
            <TouchableOpacity
              key={car.id}
              style={styles.card}
              onPress={() => handleCarPress(car.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardBackground} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.carIconContainer}>
                    <Ionicons name="car-sport" size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.carInfo}>
                    <Text style={styles.carTitle}>{car.marque} {car.modele}</Text>
                    <View style={styles.plateContainer}>
                      <Text style={styles.carPlate}>{car.immatriculation}</Text>
                    </View>
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={styles.statusDot} />
                  </View>
                </View>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="card-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>VIN</Text>
                      <Text style={styles.detailValue}>{car.vin.slice(-8)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>{translations[language].mileage}</Text>
                      <Text style={styles.detailValue}>{car.kilometrage} km</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="water-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>{translations[language].fuelType}</Text>
                      <Text style={styles.detailValue}>{car.fuelType}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailLabel}>Registration</Text>
                      <Text style={styles.detailValue}>{car.datePremiereMiseEnCirculation}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.actionHint}>
                    <Text style={styles.actionHintText}>Tap to view details</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: Spacing.lg,
    zIndex: 10,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 6,
    ...Shadows.sm,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.lg,
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    opacity: 0.95,
  },
  cardContent: {
    padding: Spacing.lg,
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  carIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  carInfo: {
    flex: 1,
  },
  carTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  plateContainer: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  carPlate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  cardDetails: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    ...Shadows.sm,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.textLight + '30',
    paddingTop: Spacing.md,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});