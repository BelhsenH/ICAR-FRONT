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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import VehicleService, { Vehicle } from '../../../services/vehicleService';
import { Colors } from '../../../constants/Colors';

const VehicleProfileEnhanced = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Partial<Vehicle>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadVehicleProfile();
    }
  }, [id, token]);

  const loadVehicleProfile = async () => {
    try {
      setLoading(true);
      const vehicleData = await VehicleService.getVehicleProfile(id!, token!);
      setVehicle(vehicleData);
      setEditedVehicle(vehicleData);
    } catch (error) {
      console.error('Error loading vehicle profile:', error);
      Alert.alert('Error', 'Failed to load vehicle profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedVehicle = await VehicleService.updateVehicleProfile(id!, editedVehicle, token!);
      setVehicle(updatedVehicle);
      setEditMode(false);
      Alert.alert('Success', 'Vehicle profile updated successfully');
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      Alert.alert('Error', 'Failed to update vehicle profile');
    } finally {
      setSaving(false);
    }
  };

  const renderEditableField = (
    label: string,
    value: string | number | undefined,
    field: keyof Vehicle,
    placeholder?: string,
    options?: { label: string; value: any }[]
  ) => {
    if (editMode) {
      if (options) {
        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.optionsContainer}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    editedVehicle[field] === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => setEditedVehicle({ ...editedVehicle, [field]: option.value })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      editedVehicle[field] === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.input}
            value={editedVehicle[field]?.toString() || ''}
            onChangeText={(text) => {
              const numericFields = ['year', 'engineSize', 'kilometrage'];
              setEditedVehicle({
                ...editedVehicle,
                [field]: numericFields.includes(field as string) ? parseFloat(text) || 0 : text,
              });
            }}
            placeholder={placeholder}
            keyboardType={['year', 'engineSize', 'kilometrage'].includes(field as string) ? 'numeric' : 'default'}
          />
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value?.toString() || 'Not specified'}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading vehicle profile...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const engineTypeOptions = [
    { label: 'Petrol', value: 'Petrol' },
    { label: 'Diesel', value: 'Diesel' },
    { label: 'Electric', value: 'Electric' },
    { label: 'Hybrid', value: 'Hybrid' },
    { label: 'Plug-in Hybrid', value: 'Plug-in Hybrid' },
    { label: 'LPG', value: 'LPG' },
    { label: 'CNG', value: 'CNG' },
  ];

  const transmissionOptions = [
    { label: 'Manual', value: 'Manual' },
    { label: 'Automatic', value: 'Automatic' },
    { label: 'CVT', value: 'CVT' },
    { label: 'Semi-automatic', value: 'Semi-automatic' },
  ];

  const drivetrainOptions = [
    { label: 'Front-Wheel Drive', value: 'FWD' },
    { label: 'Rear-Wheel Drive', value: 'RWD' },
    { label: 'All-Wheel Drive', value: 'AWD' },
    { label: '4-Wheel Drive', value: '4WD' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editMode) {
              setEditedVehicle(vehicle);
            }
            setEditMode(!editMode);
          }}
        >
          <Ionicons name={editMode ? "close" : "create"} size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleTitle}>
          {vehicle.marque} {vehicle.modele}
        </Text>
        <Text style={styles.vehicleSubtitle}>
          {vehicle.year || new Date(vehicle.datePremiereMiseEnCirculation).getFullYear()}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderEditableField('VIN', vehicle.vin, 'vin')}
          {renderEditableField('Brand', vehicle.marque, 'marque')}
          {renderEditableField('Model', vehicle.modele, 'modele')}
          {renderEditableField('Year', vehicle.year, 'year', 'Enter vehicle year')}
          {renderEditableField('Trim Level', vehicle.trim, 'trim', 'Enter trim level')}
          {renderEditableField('License Plate', vehicle.numeroImmatriculation, 'numeroImmatriculation')}
          {renderEditableField('Current Mileage', vehicle.kilometrage, 'kilometrage', 'Enter current mileage')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine & Drivetrain</Text>
          {renderEditableField('Engine Type', vehicle.engineType, 'engineType', undefined, engineTypeOptions)}
          {renderEditableField('Engine Size (L)', vehicle.engineSize, 'engineSize', 'Enter engine size')}
          {renderEditableField('Transmission', vehicle.transmissionType, 'transmissionType', undefined, transmissionOptions)}
          {renderEditableField('Drivetrain', vehicle.drivetrain, 'drivetrain', undefined, drivetrainOptions)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          {renderEditableField('Country', vehicle.plateCountry, 'plateCountry', 'Enter country')}
          {renderEditableField('Region', vehicle.plateRegion, 'plateRegion', 'Enter region')}
        </View>

        {editMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditedVehicle(vehicle);
                setEditMode(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!editMode && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/(app)/usage-tracking/${id}`)}
            >
              <Ionicons name="analytics" size={24} color={Colors.light.tint} />
              <Text style={styles.quickActionText}>Usage Tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/(app)/maintenance-history/${id}`)}
            >
              <Ionicons name="build" size={24} color={Colors.light.tint} />
              <Text style={styles.quickActionText}>Maintenance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/(app)/symptom-report/${id}`)}
            >
              <Ionicons name="warning" size={24} color={Colors.light.tint} />
              <Text style={styles.quickActionText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  vehicleCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 5,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
  },
  input: {
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  },
  optionTextSelected: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.light.text,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default VehicleProfileEnhanced;