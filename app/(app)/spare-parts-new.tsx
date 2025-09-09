import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, Modal, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import PartsService from '../../services/partsService';
import VehicleService from '../../services/vehicleService';

const { width } = Dimensions.get('window');

interface Part {
  _id: string;
  name: string;
  image: string;
  price: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  description?: string;
  stock: number;
  category: string;
  subCategory: string;
  compatibleVehicles: { brand: string; model: string; year: number }[];
}

interface SubCategory {
  name: string;
  parts: Part[];
  count: number;
}

interface Category {
  name: string;
  subCategories: SubCategory[];
}

interface UserCar {
  _id: string;
  brand: string;
  model: string;
  year: number;
  image: string;
  licensePlate: string;
  vin: string;
}

interface OrderStep {
  step: number;
  title: string;
  completed: boolean;
}

const translations = {
  fr: {
    mechanicalPartsCatalog: 'Catalogue de Pièces Mécaniques',
    noPartsAvailable: 'Aucune pièce disponible',
    loading: 'Chargement...',
    searchParts: 'Rechercher des pièces...',
    filterByCategory: 'Filtrer par catégorie',
    allCategories: 'Toutes les catégories'
  },
};

const MechanicalPartsCatalogScreen = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedCar, setSelectedCar] = useState<UserCar | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userCars, setUserCars] = useState<UserCar[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  const orderSteps: OrderStep[] = [
    { step: 1, title: 'Sélectionner la pièce', completed: false },
    { step: 2, title: 'Choisir votre véhicule', completed: false },
    { step: 3, title: 'Confirmer la commande', completed: false },
    { step: 4, title: 'Finaliser', completed: false }
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load parts by category
      const categoriesData = await PartsService.getPartsByCategory(token);
      
      // Transform API data to match our interface
      const transformedCategories = categoriesData.map(category => ({
        name: category._id,
        subCategories: category.subCategories.map(subCat => ({
          name: subCat.name,
          count: subCat.count,
          parts: subCat.parts.map(part => ({
            _id: part.id,
            name: part.name,
            price: `${part.price} DT`,
            image: part.image,
            availability: part.availability,
            stock: part.stock,
            category: category._id,
            subCategory: subCat.name,
            compatibleVehicles: []
          }))
        }))
      }));
      
      setCategories(transformedCategories);
      
      // Load user vehicles
      if (token) {
        try {
          const vehiclesData = await VehicleService.getUserVehicles(token);
          const transformedCars = vehiclesData.map(vehicle => ({
            _id: vehicle._id,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            image: vehicle.photos?.[0] || 'https://via.placeholder.com/300x200',
            licensePlate: vehicle.licensePlate,
            vin: vehicle.vin || ''
          }));
          setUserCars(transformedCars);
        } catch (vehicleError) {
          console.error('Error loading vehicles:', vehicleError);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handlePartPress = (part: Part) => {
    setSelectedPart(part);
    setCurrentStep(1);
    setShowOrderModal(true);
    setOrderNotes('');
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in-stock': return '#22C55E';
      case 'limited': return '#F59E0B';
      case 'out-of-stock': return '#EF4444';
      default: return Colors.textSecondary;
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'in-stock': return 'En stock';
      case 'limited': return 'Stock limité';
      case 'out-of-stock': return 'Rupture';
      default: return 'Disponible';
    }
  };

  const renderPart = ({ item }: { item: Part }) => (
    <TouchableOpacity
      style={[
        styles.partItem,
        item.availability === 'out-of-stock' && styles.partItemDisabled
      ]}
      onPress={() => handlePartPress(item)}
      disabled={item.availability === 'out-of-stock'}
    >
      <View style={styles.partImageContainer}>
        <Image 
          source={{ 
            uri: item.image.startsWith('/') 
              ? `${process.env.EXPO_PUBLIC_PARTS_SERVICE_URL}${item.image}`
              : item.image 
          }} 
          style={styles.partImage} 
          resizeMode="cover" 
        />
        <View 
          style={[
            styles.availabilityBadge, 
            { backgroundColor: getAvailabilityColor(item.availability) }
          ]}
        >
          <Text style={styles.availabilityText}>
            {getAvailabilityText(item.availability)}
          </Text>
        </View>
      </View>
      <View style={styles.partInfo}>
        <Text style={styles.partName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.partPrice}>{item.price}</Text>
        {item.stock > 0 && (
          <Text style={styles.partStock}>Stock: {item.stock}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={[
          styles.orderButton,
          item.availability === 'out-of-stock' && styles.orderButtonDisabled
        ]}
        onPress={() => handlePartPress(item)}
        disabled={item.availability === 'out-of-stock'}
      >
        <Ionicons 
          name="cart-outline" 
          size={16} 
          color={item.availability === 'out-of-stock' ? Colors.textSecondary : Colors.primary} 
        />
        <Text style={[
          styles.orderButtonText,
          item.availability === 'out-of-stock' && styles.orderButtonTextDisabled
        ]}>
          Commander
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const handleOrder = async () => {
    if (!selectedPart || !selectedCar) return;

    try {
      const orderData = {
        partId: selectedPart._id,
        vehicleInfo: {
          vin: selectedCar.vin,
          brand: selectedCar.brand,
          model: selectedCar.model,
          year: selectedCar.year,
          licensePlate: selectedCar.licensePlate
        },
        quantity: 1,
        notes: orderNotes,
        urgencyLevel: 'medium' as const
      };

      await PartsService.createPartsRequest(orderData, token);
      setCurrentStep(4);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Erreur', 'Impossible de passer la commande');
    }
  };

  const renderOrderModal = () => {
    if (!selectedPart) return null;

    const renderStepIndicator = () => (
      <View style={styles.stepIndicator}>
        {orderSteps.map((step, index) => (
          <View key={step.step} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              currentStep >= step.step && styles.stepCircleActive,
              currentStep > step.step && styles.stepCircleCompleted
            ]}>
              {currentStep > step.step ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= step.step && styles.stepNumberActive
                ]}>
                  {step.step}
                </Text>
              )}
            </View>
            {index < orderSteps.length - 1 && (
              <View style={[
                styles.stepLine,
                currentStep > step.step && styles.stepLineCompleted
              ]} />
            )}
          </View>
        ))}
      </View>
    );

    const renderStepContent = () => {
      switch (currentStep) {
        case 1:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Détails de la pièce</Text>
              <View style={styles.selectedPartCard}>
                <Image 
                  source={{ 
                    uri: selectedPart.image.startsWith('/') 
                      ? `${process.env.EXPO_PUBLIC_PARTS_SERVICE_URL}${selectedPart.image}`
                      : selectedPart.image 
                  }} 
                  style={styles.selectedPartImage} 
                />
                <View style={styles.selectedPartInfo}>
                  <Text style={styles.selectedPartName}>{selectedPart.name}</Text>
                  <Text style={styles.selectedPartPrice}>{selectedPart.price}</Text>
                  <Text style={styles.selectedPartCategory}>{selectedPart.category} - {selectedPart.subCategory}</Text>
                </View>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder="Notes supplémentaires (optionnel)"
                multiline
                numberOfLines={3}
                value={orderNotes}
                onChangeText={setOrderNotes}
                textAlignVertical="top"
              />
            </View>
          );
        case 2:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sélectionnez votre véhicule</Text>
              <ScrollView style={styles.carsContainer}>
                {userCars.length === 0 ? (
                  <Text style={styles.noCarsText}>Aucun véhicule enregistré</Text>
                ) : (
                  userCars.map((car) => (
                    <TouchableOpacity
                      key={car._id}
                      style={[
                        styles.carCard,
                        selectedCar?._id === car._id && styles.carCardSelected
                      ]}
                      onPress={() => setSelectedCar(car)}
                    >
                      <Image source={{ uri: car.image }} style={styles.carImage} />
                      <View style={styles.carInfo}>
                        <Text style={styles.carBrand}>{car.brand}</Text>
                        <Text style={styles.carModel}>{car.model} ({car.year})</Text>
                        <Text style={styles.carPlate}>{car.licensePlate}</Text>
                      </View>
                      {selectedCar?._id === car._id && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          );
        case 3:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Confirmation de commande</Text>
              <View style={styles.orderSummary}>
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Pièce:</Text>
                  <Text style={styles.summaryValue}>{selectedPart.name}</Text>
                </View>
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Prix:</Text>
                  <Text style={styles.summaryValue}>{selectedPart.price}</Text>
                </View>
                {selectedCar && (
                  <>
                    <View style={styles.summarySection}>
                      <Text style={styles.summaryLabel}>Véhicule:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
                      </Text>
                    </View>
                    <View style={styles.summarySection}>
                      <Text style={styles.summaryLabel}>Plaque:</Text>
                      <Text style={styles.summaryValue}>{selectedCar.licensePlate}</Text>
                    </View>
                  </>
                )}
                {orderNotes && (
                  <View style={styles.summarySection}>
                    <Text style={styles.summaryLabel}>Notes:</Text>
                    <Text style={styles.summaryValue}>{orderNotes}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        case 4:
          return (
            <View style={styles.stepContent}>
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color={Colors.primary} />
                <Text style={styles.successTitle}>Commande confirmée!</Text>
                <Text style={styles.successMessage}>
                  Votre commande a été envoyée avec succès. Vous pouvez suivre son statut dans vos commandes.
                </Text>
              </View>
            </View>
          );
        default:
          return null;
      }
    };

    const getNextButtonText = () => {
      switch (currentStep) {
        case 1: return 'Continuer';
        case 2: return 'Confirmer';
        case 3: return 'Finaliser';
        case 4: return 'Terminer';
        default: return 'Suivant';
      }
    };

    const handleNextStep = () => {
      if (currentStep === 2 && !selectedCar) {
        Alert.alert('Attention', 'Veuillez sélectionner un véhicule pour continuer.');
        return;
      }
      
      if (currentStep === 3) {
        handleOrder();
      } else if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowOrderModal(false);
        setCurrentStep(1);
        setSelectedPart(null);
        setSelectedCar(null);
        setOrderNotes('');
      }
    };

    const isNextButtonEnabled = () => {
      if (currentStep === 2) return selectedCar !== null;
      return true;
    };

    return (
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Commander une pièce</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOrderModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {renderStepIndicator()}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {renderStepContent()}
            </ScrollView>

            <View style={styles.modalFooter}>
              {currentStep > 1 && currentStep < 4 && (
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={styles.modalBackButtonText}>Retour</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isNextButtonEnabled() && styles.nextButtonDisabled
                ]}
                onPress={handleNextStep}
                disabled={!isNextButtonEnabled()}
              >
                <Text style={[
                  styles.nextButtonText,
                  !isNextButtonEnabled() && styles.nextButtonTextDisabled
                ]}>
                  {getNextButtonText()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSubCategory = (subCategory: SubCategory) => (
    <View key={subCategory.name} style={styles.subCategoryContainer}>
      <Text style={styles.subCategoryTitle}>
        {subCategory.name} ({subCategory.count})
      </Text>
      <FlatList
        data={subCategory.parts}
        renderItem={renderPart}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.partsGrid}
        contentContainerStyle={styles.partList}
      />
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => {
    const isExpanded = expandedCategories.includes(item.name);
    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(item.name)}
        >
          <Text style={styles.categoryTitle}>{item.name}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={24}
            color={Colors.text}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.subCategoriesContainer}>
            {item.subCategories.map(subCategory => renderSubCategory(subCategory))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{translations.fr.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.fr.mechanicalPartsCatalog}</Text>
        </View>
        
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.name}
          contentContainerStyle={{
            paddingBottom: Spacing.xl * 3,
            paddingHorizontal: Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{translations.fr.noPartsAvailable}</Text>
            </View>
          }
        />
        {renderOrderModal()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  categoryContainer: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  subCategoriesContainer: {
    paddingLeft: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  subCategoryContainer: {
    marginBottom: Spacing.sm,
  },
  subCategoryTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  partList: {
    paddingLeft: Spacing.md,
  },
  partsGrid: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  partItem: {
    width: (width - Spacing.lg * 3) / 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
    overflow: 'hidden',
  },
  partItemDisabled: {
    opacity: 0.6,
  },
  partImageContainer: {
    position: 'relative',
  },
  partImage: {
    width: '100%',
    height: 120,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  partInfo: {
    padding: Spacing.sm,
  },
  partName: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    marginBottom: 4,
  },
  partPrice: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  partStock: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  orderButtonDisabled: {
    borderColor: Colors.textSecondary,
    backgroundColor: '#f5f5f5',
  },
  orderButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginLeft: 4,
  },
  orderButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#22C55E',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContent: {
    paddingVertical: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  selectedPartCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  selectedPartImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  selectedPartInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  selectedPartName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  selectedPartPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  selectedPartCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  carsContainer: {
    maxHeight: 300,
  },
  noCarsText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    paddingVertical: Spacing.xl,
  },
  carCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  carCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  carImage: {
    width: 60,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  carInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  carBrand: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  carModel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  carPlate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  orderSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: Spacing.lg,
  },
  successMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: Spacing.md,
  },
  modalBackButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: 'white',
  },
  nextButtonTextDisabled: {
    color: '#ccc',
  },
});

export default MechanicalPartsCatalogScreen;
