import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { userService, IrepairUser } from '../../scripts/user-script';

// Polyline decoder for Google/ORS encoded polylines
function decodePolyline(encoded: string) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

const { height } = Dimensions.get('window');

interface Mechanic {
  id: string;
  name: string;
  distance: string;
  address: string;
  phone: string;
  specialties: string[];
  isOpen: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  avatar: string;
}

// Replace with your OpenRouteService API key
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc1MWZjY2U0ZmYxMDQwYTNiODBhYTUxOWI5YTMyMDUwIiwiaCI6Im11cm11cjY0In0=';

export default function MechanicsMapScreen() {
  const { language, translations } = useLanguage();
  const t = translations[language];
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearestMechanic, setNearestMechanic] = useState<Mechanic | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; duration: number } | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  // Find nearest mechanic to user location
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    // Haversine formula
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Load mechanics from API
  const loadMechanics = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllIrepairs();
      if (response.success && response.data) {
        const mechanicData: Mechanic[] = response.data.map((irepair: IrepairUser) => ({
          id: irepair._id,
          name: irepair.nomGarage,
          distance: '0 km', // Will be calculated when user location is available
          address: irepair.adresse || 'Address not available',
          phone: irepair.phoneNumber,
          specialties: irepair.typeService || ['General Repair'],
          isOpen: true, // Default to open - could be enhanced with business hours
          coordinates: {
            latitude: irepair.geolocation.lat,
            longitude: irepair.geolocation.lng,
          },
          avatar: '🔧',
        }));
        setMechanics(mechanicData);
      } else {
        console.error('Failed to fetch mechanics:', response.error);
        Alert.alert('Error', 'Failed to load mechanics. Please try again.');
      }
    } catch (error) {
      console.error('Error loading mechanics:', error);
      Alert.alert('Error', 'Failed to load mechanics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      // Load mechanics first
      await loadMechanics();
      
      // Get user location
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation(null);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setUserLocation(null);
      }
    };

    initializeScreen();
  }, []);

  useEffect(() => {
    if (userLocation && mechanics.length > 0) {
      let minDist = Infinity;
      let nearest: Mechanic | null = null;
      
      // Update distances and find nearest mechanic
      const updatedMechanics = mechanics.map((m) => {
        const dist = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          m.coordinates.latitude,
          m.coordinates.longitude
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = m;
        }
        return {
          ...m,
          distance: `${dist.toFixed(1)} km`,
        };
      });
      
      setMechanics(updatedMechanics);
      setNearestMechanic(nearest);
    }
  }, [userLocation, mechanics.length]);

  const handleCallMechanic = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open the dialer.');
    });
  };

  // Show route on map instead of opening external maps
  const handleGetDirections = async (mechanic: Mechanic) => {
    setSelectedMechanic(mechanic.id);
    setRouteCoords([]);
    setRouteSummary(null);
    if (!userLocation) {
      Alert.alert('Location Error', 'User location not available.');
      return;
    }
    try {
      const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
      const body = {
        coordinates: [
          [userLocation.longitude, userLocation.latitude],
          [mechanic.coordinates.longitude, mechanic.coordinates.latitude],
        ],
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': ORS_API_KEY,
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.status !== 200) {
        console.error('ORS API error:', data);
        Alert.alert('Route Error', data.error?.message || 'Could not get route.');
        return;
      }
      if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
        const decoded = decodePolyline(data.routes[0].geometry);
        setRouteCoords(decoded);
        if (data.routes[0].summary) {
          setRouteSummary({
            distance: data.routes[0].summary.distance,
            duration: data.routes[0].summary.duration,
          });
        }
      } else {
        setRouteCoords([]);
        setRouteSummary(null);
        console.error('ORS API response missing route geometry:', data);
        Alert.alert('Route not found', 'Could not find a route to this mechanic.');
      }
    } catch (err) {
      setRouteCoords([]);
      setRouteSummary(null);
      console.error('Failed to get directions:', err);
      Alert.alert('Error', 'Failed to get directions.');
    }
  };

  const renderMechanicCard = (mechanic: Mechanic) => (
    <TouchableOpacity
      key={mechanic.id}
      style={[
        styles.mechanicCard,
        selectedMechanic === mechanic.id && styles.selectedCard,
      ]}
      onPress={() => handleGetDirections(mechanic)} // <-- changed here
    >
      <View style={styles.mechanicHeader}>
        <Text style={styles.mechanicAvatar}>{mechanic.avatar}</Text>
        <View style={styles.mechanicInfo}>
          <Text style={styles.mechanicName}>{mechanic.name}</Text>
          <View style={styles.mechanicMeta}>
            <Text style={styles.distanceText}>{mechanic.distance}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: mechanic.isOpen ? Theme.colors.success : Theme.colors.error }
            ]}>
              <Text style={styles.statusText}>
                {mechanic.isOpen ? t.openNow : t.closed}
              </Text>
            </View>
          </View>
          <Text style={styles.addressText}>{mechanic.address}</Text>
        </View>
      </View>

      <View style={styles.specialtiesContainer}>
        {mechanic.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mechanicActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCallMechanic(mechanic.phone)}
        >
          <Ionicons name="call" size={20} color={Theme.colors.primary} />
          <Text style={styles.actionText}>{t.callMechanic}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleGetDirections(mechanic)}
        >
          <Ionicons name="navigate" size={20} color={Theme.colors.primary} />
          <Text style={styles.actionText}>{t.getDirections}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/(app)/mechanic-profile/${mechanic.id}` as any)}
        >
          <Ionicons name="person" size={20} color={Theme.colors.primary} />
          <Text style={styles.actionText}>{t.viewProfile}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{t.findMechanics}</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'map' && styles.activeToggle,
            ]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons
              name="map"
              size={20}
              color={viewMode === 'map' ? Theme.colors.white : Theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.activeToggle,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === 'list' ? Theme.colors.white : Theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>{t.loadingMechanics || 'Loading mechanics...'}</Text>
          </View>
        ) : viewMode === 'map' ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={(() => {
                if (userLocation && selectedMechanic) {
                  const mechanic = mechanics.find(m => m.id === selectedMechanic);
                  if (mechanic) {
                    // Center between user and mechanic
                    const lat = (userLocation.latitude + mechanic.coordinates.latitude) / 2;
                    const lng = (userLocation.longitude + mechanic.coordinates.longitude) / 2;
                    const latDelta = Math.abs(userLocation.latitude - mechanic.coordinates.latitude) * 2.2 || 0.05;
                    const lngDelta = Math.abs(userLocation.longitude - mechanic.coordinates.longitude) * 2.2 || 0.05;
                    return {
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: latDelta,
                      longitudeDelta: lngDelta,
                    };
                  }
                }
                if (userLocation) {
                  return {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  };
                }
                return {
                  latitude: 36.8065,
                  longitude: 10.1815,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                };
              })()}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {mechanics.map((mechanic) => (
                <Marker
                  key={mechanic.id}
                  coordinate={{
                    latitude: mechanic.coordinates.latitude,
                    longitude: mechanic.coordinates.longitude,
                  }}
                  title={mechanic.name}
                  description={mechanic.address}
                  pinColor={nearestMechanic && mechanic.id === nearestMechanic.id ? 'green' : undefined}
                  onPress={() => handleGetDirections(mechanic)}
                >
                  <Text style={{ fontSize: 28 }}>{mechanic.avatar}</Text>
                </Marker>
              ))}
              {/* Draw route polyline if available */}
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor="#007AFF"
                  strokeWidth={4}
                />
              )}
            </MapView>
            {/* Enhanced route summary if available */}
            {routeSummary && selectedMechanic && (
              <View style={styles.routeSummaryContainer}>
                <LinearGradient
                  colors={[Theme.colors.primary, Theme.colors.secondary]}
                  style={styles.routeSummaryGradient}
                >
                  <Text style={styles.routeSummaryTitle}>
                    {t.routeTo || 'Route to'} {mechanics.find(m => m.id === selectedMechanic)?.name}
                  </Text>
                  <View style={styles.routeStatsRow}>
                    <View style={styles.routeStat}>
                      <Ionicons name="car" size={20} color={Theme.colors.white} />
                      <Text style={styles.routeStatText}>
                        {(routeSummary.distance / 1000).toFixed(1)} km
                      </Text>
                    </View>
                    <View style={styles.routeStat}>
                      <Ionicons name="time" size={20} color={Theme.colors.white} />
                      <Text style={styles.routeStatText}>
                        {Math.round(routeSummary.duration / 60)} min
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.routeActionButton}
                      onPress={() => {
                        const mechanic = mechanics.find(m => m.id === selectedMechanic);
                        if (mechanic) {
                          const url = `https://maps.google.com/maps?daddr=${mechanic.coordinates.latitude},${mechanic.coordinates.longitude}`;
                          Linking.openURL(url);
                        }
                      }}
                    >
                      <Ionicons name="navigate" size={18} color={Theme.colors.primary} />
                      <Text style={styles.routeActionText}>{t.openInMaps || 'Open in Maps'}</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
            {/* Bottom Sheet with Mechanics */}
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>{t.nearbyMechanics}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mechanicsScroll}
              >
                {mechanics.map((mechanic) => (
                  <TouchableOpacity
                    key={mechanic.id}
                    style={[styles.mechanicMiniCard, nearestMechanic && mechanic.id === nearestMechanic.id && { borderColor: 'green', borderWidth: 2 }]}
                    onPress={() => {
                      handleGetDirections(mechanic);
                    }}
                  >
                    <Text style={styles.mechanicMiniAvatar}>{mechanic.avatar}</Text>
                    <Text style={styles.mechanicMiniName}>{mechanic.name}</Text>
                    <View style={styles.mechanicMiniMeta}>
                      <Text style={styles.mechanicMiniDistance}>{mechanic.distance}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t.nearbyMechanics}</Text>
              <Text style={styles.listSubtitle}>
                {mechanics.length} mechanics found
              </Text>
            </View>
            {mechanics.map(renderMechanicCard)}
          </ScrollView>
        )}
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: 20,
    minHeight: 250,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginTop: 20,
  },
  mapSubText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 5,
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 20,
    gap: 10,
  },
  mapControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: height * 0.3,
    ...Theme.shadows.lg,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.textLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 15,
  },
  mechanicsScroll: {
    flexGrow: 0,
  },
  mechanicMiniCard: {
    width: 120,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
  },
  mechanicMiniAvatar: {
    fontSize: 30,
    marginBottom: 8,
  },
  mechanicMiniName: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  mechanicMiniMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mechanicMiniDistance: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    paddingVertical: 20,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  listSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  mechanicCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.md,
  },
  selectedCard: {
    borderColor: Theme.colors.primary,
  },
  mechanicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  mechanicAvatar: {
    fontSize: 40,
    marginRight: 15,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  mechanicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 15,
  },
  distanceText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Theme.colors.white,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  specialtyTag: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  mechanicActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.surface,
  },
  actionButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  routeSummaryContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  routeSummaryGradient: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeSummaryTitle: {
    color: Theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeStatText: {
    color: Theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  routeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  routeActionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
