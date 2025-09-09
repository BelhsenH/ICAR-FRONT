
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

  const handleEmail = (email: string) => {
    const emailUrl = `mailto:${email}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(t.error || 'Error', 'Unable to open the email app.');
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
        {/* Contact Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={24} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>{t.contactInfo}</Text>
          </View>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="call-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>{t.phone}</Text>
              <Text style={styles.contactValue}>{mechanic.phoneNumber}</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleCall(mechanic.phoneNumber)}
            >
              <Ionicons name="call" size={20} color={Theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>{t.email}</Text>
              <Text style={styles.contactValue}>{mechanic.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleEmail(mechanic.email)}
            >
              <Ionicons name="mail" size={20} color={Theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>{t.location}</Text>
          </View>
          
          <View style={styles.locationItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="location-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.contactLabel}>{t.address}</Text>
              <Text style={styles.contactValue}>{mechanic.adresse || t.addressNotAvailable || 'Address not available'}</Text>
            </View>
          </View>

          {mechanic.zoneGeo && (
            <View style={styles.locationItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="map-outline" size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.contactLabel}>{t.zone}</Text>
                <Text style={styles.contactValue}>{mechanic.zoneGeo}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Services Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct" size={24} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>{t.services}</Text>
          </View>
          
          <View style={styles.servicesGrid}>
            {mechanic.typeService?.map((service, idx) => (
              <View key={idx} style={styles.serviceTag}>
                <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            )) || (
              <View style={styles.serviceTag}>
                <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
                <Text style={styles.serviceText}>General Repair</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={24} color={Theme.colors.primary} />
            <Text style={styles.cardTitle}>{t.quickActions}</Text>
          </View>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: Theme.colors.success }]}
              onPress={() => handleCall(mechanic.phoneNumber)}
            >
              <Ionicons name="call" size={24} color={Theme.colors.white} />
              <Text style={styles.quickActionText}>{t.callNow}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: Theme.colors.info }]}
              onPress={() => handleEmail(mechanic.email)}
            >
              <Ionicons name="mail" size={24} color={Theme.colors.white} />
              <Text style={styles.quickActionText}>{t.sendEmail}</Text>
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
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.success + '15',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    color: Theme.colors.success,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Theme.shadows.sm,
  },
  quickActionText: {
    fontSize: 16,
    color: Theme.colors.white,
    fontWeight: '600',
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
