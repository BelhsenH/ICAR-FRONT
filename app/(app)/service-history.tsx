import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Linking, Alert } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { serviceAPI } from '../../scripts/service-script';

interface ServiceHistoryRecord {
  _id: string;
  irepairId?: string;
  carDetails?: {
    _id: string;
    marque: string;
    modele: string;
    numeroImmatriculation: string;
    vin: string;
    fuelType: string;
  };
  serviceDetails?: {
    _id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    type: string;
    price: number;
    duration: string;
    description: string;
  };
  irepairDetails?: {
    _id: string;
    nomGarage: string;
    adresse: string;
    phoneNumber: string;
    email: string;
    rating: number;
    geolocation: {
      lat: number;
      lng: number;
    };
  };
  status: string;
  date: string;
  time: string;
  estimatedCost?: number;
  actualCost?: number;
  description?: string;
  notes?: string;
  createdAt: string;
}

export default function ServiceHistory() {
  const router = useRouter();
  const { language, translations } = useLanguage();
  const [maintenanceRecords, setMaintenanceRecords] = useState<ServiceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServiceHistory();
  }, []);

  const loadServiceHistory = async () => {
    try {
      setLoading(true);
      const response = await serviceAPI.getMyServiceHistory();
      
      if (response.success && response.data) {
        setMaintenanceRecords(response.data);
      } else {
        console.error('Failed to fetch service history:', response.message);
      }
    } catch (error) {
      console.error('Error loading service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServiceHistory();
    setRefreshing(false);
  };

  const getServiceName = (record: ServiceHistoryRecord) => {
    if (!record.serviceDetails) return translations[language].unknownService || 'Unknown Service';
    
    switch (language) {
      case 'ar':
        return record.serviceDetails.nameAr || record.serviceDetails.name;
      case 'fr':
        return record.serviceDetails.nameFr || record.serviceDetails.name;
      default:
        return record.serviceDetails.name;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'accepted':
        return '#2196F3';
      case 'pending':
        return '#FFC107';
      case 'cancelled':
        return '#F44336';
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      pending: translations[language].pending || 'Pending',
      accepted: translations[language].accepted || 'Accepted',
      in_progress: translations[language].inProgress || 'In Progress',
      completed: translations[language].completed || 'Completed',
      cancelled: translations[language].cancelled || 'Cancelled',
    };
    return statusTranslations[status] || status;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleCallGarage = async (phoneNumber: string, garageName: string) => {
    if (!phoneNumber) {
      Alert.alert(
        translations[language].error || 'Error',
        translations[language].noPhoneNumber || 'No phone number available for this garage.'
      );
      return;
    }

    const phoneUrl = `tel:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          translations[language].error || 'Error',
          translations[language].cannotMakeCall || 'Cannot make phone calls on this device.'
        );
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert(
        translations[language].error || 'Error',
        translations[language].callError || 'An error occurred while trying to make the call.'
      );
    }
  };

  const MaintenanceCard = ({ record }: { record: ServiceHistoryRecord }) => (
    <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
      <LinearGradient
        colors={[Colors.surface, `${Colors.surface}F0`]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="build-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.carTitle}>
              {record.carDetails ? `${record.carDetails.marque} ${record.carDetails.modele}` : translations[language].unknownCar || 'Unknown Car'}
            </Text>
            <Text style={styles.serviceType}>{getServiceName(record)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
              <Text style={styles.statusText}>{getStatusText(record.status)}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{formatDate(record.date)}</Text>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.garageRow}>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{translations[language].garage || 'Garage'}: </Text>
              {record.irepairDetails?.nomGarage || translations[language].unknownGarage || 'Unknown Garage'}
            </Text>
            {record.irepairDetails?.phoneNumber && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallGarage(record.irepairDetails!.phoneNumber, record.irepairDetails!.nomGarage)}
              >
                <Ionicons name="call" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>{translations[language].cost || 'Cost'}: </Text>
            {record.actualCost ? `${record.actualCost.toFixed(2)} TND` : record.estimatedCost ? `${record.estimatedCost.toFixed(2)} TND` : translations[language].pending || 'Pending'}
          </Text>
          {record.carDetails && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{translations[language].registrationNumber || 'Registration'}: </Text>
              {record.carDetails.numeroImmatriculation}
            </Text>
          )}
          {(record.notes || record.description) && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{translations[language].notes || 'Notes'}: </Text>
              {record.notes || record.description}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const EmptyState = () => (
    <Animatable.View animation="fadeIn" duration={800} style={styles.emptyState}>
      <LinearGradient
        colors={[`${Colors.primary}20`, `${Colors.background}80`]}
        style={styles.emptyIconContainer}
      >
        <Text style={styles.emptyIcon}>🔧</Text>
      </LinearGradient>
      <Text style={styles.emptyTitle}>{translations[language].noServiceHistory || translations[language].noServices}</Text>
      <Text style={styles.emptyDescription}>{translations[language].serviceHistoryDesc || translations[language].noServicesDescription}</Text>
    </Animatable.View>
  );

  return (
    <PaperProvider theme={LightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, `${Colors.primary}CC`]}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations[language].serviceHistory}</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Animatable.Text animation="pulse" easing="ease-out" iterationCount="infinite" style={styles.emptyTitle}>
                {translations[language].loading || 'Loading...'}
              </Animatable.Text>
            </View>
          ) : maintenanceRecords.length === 0 ? (
            <EmptyState />
          ) : (
            maintenanceRecords.map((record, index) => (
              <MaintenanceCard key={record._id} record={record} />
            ))
          )}
        </ScrollView>
      </View>
    </PaperProvider>
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
    paddingTop: Spacing.xl + 40,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.white}20`,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  headerContent: {
    flex: 1,
  },
  carTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  serviceType: {
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  cardDetails: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${Colors.textSecondary}20`,
  },
  garageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  detailText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  detailLabel: {
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
});