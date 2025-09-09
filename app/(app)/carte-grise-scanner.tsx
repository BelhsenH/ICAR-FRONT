import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, Text, Image } from 'react-native';
import { Provider as PaperProvider, Text as PaperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { addCarFromCarteGrise, testOCR } from '../../scripts/car-script';

const { width, height } = Dimensions.get('window');

interface OCRResult {
  vin?: string;
  marque?: string;
  modele?: string;
  numeroImmatriculation?: string;
  datePremiereMiseEnCirculation?: string;
  fuelType?: string;
}

export default function CarteGriseScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'recto' | 'verso' | 'processing'>('recto');
  const [rectoImage, setRectoImage] = useState<string | null>(null);
  const [versoImage, setVersoImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<OCRResult | null>(null);
  const router = useRouter();
  const { language, translations } = useLanguage();
  const t = translations[language];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    requestPermissions();
    
    // Start entrance animation
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
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
  };

  const takePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      if (step === 'recto') {
        setRectoImage(result.assets[0].uri);
        setStep('verso');
      } else if (step === 'verso') {
        setVersoImage(result.assets[0].uri);
        processImages(rectoImage!, result.assets[0].uri);
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      if (step === 'recto') {
        setRectoImage(result.assets[0].uri);
        setStep('verso');
      } else if (step === 'verso') {
        setVersoImage(result.assets[0].uri);
        processImages(rectoImage!, result.assets[0].uri);
      }
    }
  };

  const processImages = async (rectoUri: string, versoUri: string) => {
    setStep('processing');
    setLoading(true);

    try {
      // Use the first image (recto) for OCR processing
      const imageFile = {
        uri: rectoUri,
        type: 'image/jpeg',
        name: 'carte_grise.jpg',
      } as any;

      console.log('Processing carte grise image with OCR...');
      const response = await testOCR(imageFile);

      if (response.success && response.data) {
        const ocrData = response.data.extractedData || {};
        
        // Map OCR data to our expected format
        const extractedInfo: OCRResult = {
          vin: ocrData.vin,
          marque: ocrData.marque,
          modele: ocrData.modele,
          numeroImmatriculation: ocrData.numeroImmatriculation,
          datePremiereMiseEnCirculation: ocrData.datePremiereMiseEnCirculation,
          fuelType: ocrData.fuelType,
        };

        setExtractedData(extractedInfo);
        setLoading(false);

        Alert.alert(
          t.ocrSuccessTitle || 'OCR Processing Complete',
          t.ocrSuccessMessage || 'Vehicle information has been extracted successfully. Please review and confirm.',
          [
            {
              text: t.review || 'Review',
              onPress: () => showExtractedData(extractedInfo),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert(
        t.error || 'Error',
        'Failed to process carte grise images. Please try again.',
        [
          {
            text: t.tryAgain || 'Try Again',
            onPress: () => {
              setStep('recto');
              setRectoImage(null);
              setVersoImage(null);
              setLoading(false);
            },
          },
          {
            text: t.cancel || 'Cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const simulateOCR = async (rectoUri: string, versoUri: string) => {
    // This function is kept for backward compatibility but not used
    console.log('simulateOCR called but not used');
  };

  const showExtractedData = (data: OCRResult) => {
    Alert.alert(
      t.extractedData || 'Extracted Data',
      `VIN: ${data.vin}\nMarque: ${data.marque}\nModèle: ${data.modele}\nImmatriculation: ${data.numeroImmatriculation}\nDate: ${data.datePremiereMiseEnCirculation}\nCarburant: ${data.fuelType}`,
      [
        {
          text: t.cancel || 'Cancel',
          style: 'cancel',
          onPress: () => {
            setStep('recto');
            setRectoImage(null);
            setVersoImage(null);
            setExtractedData(null);
          },
        },
        {
          text: t.addCar || 'Add Car',
          onPress: () => addCarFromOCR(data),
        },
      ]
    );
  };

  const addCarFromOCR = async (data: OCRResult) => {
    if (!data.vin || !data.marque || !data.modele) {
      Alert.alert(t.error || 'Error', 'Missing required vehicle information');
      return;
    }

    try {
      setLoading(true);
      
      // Use the new addCarFromCarteGrise function
      const imageFile = {
        uri: rectoImage!,
        type: 'image/jpeg',
        name: 'carte_grise.jpg',
      } as any;

      // Prepare manual overrides based on extracted data
      const manualOverrides = {
        vin: data.vin,
        marque: data.marque,
        modele: data.modele,
        fuelType: data.fuelType || 'Essence',
        immatriculationType: data.numeroImmatriculation?.includes('TUN') ? 'TUN' : 'RS',
        numeroImmatriculation: data.numeroImmatriculation || '',
        datePremiereMiseEnCirculation: data.datePremiereMiseEnCirculation || new Date().toISOString(),
      };

      const response = await addCarFromCarteGrise(imageFile, manualOverrides);
      
      if (response.success) {
        Alert.alert(
          t.success || 'Success',
          t.carAddedSuccess || 'Car added successfully!',
          [
            {
              text: t.ok || 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to add car');
      }
    } catch (error) {
      console.error('Error adding car from OCR:', error);
      Alert.alert(t.error || 'Error', 'Failed to add car. Please try manual entry.');
    } finally {
      setLoading(false);
    }
  };

  const retakePicture = () => {
    if (step === 'verso') {
      setStep('recto');
      setRectoImage(null);
    } else {
      setRectoImage(null);
      setVersoImage(null);
      setStep('recto');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t.requestingPermission || 'Requesting permissions...'}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t.noCameraAccess || 'No access to camera and media library'}</Text>
        <ModernButton
          title={t.grantPermission || 'Grant Permission'}
          onPress={requestPermissions}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <PaperProvider theme={LightTheme}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {step === 'recto' 
              ? (t.scanCarteGriseRecto || 'Scan Carte Grise (Front)')
              : step === 'verso'
              ? (t.scanCarteGriseVerso || 'Scan Carte Grise (Back)')
              : (t.processing || 'Processing...')
            }
          </Text>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {step === 'processing' ? (
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>
                {t.processingImages || 'Processing images...'}
              </Text>
              <Text style={styles.processingSubtext}>
                {t.ocrProcessingDesc || 'Our AI is extracting vehicle information from your carte grise images.'}
              </Text>
            </View>
          ) : (
            <>
              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>
                  {step === 'recto'
                    ? (t.scanRectoInstructions || 'Position the front of your carte grise')
                    : (t.scanVersoInstructions || 'Position the back of your carte grise')
                  }
                </Text>
                <Text style={styles.instructionsText}>
                  {step === 'recto'
                    ? (t.scanRectoDesc || 'Make sure all text is clearly visible and the document is well-lit')
                    : (t.scanVersoDesc || 'Make sure the back side is clearly visible and well-lit')
                  }
                </Text>
              </View>

              {/* Preview */}
              {(step === 'recto' && rectoImage) || (step === 'verso' && versoImage) ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: step === 'recto' ? rectoImage! : versoImage! }}
                    style={styles.previewImage}
                  />
                  <ModernButton
                    title={t.retake || 'Retake'}
                    onPress={retakePicture}
                    variant="outline"
                    style={styles.retakeButton}
                  />
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <ModernButton
                  title={t.takePhoto || 'Take Photo'}
                  onPress={takePicture}
                  gradient={true}
                  size="large"
                  style={styles.actionButton}
                  icon="📷"
                />
                
                <ModernButton
                  title={t.chooseFromGallery || 'Choose from Gallery'}
                  onPress={pickFromGallery}
                  variant="outline"
                  size="large"
                  style={styles.actionButton}
                  icon="🖼️"
                />
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={[
                  styles.progressDot, 
                  (step as string) !== 'recto' ? styles.progressDotCompleted : null
                ]} />
                <View style={styles.progressLine} />
                <View style={[
                  styles.progressDot, 
                  (step as string) === 'verso' ? styles.progressDotActive : null, 
                  (step as string) === 'processing' ? styles.progressDotCompleted : null
                ]} />
              </View>
            </>
          )}
        </Animated.View>
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
    backgroundColor: Colors.primary,
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
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: width * 0.8,
    height: (width * 0.8) * 0.625, // 16:10 aspect ratio
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  retakeButton: {
    paddingHorizontal: Spacing.xl,
  },
  actionButtons: {
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.textLight,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.textLight,
    marginHorizontal: Spacing.sm,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  processingText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  processingSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  permissionText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: Spacing.xl,
  },
});
