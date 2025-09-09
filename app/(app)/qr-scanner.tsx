import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { addCar, exportCar } from '../../scripts/car-script';

const { width, height } = Dimensions.get('window');

export default function QRScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { language, translations } = useLanguage();
  const t = translations[language];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Request camera permissions
    requestCameraPermission();
    
    // Start entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Start scan line animation
    startScanLineAnimation();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const startScanLineAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      
      if (qrData.action !== 'transfer_ownership') {
        throw new Error('Invalid QR code format');
      }

      // Prepare car data for ownership transfer
      const carData = {
        carId: qrData.carId,
      };

      const response = await exportCar(qrData.carId);
      if (response.success) {
        Alert.alert(
          t.qrSuccessTitle || 'QR Code Scanned!',
          t.qrSuccessMessage || 'Car ownership has been transferred successfully.',
          [
            {
              text: t.ok || 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to transfer car ownership');
      }
    } catch (error) {
      Alert.alert(
        t.qrErrorTitle || 'Invalid QR Code',
        t.qrErrorMessage || 'The scanned QR code does not contain valid car information.',
        [
          {
            text: t.tryAgain || 'Try Again',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            },
          },
          {
            text: t.cancel || 'Cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t.requestingPermission || 'Requesting camera permission...'}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>{t.noCameraAccess || 'No access to camera'}</Text>
        <ModernButton
          title={t.grantPermission || 'Grant Permission'}
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        />
      </View>
    );
  }

  return (
    <PaperProvider theme={LightTheme}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Camera View */}
        <Camera
          style={StyleSheet.absoluteFill}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeScannerSettings={{
            barCodeTypes: ['qr'],
          }}
        />

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{t.scanQrCode || 'Scan QR Code'}</Text>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.scanCorner} />
          <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
          <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
          <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
          
          {/* Animated Scan Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200], // Ensure these are numbers, not strings
                    }),
                  },
                ],
              },
            ]}
          />
        </View>

        {/* Instructions */}
        <Animated.View style={[styles.instructionsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.instructionsTitle}>
            {t.positionQr || 'Position the QR code within the frame'}
          </Text>
          <Text style={styles.instructionsText}>
            {t.qrInstructions || 'Make sure the QR code is clearly visible and well-lit for best results'}
          </Text>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View style={[styles.bottomActions, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.flashButton}>
            <Text style={styles.flashIcon}>💡</Text>
            <Text style={styles.flashText}>{t.flash || 'Flash'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.galleryButton}>
            <Text style={styles.galleryIcon}>🖼️</Text>
            <Text style={styles.galleryText}>{t.gallery || 'Gallery'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
  scanFrame: {
    position: 'absolute',
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    top: height * 0.25,
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.accent,
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 0,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.lg,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  flashButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  flashIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  flashText: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  galleryButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  galleryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  galleryText: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '500',
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