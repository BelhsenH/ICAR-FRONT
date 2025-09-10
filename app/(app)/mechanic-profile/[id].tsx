
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import { userService, IrepairUser } from '../../../scripts/user-script';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

const { width } = Dimensions.get('window');

export default function MechanicProfileScreen() {
  const { id } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];
  const [mechanic, setMechanic] = useState<IrepairUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert(t.error || 'Error', t.cannotMakeCall || 'Unable to open the phone app.');
    });
  };


  useEffect(() => {
    const loadMechanic = async () => {
      if (!id || typeof id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        const response = await userService.getIrepairById(id);
        if (response.success && response.data) {
          setMechanic(response.data);
        } else {
          console.error('Failed to fetch mechanic:', response.error);
          Alert.alert(t.error || 'Error', 'Failed to load mechanic details.');
        }
      } catch (error) {
        console.error('Error loading mechanic:', error);
        Alert.alert(t.error || 'Error', 'Failed to load mechanic details.');
      } finally {
        setLoading(false);
      }
    };

    loadMechanic();
  }, [id]);

  if (loading) {
    return (
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.white} />
          <Text style={styles.loadingText}>{t.loading || 'Loading...'}</Text>
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
        <View style={styles.errorContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.errorText}>{t.mechanicNotFound}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.secondary]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Theme.colors.white, '#f8f9fa']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatar}>🔧</Text>
            </LinearGradient>
          </View>
          
          <Text style={styles.garageName}>{mechanic.nomGarage}</Text>
          <Text style={styles.responsibleName}>{mechanic.nomResponsable}</Text>
          
          <View style={styles.verificationContainer}>
            <View style={[styles.statusBadge, { backgroundColor: mechanic.verified ? Theme.colors.success : Theme.colors.warning }]}>
              <Ionicons 
                name={mechanic.verified ? "checkmark-circle" : "time"} 
                size={16} 
                color={Theme.colors.white} 
              />
              <Text style={styles.statusText}>
                {mechanic.verified ? t.verified : t.pending}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[Theme.colors.primary, Theme.colors.secondary]}
              style={styles.cardHeaderGradient}
            >
              <Ionicons name="business" size={24} color={Theme.colors.white} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t.businessInfo || 'Business Information'}</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person-circle" size={28} color={Theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.manager || 'Manager'}</Text>
                <Text style={styles.infoValue}>{mechanic.nomResponsable}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="call" size={28} color={Theme.colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.phone || 'Phone'}</Text>
                <Text style={styles.infoValue}>{mechanic.phoneNumber}</Text>
              </View>
              <TouchableOpacity 
                style={styles.primaryActionButton} 
                onPress={() => handleCall(mechanic.phoneNumber)}
              >
                <Ionicons name="call" size={18} color={Theme.colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time" size={28} color={Theme.colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.businessHours || 'Business Hours'}</Text>
                <Text style={styles.infoSubtext}>{t.contactForHours || 'Contact for current hours'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[Theme.colors.info, '#4FC3F7']}
              style={styles.cardHeaderGradient}
            >
              <Ionicons name="location" size={24} color={Theme.colors.white} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t.location || 'Location'}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <View style={styles.locationItem}>
              <View style={styles.locationIconWrapper}>
                <Ionicons name="location-outline" size={24} color={Theme.colors.info} />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>{t.address || 'Address'}</Text>
                <Text style={styles.locationValue}>{mechanic.adresse || t.addressNotAvailable || 'Address not available'}</Text>
              </View>
            </View>

            {mechanic.zoneGeo && (
              <View style={styles.locationItem}>
                <View style={styles.locationIconWrapper}>
                  <Ionicons name="map-outline" size={24} color={Theme.colors.info} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>{t.zone || 'Zone'}</Text>
                  <Text style={styles.locationValue}>{mechanic.zoneGeo}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.viewOnMapButton}
              onPress={() => {
                const url = `https://maps.google.com/maps?daddr=${mechanic.geolocation.lat},${mechanic.geolocation.lng}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="map" size={20} color={Theme.colors.white} />
              <Text style={styles.viewOnMapText}>{t.viewOnMap || 'View on Map'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[Theme.colors.success, '#66BB6A']}
              style={styles.cardHeaderGradient}
            >
              <Ionicons name="construct" size={24} color={Theme.colors.white} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t.services || 'Services'}</Text>
          </View>
          
          <Text style={styles.servicesDescription}>
            {t.servicesDescription || 'Professional automotive repair services offered:'}
          </Text>
          
          <View style={styles.servicesGrid}>
            {mechanic.typeService?.map((service, idx) => (
              <View key={idx} style={styles.serviceCard}>
                <LinearGradient
                  colors={[Theme.colors.success + '15', Theme.colors.success + '25']}
                  style={styles.serviceCardGradient}
                >
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                  </View>
                  <Text style={styles.serviceText}>{service}</Text>
                </LinearGradient>
              </View>
            )) || (
              <View style={styles.serviceCard}>
                <LinearGradient
                  colors={[Theme.colors.success + '15', Theme.colors.success + '25']}
                  style={styles.serviceCardGradient}
                >
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
                  </View>
                  <Text style={styles.serviceText}>General Repair</Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[Theme.colors.primary, Theme.colors.secondary]}
              style={styles.cardHeaderGradient}
            >
              <Ionicons name="flash" size={24} color={Theme.colors.white} />
            </LinearGradient>
            <Text style={styles.cardTitle}>{t.quickActions || 'Quick Actions'}</Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleCall(mechanic.phoneNumber)}
            >
              <LinearGradient
                colors={[Theme.colors.success, '#4CAF50']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="call" size={32} color={Theme.colors.white} />
                </View>
                <Text style={styles.actionTitle}>{t.callNow || 'Call Now'}</Text>
                <Text style={styles.actionSubtitle}>{t.directContact || 'Direct contact available'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                const url = `https://maps.google.com/maps?daddr=${mechanic.geolocation.lat},${mechanic.geolocation.lng}`;
                Linking.openURL(url);
              }}
            >
              <LinearGradient
                colors={[Theme.colors.info, '#2196F3']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name="navigate" size={32} color={Theme.colors.white} />
                </View>
                <Text style={styles.actionTitle}>{t.getDirections || 'Get Directions'}</Text>
                <Text style={styles.actionSubtitle}>{t.openInMaps || 'Navigate with Maps'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Theme.shadows.lg,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 30,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
  },
  avatar: {
    fontSize: 50,
  },
  garageName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  responsibleName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 15,
    textAlign: 'center',
  },
  verificationContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: Theme.colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: Theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  cardHeaderGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  infoGrid: {
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary + '40',
  },
  infoIconContainer: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    color: Theme.colors.text,
    fontWeight: '700',
  },
  infoSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  primaryActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  locationContainer: {
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info + '60',
  },
  locationIconWrapper: {
    marginRight: 16,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.info,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    ...Theme.shadows.sm,
  },
  viewOnMapText: {
    fontSize: 16,
    color: Theme.colors.white,
    fontWeight: '600',
  },
  servicesDescription: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceCard: {
    minWidth: (width - 80) / 2,
    marginBottom: 16,
  },
  serviceCardGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  serviceIconContainer: {
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 16,
    color: Theme.colors.success,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...Theme.shadows.lg,
  },
  actionCardGradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  actionIconContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  actionTitle: {
    fontSize: 18,
    color: Theme.colors.white,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.white,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: Theme.colors.white,
    fontSize: 18,
    textAlign: 'center',
  },
});
