import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import VehicleService, { VehicleUsage } from '../../../services/vehicleService';
import { Colors } from '../../../constants/Colors';

const UsageTracking = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [usageData, setUsageData] = useState<VehicleUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsage, setNewUsage] = useState<Partial<VehicleUsage>>({
    sessionType: 'manual_entry',
    odometerReading: 0,
    parkingType: 'street',
    towingFrequency: 'never',
    environmentalData: {},
    extremeTemperatureExposure: { frequency: 'rarely' },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadUsageData();
    }
  }, [id, token]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const response = await VehicleService.getUsageData(id!, 50, 0, token!);
      setUsageData(response.usageData);
    } catch (error) {
      console.error('Error loading usage data:', error);
      Alert.alert('Error', 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUsage = async () => {
    try {
      setSaving(true);
      await VehicleService.addUsageData(id!, newUsage, token!);
      setShowAddModal(false);
      setNewUsage({
        sessionType: 'manual_entry',
        odometerReading: 0,
        parkingType: 'street',
        towingFrequency: 'never',
        environmentalData: {},
        extremeTemperatureExposure: { frequency: 'rarely' },
      });
      loadUsageData();
      Alert.alert('Success', 'Usage data added successfully');
    } catch (error) {
      console.error('Error adding usage data:', error);
      Alert.alert('Error', 'Failed to add usage data');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderUsageCard = (usage: VehicleUsage) => (
    <View key={usage._id} style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageDate}>{formatDate(usage.createdAt)}</Text>
        <View style={[styles.sessionTypeBadge, getSessionTypeStyle(usage.sessionType)]}>
          <Text style={styles.sessionTypeText}>{usage.sessionType.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.usageDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="speedometer" size={16} color={Colors.light.tint} />
          <Text style={styles.detailText}>Odometer: {usage.odometerReading.toLocaleString()} km</Text>
        </View>
        
        {usage.tripDistance && (
          <View style={styles.detailRow}>
            <Ionicons name="car" size={16} color={Colors.light.tint} />
            <Text style={styles.detailText}>Trip Distance: {usage.tripDistance} km</Text>
          </View>
        )}
        
        {usage.cityDrivingPercentage !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color={Colors.light.tint} />
            <Text style={styles.detailText}>
              City: {usage.cityDrivingPercentage}% | Highway: {usage.highwayDrivingPercentage}%
            </Text>
          </View>
        )}
        
        {usage.harshAccelerationEvents !== undefined && usage.harshAccelerationEvents > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="warning" size={16} color="#ff6b6b" />
            <Text style={styles.detailText}>
              Harsh Events: {usage.harshAccelerationEvents} accel, {usage.harshBrakingEvents} brake
            </Text>
          </View>
        )}
        
        {usage.parkingType && (
          <View style={styles.detailRow}>
            <Ionicons name="home" size={16} color={Colors.light.tint} />
            <Text style={styles.detailText}>Parking: {usage.parkingType.replace('_', ' ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const getSessionTypeStyle = (sessionType: string) => {
    switch (sessionType) {
      case 'app_open':
        return { backgroundColor: '#e3f2fd' };
      case 'trip_end':
        return { backgroundColor: '#e8f5e8' };
      case 'manual_entry':
        return { backgroundColor: '#fff3e0' };
      default:
        return { backgroundColor: '#f5f5f5' };
    }
  };

  const renderAddUsageModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Usage Data</Text>
          <TouchableOpacity onPress={handleAddUsage} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              value={newUsage.odometerReading?.toString() || ''}
              onChangeText={(text) => setNewUsage({ ...newUsage, odometerReading: parseInt(text) || 0 })}
              keyboardType="numeric"
              placeholder="Enter current odometer reading"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Trip Distance (km)</Text>
            <TextInput
              style={styles.input}
              value={newUsage.tripDistance?.toString() || ''}
              onChangeText={(text) => setNewUsage({ ...newUsage, tripDistance: parseFloat(text) || undefined })}
              keyboardType="numeric"
              placeholder="Enter trip distance"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>City Driving (%)</Text>
            <TextInput
              style={styles.input}
              value={newUsage.cityDrivingPercentage?.toString() || ''}
              onChangeText={(text) => {
                const cityPercent = parseInt(text) || 0;
                setNewUsage({
                  ...newUsage,
                  cityDrivingPercentage: cityPercent,
                  highwayDrivingPercentage: 100 - cityPercent,
                });
              }}
              keyboardType="numeric"
              placeholder="0-100"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Harsh Acceleration Events</Text>
            <TextInput
              style={styles.input}
              value={newUsage.harshAccelerationEvents?.toString() || ''}
              onChangeText={(text) => setNewUsage({ ...newUsage, harshAccelerationEvents: parseInt(text) || 0 })}
              keyboardType="numeric"
              placeholder="Number of events"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Harsh Braking Events</Text>
            <TextInput
              style={styles.input}
              value={newUsage.harshBrakingEvents?.toString() || ''}
              onChangeText={(text) => setNewUsage({ ...newUsage, harshBrakingEvents: parseInt(text) || 0 })}
              keyboardType="numeric"
              placeholder="Number of events"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cold Starts Today</Text>
            <TextInput
              style={styles.input}
              value={newUsage.coldStartsCount?.toString() || ''}
              onChangeText={(text) => setNewUsage({ ...newUsage, coldStartsCount: parseInt(text) || 0 })}
              keyboardType="numeric"
              placeholder="Number of cold starts"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Parking Type</Text>
            <View style={styles.optionsContainer}>
              {['garage', 'covered', 'street', 'parking_lot'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    newUsage.parkingType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setNewUsage({ ...newUsage, parkingType: type as any })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      newUsage.parkingType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Towing Frequency</Text>
            <View style={styles.optionsContainer}>
              {['never', 'occasionally', 'frequently'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    newUsage.towingFrequency === freq && styles.optionButtonSelected,
                  ]}
                  onPress={() => setNewUsage({ ...newUsage, towingFrequency: freq as any })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      newUsage.towingFrequency === freq && styles.optionTextSelected,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Load Carrying</Text>
              <Switch
                value={newUsage.loadCarrying || false}
                onValueChange={(value) => setNewUsage({ ...newUsage, loadCarrying: value })}
                trackColor={{ false: '#767577', true: Colors.light.tint }}
                thumbColor={newUsage.loadCarrying ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Environmental Data</Text>
            <TextInput
              style={styles.input}
              value={newUsage.environmentalData?.city || ''}
              onChangeText={(text) =>
                setNewUsage({
                  ...newUsage,
                  environmentalData: { ...newUsage.environmentalData, city: text },
                })
              }
              placeholder="City name"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading usage data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usage Tracking</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {usageData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No usage data yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first usage entry to start tracking</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyStateButtonText}>Add Usage Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          usageData.map(renderUsageCard)
        )}
      </ScrollView>

      {renderAddUsageModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  usageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageDate: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  sessionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  usageDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  saveButton: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  optionText: {
    fontSize: 14,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default UsageTracking;