import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../config';
import { serviceAPI } from '../../../scripts/service-script';

interface MaintenanceRequest {
  _id: string;
  date: string;
  status: string;
  serviceId: {
    _id?: string;
    id?: string;
    name: string;
    type?: string;
    price?: number;
  } | string;
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

interface ServiceType {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  icon: string;
  color: string;
  category: string;
}

interface ManualServiceRequest {
  serviceType: string;
  description: string;
  date: string;
}

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

const serviceTypes: ServiceType[] = [
  { id: 'oil_change', name: 'Oil Change', nameAr: 'تغيير الزيت', nameFr: 'Changement d\'huile', icon: 'water-outline', color: '#FF6B6B', category: 'Engine' },
  { id: 'tire_rotation', name: 'Tire Rotation', nameAr: 'دوران الإطارات', nameFr: 'Rotation des pneus', icon: 'ellipse-outline', color: '#4ECDC4', category: 'Tires' },
  { id: 'brake_inspection', name: 'Brake Inspection', nameAr: 'فحص الفرامل', nameFr: 'Inspection des freins', icon: 'stop-circle-outline', color: '#FF8A65', category: 'Safety' },
  { id: 'engine_tune', name: 'Engine Tune-up', nameAr: 'ضبط المحرك', nameFr: 'Révision moteur', icon: 'cog-outline', color: '#5C6BC0', category: 'Engine' },
  { id: 'transmission', name: 'Transmission Service', nameAr: 'خدمة ناقل الحركة', nameFr: 'Service de transmission', icon: 'settings-outline', color: '#AB47BC', category: 'Drivetrain' },
  { id: 'air_filter', name: 'Air Filter Replacement', nameAr: 'استبدال فلتر الهواء', nameFr: 'Remplacement filtre à air', icon: 'leaf-outline', color: '#66BB6A', category: 'Filters' },
  { id: 'battery', name: 'Battery Service', nameAr: 'خدمة البطارية', nameFr: 'Service de batterie', icon: 'battery-charging-outline', color: '#FFA726', category: 'Electrical' },
  { id: 'cooling_system', name: 'Cooling System', nameAr: 'نظام التبريد', nameFr: 'Système de refroidissement', icon: 'thermometer-outline', color: '#26C6DA', category: 'Engine' },
  { id: 'exhaust', name: 'Exhaust System', nameAr: 'نظام العادم', nameFr: 'Système d\'échappement', icon: 'cloud-outline', color: '#8D6E63', category: 'Exhaust' },
  { id: 'general_maintenance', name: 'General Maintenance', nameAr: 'صيانة عامة', nameFr: 'Maintenance générale', icon: 'build-outline', color: '#78909C', category: 'General' },
  { id: 'other', name: 'Other', nameAr: 'أخرى', nameFr: 'Autre', icon: 'help-circle-outline', color: '#BDBDBD', category: 'Other' }
];

export default function MaintenanceDashboard() {
  const { id: carId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showManualServiceModal, setShowManualServiceModal] = useState(false);
  const [manualServiceRequest, setManualServiceRequest] = useState<ManualServiceRequest>({
    serviceType: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [creatingManualService, setCreatingManualService] = useState(false);

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
        // Enhance maintenance history with actual service names
        const enhancedData = { ...data.data };
        
        if (enhancedData.maintenanceHistory && enhancedData.maintenanceHistory.length > 0) {
          // Fetch all services to get service names
          setLoadingServices(true);
          try {
            const servicesResponse = await serviceAPI.getAllServices();
            const services = servicesResponse.data || servicesResponse;
            
            // Create a map of service IDs to service names
            const serviceMap = new Map();
            if (Array.isArray(services)) {
              services.forEach(service => {
                serviceMap.set(service._id, service.name);
              });
            }
            
            // Update maintenance history with actual service names
            enhancedData.maintenanceHistory = enhancedData.maintenanceHistory.map(state => {
              if (state.maintenanceRequest?.serviceId) {
                const serviceId = typeof state.maintenanceRequest.serviceId === 'string' 
                  ? state.maintenanceRequest.serviceId 
                  : state.maintenanceRequest.serviceId._id || state.maintenanceRequest.serviceId.id;
                
                const serviceName = serviceMap.get(serviceId);
                if (serviceName) {
                  return {
                    ...state,
                    maintenanceRequest: {
                      ...state.maintenanceRequest,
                      serviceId: {
                        ...state.maintenanceRequest.serviceId,
                        name: serviceName
                      }
                    }
                  };
                }
              }
              return state;
            });
          } catch (servicesError) {
            console.warn('Failed to fetch services for name mapping:', servicesError);
          } finally {
            setLoadingServices(false);
          }
        }
        
        setDashboardData(enhancedData);
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

  const getServiceName = (maintenanceRequest: MaintenanceRequest | undefined) => {
    if (maintenanceRequest?.serviceId) {
      if (typeof maintenanceRequest.serviceId === 'string') {
        return language === 'ar' ? 'خدمة صيانة' : language === 'fr' ? 'Service de maintenance' : 'Maintenance Service';
      } else {
        return maintenanceRequest.serviceId.name || 
          (language === 'ar' ? 'خدمة صيانة' : language === 'fr' ? 'Service de maintenance' : 'Maintenance Service');
      }
    }
    return language === 'ar' ? 'خدمة صيانة' : language === 'fr' ? 'Service de maintenance' : 'Maintenance Service';
  };

  const getServiceIcon = (serviceName: string): string => {
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('oil')) return 'water-outline';
    if (lowerName.includes('tire') || lowerName.includes('wheel')) return 'ellipse-outline';
    if (lowerName.includes('brake')) return 'stop-circle-outline';
    if (lowerName.includes('engine') || lowerName.includes('tune')) return 'cog-outline';
    if (lowerName.includes('transmission')) return 'settings-outline';
    if (lowerName.includes('filter') || lowerName.includes('air')) return 'leaf-outline';
    if (lowerName.includes('battery')) return 'battery-charging-outline';
    if (lowerName.includes('cooling') || lowerName.includes('coolant')) return 'thermometer-outline';
    if (lowerName.includes('exhaust')) return 'cloud-outline';
    return 'build-outline';
  };

  const getServiceColor = (serviceName: string): string => {
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('oil')) return '#FF6B6B';
    if (lowerName.includes('tire') || lowerName.includes('wheel')) return '#4ECDC4';
    if (lowerName.includes('brake')) return '#FF8A65';
    if (lowerName.includes('engine') || lowerName.includes('tune')) return '#5C6BC0';
    if (lowerName.includes('transmission')) return '#AB47BC';
    if (lowerName.includes('filter') || lowerName.includes('air')) return '#66BB6A';
    if (lowerName.includes('battery')) return '#FFA726';
    if (lowerName.includes('cooling') || lowerName.includes('coolant')) return '#26C6DA';
    if (lowerName.includes('exhaust')) return '#8D6E63';
    return '#78909C';
  };

  const getServiceCategory = (serviceName: string): string => {
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('oil') || lowerName.includes('engine') || lowerName.includes('cooling')) return 'Engine';
    if (lowerName.includes('tire') || lowerName.includes('wheel')) return 'Tires';
    if (lowerName.includes('brake')) return 'Safety';
    if (lowerName.includes('transmission')) return 'Drivetrain';
    if (lowerName.includes('filter')) return 'Filters';
    if (lowerName.includes('battery')) return 'Electrical';
    if (lowerName.includes('exhaust')) return 'Exhaust';
    return 'General';
  };

