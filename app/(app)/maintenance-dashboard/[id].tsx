import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../config';

interface MaintenanceRequest {
  _id: string;
  date: string;
  status: string;
  serviceId: {
    name: string;
    type: string;
    price: number;
  };
}

interface MaintenanceCarState {
  _id: string;
  maintenanceRequestId: string;
  createdAt: string;
  currentMileage?: number;
  engineOil?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    oilType?: string;
  };
  brakeFluid?: {
    lastChangeDate?: string;
    isOverdue?: boolean;
  };
  tirePressure?: {
    frontPSI?: number;
    rearPSI?: number;
    lastCheckDate?: string;
  };
  maintenanceRequest?: MaintenanceRequest;
}

interface Car {
  _id: string;
  marque: string;
  modele: string;
  numeroImmatriculation: string;
  kilometrage: number;
}

interface DashboardData {
  car: Car;
  maintenanceHistory: MaintenanceCarState[];
  summary: {
    totalMaintenanceRecords: number;
    lastMaintenanceDate?: string;
    currentMileage?: number;
  };
}

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

export default function MaintenanceDashboard() {
  const { id: carId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const vehicleServiceUrl = `${config.apiUrl}/api/vehicle`;
      
      const response = await fetch(
        `${vehicleServiceUrl}/${carId}/maintenance-dashboard`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        Alert.alert(t.error || 'Error', data.message || 'Failed to fetch maintenance data');
      }
    } catch (error) {
      console.error('Error fetching maintenance dashboard:', error);
      Alert.alert(t.error || 'Error', 'Failed to fetch maintenance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [carId, t.error]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Theme.colors.success;
      case 'in_progress': return Theme.colors.warning;
      case 'pending': return Theme.colors.info;
      case 'cancelled': return Theme.colors.error;
      default: return Theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      pending: language === 'ar' ? 'في الانتظار' : language === 'fr' ? 'En attente' : 'Pending',
      accepted: language === 'ar' ? 'مقبول' : language === 'fr' ? 'Accepté' : 'Accepted',
      in_progress: language === 'ar' ? 'قيد التنفيذ' : language === 'fr' ? 'En cours' : 'In Progress',
      completed: language === 'ar' ? 'مكتمل' : language === 'fr' ? 'Terminé' : 'Completed',
      cancelled: language === 'ar' ? 'ملغي' : language === 'fr' ? 'Annulé' : 'Cancelled'
    };
    return statusTexts[status] || status;
  };

  const renderMaintenanceStateCard = (state: MaintenanceCarState) => (
    <View key={state._id} style={styles.maintenanceCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.maintenanceTitle}>
            {state.maintenanceRequest?.serviceId.name || 
              (language === 'ar' ? 'خدمة صيانة' : language === 'fr' ? 'Service de maintenance' : 'Maintenance Service')}
          </Text>
          <Text style={styles.maintenanceDate}>
            {formatDate(state.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(state.maintenanceRequest?.status || 'pending') }]}>
          <Text style={styles.statusText}>
            {getStatusText(state.maintenanceRequest?.status || 'pending')}
          </Text>
        </View>
      </View>

      {/* Current mileage */}
      {state.currentMileage && (
        <View style={styles.detailRow}>
          <Ionicons name="speedometer-outline" size={16} color={Theme.colors.primary} />
          <Text style={styles.detailLabel}>
            {language === 'ar' ? 'المسافة المقطوعة' : language === 'fr' ? 'Kilométrage' : 'Mileage'}:
          </Text>
          <Text style={styles.detailValue}>{state.currentMileage.toLocaleString()} km</Text>
        </View>
      )}

      {/* Engine oil info */}
      {state.engineOil && (state.engineOil.lastChangeKm || state.engineOil.oilType) && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'زيت المحرك' : language === 'fr' ? 'Huile moteur' : 'Engine Oil'}
          </Text>
          {state.engineOil.lastChangeKm && (
            <View style={styles.detailRow}>
              <Ionicons name="car-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'آخر تغيير' : language === 'fr' ? 'Dernier changement' : 'Last change'}:
              </Text>
              <Text style={styles.detailValue}>{state.engineOil.lastChangeKm} km</Text>
            </View>
          )}
          {state.engineOil.oilType && (
            <View style={styles.detailRow}>
              <Ionicons name="water-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'نوع الزيت' : language === 'fr' ? 'Type d\'huile' : 'Oil type'}:
              </Text>
              <Text style={styles.detailValue}>{state.engineOil.oilType}</Text>
            </View>
          )}
        </View>
      )}

      {/* Brake fluid info */}
      {state.brakeFluid && state.brakeFluid.lastChangeDate && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'سائل الفرامل' : language === 'fr' ? 'Liquide de frein' : 'Brake Fluid'}
          </Text>
          <View style={styles.detailRow}>
            <Ionicons name="warning-outline" size={16} color={state.brakeFluid.isOverdue ? Theme.colors.error : Theme.colors.primary} />
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'آخر تغيير' : language === 'fr' ? 'Dernier changement' : 'Last change'}:
            </Text>
            <Text style={[styles.detailValue, state.brakeFluid.isOverdue && { color: Theme.colors.error }]}>
              {formatDate(state.brakeFluid.lastChangeDate)}
              {state.brakeFluid.isOverdue ? ' ⚠️' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* Tire pressure info */}
      {state.tirePressure && (state.tirePressure.frontPSI || state.tirePressure.rearPSI) && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {language === 'ar' ? 'ضغط الإطارات' : language === 'fr' ? 'Pression des pneus' : 'Tire Pressure'}
          </Text>
          {state.tirePressure.frontPSI && (
            <View style={styles.detailRow}>
              <Ionicons name="ellipse-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'أمامي' : language === 'fr' ? 'Avant' : 'Front'}:
              </Text>
              <Text style={styles.detailValue}>{state.tirePressure.frontPSI} PSI</Text>
            </View>
          )}
          {state.tirePressure.rearPSI && (
            <View style={styles.detailRow}>
              <Ionicons name="ellipse-outline" size={16} color={Theme.colors.primary} />
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'خلفي' : language === 'fr' ? 'Arrière' : 'Rear'}:
              </Text>
              <Text style={styles.detailValue}>{state.tirePressure.rearPSI} PSI</Text>
            </View>
          )}
        </View>
      )}

      {/* Service cost */}
      {state.maintenanceRequest?.serviceId.price && (
        <View style={styles.costSection}>
          <Text style={styles.costLabel}>
            {language === 'ar' ? 'التكلفة' : language === 'fr' ? 'Coût' : 'Cost'}:
          </Text>
          <Text style={styles.costValue}>
            {state.maintenanceRequest.serviceId.price.toFixed(2)} TND
          </Text>
        </View>
      )}

      {/* View/Edit car state button */}
      <TouchableOpacity 
        style={styles.carStateButton}
        onPress={() => router.push(`/(app)/maintenance-car-state/${carId}/${state.maintenanceRequestId}` as any)}
      >
        <Ionicons name="settings-outline" size={20} color={Theme.colors.primary} />
        <Text style={styles.carStateButtonText}>
          {language === 'ar' ? 'عرض/تحديث حالة السيارة' : language === 'fr' ? 'Voir/Modifier l\'état' : 'View/Edit Car State'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.secondary]}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'ar' ? 'لوحة صيانة السيارة' : language === 'fr' ? 'Tableau de bord maintenance' : 'Maintenance Dashboard'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.content}>
            <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
            <Text style={styles.loadingText}>
              {language === 'ar' ? 'جارٍ التحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.secondary]}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'ar' ? 'لوحة صيانة السيارة' : language === 'fr' ? 'Tableau de bord maintenance' : 'Maintenance Dashboard'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.content}>
            <Text style={styles.noDataText}>
              {language === 'ar' ? 'لا توجد بيانات صيانة متاحة' : language === 'fr' ? 'Aucune donnée de maintenance disponible' : 'No maintenance data available'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[Theme.colors.primary, Theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'لوحة صيانة السيارة' : language === 'fr' ? 'Tableau de bord maintenance' : 'Maintenance Dashboard'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Car info card */}
          <View style={styles.carInfoCard}>
            <View style={styles.carInfoHeader}>
              <Ionicons name="car" size={32} color={Theme.colors.primary} />
              <View style={styles.carInfoText}>
                <Text style={styles.carName}>
                  {dashboardData.car.marque} {dashboardData.car.modele}
                </Text>
                <Text style={styles.carPlate}>
                  {dashboardData.car.numeroImmatriculation}
                </Text>
              </View>
            </View>
            
            <View style={styles.carStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {dashboardData.summary.totalMaintenanceRecords}
                </Text>
                <Text style={styles.statLabel}>
                  {language === 'ar' ? 'سجلات الصيانة' : language === 'fr' ? 'Enregistrements' : 'Records'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {(dashboardData.summary.currentMileage || dashboardData.car.kilometrage || 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>
                  {language === 'ar' ? 'كم' : language === 'fr' ? 'km' : 'km'}
                </Text>
              </View>
            </View>
            
            {/* Add new maintenance button */}
            <TouchableOpacity 
              style={styles.addMaintenanceButton}
              onPress={() => router.push(`/(app)/book-service-v2/${carId}`)}
            >
              <Ionicons name="add-circle-outline" size={24} color={Theme.colors.white} />
              <Text style={styles.addMaintenanceText}>
                {language === 'ar' ? 'حجز خدمة جديدة' : language === 'fr' ? 'Réserver un nouveau service' : 'Book New Service'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Maintenance history */}
          <View style={styles.historySection}>
            <Text style={styles.sectionHeaderTitle}>
              {language === 'ar' ? 'تاريخ الصيانة' : language === 'fr' ? 'Historique de maintenance' : 'Maintenance History'}
            </Text>
            
            {dashboardData.maintenanceHistory.length === 0 ? (
              <View style={styles.noHistoryContainer}>
                <Ionicons name="build-outline" size={48} color={Theme.colors.textSecondary} />
                <Text style={styles.noHistoryText}>
                  {language === 'ar' ? 'لا يوجد تاريخ صيانة بعد' : language === 'fr' ? 'Aucun historique de maintenance' : 'No maintenance history yet'}
                </Text>
                <Text style={styles.noHistorySubtext}>
                  {language === 'ar' ? 'ابدأ بحجز خدمة صيانة' : language === 'fr' ? 'Commencez par réserver un service' : 'Start by booking a maintenance service'}
                </Text>
              </View>
            ) : (
              dashboardData.maintenanceHistory.map(renderMaintenanceStateCard)
            )}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loader: {
    marginTop: 100,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 100,
  },
  carInfoCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.md,
  },
  carInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  carInfoText: {
    marginLeft: 15,
    flex: 1,
  },
  carName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  carPlate: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  carStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 5,
  },
  addMaintenanceButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    ...Theme.shadows.sm,
  },
  addMaintenanceText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 15,
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    ...Theme.shadows.sm,
  },
  noHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: 15,
  },
  noHistorySubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  maintenanceCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    ...Theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  maintenanceDate: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: Theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  detailSection: {
    marginVertical: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: Theme.colors.primary + '30',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  carStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '30',
  },
  carStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
    flex: 1,
    marginHorizontal: 10,
  },
});
