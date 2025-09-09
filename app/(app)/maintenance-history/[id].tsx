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
import VehicleService, { MaintenanceRecord } from '../../../services/vehicleService';
import { Colors } from '../../../constants/Colors';

const MaintenanceHistory = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceRecord>>({
    serviceDate: new Date().toISOString().split('T')[0],
    odometerAtService: 0,
    serviceType: 'scheduled',
    reasonForService: 'scheduled_maintenance',
    jobLines: [],
    totalCost: { parts: 0, labor: 0, total: 0 },
    workshopInfo: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadMaintenanceHistory();
    }
  }, [id, token]);

  const loadMaintenanceHistory = async () => {
    try {
      setLoading(true);
      const response = await VehicleService.getMaintenanceHistory(id!, 50, 0, token!);
      setMaintenanceHistory(response.maintenanceHistory);
    } catch (error) {
      console.error('Error loading maintenance history:', error);
      Alert.alert('Error', 'Failed to load maintenance history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async () => {
    try {
      setSaving(true);
      
      // Calculate total cost
      const totalParts = newMaintenance.jobLines?.reduce((sum, job) => 
        sum + (job.partsReplaced?.reduce((partSum, part) => partSum + (part.cost || 0), 0) || 0), 0) || 0;
      const totalLabor = newMaintenance.jobLines?.reduce((sum, job) => sum + (job.laborCost || 0), 0) || 0;
      
      const maintenanceData = {
        ...newMaintenance,
        totalCost: {
          parts: totalParts,
          labor: totalLabor,
          total: totalParts + totalLabor,
        },
      };

      await VehicleService.addMaintenanceRecord(id!, maintenanceData, token!);
      setShowAddModal(false);
      resetForm();
      loadMaintenanceHistory();
      Alert.alert('Success', 'Maintenance record added successfully');
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      Alert.alert('Error', 'Failed to add maintenance record');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewMaintenance({
      serviceDate: new Date().toISOString().split('T')[0],
      odometerAtService: 0,
      serviceType: 'scheduled',
      reasonForService: 'scheduled_maintenance',
      jobLines: [],
      totalCost: { parts: 0, labor: 0, total: 0 },
      workshopInfo: {},
    });
  };

  const addJobLine = () => {
    const newJobLine = {
      serviceCategory: 'other' as const,
      description: '',
      partsReplaced: [],
      fluidsChanged: [],
      laborHours: 0,
      laborCost: 0,
    };
    
    setNewMaintenance({
      ...newMaintenance,
      jobLines: [...(newMaintenance.jobLines || []), newJobLine],
    });
  };

  const updateJobLine = (index: number, updatedJobLine: any) => {
    const updatedJobLines = [...(newMaintenance.jobLines || [])];
    updatedJobLines[index] = updatedJobLine;
    setNewMaintenance({ ...newMaintenance, jobLines: updatedJobLines });
  };

  const removeJobLine = (index: number) => {
    const updatedJobLines = [...(newMaintenance.jobLines || [])];
    updatedJobLines.splice(index, 1);
    setNewMaintenance({ ...newMaintenance, jobLines: updatedJobLines });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'scheduled': return '#4caf50';
      case 'repair': return '#ff9800';
      case 'inspection': return '#2196f3';
      case 'warranty': return '#9c27b0';
      case 'recall': return '#f44336';
      case 'emergency': return '#e91e63';
      default: return '#757575';
    }
  };

  const renderMaintenanceCard = (maintenance: MaintenanceRecord) => (
    <View key={maintenance._id} style={styles.maintenanceCard}>
      <View style={styles.maintenanceHeader}>
        <View>
          <Text style={styles.maintenanceDate}>{formatDate(maintenance.serviceDate)}</Text>
          <Text style={styles.odometerReading}>
            {maintenance.odometerAtService.toLocaleString()} km
          </Text>
        </View>
        <View style={[styles.serviceTypeBadge, { backgroundColor: getServiceTypeColor(maintenance.serviceType) }]}>
          <Text style={styles.serviceTypeText}>{maintenance.serviceType}</Text>
        </View>
      </View>

      {maintenance.workshopInfo?.workshopName && (
        <View style={styles.workshopInfo}>
          <Ionicons name="business" size={16} color={Colors.light.tint} />
          <Text style={styles.workshopName}>{maintenance.workshopInfo.workshopName}</Text>
        </View>
      )}

      <View style={styles.jobLinesContainer}>
        {maintenance.jobLines.map((job, index) => (
          <View key={index} style={styles.jobLine}>
            <Text style={styles.jobCategory}>{job.serviceCategory.replace('_', ' ')}</Text>
            <Text style={styles.jobDescription}>{job.description}</Text>
            {job.partsReplaced && job.partsReplaced.length > 0 && (
              <View style={styles.partsContainer}>
                {job.partsReplaced.map((part, partIndex) => (
                  <Text key={partIndex} style={styles.partText}>
                    • {part.partName} (Qty: {part.quantity})
                    {part.cost && ` - $${part.cost.toFixed(2)}`}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {maintenance.totalCost && maintenance.totalCost.total > 0 && (
        <View style={styles.costContainer}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Parts:</Text>
            <Text style={styles.costValue}>${maintenance.totalCost.parts.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Labor:</Text>
            <Text style={styles.costValue}>${maintenance.totalCost.labor.toFixed(2)}</Text>
          </View>
          <View style={[styles.costRow, styles.totalCostRow]}>
            <Text style={styles.totalCostLabel}>Total:</Text>
            <Text style={styles.totalCostValue}>${maintenance.totalCost.total.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {maintenance.serviceNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{maintenance.serviceNotes}</Text>
        </View>
      )}
    </View>
  );

  const renderAddMaintenanceModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Maintenance Record</Text>
          <TouchableOpacity onPress={handleAddMaintenance} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Date *</Text>
            <TextInput
              style={styles.input}
              value={newMaintenance.serviceDate}
              onChangeText={(text) => setNewMaintenance({ ...newMaintenance, serviceDate: text })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              value={newMaintenance.odometerAtService?.toString() || ''}
              onChangeText={(text) => setNewMaintenance({ ...newMaintenance, odometerAtService: parseInt(text) || 0 })}
              keyboardType="numeric"
              placeholder="Enter odometer reading"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Type</Text>
            <View style={styles.optionsContainer}>
              {['scheduled', 'repair', 'inspection', 'warranty', 'recall', 'emergency'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    newMaintenance.serviceType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setNewMaintenance({ ...newMaintenance, serviceType: type as any })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      newMaintenance.serviceType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Workshop Name</Text>
            <TextInput
              style={styles.input}
              value={newMaintenance.workshopInfo?.workshopName || ''}
              onChangeText={(text) =>
                setNewMaintenance({
                  ...newMaintenance,
                  workshopInfo: { ...newMaintenance.workshopInfo, workshopName: text },
                })
              }
              placeholder="Enter workshop name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newMaintenance.serviceNotes || ''}
              onChangeText={(text) => setNewMaintenance({ ...newMaintenance, serviceNotes: text })}
              placeholder="Enter service notes"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.jobLinesHeader}>
              <Text style={styles.inputLabel}>Job Lines</Text>
              <TouchableOpacity onPress={addJobLine} style={styles.addJobButton}>
                <Ionicons name="add" size={20} color={Colors.light.tint} />
                <Text style={styles.addJobText}>Add Job</Text>
              </TouchableOpacity>
            </View>

            {newMaintenance.jobLines?.map((job, index) => (
              <View key={index} style={styles.jobLineForm}>
                <View style={styles.jobLineHeader}>
                  <Text style={styles.jobLineTitle}>Job {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeJobLine(index)}>
                    <Ionicons name="trash" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={job.description}
                  onChangeText={(text) => updateJobLine(index, { ...job, description: text })}
                  placeholder="Job description"
                />

                <View style={styles.optionsContainer}>
                  {['engine', 'transmission', 'brakes', 'tires', 'electrical', 'cooling', 'exhaust', 'suspension', 'body', 'interior', 'other'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.smallOptionButton,
                        job.serviceCategory === category && styles.optionButtonSelected,
                      ]}
                      onPress={() => updateJobLine(index, { ...job, serviceCategory: category })}
                    >
                      <Text
                        style={[
                          styles.smallOptionText,
                          job.serviceCategory === category && styles.optionTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  value={job.laborCost?.toString() || ''}
                  onChangeText={(text) => updateJobLine(index, { ...job, laborCost: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Labor cost"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading maintenance history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance History</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {maintenanceHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="build-outline" size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No maintenance records</Text>
            <Text style={styles.emptyStateSubtext}>Add your first maintenance record to start tracking</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyStateButtonText}>Add Maintenance Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          maintenanceHistory.map(renderMaintenanceCard)
        )}
      </ScrollView>

      {renderAddMaintenanceModal()}
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
  maintenanceCard: {
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
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  maintenanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  odometerReading: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  serviceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workshopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  workshopName: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  jobLinesContainer: {
    gap: 8,
    marginBottom: 12,
  },
  jobLine: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
  },
  jobCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.tint,
    textTransform: 'uppercase',
  },
  jobDescription: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 2,
  },
  partsContainer: {
    marginTop: 4,
  },
  partText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginLeft: 8,
  },
  costContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  costValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  totalCostRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalCostValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    fontStyle: 'italic',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  smallOptionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'white',
  },
  smallOptionText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  jobLinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  addJobText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '500',
  },
  jobLineForm: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  jobLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobLineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
});

export default MaintenanceHistory;