  const getServiceTypeDisplayName = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(st => st.id === serviceTypeId);
    if (!serviceType) return serviceTypeId;
    
    if (language === 'ar') return serviceType.nameAr;
    if (language === 'fr') return serviceType.nameFr;
    return serviceType.name;
  };

  const createManualServiceRequest = async () => {
    if (!manualServiceRequest.serviceType || !manualServiceRequest.description.trim()) {
      Alert.alert(
        t.error || 'Error',
        language === 'ar' 
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : language === 'fr'
          ? 'Veuillez remplir tous les champs requis'
          : 'Please fill in all required fields'
      );
      return;
    }

    setCreatingManualService(true);
    try {
      const requestData = {
        serviceType: manualServiceRequest.serviceType,
        description: manualServiceRequest.description,
        date: manualServiceRequest.date,
        isManual: true,
        serviceName: getServiceTypeDisplayName(manualServiceRequest.serviceType)
      };

      // Use the maintenance service API for creating manual service requests
      const token = await AsyncStorage.getItem('authToken');
      const maintenanceServiceUrl = `${config.apiUrl}/api/maintenance`;
      
      const response = await fetch(
        `${maintenanceServiceUrl}/manual-request/${carId}`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : language === 'fr' ? 'Succès' : 'Success',
          language === 'ar'
            ? 'تم إنشاء طلب الخدمة اليدوي بنجاح'
            : language === 'fr'
            ? 'Demande de service manuelle créée avec succès'
            : 'Manual service request created successfully'
        );
        setShowManualServiceModal(false);
        setManualServiceRequest({
          serviceType: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert(t.error || 'Error', data.message || 'Failed to create manual service request');
      }
    } catch (error) {
      console.error('Error creating manual service request:', error);
      Alert.alert(t.error || 'Error', 'Failed to create manual service request');
    } finally {
      setCreatingManualService(false);
    }
  };

  const renderMaintenanceStateCard = (state: MaintenanceCarState) => {
    const serviceName = getServiceName(state.maintenanceRequest);
    const serviceIcon = getServiceIcon(serviceName);
    const serviceColor = getServiceColor(serviceName);
    const serviceCategory = getServiceCategory(serviceName);
    const status = state.maintenanceRequest?.status || 'pending';
    
    return (
      <View key={state._id} style={[styles.maintenanceCard, { borderLeftColor: serviceColor, borderLeftWidth: 5 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.serviceIconContainer}>
              <View style={[styles.serviceIconWrapper, { backgroundColor: serviceColor + '15' }]}>
                <Ionicons name={serviceIcon as any} size={24} color={serviceColor} />
              </View>
              <View style={styles.serviceTitleContainer}>
                <Text style={styles.maintenanceTitle}>
                  {serviceName}
                </Text>
                <View style={styles.categoryContainer}>
                  <Text style={[styles.categoryText, { color: serviceColor }]}>
                    {serviceCategory}
                  </Text>
                  {loadingServices && (
                    <ActivityIndicator size="small" color={serviceColor} style={styles.serviceLoadingIndicator} />
                  )}
                </View>
                <Text style={styles.maintenanceDate}>
                  {formatDate(state.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>
                {getStatusText(status)}
              </Text>
            </View>
            <View style={[styles.progressIndicator, { backgroundColor: serviceColor + '30' }]}>
              <View 
                style={[styles.progressBar, 
                  { 
                    backgroundColor: serviceColor,
                    width: status === 'completed' ? '100%' : status === 'in_progress' ? '60%' : status === 'accepted' ? '30%' : '10%'
                  }
                ]} 
              />
            </View>
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
              {state.brakeFluid.isOverdue && ' ⚠️'}
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
        {state.maintenanceRequest?.serviceId && typeof state.maintenanceRequest.serviceId !== 'string' && state.maintenanceRequest.serviceId.price && (
          <View style={styles.costSection}>
            <View style={styles.costIconContainer}>
              <Ionicons name="card-outline" size={20} color={serviceColor} />
              <Text style={styles.costLabel}>
                {language === 'ar' ? 'التكلفة' : language === 'fr' ? 'Coût' : 'Cost'}
              </Text>
            </View>
            <Text style={[styles.costValue, { color: serviceColor }]}>
              {state.maintenanceRequest.serviceId.price.toFixed(2)} TND
            </Text>
          </View>
        )}

        {/* View/Edit car state button */}
        <TouchableOpacity 
          style={[styles.carStateButton, { borderColor: serviceColor + '30' }]}
          onPress={() => router.push(`/(app)/maintenance-car-state/${carId}/${state.maintenanceRequestId}` as any)}
        >
          <Ionicons name="settings-outline" size={20} color={serviceColor} />
          <Text style={[styles.carStateButtonText, { color: serviceColor }]}>
            {language === 'ar' ? 'عرض/تحديث حالة السيارة' : language === 'fr' ? 'Voir/Modifier l\'état' : 'View/Edit Car State'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

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
            <LinearGradient
              colors={[Theme.colors.primary + '10', Theme.colors.secondary + '05']}
              style={styles.carInfoGradient}
            >
              <View style={styles.carInfoHeader}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="car" size={36} color={Theme.colors.primary} />
                </View>
                <View style={styles.carInfoText}>
                  <Text style={styles.carName}>
                    {dashboardData.car.marque} {dashboardData.car.modele}
                  </Text>
                  <View style={styles.plateContainer}>
                    <Ionicons name="card-outline" size={16} color={Theme.colors.textSecondary} />
                    <Text style={styles.carPlate}>
                      {dashboardData.car.numeroImmatriculation}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.carStats}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text-outline" size={20} color={Theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>
                  {dashboardData.summary.totalMaintenanceRecords}
                </Text>
                <Text style={styles.statLabel}>
                  {language === 'ar' ? 'سجلات الصيانة' : language === 'fr' ? 'Enregistrements' : 'Records'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="speedometer-outline" size={20} color={Theme.colors.secondary} />
                </View>
                <Text style={styles.statValue}>
                  {(dashboardData.summary.currentMileage || dashboardData.car.kilometrage || 0).toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>
                  {language === 'ar' ? 'كم' : language === 'fr' ? 'km' : 'km'}
                </Text>
              </View>
            </View>
            
            {/* Add new maintenance button */}
            <LinearGradient
              colors={[Theme.colors.primary, Theme.colors.secondary]}
              style={styles.addMaintenanceButton}
            >
              <TouchableOpacity 
                style={styles.addMaintenanceButtonInner}
                onPress={() => setShowServiceOptions(true)}
              >
                <View style={styles.addMaintenanceIconContainer}>
                  <Ionicons name="add-circle-outline" size={26} color={Theme.colors.white} />
                </View>
                <Text style={styles.addMaintenanceText}>
                  {language === 'ar' ? 'إضافة خدمة جديدة' : language === 'fr' ? 'Ajouter un nouveau service' : 'Add New Service'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Theme.colors.white} />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Maintenance history */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="time-outline" size={24} color={Theme.colors.primary} />
                <Text style={styles.sectionHeaderTitle}>
                  {language === 'ar' ? 'تاريخ الصيانة' : language === 'fr' ? 'Historique de maintenance' : 'Maintenance History'}
                </Text>
              </View>
              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCount}>
                  {dashboardData.maintenanceHistory.length}
                </Text>
              </View>
            </View>
            
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
              dashboardData.maintenanceHistory.map((state, index) => (
                <View key={state._id}>
                  {renderMaintenanceStateCard(state)}
                  {index < dashboardData.maintenanceHistory.length - 1 && (
                    <View style={styles.serviceDivider}>
                      <View style={styles.dividerLine} />
                      <View style={styles.dividerDot} />
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Service Options Modal */}
      <Modal
        visible={showServiceOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serviceOptionsModal}>
            <Text style={styles.modalTitle}>
              {language === 'ar' ? 'اختر نوع الخدمة' : language === 'fr' ? 'Choisir le type de service' : 'Choose Service Type'}
            </Text>
            
            <TouchableOpacity 
              style={styles.serviceOptionButton}
              onPress={() => {
                setShowServiceOptions(false);
                router.push(`/(app)/book-service-v2/${carId}`);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color={Theme.colors.primary} />
              <View style={styles.serviceOptionContent}>
                <Text style={styles.serviceOptionTitle}>
                  {language === 'ar' ? 'حجز خدمة' : language === 'fr' ? 'Réserver un service' : 'Book Service'}
                </Text>
                <Text style={styles.serviceOptionDescription}>
                  {language === 'ar' ? 'اختر من الخدمات المتاحة وحدد موعد' : language === 'fr' ? 'Choisir parmi les services disponibles et programmer' : 'Choose from available services and schedule'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceOptionButton}
              onPress={() => {
                setShowServiceOptions(false);
                setShowManualServiceModal(true);
              }}
            >
              <Ionicons name="create-outline" size={24} color={Theme.colors.secondary} />
              <View style={styles.serviceOptionContent}>
                <Text style={styles.serviceOptionTitle}>
                  {language === 'ar' ? 'إدخال يدوي' : language === 'fr' ? 'Saisie manuelle' : 'Manual Entry'}
                </Text>
                <Text style={styles.serviceOptionDescription}>
                  {language === 'ar' ? 'أضف خدمة مخصصة بوصف خاص' : language === 'fr' ? 'Ajouter un service personnalisé avec description' : 'Add custom service with description'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowServiceOptions(false)}
            >
              <Text style={styles.cancelButtonText}>
                {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Service Request Modal */}
      <Modal
        visible={showManualServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.manualServiceModal} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {language === 'ar' ? 'إضافة خدمة يدوية' : language === 'fr' ? 'Ajouter un service manuel' : 'Add Manual Service'}
            </Text>
            
            {/* Service Type Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ar' ? 'نوع الخدمة' : language === 'fr' ? 'Type de service' : 'Service Type'}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={manualServiceRequest.serviceType}
                  onValueChange={(itemValue) => 
                    setManualServiceRequest({...manualServiceRequest, serviceType: itemValue})
                  }
                  style={styles.picker}
                >
                  <Picker.Item 
                    label={language === 'ar' ? 'اختر نوع الخدمة' : language === 'fr' ? 'Sélectionner le type' : 'Select service type'} 
                    value="" 
                  />
                  {serviceTypes.map((serviceType) => (
                    <Picker.Item 
                      key={serviceType.id} 
                      label={getServiceTypeDisplayName(serviceType.id)} 
                      value={serviceType.id} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ar' ? 'الوصف' : language === 'fr' ? 'Description' : 'Description'}
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder={language === 'ar' ? 'أدخل وصف الخدمة...' : language === 'fr' ? 'Entrez la description...' : 'Enter service description...'}
                value={manualServiceRequest.description}
                onChangeText={(text) => setManualServiceRequest({...manualServiceRequest, description: text})}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {language === 'ar' ? 'التاريخ' : language === 'fr' ? 'Date' : 'Date'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={manualServiceRequest.date}
                onChangeText={(text) => setManualServiceRequest({...manualServiceRequest, date: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>


            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={createManualServiceRequest}
                disabled={creatingManualService}
              >
                {creatingManualService ? (
                  <ActivityIndicator size="small" color={Theme.colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {language === 'ar' ? 'إنشاء الطلب' : language === 'fr' ? 'Créer la demande' : 'Create Request'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowManualServiceModal(false)}
                disabled={creatingManualService}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    borderRadius: 24,
    marginBottom: 24,
    ...Theme.shadows.md,
    elevation: 8,
    shadowRadius: 16,
    shadowOpacity: 0.12,
    overflow: 'hidden',
  },
  carInfoGradient: {
    padding: 24,
  },
  carInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  carIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
    marginRight: 16,
  },
  carInfoText: {
    flex: 1,
  },
  carName: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carPlate: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  carStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    backgroundColor: Theme.colors.white,
    borderRadius: 16,
    margin: -8,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Theme.colors.textLight,
    alignSelf: 'center',
    marginTop: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addMaintenanceButton: {
    borderRadius: 28,
    marginTop: 20,
    ...Theme.shadows.md,
    elevation: 6,
  },
  addMaintenanceButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addMaintenanceIconContainer: {
    marginRight: 12,
  },
  addMaintenanceText: {
    color: Theme.colors.white,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  historySection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  historyCountBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  historyCount: {
    color: Theme.colors.white,
    fontSize: 14,
    fontWeight: '700',
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.md,
    elevation: 8,
    shadowRadius: 12,
    shadowOpacity: 0.15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  serviceIconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  maintenanceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  maintenanceDate: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: Theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressIndicator: {
    width: 100,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: 0.3,
  },
  detailSection: {
    marginVertical: 15,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
    backgroundColor: Theme.colors.background + '50',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  costSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
  },
  costIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginLeft: 8,
  },
  costValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  carStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
    borderWidth: 2,
  },
  carStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 12,
  },
  serviceTitleContainer: {
    flex: 1,
  },
  serviceLoadingIndicator: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceOptionsModal: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  manualServiceModal: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    alignSelf: 'center',
    marginTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  serviceOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: Theme.colors.background,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
  },
  serviceOptionContent: {
    flex: 1,
    marginLeft: 15,
  },
  serviceOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  serviceOptionDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: Theme.colors.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Theme.colors.textLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: Theme.colors.background,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Theme.colors.textSecondary,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  serviceDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.textLight,
  },
  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
    marginHorizontal: 15,
  },
});
