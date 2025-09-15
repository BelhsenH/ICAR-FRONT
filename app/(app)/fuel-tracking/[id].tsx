import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Animated, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  Modal as RNModal
} from 'react-native';
import { 
  Text, 
  Provider as PaperProvider, 
  FAB, 
  Modal, 
  Portal, 
  Button,
  Card,
  DataTable,
  Divider
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../../constants/Theme';
import { ModernButton } from '../../../components/modern/ModernButton';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCarById } from '../../../scripts/car-script';
import { 
  getFuelEntries, 
  createFuelEntry, 
  deleteFuelEntry, 
  getFuelStatistics,
  FuelEntry as ApiFuelEntry 
} from '../../../scripts/fuel-script';

const { width, height } = Dimensions.get('window');

// Use the API FuelEntry type
type FuelEntry = ApiFuelEntry;

interface CarDetails {
  id: string;
  marque: string;
  modele: string;
  kilometrage: string;
}

const fuelStations = [
  'STIR',
  'Total Energies',
  'Ola Energy', 
  'STAROIL',
  'Shell',
  'AGIL'
];

const drivingConditions = [
  { value: 'city', labelFr: 'Ville', labelAr: 'مدينة' },
  { value: 'highway', labelFr: 'Autoroute', labelAr: 'طريق سريع' },
  { value: 'mixed', labelFr: 'Mixte', labelAr: 'مختلط' }
];

// Predefined fuel types with their prices (in dinars per liter)
const fuelTypes = [
  {
    value: 'sans plomb super',
    labelFr: 'Sans plomb super',
    labelAr: 'سوبر خالي من الرصاص',
    price: 2.525 // 2525 millimes
  },
  {
    value: 'gasoil sans soufre',
    labelFr: 'Gasoil sans soufre',
    labelAr: 'غازوال خالي من الكبريت',
    price: 2.205 // 2205 millimes
  },
  {
    value: 'gasoil',
    labelFr: 'Gasoil',
    labelAr: 'غازوال',
    price: 1.985 // 1985 millimes
  },
  {
    value: 'sans plomb premier',
    labelFr: 'Sans plomb premier',
    labelAr: 'خالي من الرصاص أول',
    price: 2.855 // 2855 millimes
  }
];

