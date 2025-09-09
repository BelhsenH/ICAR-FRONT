import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import { ModernButton } from '../../../components/modern/ModernButton';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface CarPart {
  id: string;
  name: string;
  category: string;
  price: number;
  seller: {
    name: string;
    rating: number;
    contact: string;
  };
  image: any;
  description: string;
}

const PartDetailsScreen = () => {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const { language, translations } = useLanguage();

  const parts: CarPart[] = [
    {
      id: '1',
      name: 'Engine Control Unit',
      category: 'Engine',
      price: 199.99,
      seller: { name: 'AutoTech', rating: 4.5, contact: 'support@autotech.com' },
      image: require('../../../assets/images/engine-control-unit.jpeg'),
      description: 'High-performance engine control unit for optimized vehicle performance. Compatible with most modern engines, this ECU enhances fuel efficiency and power output.',
    },
    {
      id: '2',
      name: 'Brake Pads',
      category: 'Brake System',
      price: 49.99,
      seller: { name: 'BrakePro', rating: 4.2, contact: 'info@brakepro.com' },
      image: require('../../../assets/images/brake-pads.jpg'),
      description: 'Durable ceramic brake pads for enhanced stopping power. Designed for high-performance vehicles, these pads reduce brake fade and wear.',
    },
    {
      id: '3',
      name: 'Air Filter',
      category: 'Air Intake',
      price: 29.99,
      seller: { name: 'FilterCo', rating: 4.8, contact: 'sales@filterco.com' },
      image: require('../../../assets/images/air-filter.png'),
      description: 'High-flow air filter for improved engine efficiency. Increases airflow while maintaining excellent filtration to protect your engine.',
    },
    {
      id: '4',
      name: 'Radiator',
      category: 'Cooling',
      price: 89.99,
      seller: { name: 'CoolTech', rating: 4.0, contact: 'support@cooltech.com' },
      image: require('../../../assets/images/radiator.jpeg'),
      description: 'Aluminum radiator for efficient engine cooling. Lightweight and durable, suitable for high-performance and daily driving conditions.',
    },
    {
      id: '5',
      name: 'Clutch Kit',
      category: 'Clutch',
      price: 129.99,
      seller: { name: 'AutoTech', rating: 4.5, contact: 'support@autotech.com' },
      image: require('../../../assets/images/clutch-kit.jpeg'),
      description: 'Complete clutch kit for manual transmissions. Includes clutch disc, pressure plate, and release bearing for reliable performance.',
    },
    {
      id: '6',
      name: 'Shock Absorber',
      category: 'Suspension',
      price: 79.99,
      seller: { name: 'RideSmooth', rating: 4.3, contact: 'info@ridesmooth.com' },
      image: require('../../../assets/images/shock-absorber.jpeg'),
      description: 'High-quality shock absorber for improved ride comfort. Enhances vehicle stability and handling on various road conditions.',
    },
  ];

  const part = parts.find(p => p.id === itemId);

  if (!part) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{translations[language].partNotFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{part.name}</Text>
      </View>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Image source={part.image} style={styles.partImage} resizeMode="cover" />
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>{translations[language].partDetails}</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].name}</Text>
              <Text style={styles.detailValue}>{part.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].category}</Text>
              <Text style={styles.detailValue}>{part.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].price}</Text>
              <Text style={styles.detailValue}>${part.price.toFixed(2)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].description}</Text>
              <Text style={styles.detailValue}>{part.description}</Text>
            </View>
          </View>
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>{translations[language].sellerInformation}</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].seller}</Text>
              <Text style={styles.detailValue}>{part.seller.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].rating}</Text>
              <Text style={styles.detailValue}>{part.seller.rating}/5</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{translations[language].contact}</Text>
              <Text style={styles.detailValue}>{part.seller.contact}</Text>
            </View>
          </View>
          <ModernButton
            title={translations[language].purchase}
            onPress={() => alert('Purchase functionality not implemented')}
            variant="filled"
            size="large"
            style={styles.purchaseButton}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  partImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  detailsSection: {
    marginBottom: Spacing.xl,
  },
  sellerSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  detailValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  purchaseButton: {
    alignSelf: 'center',
    width: width * 0.8,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

export default PartDetailsScreen;