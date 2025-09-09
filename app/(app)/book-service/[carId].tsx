import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Theme';
import { ModernButton } from '../../../components/modern/ModernButton';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface ServiceType {
  id: string;
  name: string;
  nameAr: string;
  duration: string;
  price: string;
  icon: string;
}

interface Mechanic {
  id: string;
  name: string;
  rating: number;
  distance: string;
  avatar: string;
  specialties: string[];
}

const serviceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'Oil Change',
    nameAr: 'تغيير الزيت',
    duration: '30 min',
    price: '50 TND',
    icon: 'car-outline',
  },
  {
    id: '2',
    name: 'Brake Service',
    nameAr: 'خدمة الفرامل',
    duration: '60 min',
    price: '120 TND',
    icon: 'disc-outline',
  },
  {
    id: '3',
    name: 'Engine Diagnostic',
    nameAr: 'تشخيص المحرك',
    duration: '45 min',
    price: '80 TND',
    icon: 'settings-outline',
  },
  {
    id: '4',
    name: 'Tire Service',
    nameAr: 'خدمة الإطارات',
    duration: '40 min',
    price: '90 TND',
    icon: 'ellipse-outline',
  },
];

const mechanics: Mechanic[] = [
  {
    id: '1',
    name: 'Ahmed Ben Ali',
    rating: 4.8,
    distance: '2.5 km',
    avatar: '👨‍🔧',
    specialties: ['Engine', 'Brakes'],
  },
  {
    id: '2',
    name: 'Mohamed Trabelsi',
    rating: 4.9,
    distance: '3.1 km',
    avatar: '👨‍🔧',
    specialties: ['Oil Change', 'Tires'],
  },
  {
    id: '3',
    name: 'Karim Sassi',
    rating: 4.7,
    distance: '4.2 km',
    avatar: '👨‍🔧',
    specialties: ['Diagnostic', 'Electrical'],
  },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

export default function BookServiceScreen() {
  const { carId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');

  // Generate next 7 days
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return dates;
  };

  const dates = generateDates();

  const handleBookAppointment = () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedMechanic) {
      Alert.alert(t.error, 'Please select all required fields');
      return;
    }

    Alert.alert(
      t.serviceBooked,
      t.serviceBookedDesc,
      [
        {
          text: t.ok,
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[Theme.colors.primary, Theme.colors.secondary]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.bookService}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.selectService}</Text>
          <View style={styles.serviceGrid}>
            {serviceTypes.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  selectedService === service.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedService(service.id)}
              >
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name={service.icon as any}
                    size={24}
                    color={
                      selectedService === service.id
                        ? Theme.colors.white
                        : Theme.colors.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.serviceName,
                    selectedService === service.id && styles.selectedText,
                  ]}
                >
                  {language === 'ar' ? service.nameAr : service.name}
                </Text>
                <Text
                  style={[
                    styles.serviceDetails,
                    selectedService === service.id && styles.selectedText,
                  ]}
                >
                  {service.duration} • {service.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.selectDate}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateContainer}>
              {dates.map((date) => (
                <TouchableOpacity
                  key={date.date}
                  style={[
                    styles.dateCard,
                    selectedDate === date.date && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedDate(date.date)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === date.date && styles.selectedText,
                    ]}
                  >
                    {date.display}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.selectTime}</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeCard,
                  selectedTime === time && styles.selectedCard,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.selectedText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mechanic Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.selectMechanic}</Text>
          {mechanics.map((mechanic) => (
            <TouchableOpacity
              key={mechanic.id}
              style={[
                styles.mechanicCard,
                selectedMechanic === mechanic.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedMechanic(mechanic.id)}
            >
              <View style={styles.mechanicInfo}>
                <Text style={styles.mechanicAvatar}>{mechanic.avatar}</Text>
                <View style={styles.mechanicDetails}>
                  <Text
                    style={[
                      styles.mechanicName,
                      selectedMechanic === mechanic.id && styles.selectedText,
                    ]}
                  >
                    {mechanic.name}
                  </Text>
                  <View style={styles.mechanicMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color={Theme.colors.warning} />
                      <Text style={styles.ratingText}>{mechanic.rating}</Text>
                    </View>
                    <Text style={styles.distanceText}>{mechanic.distance}</Text>
                  </View>
                  <View style={styles.specialtiesContainer}>
                    {mechanic.specialties.map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              {selectedMechanic === mechanic.id && (
                <Ionicons name="checkmark-circle" size={24} color={Theme.colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Book Button */}
        <View style={styles.bookingSection}>
          <ModernButton
            title={t.bookAppointment}
            onPress={handleBookAppointment}
            disabled={!selectedService || !selectedDate || !selectedTime || !selectedMechanic}
            style={styles.bookButton}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 15,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.md,
  },
  selectedCard: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  serviceDetails: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  selectedText: {
    color: Theme.colors.white,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 5,
  },
  dateCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.sm,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.text,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.sm,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.text,
  },
  mechanicCard: {
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Theme.shadows.md,
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mechanicAvatar: {
    fontSize: 40,
    marginRight: 15,
  },
  mechanicDetails: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  mechanicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  ratingText: {
    fontSize: 14,
    color: Theme.colors.text,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  specialtyTag: {
    backgroundColor: Theme.colors.background,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  bookingSection: {
    paddingBottom: 30,
  },
  bookButton: {
    marginTop: 10,
  },
});