export default function FuelTracking() {
  const { id } = useLocalSearchParams();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const { language, translations } = useLanguage();
  const t = translations[language];

  // Form state
  const [formData, setFormData] = useState({
    date: new Date(),
    odometerReading: '',
    fuelQuantity: '',
    pricePerLiter: fuelTypes[0].price.toString(),
    totalCost: '',
    fuelStation: fuelStations[0],
    drivingConditions: drivingConditions[0].value,
    fuelType: fuelTypes[0].value
  });

  // Form validation and UI state
  const [validationErrors, setValidationErrors] = useState({
    odometerReading: false,
    pricePerLiter: false,
    totalCost: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // New state for enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, last30, last90, thisYear
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [selectedMetrics, setSelectedMetrics] = useState(['consumption', 'cost', 'efficiency']);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadData();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadCarDetails(),
      loadFuelEntries(),
      loadStatistics()
    ]);
    setLoading(false);
  };

  const loadCarDetails = async () => {
    try {
      const response = await getCarById(id as string);
      if (response.success && response.data) {
        const carData = response.data;
        setCar({
          id: carData._id,
          marque: carData.marque,
          modele: carData.modele,
          kilometrage: carData.kilometrage?.toString() || '0'
        });
      }
    } catch (error) {
      console.error('Error loading car details:', error);
    }
  };

  const loadFuelEntries = async () => {
    try {
      const response = await getFuelEntries(id as string);
      if (response.success && response.data) {
        setFuelEntries(response.data);
      }
    } catch (error) {
      console.error('Error loading fuel entries:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getFuelStatistics(id as string);
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const calculateFuelQuantity = () => {
    const totalCost = parseFloat(formData.totalCost) || 0;
    const price = parseFloat(formData.pricePerLiter) || 0;
    return price > 0 ? totalCost / price : 0;
  };

  const handleFuelTypeChange = (fuelType: string) => {
    const selectedFuel = fuelTypes.find(fuel => fuel.value === fuelType);
    setFormData({
      ...formData,
      fuelType: fuelType,
      pricePerLiter: selectedFuel ? selectedFuel.price.toString() : ''
    });
  };


  const validateForm = () => {
    const errors = {
      odometerReading: !formData.odometerReading || parseFloat(formData.odometerReading) <= 0,
      pricePerLiter: !formData.pricePerLiter || parseFloat(formData.pricePerLiter) <= 0,
      totalCost: !formData.totalCost || parseFloat(formData.totalCost) <= 0
    };

    setValidationErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleFormSubmit = () => {
    if (validateForm()) {
      setShowConfirmDialog(true);
    }
  };

  const handleAddFuelEntry = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    try {
      const fuelData = {
        carId: id as string,
        date: formData.date.toISOString(),
        odometerReading: parseFloat(formData.odometerReading),
        totalCost: parseFloat(formData.totalCost),
        fuelStation: formData.fuelStation,
        drivingConditions: formData.drivingConditions,
        fuelType: formData.fuelType
      };

      const response = await createFuelEntry(fuelData);
      
      if (response.success) {
        await loadData();
        setAddModalVisible(false);
        
        // Reset form
        const initialFuelType = fuelTypes[0];
        setFormData({
          date: new Date(),
          odometerReading: '',
          fuelQuantity: '',
          pricePerLiter: initialFuelType.price.toString(),
          totalCost: '',
          fuelStation: fuelStations[0],
          drivingConditions: drivingConditions[0].value,
          fuelType: initialFuelType.value
        });
        setValidationErrors({
          odometerReading: false,
          pricePerLiter: false,
          totalCost: false
        });

        Alert.alert(t.success || 'Succès', 'Plein ajouté avec succès');
      } else {
        Alert.alert(t.error || 'Erreur', response.message || 'Erreur lors de l\'ajout du plein');
      }
    } catch (error) {
      Alert.alert(t.error || 'Erreur', 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumberInput = (text: string, field: string) => {
    // Remove non-numeric characters except decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places based on field type
    if (parts.length === 2) {
      const decimalPlaces = field === 'pricePerLiter' ? 3 : 2;
      parts[1] = parts[1].substring(0, decimalPlaces);
      cleaned = parts[0] + '.' + parts[1];
    }
    
    return cleaned;
  };

  // Use statistics from API instead of calculating locally
  const averages = statistics;

  // Helper functions for labels
  const getDrivingConditionLabel = (value: string) => {
    const condition = drivingConditions.find(c => c.value === value);
    return language === 'fr' ? condition?.labelFr : condition?.labelAr;
  };

  const getFuelTypeLabel = (value: string) => {
    const fuel = fuelTypes.find(f => f.value === value);
    return language === 'fr' ? fuel?.labelFr : fuel?.labelAr;
  };

  // Enhanced filtering and sorting logic
  const getFilteredEntries = () => {
    let filtered = [...fuelEntries];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.fuelStation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getFuelTypeLabel(entry.fuelType)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDrivingConditionLabel(entry.drivingConditions)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply period filter
    const now = new Date();
    if (filterPeriod !== 'all') {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        switch (filterPeriod) {
          case 'last30':
            return (now.getTime() - entryDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
          case 'last90':
            return (now.getTime() - entryDate.getTime()) <= (90 * 24 * 60 * 60 * 1000);
          case 'thisYear':
            return entryDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  // Calculate filtered statistics
  const getFilteredStatistics = () => {
    if (filteredEntries.length === 0) return null;

    const totalCost = filteredEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalQuantity = filteredEntries.reduce((sum, entry) => sum + entry.fuelQuantity, 0);
    const avgConsumption = filteredEntries
      .filter(entry => entry.fuelConsumption)
      .reduce((sum, entry, _, arr) => sum + (entry.fuelConsumption || 0) / arr.length, 0);

    const sortedByDate = [...filteredEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalDistance = sortedByDate.length > 1 ?
      sortedByDate[sortedByDate.length - 1].odometerReading - sortedByDate[0].odometerReading : 0;

    return {
      totalCost,
      totalQuantity,
      avgConsumption,
      totalDistance,
      avgCostPerKm: totalDistance > 0 ? totalCost / totalDistance : 0,
      entriesCount: filteredEntries.length
    };
  };

  const filteredStats = getFilteredStatistics();


  return (
    <PaperProvider theme={LightTheme}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.accent]}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.fuelTracking || 'Suivi Carburant'}</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loading || 'Chargement...'}</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            {/* Enhanced Car Info */}
            <Animated.View style={[styles.enhancedCarCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <LinearGradient
                colors={[Colors.primary + '05', Colors.accent + '05']}
                style={styles.carCardGradient}
              >
                <View style={styles.carHeaderContainer}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    style={styles.carIconContainer}
                  >
                    <Ionicons name="car-sport" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.carInfoContainer}>
                    <Text style={styles.enhancedCarTitle}>
                      {car?.marque} {car?.modele}
                    </Text>
                    <View style={styles.carStatsRow}>
                      <View style={styles.carStatItem}>
                        <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
                        <Text style={styles.carStatText}>
                          {car?.kilometrage} km
                        </Text>
                      </View>
                      {fuelEntries.length > 0 && (
                        <View style={styles.carStatItem}>
                          <Ionicons name="library-outline" size={16} color={Colors.accent} />
                          <Text style={styles.carStatText}>
                            {fuelEntries.length} {t.fuelEntries || 'pleins'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Enhanced Statistics Dashboard */}
            {averages && (
              <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {/* Statistics Toggle and Filter Chips */}
                <View style={styles.statsControlsContainer}>
                  <View style={styles.filterChipsContainer}>
                    {['all', 'last30', 'last90', 'thisYear'].map((period) => (
                      <TouchableOpacity
                        key={period}
                        onPress={() => setFilterPeriod(period)}
                        style={[
                          styles.filterChip,
                          filterPeriod === period && styles.activeFilterChip
                        ]}
                      >
                        <Text style={[
                          styles.filterChipText,
                          filterPeriod === period && styles.activeFilterChipText
                        ]}>
                          {period === 'all' ? 'Tout' :
                           period === 'last30' ? '30j' :
                           period === 'last90' ? '90j' : 'Cette année'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Card style={styles.enhancedStatsCard}>
                  <Card.Content>
                    <View style={styles.statsHeaderContainer}>
                      <LinearGradient
                        colors={[Colors.primary + '20', Colors.accent + '10']}
                        style={styles.statsHeaderGradient}
                      >
                        <Ionicons name="analytics-outline" size={24} color={Colors.primary} />
                        <Text style={styles.enhancedSectionTitle}>
                          {t.statistics || 'Statistiques'}
                          {filterPeriod !== 'all' && (
                            <Text style={styles.statsSubtitle}>
                              {filteredStats ? ` (${filteredStats.entriesCount} entrées)` : ''}
                            </Text>
                          )}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.enhancedStatsGrid}>
                      <LinearGradient
                        colors={['#FF6B6B20', '#FF6B6B10']}
                        style={[styles.enhancedStatItem, styles.consumptionCard]}
                      >
                        <View style={styles.statIconContainer}>
                          <Ionicons name="speedometer-outline" size={20} color="#FF6B6B" />
                        </View>
                        <Text style={[styles.enhancedStatValue, { color: '#FF6B6B' }]}>
                          {filteredStats ? filteredStats.avgConsumption.toFixed(2) : averages.avgConsumption.toFixed(2)}
                        </Text>
                        <Text style={styles.statUnit}>L/100km</Text>
                        <Text style={styles.enhancedStatLabel}>{t.avgConsumption || 'Consommation moyenne'}</Text>
                        {filteredStats && filteredStats.avgConsumption !== averages.avgConsumption && (
                          <View style={styles.comparisonIndicator}>
                            <Ionicons
                              name={filteredStats.avgConsumption < averages.avgConsumption ? "trending-down" : "trending-up"}
                              size={12}
                              color={filteredStats.avgConsumption < averages.avgConsumption ? "#28A745" : "#FF6B6B"}
                            />
                          </View>
                        )}
                      </LinearGradient>

                      <LinearGradient
                        colors={['#4ECDC420', '#4ECDC410']}
                        style={[styles.enhancedStatItem, styles.costCard]}
                      >
                        <View style={styles.statIconContainer}>
                          <Ionicons name="cash-outline" size={20} color="#4ECDC4" />
                        </View>
                        <Text style={[styles.enhancedStatValue, { color: '#4ECDC4' }]}>
                          {filteredStats ? filteredStats.avgCostPerKm.toFixed(3) : averages.avgCostPerKm.toFixed(3)}
                        </Text>
                        <Text style={styles.statUnit}>DT/km</Text>
                        <Text style={styles.enhancedStatLabel}>{t.avgCostPerKm || 'Coût moyen par km'}</Text>
                        {filteredStats && filteredStats.avgCostPerKm !== averages.avgCostPerKm && (
                          <View style={styles.comparisonIndicator}>
                            <Ionicons
                              name={filteredStats.avgCostPerKm < averages.avgCostPerKm ? "trending-down" : "trending-up"}
                              size={12}
                              color={filteredStats.avgCostPerKm < averages.avgCostPerKm ? "#28A745" : "#FF6B6B"}
                            />
                          </View>
                        )}
                      </LinearGradient>

                      <LinearGradient
                        colors={['#45B7D120', '#45B7D110']}
                        style={[styles.enhancedStatItem, styles.distanceCard]}
                      >
                        <View style={styles.statIconContainer}>
                          <Ionicons name="map-outline" size={20} color="#45B7D1" />
                        </View>
                        <Text style={[styles.enhancedStatValue, { color: '#45B7D1' }]}>
                          {filteredStats ? filteredStats.totalDistance : averages.totalDistance}
                        </Text>
                        <Text style={styles.statUnit}>km</Text>
                        <Text style={styles.enhancedStatLabel}>{t.totalDistance || 'Distance totale'}</Text>
                      </LinearGradient>

                      <LinearGradient
                        colors={['#F7931E20', '#F7931E10']}
                        style={[styles.enhancedStatItem, styles.totalCostCard]}
                      >
                        <View style={styles.statIconContainer}>
                          <Ionicons name="wallet-outline" size={20} color="#F7931E" />
                        </View>
                        <Text style={[styles.enhancedStatValue, { color: '#F7931E' }]}>
                          {filteredStats ? filteredStats.totalCost.toFixed(2) : averages.totalCost.toFixed(2)}
                        </Text>
                        <Text style={styles.statUnit}>DT</Text>
                        <Text style={styles.enhancedStatLabel}>{t.totalCost || 'Coût total'}</Text>
                      </LinearGradient>
                    </View>

                    {/* Quick Insights Bar */}
                    {filteredStats && (
                      <View style={styles.quickInsightsContainer}>
                        <LinearGradient
                          colors={[Colors.accent + '10', Colors.primary + '05']}
                          style={styles.quickInsightsGradient}
                        >
                          <View style={styles.insightItem}>
                            <Ionicons name="water-outline" size={16} color={Colors.accent} />
                            <Text style={styles.insightLabel}>Quantité totale</Text>
                            <Text style={styles.insightValue}>{filteredStats.totalQuantity.toFixed(1)}L</Text>
                          </View>
                          <View style={styles.insightDivider} />
                          <View style={styles.insightItem}>
                            <Ionicons name="library-outline" size={16} color={Colors.primary} />
                            <Text style={styles.insightLabel}>Pleins</Text>
                            <Text style={styles.insightValue}>{filteredStats.entriesCount}</Text>
                          </View>
                          {filteredStats.totalDistance > 0 && (
                            <>
                              <View style={styles.insightDivider} />
                              <View style={styles.insightItem}>
                                <Ionicons name="calculator-outline" size={16} color="#F7931E" />
                                <Text style={styles.insightLabel}>Coût/100km</Text>
                                <Text style={styles.insightValue}>
                                  {((filteredStats.totalCost / filteredStats.totalDistance) * 100).toFixed(2)}DT
                                </Text>
                              </View>
                            </>
                          )}
                        </LinearGradient>
                      </View>
                    )}
                  </Card.Content>
                </Card>

                {/* Analytics Cards */}
                <View style={styles.analyticsContainer}>
                  <Card style={styles.analyticsCard}>
                    <Card.Content>
                      <View style={styles.analyticsHeader}>
                        <LinearGradient
                          colors={[Colors.primary, Colors.accent]}
                          style={styles.analyticsIconBg}
                        >
                          <Ionicons name="trending-up" size={18} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.analyticsTitle}>{t.insights || 'Insights'}</Text>
                      </View>
                      
                      {averages.avgConsumption > 0 && (
                        <View style={styles.insightContainer}>
                          <View style={styles.insightDot} />
                          <Text style={styles.insightText}>
                            {averages.avgConsumption < 7 ? 
                              (t.efficientConsumption || 'Consommation efficace! Bien joué.') :
                              averages.avgConsumption < 10 ?
                              (t.moderateConsumption || 'Consommation modérée. Bon travail.') :
                              (t.highConsumption || 'Consommation élevée. Considérez une conduite plus économique.')}
                          </Text>
                        </View>
                      )}
                      
                      {fuelEntries.length >= 3 && (
                        <View style={styles.insightContainer}>
                          <View style={styles.insightDot} />
                          <Text style={styles.insightText}>
                            {t.regularTracking || `Suivi régulier détecté! ${fuelEntries.length} pleins enregistrés.`}
                          </Text>
                        </View>
                      )}
                      
                      {averages.totalDistance > 1000 && (
                        <View style={styles.insightContainer}>
                          <View style={styles.insightDot} />
                          <Text style={styles.insightText}>
                            {t.highMileage || `Kilométrage élevé: ${averages.totalDistance}km parcourus.`}
                          </Text>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                  
                  {/* Trends and Performance Cards */}
                  {fuelEntries.length >= 2 && (
                    <View style={styles.trendsContainer}>
                      <Card style={styles.trendCard}>
                        <Card.Content>
                          <View style={styles.trendHeader}>
                            <LinearGradient
                              colors={['#FF6B6B', '#FF8E8E']}
                              style={styles.trendIconBg}
                            >
                              <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.trendTitle}>{t.consumptionTrend || 'Tendance Consommation'}</Text>
                          </View>
                          
                          {/* Simple visual trend representation */}
                          <View style={styles.trendVisualization}>
                            {fuelEntries.slice(-5).reverse().map((entry, index) => {
                              const consumption = entry.fuelConsumption || 0;
                              const maxConsumption = Math.max(...fuelEntries.map(e => e.fuelConsumption || 0));
                              const barHeight = consumption > 0 ? Math.max((consumption / maxConsumption) * 60, 10) : 10;
                              const barColor = consumption < 7 ? '#28A745' : consumption < 10 ? '#F7931E' : '#FF6B6B';
                              
                              return (
                                <View key={index} style={styles.trendBar}>
                                  <View
                                    style={[
                                      styles.trendBarFill,
                                      { height: barHeight, backgroundColor: barColor }
                                    ]}
                                  />
                                  <Text style={styles.trendBarLabel}>
                                    {consumption > 0 ? consumption.toFixed(1) : '-'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                          
                          <View style={styles.trendSummary}>
                            <Text style={styles.trendSummaryText}>
                              {t.last5Entries || 'Dernières 5 entrées'} - {t.consumptionPattern || 'Tendance de consommation'}
                            </Text>
                          </View>
                        </Card.Content>
                      </Card>
                      
                      <Card style={styles.performanceCard}>
                        <Card.Content>
                          <View style={styles.performanceHeader}>
                            <LinearGradient
                              colors={['#4ECDC4', '#44B3A9']}
                              style={styles.performanceIconBg}
                            >
                              <Ionicons name="speedometer-outline" size={18} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.performanceTitle}>{t.performance || 'Performance'}</Text>
                          </View>
                          
                          <View style={styles.performanceMetrics}>
                            <View style={styles.performanceMetric}>
                              <Text style={styles.performanceLabel}>{t.bestConsumption || 'Meilleure'}</Text>
                              <Text style={[styles.performanceValue, { color: '#28A745' }]}>
                                {Math.min(...fuelEntries.filter(e => e.fuelConsumption).map(e => e.fuelConsumption!)).toFixed(2)} L/100km
                              </Text>
                            </View>
                            <View style={styles.performanceMetric}>
                              <Text style={styles.performanceLabel}>{t.worstConsumption || 'Pire'}</Text>
                              <Text style={[styles.performanceValue, { color: '#FF6B6B' }]}>
                                {Math.max(...fuelEntries.filter(e => e.fuelConsumption).map(e => e.fuelConsumption!)).toFixed(2)} L/100km
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.performanceGoal}>
                            <LinearGradient
                              colors={[Colors.accent + '20', Colors.primary + '10']}
                              style={styles.goalContainer}
                            >
                              <Ionicons name="flag-outline" size={16} color={Colors.accent} />
                              <Text style={styles.goalText}>
                                {averages.avgConsumption < 8 ? 
                                  (t.excellentEfficiency || 'Excellente efficacité!') :
                                  (t.roomForImprovement || 'Place à l’amélioration')}
                              </Text>
                            </LinearGradient>
                          </View>
                        </Card.Content>
                      </Card>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Enhanced Fuel Entries History */}
            <Card style={styles.enhancedHistoryCard}>
              <Card.Content>
                <View style={styles.historyHeaderContainer}>
                  <LinearGradient
                    colors={[Colors.accent + '20', Colors.primary + '10']}
                    style={styles.historyHeaderGradient}
                  >
                    <Ionicons name="time-outline" size={24} color={Colors.accent} />
                    <Text style={styles.enhancedSectionTitle}>
                      {t.fuelHistory || 'Historique des pleins'}
                      {filteredEntries.length !== fuelEntries.length && (
                        <Text style={styles.statsSubtitle}>
                          {' '}({filteredEntries.length}/{fuelEntries.length})
                        </Text>
                      )}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Search and Sort Controls */}
                {fuelEntries.length > 0 && (
                  <View style={styles.historyControlsContainer}>
                    <View style={styles.searchContainer}>
                      <LinearGradient
                        colors={[Colors.background, '#F8F9FA']}
                        style={styles.searchInputContainer}
                      >
                        <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
                        <TextInput
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Rechercher par station, carburant..."
                          placeholderTextColor={Colors.textSecondary}
                        />
                        {searchQuery ? (
                          <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                          </TouchableOpacity>
                        ) : null}
                      </LinearGradient>
                    </View>

                   
                  </View>
                )}
                
                {fuelEntries.length === 0 ? (
                  <LinearGradient
                    colors={[Colors.background, '#F8F9FA']}
                    style={styles.enhancedEmptyContainer}
                  >
                    <View style={styles.emptyIconContainer}>
                      <LinearGradient
                        colors={[Colors.primary + '20', Colors.accent + '20']}
                        style={styles.emptyIconGradient}
                      >
                        <Ionicons name="car-outline" size={48} color={Colors.primary} />
                      </LinearGradient>
                    </View>
                    <Text style={styles.enhancedEmptyText}>
                      {t.noFuelEntries || 'Aucun plein enregistré'}
                    </Text>
                    <Text style={styles.enhancedEmptySubtext}>
                      {t.addFirstFuelEntry || 'Commencez par ajouter votre premier plein'}
                    </Text>
                    <LinearGradient
                      colors={[Colors.primary, Colors.accent]}
                      style={styles.addFirstEntryButton}
                    >
                      <TouchableOpacity
                        onPress={() => setAddModalVisible(true)}
                        style={styles.addFirstEntryButtonContent}
                      >
                        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.addFirstEntryButtonText}>
                          {t.addFirstEntry || 'Ajouter le premier plein'}
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </LinearGradient>
                ) : filteredEntries.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <LinearGradient
                      colors={[Colors.accent + '10', Colors.primary + '05']}
                      style={styles.noResultsGradient}
                    >
                      <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
                      <Text style={styles.noResultsText}>Aucun résultat trouvé</Text>
                      <Text style={styles.noResultsSubtext}>
                        Essayez de modifier vos critères de recherche ou de filtrage
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSearchQuery('');
                          setFilterPeriod('all');
                        }}
                        style={styles.clearFiltersButton}
                      >
                        <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ) : (
                  // Enhanced Mobile-Optimized Cards Layout
                  <View style={styles.mobileCardsContainer}>
                    {filteredEntries.map((entry, index) => (
                      <View key={entry.id} style={[
                        styles.fuelEntryCard,
                        index % 2 === 0 ? styles.evenCard : styles.oddCard
                      ]}>
                        <View style={styles.cardHeader}>
                          <View style={styles.dateSection}>
                            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                            <Text style={styles.cardDateText}>{entry.date}</Text>
                          </View>
                          <View style={styles.consumptionBadge}>
                            {entry.fuelConsumption ? (
                              <Text style={[
                                styles.consumptionBadgeText,
                                {
                                  color: entry.fuelConsumption < 7 ? '#28A745' :
                                         entry.fuelConsumption < 10 ? '#F7931E' : '#FF6B6B'
                                }
                              ]}>
                                {entry.fuelConsumption.toFixed(2)} L/100km
                              </Text>
                            ) : (
                              <Text style={styles.noBadgeText}>- L/100km</Text>
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.cardContent}>
                          <View style={styles.primaryMetricsRow}>
                            <View style={styles.metricItem}>
                              <LinearGradient
                                colors={['#45B7D120', '#45B7D110']}
                                style={styles.metricIconContainer}
                              >
                                <Ionicons name="water-outline" size={16} color="#45B7D1" />
                              </LinearGradient>
                              <View style={styles.metricContent}>
                                <Text style={styles.metricLabel}>{t.quantity || 'Quantité'}</Text>
                                <Text style={styles.metricValue}>{Number(entry.fuelQuantity).toFixed(2)} L</Text>
                              </View>
                            </View>

                            <View style={styles.metricItem}>
                              <LinearGradient
                                colors={['#F7931E20', '#F7931E10']}
                                style={styles.metricIconContainer}
                              >
                                <Ionicons name="cash-outline" size={16} color="#F7931E" />
                              </LinearGradient>
                              <View style={styles.metricContent}>
                                <Text style={styles.metricLabel}>{t.cost || 'Coût'}</Text>
                                <Text style={[styles.metricValue, { color: '#F7931E', fontWeight: '700' }]}>
                                  {entry.totalCost.toFixed(2)} DT
                                </Text>
                              </View>
                            </View>

                            <View style={styles.metricItem}>
                              <LinearGradient
                                colors={['#9C27B020', '#9C27B010']}
                                style={styles.metricIconContainer}
                              >
                                <Ionicons name="speedometer-outline" size={16} color="#9C27B0" />
                              </LinearGradient>
                              <View style={styles.metricContent}>
                                <Text style={styles.metricLabel}>Kilométrage</Text>
                                <Text style={[styles.metricValue, { color: '#9C27B0' }]}>
                                  {entry.odometerReading.toLocaleString()} km
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.secondaryMetricsRow}>
                            <View style={styles.detailChip}>
                              <Ionicons name="business-outline" size={14} color={Colors.textSecondary} />
                              <Text style={styles.detailChipText}>{entry.fuelStation}</Text>
                            </View>
                            <View style={styles.detailChip}>
                              <Ionicons name="flash-outline" size={14} color={Colors.textSecondary} />
                              <Text style={styles.detailChipText}>{getFuelTypeLabel(entry.fuelType)}</Text>
                            </View>
                            <View style={styles.detailChip}>
                              <Ionicons name="car-outline" size={14} color={Colors.textSecondary} />
                              <Text style={styles.detailChipText}>{getDrivingConditionLabel(entry.drivingConditions)}</Text>
                            </View>
                          </View>

                          {/* Price per liter info */}
                          <View style={styles.priceInfoRow}>
                            <Text style={styles.priceInfoText}>
                              Prix: {(entry.totalCost / entry.fuelQuantity).toFixed(3)} DT/L
                            </Text>
                            {entry.fuelConsumption && (
                              <View style={styles.efficiencyBadge}>
                                <Ionicons
                                  name={entry.fuelConsumption < 7 ? "leaf-outline" : entry.fuelConsumption < 10 ? "analytics-outline" : "alert-outline"}
                                  size={12}
                                  color={entry.fuelConsumption < 7 ? "#28A745" : entry.fuelConsumption < 10 ? "#F7931E" : "#FF6B6B"}
                                />
                                <Text style={[
                                  styles.efficiencyText,
                                  {
                                    color: entry.fuelConsumption < 7 ? "#28A745" : entry.fuelConsumption < 10 ? "#F7931E" : "#FF6B6B"
                                  }
                                ]}>
                                  {entry.fuelConsumption < 7 ? 'Efficace' : entry.fuelConsumption < 10 ? 'Normal' : 'Élevé'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        )}

        {/* Enhanced FAB */}
        <View style={styles.enhancedFabContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            style={styles.enhancedFabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.enhancedFabButton}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Add Fuel Entry Modal */}
        <Portal>
          <Modal
            visible={addModalVisible}
            onDismiss={() => {
              if (!isSubmitting) {
                setAddModalVisible(false);
                setValidationErrors({ odometerReading: false, pricePerLiter: false, totalCost: false });
              }
            }}
            contentContainerStyle={styles.enhancedModalContainer}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={styles.modalHeaderGradient}
              >
                <View style={styles.modalIconContainer}>
                  <Ionicons name="car" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.enhancedModalTitle}>{t.addFuelEntry || 'Ajouter un plein'}</Text>
              </LinearGradient>
            </View>
            
            <ScrollView style={styles.enhancedModalContent} showsVerticalScrollIndicator={false}>

              {/* Date */}
              <Text style={styles.inputLabel}>{t.date || 'Date'}</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateInput}
              >
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString('fr-FR')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, date: selectedDate });
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}

              {/* Kilométrage compteur */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="speedometer-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.odometerReading || 'Kilométrage compteur'} (km) *
                  </Text>
                </View>
                <View style={[styles.enhancedInputContainer, validationErrors.odometerReading && styles.errorInput]}>
                  <TextInput
                    style={styles.enhancedInput}
                    value={formData.odometerReading}
                    onChangeText={(text) => {
                      const formatted = formatNumberInput(text, 'odometer');
                      setFormData({ ...formData, odometerReading: formatted });
                      if (validationErrors.odometerReading) {
                        setValidationErrors({ ...validationErrors, odometerReading: false });
                      }
                    }}
                    placeholder={t.enterOdometerReading || 'Entrez le kilométrage'}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textLight}
                  />
                  {validationErrors.odometerReading && (
                    <Ionicons name="alert-circle" size={20} color="#FF6B6B" style={styles.errorIcon} />
                  )}
                </View>
                {validationErrors.odometerReading && (
                  <Text style={styles.errorText}>Veuillez entrer un kilométrage valide</Text>
                )}
              </View>

              {/* Type de carburant */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="flash-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.fuelType || 'Type de carburant'}
                  </Text>
                </View>
                <View style={styles.enhancedPickerContainer}>
                  <Picker
                    selectedValue={formData.fuelType}
                    onValueChange={handleFuelTypeChange}
                    style={styles.enhancedPicker}
                  >
                    {fuelTypes.map((fuel) => (
                      <Picker.Item
                        key={fuel.value}
                        label={`${language === 'fr' ? fuel.labelFr : fuel.labelAr} (${fuel.price} DT/L)`}
                        value={fuel.value}
                      />
                    ))}
                  </Picker>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} style={styles.pickerIcon} />
                </View>
              </View>

              {/* Prix par litre (Auto-complété) */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.pricePerLiter || 'Prix par litre'} (DT)
                  </Text>
                </View>
                <LinearGradient
                  colors={[Colors.primary + '10', Colors.accent + '05']}
                  style={styles.calculatedCostContainer}
                >
                  <Text style={styles.enhancedCalculatedText}>
                    {formData.pricePerLiter ? `${parseFloat(formData.pricePerLiter).toFixed(3)} DT/L` : 'Sélectionnez un type de carburant'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                </LinearGradient>
                <Text style={[styles.errorText, { color: Colors.textSecondary, fontStyle: 'italic' }]}>
                  Prix automatiquement défini selon le type de carburant
                </Text>
              </View>

              {/* Coût total */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="calculator-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.totalCost || 'Coût total'} (DT) *
                  </Text>
                </View>
                <View style={[styles.enhancedInputContainer, validationErrors.totalCost && styles.errorInput]}>
                  <TextInput
                    style={styles.enhancedInput}
                    value={formData.totalCost}
                    onChangeText={(text) => {
                      const formatted = formatNumberInput(text, 'pricePerLiter');
                      setFormData({ ...formData, totalCost: formatted });
                      if (validationErrors.totalCost) {
                        setValidationErrors({ ...validationErrors, totalCost: false });
                      }
                    }}
                    placeholder={t.enterTotalCost || 'Entrez le coût total'}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                  {validationErrors.totalCost && (
                    <Ionicons name="alert-circle" size={20} color="#FF6B6B" style={styles.errorIcon} />
                  )}
                </View>
                {validationErrors.totalCost && (
                  <Text style={styles.errorText}>Veuillez entrer un coût total valide</Text>
                )}
              </View>

              {/* Quantité de carburant (Calculée) */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="water-outline" size={16} color={Colors.accent} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.fuelQuantity || 'Quantité de carburant'} (L)
                  </Text>
                </View>
                <LinearGradient
                  colors={[Colors.accent + '10', Colors.primary + '05']}
                  style={styles.calculatedCostContainer}
                >
                  <Text style={styles.enhancedCalculatedText}>
                    {calculateFuelQuantity().toFixed(2)} L
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </LinearGradient>
                <Text style={[styles.errorText, { color: Colors.textSecondary, fontStyle: 'italic' }]}>
                  Calculé automatiquement: Coût total ÷ Prix par litre
                </Text>
              </View>

              {/* Station service */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="business-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.fuelStation || 'Station service'}
                  </Text>
                </View>
                <View style={styles.enhancedPickerContainer}>
                  <Picker
                    selectedValue={formData.fuelStation}
                    onValueChange={(value) => setFormData({ ...formData, fuelStation: value })}
                    style={styles.enhancedPicker}
                  >
                    {fuelStations.map((station) => (
                      <Picker.Item key={station} label={station} value={station} />
                    ))}
                  </Picker>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} style={styles.pickerIcon} />
                </View>
              </View>

              {/* Conditions de conduite */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelContainer}>
                  <Ionicons name="car-outline" size={16} color={Colors.primary} />
                  <Text style={styles.enhancedInputLabel}>
                    {t.drivingConditions || 'Conditions de conduite'}
                  </Text>
                </View>
                <View style={styles.enhancedPickerContainer}>
                  <Picker
                    selectedValue={formData.drivingConditions}
                    onValueChange={(value) => setFormData({ ...formData, drivingConditions: value })}
                    style={styles.enhancedPicker}
                  >
                    {drivingConditions.map((condition) => (
                      <Picker.Item 
                        key={condition.value} 
                        label={language === 'fr' ? condition.labelFr : condition.labelAr}
                        value={condition.value} 
                      />
                    ))}
                  </Picker>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} style={styles.pickerIcon} />
                </View>
              </View>

              <View style={styles.enhancedModalButtonContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (!isSubmitting) {
                      setAddModalVisible(false);
                      setValidationErrors({ odometerReading: false, pricePerLiter: false, totalCost: false });
                    }
                  }}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>{t.cancel || 'Annuler'}</Text>
                </TouchableOpacity>
                
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={[styles.submitButtonGradient, isSubmitting && styles.disabledButton]}
                >
                  <TouchableOpacity
                    onPress={handleFormSubmit}
                    style={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.submitButtonText}>Ajout en cours...</Text>
                      </View>
                    ) : (
                      <View style={styles.submitButtonContent}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.submitButtonText}>{t.add || 'Ajouter'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </ScrollView>
          </Modal>
          
          {/* Confirmation Dialog */}
          <Modal
            visible={showConfirmDialog}
            onDismiss={() => setShowConfirmDialog(false)}
            contentContainerStyle={styles.confirmDialogContainer}
          >
            <LinearGradient
              colors={[Colors.primary + '10', Colors.accent + '05']}
              style={styles.confirmDialogContent}
            >
              <View style={styles.confirmIconContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.confirmIcon}
                >
                  <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <Text style={styles.confirmTitle}>Confirmer l'ajout</Text>
              <Text style={styles.confirmMessage}>
                Voulez-vous vraiment ajouter ce plein de {calculateFuelQuantity().toFixed(2)}L pour un coût total de {parseFloat(formData.totalCost || '0').toFixed(2)} DT ?
              </Text>
              
              <View style={styles.confirmButtonContainer}>
                <TouchableOpacity
                  onPress={() => setShowConfirmDialog(false)}
                  style={styles.confirmCancelButton}
                >
                  <Text style={styles.confirmCancelText}>Annuler</Text>
                </TouchableOpacity>
                
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={styles.confirmSubmitButton}
                >
                  <TouchableOpacity
                    onPress={handleAddFuelEntry}
                    style={styles.confirmSubmitButtonContent}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmSubmitText}>Confirmer</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </LinearGradient>
          </Modal>

        </Portal>
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
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  enhancedCarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    elevation: 8,
  },
  carCardGradient: {
    padding: Spacing.lg,
  },
  carHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  carInfoContainer: {
    flex: 1,
  },
  enhancedCarTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  carStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  carStatText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  carTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  carSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  enhancedStatsCard: {
    marginBottom: Spacing.lg,
    ...Shadows.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    elevation: 8,
  },
  statsHeaderContainer: {
    marginBottom: Spacing.lg,
  },
  statsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: -4,
    marginTop: -4,
  },
  enhancedSectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  enhancedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  enhancedStatItem: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
    elevation: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  enhancedStatValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  enhancedStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  consumptionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  costCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  distanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#45B7D1',
  },
  totalCostCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F7931E',
  },
  analyticsContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  analyticsCard: {
    ...Shadows.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    elevation: 4,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  analyticsIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  analyticsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  trendsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  trendCard: {
    ...Shadows.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  trendIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  trendTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  trendVisualization: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarFill: {
    width: 20,
    borderRadius: 10,
    marginBottom: Spacing.xs,
    minHeight: 10,
  },
  trendBarLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  trendSummary: {
    alignItems: 'center',
  },
  trendSummaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  performanceCard: {
    ...Shadows.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  performanceIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  performanceTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  performanceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  performanceGoal: {
    marginTop: Spacing.xs,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  goalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  enhancedHistoryCard: {
    marginBottom: 80,
    ...Shadows.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    elevation: 8,
  },
  historyHeaderContainer: {
    marginBottom: Spacing.lg,
  },
  historyHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: -4,
    marginTop: -4,
  },
  enhancedEmptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
    marginHorizontal: -Spacing.sm,
  },
  emptyIconContainer: {
    marginBottom: Spacing.lg,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedEmptyText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  enhancedEmptySubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  addFirstEntryButton: {
    borderRadius: BorderRadius.md,
    ...Shadows.md,
    elevation: 4,
  },
  addFirstEntryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  addFirstEntryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  mobileCardsContainer: {
    gap: Spacing.sm,
  },
  fuelEntryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  evenCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  oddCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDateText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  consumptionBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  consumptionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  noBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  cardContent: {
    paddingTop: Spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  enhancedTableContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  enhancedDataTable: {
    backgroundColor: 'transparent',
  },
  enhancedTableHeader: {
    backgroundColor: Colors.primary + '15',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary + '30',
  },
  enhancedHeaderText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  enhancedTableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    minHeight: 56,
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8F9FA',
  },
  enhancedCellText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  quantityText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  unitText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  costText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  consumptionContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
  },
  consumptionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  statsCard: {
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  historyCard: {
    marginBottom: 80,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textLight,
    textAlign: 'center',
  },
  enhancedFabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  enhancedFabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Shadows.xl,
    elevation: 12,
  },
  enhancedFabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    maxHeight: height * 0.9,
    ...Shadows.lg,
  },
  enhancedModalContainer: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    maxHeight: height * 0.9,
    ...Shadows.xl,
    elevation: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  modalHeader: {
    marginBottom: Spacing.lg,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  enhancedModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  enhancedModalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  enhancedInputLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  enhancedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
    ...Shadows.sm,
    elevation: 2,
  },
  enhancedInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  errorInput: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FF6B6B05',
  },
  errorIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  calculatedCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.accent + '30',
    ...Shadows.sm,
    elevation: 2,
  },
  enhancedCalculatedText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.accent,
  },
  enhancedPickerContainer: {
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    ...Shadows.sm,
    elevation: 2,
    overflow: 'hidden',
  },
  enhancedPicker: {
    height: 50,
    color: Colors.text,
  },
  pickerIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: 15,
    pointerEvents: 'none',
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  disabledInput: {
    backgroundColor: Colors.textLight,
    justifyContent: 'center',
  },
  calculatedText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  picker: {
    height: 50,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  enhancedModalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitButtonGradient: {
    flex: 1,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
    elevation: 4,
  },
  submitButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmDialogContainer: {
    backgroundColor: Colors.surface,
    margin: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.xl,
    elevation: 20,
    overflow: 'hidden',
  },
  confirmDialogContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  confirmIconContainer: {
    marginBottom: Spacing.lg,
  },
  confirmIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  confirmTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  confirmCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  confirmSubmitButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
    elevation: 4,
  },
  confirmSubmitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  confirmSubmitText: {
    fontSize: Typography.fontSize.base,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // New styles for enhanced features
  statsControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  filterChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  comparisonIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  quickInsightsContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  quickInsightsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    marginRight: Spacing.xs,
  },
  insightValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  insightDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.textLight,
    marginHorizontal: Spacing.sm,
  },
  historyControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginLeft: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  sortButtonText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  noResultsContainer: {
    paddingVertical: Spacing.xl,
  },
  noResultsGradient: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  noResultsText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noResultsSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  clearFiltersButton: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearFiltersText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  secondaryMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  detailChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  priceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  priceInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  efficiencyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});