import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, Share, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Text, Provider as PaperProvider, FAB, Modal, Portal, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../../constants/Theme';
import { ModernButton } from '../../../components/modern/ModernButton';
import { generateQrCode, getCarById, editCar, deleteCar } from '../../../scripts/car-script';
import QRCode from 'react-native-qrcode-svg';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

interface CarDetails {
  id: string;
  marque: string;
  modele: string;
  vin: string;
  immatriculation: string;
  fuelType: string;
  kilometrage: string;
  datePremiereMiseEnCirculation: string;
  dateAdded: string;
  lastService?: string;
  nextService?: string;
  registrationSubtype?: string;
  immatriculationType: string;
}

const allowedModeles: { [key: string]: string[] } = {
  Peugeot: ["208", "308", "3008", "5008", "Partner"],
  Renault: ["Clio", "Megane", "Captur", "Duster", "Twingo"],
  Citroën: ["C3", "C4", "Berlingo", "C5", "DS3"],
  Toyota: ["Corolla", "Yaris", "Camry", "RAV4", "Hilux"],
  Hyundai: ["i20", "Tucson", "Santa Fe", "i30", "Accent"],
  Kia: ["Picanto", "Rio", "Sportage", "Sorento", "Cerato"],
  Mercedes: ["C-Class", "E-Class", "S-Class", "GLC", "A-Class"],
  BMW: ["3 Series", "5 Series", "X5", "X3", "1 Series"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Polo", "Jetta"],
  Ford: ["Focus", "Fiesta", "Kuga", "Mondeo", "EcoSport"],
  Opel: ["Corsa", "Astra", "Insignia", "Zafira", "Crossland"],
  Dacia: ["Sandero", "Logan", "Duster", "Dokker", "Lodgy"],
  Fiat: ["Panda", "500", "Tipo", "Punto", "Doblo"],
  Suzuki: ["Swift", "Vitara", "Ignis", "Jimny", "S-Cross"],
  Honda: ["Civic", "CR-V", "Jazz", "Accord", "HR-V"]
};

export default function CarProfile() {
  const { id } = useLocalSearchParams();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [formData, setFormData] = useState<CarDetails | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const { language, translations } = useLanguage();
  const t = translations[language];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;
  const infoRowsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCarDetails();
    
    // Start entrance animations
    Animated.stagger(200, [
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
      Animated.spring(buttonSlideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(infoRowsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id]);

  const loadCarDetails = async () => {
    try {
      const response = await getCarById(id as string);
      if (response.success && response.data) {
        const carData = response.data;
        const carDetails: CarDetails = {
          id: carData._id,
          marque: carData.marque,
          modele: carData.modele,
          vin: carData.vin,
          immatriculation: carData.numeroImmatriculation,
          fuelType: carData.fuelType,
          kilometrage: carData.kilometrage?.toString() || '0',
          datePremiereMiseEnCirculation: new Date(carData.datePremiereMiseEnCirculation).toLocaleDateString('fr-FR'),
          dateAdded: carData.dateAdded || new Date().toLocaleDateString('fr-FR'),
          lastService: carData.lastService,
          nextService: carData.nextService,
          registrationSubtype: carData.registrationSubtype,
          immatriculationType: carData.immatriculationType,
        };
        setCar(carDetails);
        setFormData(carDetails); // Initialize form data for editing
      } else {
        Alert.alert(t.error || 'Error', response.message || t.failedToLoadCar || 'Failed to load car details');
      }
    } catch (error) {
      Alert.alert(t.error || 'Error', t.failedToLoadCar || 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setActionModalVisible(false);
    try {
      const response = await generateQrCode(id as string);
      if (response.success && response.data) {
        setQrCodeData(response.data.qrCode);
        setQrModalVisible(true);
      } else {
        Alert.alert(t.error || 'Error', response.message || t.failedToGenerateQr || 'Failed to generate QR code');
      }
    } catch (error) {
      Alert.alert(t.error || 'Error', t.failedToGenerateQr || 'An unexpected error occurred');
    }
  };

  const handleShare = async () => {
    try {
      if (!car || !qrCodeData) {
        Alert.alert(t.error || 'Error', t.noCarData || 'No car data available to share');
        return;
      }

      await Share.share({
        message: `${t.carDetails || 'Car Details'}: ${car.marque} ${car.modele}\n${t.vin || 'VIN'}: ${car.vin}\n${t.qrCode || 'QR Code Data'}: ${qrCodeData}`,
        title: t.shareCarDetails || 'Share Car Details',
      });
    } catch (error) {
      Alert.alert(t.error || 'Error', t.failedToShare || 'Failed to share car details');
    }
  };

  const handleEdit = () => {
    setActionModalVisible(false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!formData) return;

    try {
      const carData = {
        vin: formData.vin,
        marque: formData.marque,
        modele: formData.modele,
        fuelType: formData.fuelType,
        immatriculationType: formData.immatriculationType,
        numeroImmatriculation: formData.immatriculation,
        registrationSubtype: formData.registrationSubtype,
        kilometrage: formData.kilometrage,
        datePremiereMiseEnCirculation: formData.datePremiereMiseEnCirculation,
      };

      const response = await editCar(id as string, carData);
      if (response.success && response.data) {
        setCar({
          ...formData,
          id: response.data._id,
          dateAdded: response.data.dateAdded || formData.dateAdded,
        });
        setEditModalVisible(false);
        Alert.alert(t.success || 'Success', t.carUpdated || 'Car updated successfully');
      } else {
        Alert.alert(t.error || 'Error', response.message || t.failedToUpdateCar || 'Failed to update car');
      }
    } catch (error) {
      Alert.alert(t.error || 'Error', t.failedToUpdateCar || 'An unexpected error occurred');
    }
  };

  const handleDelete = () => {
    setActionModalVisible(false);
    Alert.alert(
      t.deleteConfirmation || 'Delete Car',
      t.deleteConfirmationMessage || 'Are you sure you want to delete this car?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.delete || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteCar(id as string);
              if (response.success) {
                Alert.alert(t.success || 'Success', t.carDeleted || 'Car deleted successfully');
                router.back();
              } else {
                Alert.alert(t.error || 'Error', response.message || t.failedToDeleteCar || 'Failed to delete car');
              }
            } catch (error) {
              Alert.alert(t.error || 'Error', t.failedToDeleteCar || 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleRequestService = () => {
    setActionModalVisible(false);
    router.push(`/(app)/book-service-v2/${id}`);
  };

  // Helper to parse and format date
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  };
  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

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
          <Text style={styles.headerTitle}>{t.carProfile || 'Car Profile'}</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t.loading || 'Loading...'}</Text>
          </View>
        ) : !car ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t.noCarData || 'No car data available'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.carTitle}>{car.marque} {car.modele}</Text>
              <Text style={styles.carPlate}>{car.immatriculation}</Text>

              <Animated.View 
                style={[styles.detailsContainer, { opacity: infoRowsAnim }]}
              >
                <VinRow label={t.vin || 'VIN'} value={car.vin} />
                <InfoRow label={t.fuelType || 'Fuel Type'} value={car.fuelType} />
                <InfoRow label={t.mileage || 'Mileage'} value={`${car.kilometrage} km`} />
                <InfoRow
                  label={t.firstRegistration || 'First Registration'}
                  value={car.datePremiereMiseEnCirculation}
                />
                <InfoRow label={t.dateAdded || 'Date Added'} value={car.dateAdded} />
                {car.lastService && (
                  <InfoRow label={t.lastService || 'Last Service'} value={car.lastService} />
                )}
                {car.nextService && (
                  <InfoRow label={t.nextService || 'Next Service'} value={car.nextService} />
                )}
                <InfoRow label={t.immatriculationType || 'Immatriculation Type'} value={car.immatriculationType} />
                {car.registrationSubtype && (
                  <InfoRow label={t.registrationSubtype || 'Registration Subtype'} value={car.registrationSubtype} />
                )}
              </Animated.View>
            </Animated.View>


            <Animated.View 
              style={[styles.actionsContainer, { transform: [{ translateY: buttonSlideAnim }] }]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={[styles.gradientButton, styles.primaryActionButton]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity 
                  onPress={handleRequestService}
                  style={styles.gradientButtonContent}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="tools" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>{t.requestService || 'Request Service'}</Text>
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={[styles.gradientButton, styles.actionButton]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity 
                  onPress={() => router.push(`/(app)/maintenance-dashboard/${id}` as any)}
                  style={styles.gradientButtonContent}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="dashboard" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>{t.MaintenanceDashboard || 'Maintenance Dashboard'}</Text>
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={['#28A745', '#20843B']}
                style={[styles.gradientButton, styles.actionButton]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity 
                  onPress={() => router.push(`/(app)/fuel-tracking/${id}` as any)}
                  style={styles.gradientButtonContent}
                  activeOpacity={0.8}
                >
                  <FontAwesome5 name="gas-pump" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>{t.fuelTracking || 'Fuel Tracking'}</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity 
                  onPress={handleEdit}
                  style={[styles.secondaryActionButton, styles.editButton]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="edit" size={18} color={Colors.primary} />
                  <Text style={styles.secondaryButtonText}>{t.edit || 'Edit'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleExport}
                  style={[styles.secondaryActionButton, styles.exportButton]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="file-download" size={18} color={Colors.accent} />
                  <Text style={styles.secondaryButtonText}>{t.export || 'Export'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleDelete}
                  style={[styles.secondaryActionButton, styles.deleteButton]}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete" size={18} color={Colors.error} />
                  <Text style={[styles.secondaryButtonText, { color: Colors.error }]}>{t.delete || 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        )}

        {/* Enhanced FAB */}
        <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.fabButton}
              onPress={() => {
                Animated.spring(fabScale, {
                  toValue: 0.8,
                  useNativeDriver: true,
                }).start(() => {
                  Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start();
                  setActionModalVisible(true);
                });
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Action Modal */}
        <Portal>
          <Modal
            visible={actionModalVisible}
            onDismiss={() => setActionModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="settings" size={24} color={Colors.primary} />
              <Text style={styles.modalTitle}>{t.carActions || 'Car Actions'}</Text>
            </View>
            
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              style={styles.modalGradientButton}
            >
              <TouchableOpacity onPress={handleRequestService} style={styles.modalButtonContent}>
                <FontAwesome5 name="tools" size={18} color="#FFFFFF" style={styles.modalButtonIcon} />
                <Text style={styles.modalPrimaryButtonText}>{t.requestService || 'Request Service'}</Text>
              </TouchableOpacity>
            </LinearGradient>
            
            <TouchableOpacity onPress={handleEdit} style={[styles.modalOutlineButton, styles.editModalButton]}>
              <MaterialIcons name="edit" size={18} color={Colors.primary} style={styles.modalButtonIcon} />
              <Text style={styles.modalSecondaryButtonText}>{t.edit || 'Edit Car'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleExport} style={[styles.modalOutlineButton, styles.exportModalButton]}>
              <MaterialIcons name="file-download" size={18} color={Colors.accent} style={styles.modalButtonIcon} />
              <Text style={styles.modalSecondaryButtonText}>{t.export || 'Export Car'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleDelete} style={[styles.modalOutlineButton, styles.deleteModalButton]}>
              <MaterialIcons name="delete" size={18} color={Colors.error} style={styles.modalButtonIcon} />
              <Text style={[styles.modalSecondaryButtonText, { color: Colors.error }]}>{t.delete || 'Delete Car'}</Text>
            </TouchableOpacity>
          </Modal>
        </Portal>

        {/* QR Code Modal */}
        <Portal>
          <Modal
            visible={qrModalVisible}
            onDismiss={() => setQrModalVisible(false)}
            contentContainerStyle={styles.qrModalContainer}
          >
            <Text style={styles.modalTitle}>{t.exportQrCode || 'Export QR Code'}</Text>
            <View style={styles.qrCodeContainer}>
              {qrCodeData ? (
                <QRCode
                  value={qrCodeData}
                  size={200}
                  backgroundColor={Colors.background}
                  color={Colors.text}
                  errorCorrectionLevel="L"
                />
              ) : (
                <Text style={styles.qrCodePlaceholder}>{t.generatingQr || 'Generating QR Code...'}</Text>
              )}
              <Text style={styles.qrCodeText}>
                {t.qrCodeInstructions || 'Scan this QR code to transfer car ownership or share details'}
              </Text>
            </View>
            <ModernButton
              title={t.shareQrCode || 'Share QR Code'}
              onPress={handleShare}
              style={styles.qrShareButton}
            />
          </Modal>
        </Portal>

        {/* Edit Modal */}
        <Portal>
          <Modal
            visible={editModalVisible}
            onDismiss={() => setEditModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>{t.editCar || 'Edit Car'}</Text>
            <ScrollView style={styles.editForm}>
              {formData && (
                <>
                  <Text style={styles.inputLabel}>{t.marque || 'Brand'}</Text>
                  <Picker
                    selectedValue={formData.marque}
                    onValueChange={(value) => {
                      setFormData({ ...formData, marque: value, modele: '' });
                    }}
                    style={styles.picker}
                  >
                    {Object.keys(allowedModeles).map((brand) => (
                      <Picker.Item key={brand} label={brand} value={brand} />
                    ))}
                  </Picker>

                  <Text style={styles.inputLabel}>{t.modele || 'Model'}</Text>
                  <Picker
                    selectedValue={formData.modele}
                    onValueChange={(value) => setFormData({ ...formData, modele: value })}
                    style={styles.picker}
                    enabled={!!formData.marque}
                  >
                    <Picker.Item label={t.selectModel || 'Select Model'} value="" />
                    {formData.marque &&
                      Array.isArray(allowedModeles[formData.marque]) &&
                      allowedModeles[formData.marque].map((model) => (
                        <Picker.Item key={model} label={model} value={model} />
                      ))}
                  </Picker>

                  <Text style={styles.inputLabel}>{t.vin || 'VIN'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.vin}
                    onChangeText={(text) => setFormData({ ...formData, vin: text.toUpperCase() })}
                    placeholder={t.enterVin || 'Enter VIN'}
                  />

                  <Text style={styles.inputLabel}>{t.fuelType || 'Fuel Type'}</Text>
                  <Picker
                    selectedValue={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                    style={styles.picker}
                  >
                    {['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'].map((type) => (
                      <Picker.Item key={type} label={type} value={type} />
                    ))}
                  </Picker>

                  <Text style={styles.inputLabel}>{t.numeroImmatriculation || 'Registration Number'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.immatriculation}
                    onChangeText={(text) => setFormData({ ...formData, immatriculation: text })}
                    placeholder={t.enterRegistration || 'Enter Registration Number'}
                  />

                  <Text style={styles.inputLabel}>{t.mileage || 'Mileage'}</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.kilometrage}
                    onChangeText={(text) => setFormData({ ...formData, kilometrage: text })}
                    placeholder={t.enterMileage || 'Enter Mileage'}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>{t.firstRegistration || 'First Registration (DD/MM/YYYY)'}</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.input, { justifyContent: 'center' }]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: formData.datePremiereMiseEnCirculation ? Colors.text : Colors.textSecondary }}>
                      {formData.datePremiereMiseEnCirculation || t.enterDate || 'DD/MM/YYYY'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        formData.datePremiereMiseEnCirculation
                          ? parseDate(formData.datePremiereMiseEnCirculation)
                          : new Date()
                      }
                      mode="date"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setFormData({
                            ...formData,
                            datePremiereMiseEnCirculation: formatDate(selectedDate),
                          });
                        }
                      }}
                      maximumDate={new Date()}
                    />
                  )}
                </>
              )}
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalButton}
              >
                {t.cancel || 'Cancel'}
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveEdit}
                style={styles.modalButton}
              >
                {t.save || 'Save'}
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const VinRow = ({ label, value }: { label: string; value: string }) => {
  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert('Success', 'VIN copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy VIN');
    }
  };

  return (
    <View style={styles.vinContainer}>
      <View style={styles.vinLabelContainer}>
        <View style={styles.infoLabelDot} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.vinValueContainer}>
        <Text style={styles.vinValue}>{value}</Text>
        <TouchableOpacity 
          onPress={copyToClipboard}
          style={styles.copyButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="content-copy" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      <View style={styles.infoLabelDot} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    paddingTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    elevation: 8,
  },
  carTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  carPlate: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#F0F4F8',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  detailsContainer: {
    marginTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  vinContainer: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vinLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  vinValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  vinValue: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginLeft: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionsContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  gradientButton: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  primaryActionButton: {
    marginBottom: Spacing.lg,
  },
  gradientButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    ...Shadows.sm,
  },
  editButton: {
    borderColor: Colors.primary,
  },
  exportButton: {
    borderColor: Colors.accent,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginLeft: Spacing.xs,
    color: Colors.text,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    ...Shadows.lg,
    elevation: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.xl,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: Spacing.sm,
    textAlign: 'center',
  },
  modalGradientButton: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  modalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  modalButtonIcon: {
    marginRight: Spacing.sm,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  modalOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  editModalButton: {
    borderColor: Colors.primary,
  },
  exportModalButton: {
    borderColor: Colors.accent,
  },
  deleteModalButton: {
    borderColor: Colors.error,
  },
  modalSecondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  modalButton: {
    marginBottom: Spacing.md,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  qrModalContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  qrCodePlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  qrCodeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: width * 0.7,
  },
  qrShareButton: {
    width: '100%',
  },
  editForm: {
    maxHeight: height * 0.6,
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
  picker: {
    borderWidth: 1,
    borderColor: Colors.textLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
});