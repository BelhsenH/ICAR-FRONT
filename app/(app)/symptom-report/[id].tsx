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
import VehicleService, { UserSymptomReport } from '../../../services/vehicleService';
import { Colors } from '../../../constants/Colors';

const SymptomReport = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [symptomReports, setSymptomReports] = useState<UserSymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newReport, setNewReport] = useState<Partial<UserSymptomReport>>({
    odometerReading: 0,
    urgency: 'medium',
    drivingSafety: 'safe_to_drive',
    symptoms: {
      noises: [],
      vibrations: [],
      warningLights: [],
      smells: [],
      performance: {},
      fluidSpots: [],
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadSymptomReports();
    }
  }, [id, token]);

  const loadSymptomReports = async () => {
    try {
      setLoading(true);
      const response = await VehicleService.getSymptomReports(id!, undefined, 50, 0, token!);
      setSymptomReports(response.symptomReports);
    } catch (error) {
      console.error('Error loading symptom reports:', error);
      Alert.alert('Error', 'Failed to load symptom reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    try {
      setSaving(true);
      await VehicleService.addSymptomReport(id!, newReport, token!);
      setShowAddModal(false);
      resetForm();
      loadSymptomReports();
      Alert.alert('Success', 'Symptom report submitted successfully');
    } catch (error) {
      console.error('Error submitting symptom report:', error);
      Alert.alert('Error', 'Failed to submit symptom report');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setNewReport({
      odometerReading: 0,
      urgency: 'medium',
      drivingSafety: 'safe_to_drive',
      symptoms: {
        noises: [],
        vibrations: [],
        warningLights: [],
        smells: [],
        performance: {},
        fluidSpots: [],
      },
    });
  };

  const addNoise = () => {
    const newNoise = {
      type: 'other' as const,
      location: 'other' as const,
      when: 'other' as const,
      speed: 'all_speeds' as const,
      severity: 'mild' as const,
      description: '',
    };
    setNewReport({
      ...newReport,
      symptoms: {
        ...newReport.symptoms,
        noises: [...(newReport.symptoms?.noises || []), newNoise],
      },
    });
  };

  const addVibration = () => {
    const newVibration = {
      location: 'other' as const,
      when: 'other' as const,
      speed: 'all_speeds' as const,
      severity: 'mild' as const,
      description: '',
    };
    setNewReport({
      ...newReport,
      symptoms: {
        ...newReport.symptoms,
        vibrations: [...(newReport.symptoms?.vibrations || []), newVibration],
      },
    });
  };

  const addWarningLight = () => {
    const newWarningLight = {
      lightType: 'other' as const,
      behavior: 'constant' as const,
      when: 'other' as const,
      description: '',
    };
    setNewReport({
      ...newReport,
      symptoms: {
        ...newReport.symptoms,
        warningLights: [...(newReport.symptoms?.warningLights || []), newWarningLight],
      },
    });
  };

  const addSmell = () => {
    const newSmell = {
      type: 'other' as const,
      location: 'other' as const,
      when: 'other' as const,
      intensity: 'mild' as const,
      description: '',
    };
    setNewReport({
      ...newReport,
      symptoms: {
        ...newReport.symptoms,
        smells: [...(newReport.symptoms?.smells || []), newSmell],
      },
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#d32f2f';
      default: return '#757575';
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

  const renderSymptomCard = (report: UserSymptomReport) => (
    <View key={report._id} style={styles.symptomCard}>
      <View style={styles.symptomHeader}>
        <View>
          <Text style={styles.symptomDate}>{formatDate(report.reportDate)}</Text>
          <Text style={styles.odometerReading}>
            {report.odometerReading.toLocaleString()} km
          </Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(report.urgency) }]}>
          <Text style={styles.urgencyText}>{report.urgency}</Text>
        </View>
      </View>

      <View style={styles.symptomDetails}>
        {report.symptoms.noises && report.symptoms.noises.length > 0 && (
          <View style={styles.symptomSection}>
            <Text style={styles.symptomSectionTitle}>Noises ({report.symptoms.noises.length})</Text>
            {report.symptoms.noises.map((noise, index) => (
              <Text key={index} style={styles.symptomText}>
                • {noise.type} noise from {noise.location} when {noise.when}
              </Text>
            ))}
          </View>
        )}

        {report.symptoms.vibrations && report.symptoms.vibrations.length > 0 && (
          <View style={styles.symptomSection}>
            <Text style={styles.symptomSectionTitle}>Vibrations ({report.symptoms.vibrations.length})</Text>
            {report.symptoms.vibrations.map((vibration, index) => (
              <Text key={index} style={styles.symptomText}>
                • Vibration in {vibration.location} when {vibration.when}
              </Text>
            ))}
          </View>
        )}

        {report.symptoms.warningLights && report.symptoms.warningLights.length > 0 && (
          <View style={styles.symptomSection}>
            <Text style={styles.symptomSectionTitle}>Warning Lights ({report.symptoms.warningLights.length})</Text>
            {report.symptoms.warningLights.map((light, index) => (
              <Text key={index} style={styles.symptomText}>
                • {light.lightType.replace('_', ' ')} light ({light.behavior})
              </Text>
            ))}
          </View>
        )}

        {report.symptoms.performance && Object.keys(report.symptoms.performance).some(key => report.symptoms.performance![key as keyof typeof report.symptoms.performance]) && (
          <View style={styles.symptomSection}>
            <Text style={styles.symptomSectionTitle}>Performance Issues</Text>
            {report.symptoms.performance.startingDifficulty && (
              <Text style={styles.symptomText}>• Starting difficulty</Text>
            )}
            {report.symptoms.performance.engineRoughness && (
              <Text style={styles.symptomText}>• Engine roughness</Text>
            )}
            {report.symptoms.performance.powerLoss && (
              <Text style={styles.symptomText}>• Power loss</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.safetyContainer}>
        <Ionicons 
          name={report.drivingSafety === 'safe_to_drive' ? 'checkmark-circle' : 'warning'} 
          size={16} 
          color={report.drivingSafety === 'safe_to_drive' ? '#4caf50' : '#f44336'} 
        />
        <Text style={styles.safetyText}>
          {report.drivingSafety.replace(/_/g, ' ')}
        </Text>
      </View>

      {report.additionalNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>"{report.additionalNotes}"</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getUrgencyColor(report.status) }]}>
          Status: {report.status.replace('_', ' ')}
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Odometer Reading (km) *</Text>
              <TextInput
                style={styles.input}
                value={newReport.odometerReading?.toString() || ''}
                onChangeText={(text) => setNewReport({ ...newReport, odometerReading: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="Enter current odometer reading"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Urgency Level</Text>
              <View style={styles.optionsContainer}>
                {['low', 'medium', 'high', 'critical'].map((urgency) => (
                  <TouchableOpacity
                    key={urgency}
                    style={[
                      styles.optionButton,
                      newReport.urgency === urgency && styles.optionButtonSelected,
                    ]}
                    onPress={() => setNewReport({ ...newReport, urgency: urgency as any })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        newReport.urgency === urgency && styles.optionTextSelected,
                      ]}
                    >
                      {urgency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Driving Safety</Text>
              <View style={styles.optionsContainer}>
                {['safe_to_drive', 'drive_with_caution', 'avoid_highways', 'stop_driving_immediately'].map((safety) => (
                  <TouchableOpacity
                    key={safety}
                    style={[
                      styles.optionButton,
                      newReport.drivingSafety === safety && styles.optionButtonSelected,
                    ]}
                    onPress={() => setNewReport({ ...newReport, drivingSafety: safety as any })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        newReport.drivingSafety === safety && styles.optionTextSelected,
                      ]}
                    >
                      {safety.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Sounds & Vibrations</Text>
            
            <View style={styles.symptomGroup}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomGroupTitle}>Noises</Text>
                <TouchableOpacity onPress={addNoise} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              
              {newReport.symptoms?.noises?.map((noise, index) => (
                <View key={index} style={styles.symptomItem}>
                  <Text style={styles.itemLabel}>Noise {index + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={noise.description}
                    onChangeText={(text) => {
                      const updatedNoises = [...(newReport.symptoms?.noises || [])];
                      updatedNoises[index] = { ...noise, description: text };
                      setNewReport({
                        ...newReport,
                        symptoms: { ...newReport.symptoms, noises: updatedNoises },
                      });
                    }}
                    placeholder="Describe the noise..."
                  />
                </View>
              ))}
            </View>

            <View style={styles.symptomGroup}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomGroupTitle}>Vibrations</Text>
                <TouchableOpacity onPress={addVibration} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              
              {newReport.symptoms?.vibrations?.map((vibration, index) => (
                <View key={index} style={styles.symptomItem}>
                  <Text style={styles.itemLabel}>Vibration {index + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={vibration.description}
                    onChangeText={(text) => {
                      const updatedVibrations = [...(newReport.symptoms?.vibrations || [])];
                      updatedVibrations[index] = { ...vibration, description: text };
                      setNewReport({
                        ...newReport,
                        symptoms: { ...newReport.symptoms, vibrations: updatedVibrations },
                      });
                    }}
                    placeholder="Describe the vibration..."
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Warning Lights & Performance</Text>
            
            <View style={styles.symptomGroup}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomGroupTitle}>Warning Lights</Text>
                <TouchableOpacity onPress={addWarningLight} style={styles.addButton}>
                  <Ionicons name="add" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              
              {newReport.symptoms?.warningLights?.map((light, index) => (
                <View key={index} style={styles.symptomItem}>
                  <Text style={styles.itemLabel}>Warning Light {index + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={light.description}
                    onChangeText={(text) => {
                      const updatedLights = [...(newReport.symptoms?.warningLights || [])];
                      updatedLights[index] = { ...light, description: text };
                      setNewReport({
                        ...newReport,
                        symptoms: { ...newReport.symptoms, warningLights: updatedLights },
                      });
                    }}
                    placeholder="Describe the warning light..."
                  />
                </View>
              ))}
            </View>

            <View style={styles.symptomGroup}>
              <Text style={styles.symptomGroupTitle}>Performance Issues</Text>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Starting Difficulty</Text>
                <Switch
                  value={newReport.symptoms?.performance?.startingDifficulty || false}
                  onValueChange={(value) =>
                    setNewReport({
                      ...newReport,
                      symptoms: {
                        ...newReport.symptoms,
                        performance: { ...newReport.symptoms?.performance, startingDifficulty: value },
                      },
                    })
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Engine Roughness</Text>
                <Switch
                  value={newReport.symptoms?.performance?.engineRoughness || false}
                  onValueChange={(value) =>
                    setNewReport({
                      ...newReport,
                      symptoms: {
                        ...newReport.symptoms,
                        performance: { ...newReport.symptoms?.performance, engineRoughness: value },
                      },
                    })
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Power Loss</Text>
                <Switch
                  value={newReport.symptoms?.performance?.powerLoss || false}
                  onValueChange={(value) =>
                    setNewReport({
                      ...newReport,
                      symptoms: {
                        ...newReport.symptoms,
                        performance: { ...newReport.symptoms?.performance, powerLoss: value },
                      },
                    })
                  }
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Increased Fuel Consumption</Text>
                <Switch
                  value={newReport.symptoms?.performance?.fuelConsumptionIncrease || false}
                  onValueChange={(value) =>
                    setNewReport({
                      ...newReport,
                      symptoms: {
                        ...newReport.symptoms,
                        performance: { ...newReport.symptoms?.performance, fuelConsumptionIncrease: value },
                      },
                    })
                  }
                />
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newReport.additionalNotes || ''}
                onChangeText={(text) => setNewReport({ ...newReport, additionalNotes: text })}
                placeholder="Any additional details about the symptoms..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.submitContainer}>
              <Text style={styles.submitNote}>
                Please review your information and submit the report. A mechanic will review it and get back to you.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderAddReportModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Report Symptoms - Step {currentStep}/4</Text>
          <TouchableOpacity
            onPress={currentStep === 4 ? handleSubmitReport : () => setCurrentStep(currentStep + 1)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.light.tint} />
            ) : (
              <Text style={styles.nextButton}>
                {currentStep === 4 ? 'Submit' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.modalContent}>
          {renderStepContent()}
        </ScrollView>

        {currentStep > 1 && (
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading symptom reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Reports</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {symptomReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={64} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No symptom reports</Text>
            <Text style={styles.emptyStateSubtext}>Report any issues with your vehicle to get expert help</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyStateButtonText}>Report Symptoms</Text>
            </TouchableOpacity>
          </View>
        ) : (
          symptomReports.map(renderSymptomCard)
        )}
      </ScrollView>

      {renderAddReportModal()}
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
  symptomCard: {
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
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  symptomDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  odometerReading: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  symptomDetails: {
    gap: 12,
  },
  symptomSection: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
  },
  symptomSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  symptomText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  safetyText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    fontStyle: 'italic',
  },
  statusContainer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  nextButton: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 20,
    paddingTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 2,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
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
    minHeight: 100,
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
  },
  optionTextSelected: {
    color: 'white',
  },
  symptomGroup: {
    marginBottom: 24,
  },
  symptomGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
  },
  symptomItem: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  submitNote: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
  },
});

export default SymptomReport;