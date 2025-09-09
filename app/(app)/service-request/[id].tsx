import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import { serviceAPI } from '../../../scripts/service-script';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface ServiceRequest {
  _id: string;
  serviceId: string;
  carId: string;
  icarId: string;
  irepairId: string;
  date: string;
  time: string;
  paymentMethod: string;
  description?: string;
  status: string;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  statusHistory: {
    status: string;
    description: string;
    updatedBy: string;
    timestamp: string;
  }[];
  carDetails?: {
    _id: string;
    marque: string;
    modele: string;
    annee: number;
    immatriculation: string;
    couleur: string;
  };
  serviceDetails?: {
    _id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    description: string;
    price: number;
    duration: string;
    type: string;
  };
  irepairDetails?: {
    _id: string;
    nomGarage: string;
    adresse: string;
    telephone: string;
    verified: boolean;
  };
}

const statusColors = {
  pending: '#FF9500',
  accepted: '#007AFF',
  in_progress: '#34C759',
  no_parts: '#FF3B30',
  installing: '#5856D6',
  ready_to_drop: '#30D158',
  completed: '#00C896',
  cancelled: '#FF453A',
};

const statusIcons = {
  pending: 'time-outline',
  accepted: 'checkmark-circle-outline',
  in_progress: 'construct-outline',
  no_parts: 'alert-circle-outline',
  installing: 'build-outline',
  ready_to_drop: 'car-outline',
  completed: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function ServiceRequestDetailScreen() {
  const { id } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServiceRequest = useCallback(async () => {
    try {
      const response = await serviceAPI.getServiceRequest(id as string);
      setServiceRequest(response);
    } catch (error) {
      console.error('Error fetching service request:', error);
      Alert.alert(
        t.error || 'Error',
        'Failed to fetch service request details',
        [
          {
            text: t.ok || 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }, [id, t.error, t.ok]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServiceRequest();
    setRefreshing(false);
  }, [fetchServiceRequest]);

  useEffect(() => {
    if (id) {
      fetchServiceRequest();
    }
  }, [id, fetchServiceRequest]);

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: language === 'ar' ? 'في الانتظار' : language === 'fr' ? 'En attente' : 'Pending',
      accepted: language === 'ar' ? 'مقبول' : language === 'fr' ? 'Accepté' : 'Accepted',
      in_progress: language === 'ar' ? 'قيد التنفيذ' : language === 'fr' ? 'En cours' : 'In Progress',
      no_parts: language === 'ar' ? 'لا توجد قطع' : language === 'fr' ? 'Pas de pièces' : 'No Parts',
      installing: language === 'ar' ? 'التركيب' : language === 'fr' ? 'Installation' : 'Installing',
      ready_to_drop: language === 'ar' ? 'جاهز للاستلام' : language === 'fr' ? 'Prêt à récupérer' : 'Ready to Drop',
      completed: language === 'ar' ? 'مكتمل' : language === 'fr' ? 'Terminé' : 'Completed',
      cancelled: language === 'ar' ? 'ملغي' : language === 'fr' ? 'Annulé' : 'Cancelled',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar' : 'fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>
          {language === 'ar' ? 'جاري التحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  if (!serviceRequest) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Theme.colors.error} />
        <Text style={styles.errorText}>
          {language === 'ar' ? 'طلب الخدمة غير موجود' : language === 'fr' ? 'Demande de service introuvable' : 'Service request not found'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>
            {language === 'ar' ? 'العودة' : language === 'fr' ? 'Retour' : 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'تفاصيل طلب الخدمة' : language === 'fr' ? 'Détails de la demande' : 'Service Request Details'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: statusColors[serviceRequest.status as keyof typeof statusColors] + '20' }]}>
              <Ionicons
                name={statusIcons[serviceRequest.status as keyof typeof statusIcons] as any}
                size={24}
                color={statusColors[serviceRequest.status as keyof typeof statusColors]}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {language === 'ar' ? 'حالة الطلب' : language === 'fr' ? 'État de la demande' : 'Request Status'}
              </Text>
              <Text style={[styles.statusText, { color: statusColors[serviceRequest.status as keyof typeof statusColors] }]}>
                {getStatusText(serviceRequest.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.requestId}>#{serviceRequest._id.slice(-8).toUpperCase()}</Text>
        </View>

        {/* Service Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'تفاصيل الخدمة' : language === 'fr' ? 'Détails du service' : 'Service Details'}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'الخدمة:' : language === 'fr' ? 'Service:' : 'Service:'}
            </Text>
            <Text style={styles.detailValue}>
              {serviceRequest.serviceDetails
                ? (language === 'ar' ? serviceRequest.serviceDetails.nameAr : language === 'fr' ? serviceRequest.serviceDetails.nameFr : serviceRequest.serviceDetails.name)
                : 'N/A'
              }
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'النوع:' : language === 'fr' ? 'Type:' : 'Type:'}
            </Text>
            <Text style={styles.detailValue}>{serviceRequest.serviceDetails?.type || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'المدة:' : language === 'fr' ? 'Durée:' : 'Duration:'}
            </Text>
            <Text style={styles.detailValue}>{serviceRequest.serviceDetails?.duration || 'N/A'}</Text>
          </View>
        </View>

        {/* Mechanic Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'تفاصيل الميكانيكي' : language === 'fr' ? 'Détails du mécanicien' : 'Mechanic Details'}
          </Text>
          <View style={styles.mechanicHeader}>
            <Text style={styles.mechanicName}>
              {serviceRequest.irepairDetails?.nomGarage || 'N/A'}
            </Text>
            {serviceRequest.irepairDetails?.verified && (
              <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
            )}
          </View>
          <Text style={styles.mechanicAddress}>
            {serviceRequest.irepairDetails?.adresse || 'N/A'}
          </Text>
          <Text style={styles.mechanicPhone}>
            📞 {serviceRequest.irepairDetails?.telephone || 'N/A'}
          </Text>
        </View>

        {/* Car Details */}
        {serviceRequest.carDetails && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تفاصيل السيارة' : language === 'fr' ? 'Détails du véhicule' : 'Vehicle Details'}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'الماركة:' : language === 'fr' ? 'Marque:' : 'Brand:'}
              </Text>
              <Text style={styles.detailValue}>{serviceRequest.carDetails.marque}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'الموديل:' : language === 'fr' ? 'Modèle:' : 'Model:'}
              </Text>
              <Text style={styles.detailValue}>{serviceRequest.carDetails.modele}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'السنة:' : language === 'fr' ? 'Année:' : 'Year:'}
              </Text>
              <Text style={styles.detailValue}>{serviceRequest.carDetails.annee}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'اللوحة:' : language === 'fr' ? 'Immatriculation:' : 'License Plate:'}
              </Text>
              <Text style={styles.detailValue}>{serviceRequest.carDetails.immatriculation}</Text>
            </View>
          </View>
        )}

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'تفاصيل الحجز' : language === 'fr' ? 'Détails de la réservation' : 'Booking Details'}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'التاريخ:' : language === 'fr' ? 'Date:' : 'Date:'}
            </Text>
            <Text style={styles.detailValue}>{formatDate(serviceRequest.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'الوقت:' : language === 'fr' ? 'Heure:' : 'Time:'}
            </Text>
            <Text style={styles.detailValue}>{formatTime(serviceRequest.time)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'طريقة الدفع:' : language === 'fr' ? 'Paiement:' : 'Payment:'}
            </Text>
            <Text style={styles.detailValue}>
              {serviceRequest.paymentMethod === 'cash'
                ? (language === 'ar' ? 'نقد' : language === 'fr' ? 'Espèces' : 'Cash')
                : (language === 'ar' ? 'بطاقة' : language === 'fr' ? 'Carte' : 'Card')
              }
            </Text>
          </View>
          {serviceRequest.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'الوصف:' : language === 'fr' ? 'Description:' : 'Description:'}
              </Text>
              <Text style={styles.detailValue}>{serviceRequest.description}</Text>
            </View>
          )}
        </View>

        {/* Cost Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {language === 'ar' ? 'تفاصيل التكلفة' : language === 'fr' ? 'Détails des coûts' : 'Cost Details'}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'ar' ? 'التكلفة المقدرة:' : language === 'fr' ? 'Coût estimé:' : 'Estimated Cost:'}
            </Text>
            <Text style={styles.detailValue}>{serviceRequest.estimatedCost} TND</Text>
          </View>
          {serviceRequest.actualCost && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {language === 'ar' ? 'التكلفة الفعلية:' : language === 'fr' ? 'Coût réel:' : 'Actual Cost:'}
              </Text>
              <Text style={[styles.detailValue, styles.actualCost]}>{serviceRequest.actualCost} TND</Text>
            </View>
          )}
          {serviceRequest.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>
                {language === 'ar' ? 'ملاحظات:' : language === 'fr' ? 'Notes:' : 'Notes:'}
              </Text>
              <Text style={styles.notesText}>{serviceRequest.notes}</Text>
            </View>
          )}
        </View>

        {/* Status History */}
        {serviceRequest.statusHistory && serviceRequest.statusHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {language === 'ar' ? 'تاريخ الحالة' : language === 'fr' ? 'Historique des états' : 'Status History'}
            </Text>
            {serviceRequest.statusHistory.map((status, index) => (
              <View key={index} style={styles.statusHistoryItem}>
                <View style={[styles.statusHistoryIcon, { backgroundColor: statusColors[status.status as keyof typeof statusColors] || '#6B7280' }]}>
                  <Ionicons
                    name={statusIcons[status.status as keyof typeof statusIcons] as any || 'ellipse'}
                    size={16}
                    color={Theme.colors.white}
                  />
                </View>
                <View style={styles.statusHistoryContent}>
                  <Text style={styles.statusHistoryTitle}>{getStatusText(status.status)}</Text>
                  <Text style={styles.statusHistoryDescription}>{status.description}</Text>
                  <Text style={styles.statusHistoryTime}>
                    {new Date(status.timestamp).toLocaleString(language === 'ar' ? 'ar' : 'fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    ...Theme.shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  requestId: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    ...Theme.shadows.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.textLight,
  },
  detailLabel: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  mechanicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  mechanicAddress: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  mechanicPhone: {
    fontSize: 14,
    color: Theme.colors.primary,
  },
  actualCost: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  notesSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.textLight,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  statusHistoryItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statusHistoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusHistoryContent: {
    flex: 1,
  },
  statusHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  statusHistoryDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  statusHistoryTime: {
    fontSize: 12,
    color: Theme.colors.textLight,
  },
});
