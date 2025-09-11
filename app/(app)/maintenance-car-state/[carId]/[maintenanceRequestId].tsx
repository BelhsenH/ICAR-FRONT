import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { Text, Card, ProgressBar, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../../constants/Theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ModernButton } from '../../../../components/modern/ModernButton';
import { maintenanceCarStateAPI, MaintenanceCarStateData } from '../../../../services/maintenanceCarStateAPI';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface FormSection {
  title: string;
  fields: FormField[];
  icon: string;
  color: string;
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: string[];
  unit?: string;
  icon?: string;
}

export default function MaintenanceCarStateForm() {
  const { carId, maintenanceRequestId } = useLocalSearchParams();
  const { language, translations } = useLanguage();
  const t = translations[language];
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MaintenanceCarStateData>({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [completedFields, setCompletedFields] = useState(0);
  const [totalFields, setTotalFields] = useState(0);
  const animatedValue = useState(new Animated.Value(0))[0];

  // Check if we're editing existing data
  useEffect(() => {
    loadExistingData();
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [carId, maintenanceRequestId]);

  // Calculate total fields count
  useEffect(() => {
    let total = 0;
    formSections.forEach(section => {
      total += section.fields.length;
    });
    // Add additional fields from additionalDetails
    total += 3; // recentAccidents, customModifications, otherNotes
    setTotalFields(total);
  }, [formSections]);

  // Calculate completion progress
  useEffect(() => {
    let filled = 0;
    
    // Count filled fields from sections
    formSections.forEach(section => {
      section.fields.forEach(field => {
        const value = getFieldValue(field.key);
        if (value !== null && value !== undefined && value !== '') {
          filled++;
        }
      });
    });
    
    // Count additional details fields
    const additionalDetails = formData.additionalDetails || {};
    if (additionalDetails.recentAccidents && additionalDetails.recentAccidents.trim()) filled++;
    if (additionalDetails.customModifications && additionalDetails.customModifications.trim()) filled++;
    if (additionalDetails.otherNotes && additionalDetails.otherNotes.trim()) filled++;
    
    setCompletedFields(filled);
  }, [formData, formSections]);

  const loadExistingData = async () => {
    try {
      const response = await maintenanceCarStateAPI.getMaintenanceCarState(carId as string, maintenanceRequestId as string);
      if (response.success) {
        setFormData(response.data);
        setIsEditMode(true);
      }
    } catch (error) {
      console.log('No existing data found, creating new state');
      setIsEditMode(false);
    }
  };

  const formSections: FormSection[] = [
    {
      title: language === 'ar' ? 'معلومات عامة' : language === 'fr' ? 'Informations générales' : 'General Information',
      icon: 'information-circle',
      color: Theme.colors.info,
      fields: [
        {
          key: 'currentMileage',
          label: language === 'ar' ? 'المسافة الحالية' : language === 'fr' ? 'Kilométrage actuel' : 'Current Mileage',
          type: 'number',
          unit: 'km',
          icon: 'speedometer'
        }
      ]
    },
    {
      title: language === 'ar' ? 'زيت المحرك والمرشحات' : language === 'fr' ? 'Huile moteur et filtres' : 'Engine Oil & Filters',
      icon: 'oil-temperature',
      color: Theme.colors.warning,
      fields: [
        {
          key: 'engineOil.lastChangeKm',
          label: language === 'ar' ? 'آخر تغيير زيت المحرك (كم)' : language === 'fr' ? 'Dernier changement huile (km)' : 'Last Oil Change (km)',
          type: 'number',
          unit: 'km',
          icon: 'speedometer'
        },
        {
          key: 'engineOil.lastChangeDate',
          label: language === 'ar' ? 'تاريخ آخر تغيير زيت' : language === 'fr' ? 'Date dernier changement' : 'Last Oil Change Date',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'engineOil.oilType',
          label: language === 'ar' ? 'نوع الزيت' : language === 'fr' ? 'Type d\'huile' : 'Oil Type',
          type: 'select',
          options: ['5W-30 synthetic', '5W-40 synthetic', '10W-40 semi-synthetic', '15W-40 mineral', 'Other'],
          icon: 'water'
        },
        {
          key: 'oilFilter.lastChangeKm',
          label: language === 'ar' ? 'آخر تغيير فلتر زيت (كم)' : language === 'fr' ? 'Dernier changement filtre (km)' : 'Last Oil Filter Change (km)',
          type: 'number',
          unit: 'km',
          icon: 'funnel'
        },
        {
          key: 'oilFilter.lastChangeDate',
          label: language === 'ar' ? 'تاريخ آخر تغيير فلتر زيت' : language === 'fr' ? 'Date changement filtre' : 'Last Oil Filter Change Date',
          type: 'date',
          icon: 'calendar'
        }
      ]
    },
    {
      title: language === 'ar' ? 'السوائل' : language === 'fr' ? 'Fluides' : 'Fluids',
      icon: 'water-outline',
      color: Theme.colors.accent,
      fields: [
        {
          key: 'coolantAntifreeze.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير سائل التبريد' : language === 'fr' ? 'Dernier changement liquide de refroidissement' : 'Last Coolant Change',
          type: 'date',
          icon: 'snow'
        },
        {
          key: 'brakeFluid.lastChangeDate',
          label: language === 'ar' ? 'آخر تغيير سائل الفرامل' : language === 'fr' ? 'Dernier changement liquide de frein' : 'Last Brake Fluid Change',
          type: 'date',
          icon: 'hand-left'
        },
        {
          key: 'transmissionFluid.lastChangeDate',
          label: language === 'ar' ? 'آخر تغيير زيت القير' : language === 'fr' ? 'Dernier changement huile de transmission' : 'Last Transmission Fluid Change',
          type: 'date',
          icon: 'cog'
        }
      ]
    },
    {
      title: language === 'ar' ? 'الإطارات والفرامل' : language === 'fr' ? 'Pneus et freins' : 'Tires & Brakes',
      icon: 'car-tire-alert',
      color: Theme.colors.error,
      fields: [
        {
          key: 'tirePressure.frontPSI',
          label: language === 'ar' ? 'ضغط الإطارات الأمامية' : language === 'fr' ? 'Pression pneus avant' : 'Front Tire Pressure',
          type: 'number',
          unit: 'PSI',
          icon: 'gauge'
        },
        {
          key: 'tirePressure.rearPSI',
          label: language === 'ar' ? 'ضغط الإطارات الخلفية' : language === 'fr' ? 'Pression pneus arrière' : 'Rear Tire Pressure',
          type: 'number',
          unit: 'PSI',
          icon: 'gauge'
        },
        {
          key: 'tirePressure.lastCheckDate',
          label: language === 'ar' ? 'آخر فحص ضغط الإطارات' : language === 'fr' ? 'Dernière vérification pression' : 'Last Pressure Check',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'brakePads.front.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير فحمات الفرامل الأمامية' : language === 'fr' ? 'Dernier changement plaquettes avant' : 'Last Front Brake Pads Change',
          type: 'date',
          icon: 'stop-circle'
        },
        {
          key: 'brakePads.rear.lastReplacementDate',
          label: language === 'ar' ? 'آخر تغيير فحمات الفرامل الخلفية' : language === 'fr' ? 'Dernier changement plaquettes arrière' : 'Last Rear Brake Pads Change',
          type: 'date',
          icon: 'stop-circle'
        }
      ]
    },
    {
      title: language === 'ar' ? 'البطارية والكهربائيات' : language === 'fr' ? 'Batterie et électricité' : 'Battery & Electrical',
      icon: 'battery-charging',
      color: Theme.colors.success,
      fields: [
        {
          key: 'battery12V.installDate',
          label: language === 'ar' ? 'تاريخ تركيب البطارية' : language === 'fr' ? 'Date installation batterie' : 'Battery Install Date',
          type: 'date',
          icon: 'calendar'
        },
        {
          key: 'battery12V.lastVoltage',
          label: language === 'ar' ? 'آخر قراءة جهد' : language === 'fr' ? 'Dernière lecture tension' : 'Last Voltage Reading',
          type: 'number',
          unit: 'V',
          icon: 'flash'
        }
      ]
    }
  ];

  const handleInputChange = (key: string, value: any) => {
    const keys = key.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const getFieldValue = (key: string) => {
    const keys = key.split('.');
    let value = formData;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || '';
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      let response;
      if (isEditMode) {
        response = await maintenanceCarStateAPI.updateMaintenanceCarState(carId as string, maintenanceRequestId as string, formData);
      } else {
        response = await maintenanceCarStateAPI.createMaintenanceCarState(carId as string, maintenanceRequestId as string, formData);
      }
      
      if (response.success) {
        Alert.alert(
          t.success || 'Success',
          isEditMode 
            ? (language === 'ar' ? 'تم تحديث حالة السيارة بنجاح' : language === 'fr' ? 'État du véhicule mis à jour avec succès' : 'Car state updated successfully')
            : (language === 'ar' ? 'تم حفظ حالة السيارة بنجاح' : language === 'fr' ? 'État du véhicule sauvegardé avec succès' : 'Car state saved successfully'),
          [{ text: t.ok || 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t.error || 'Error', response.message || 'Failed to save car state');
      }
    } catch (error) {
      console.error('Error saving maintenance car state:', error);
      Alert.alert(t.error || 'Error', 'Failed to save car state');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = getFieldValue(field.key);
    const hasValue = value !== null && value !== undefined && value !== '';
    
    switch (field.type) {
      case 'text':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={18} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </View>
            )}
            <TextInput
              style={[styles.input, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              value={value as string}
              onChangeText={(text) => handleInputChange(field.key, text)}
              placeholder={field.label}
              placeholderTextColor={Theme.colors.textSecondary + '80'}
            />
            {hasValue && (
              <View style={styles.inputValidationIcon}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
              </View>
            )}
          </View>
        );
        
      case 'number':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={18} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </View>
            )}
            <View style={[styles.inputWithUnit, field.icon && { marginLeft: 40 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }, hasValue && styles.inputFilled]}
                value={value?.toString() || ''}
                onChangeText={(text) => handleInputChange(field.key, text ? parseFloat(text) : undefined)}
                placeholder={field.label}
                placeholderTextColor={Theme.colors.textSecondary + '80'}
                keyboardType="numeric"
              />
              {field.unit && (
                <View style={styles.unitContainer}>
                  <Text style={styles.unitLabel}>{field.unit}</Text>
                </View>
              )}
            </View>
            {hasValue && (
              <View style={styles.inputValidationIcon}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
              </View>
            )}
          </View>
        );
        
      case 'date':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={18} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.dateInput, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              onPress={() => setShowDatePicker(field.key)}
            >
              <Text style={[styles.dateText, !value && styles.placeholderText]}>
                {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : field.label}
              </Text>
              <View style={[styles.dateIcon, hasValue && styles.dateIconFilled]}>
                <Ionicons name="calendar" size={18} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {hasValue && (
              <View style={styles.inputValidationIcon}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
              </View>
            )}
            
            {showDatePicker === field.key && (
              <DateTimePicker
                value={value ? parseDate(value as string) : new Date()}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(null);
                  if (selectedDate) {
                    handleInputChange(field.key, formatDate(selectedDate));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primary + 'E6']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.header, 
            {
              opacity: animatedValue,
              transform: [{
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              }]
            }
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color={Theme.colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEditMode 
                ? (language === 'ar' ? 'تحديث حالة السيارة' : language === 'fr' ? 'Mettre à jour l\'état' : 'Update Vehicle Status')
                : (language === 'ar' ? 'حالة السيارة' : language === 'fr' ? 'État du véhicule' : 'Vehicle Inspection')
              }
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode 
                ? (language === 'ar' ? 'تعديل بيانات الصيانة' : language === 'fr' ? 'Modifier les données de maintenance' : 'Modify maintenance data')
                : (language === 'ar' ? 'فحص شامل للمركبة' : language === 'fr' ? 'Inspection complète du véhicule' : 'Comprehensive vehicle assessment')
              }
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.completionBadge}>
              <Text style={styles.completionPercentage}>
                {Math.round((completedFields / (totalFields || 1)) * 100)}%
              </Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>
              {language === 'ar' ? 'تقدم الإكمال' : language === 'fr' ? 'Progrès de completion' : 'Completion Progress'}
            </Text>
            <Text style={styles.progressStats}>
              {`${completedFields} ${language === 'ar' ? 'من' : language === 'fr' ? 'de' : 'of'} ${totalFields} ${language === 'ar' ? 'حقول مكتملة' : language === 'fr' ? 'champs complétés' : 'fields completed'}`}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.round((completedFields / (totalFields || 1)) * 100)}%`]
                    })
                  }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressStart}>0%</Text>
              <Text style={styles.progressEnd}>100%</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {formSections.map((section, sectionIndex) => (
            <Animated.View 
              key={sectionIndex} 
              style={[
                styles.section,
                {
                  opacity: animatedValue,
                  transform: [{
                    translateY: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: section.color + '15', borderColor: section.color + '30' }]}>
                  <MaterialIcons name={section.icon as any} size={22} color={section.color} />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionMeta}>
                    <View style={[styles.sectionBadge, { backgroundColor: section.color + '10' }]}>
                      <Text style={[styles.sectionBadgeText, { color: section.color }]}>
                        {section.fields.filter(field => {
                          const value = getFieldValue(field.key);
                          return value !== null && value !== undefined && value !== '';
                        }).length}/{section.fields.length} {language === 'ar' ? 'مكتمل' : language === 'fr' ? 'terminé' : 'completed'}
                      </Text>
                    </View>
                    <View style={[styles.statusIndicator, {
                      backgroundColor: section.fields.filter(field => {
                        const value = getFieldValue(field.key);
                        return value !== null && value !== undefined && value !== '';
                      }).length === section.fields.length ? Theme.colors.success : Theme.colors.warning
                    }]} />
                  </View>
                </View>
              </View>
              
              {section.fields.map((field, fieldIndex) => (
                <View key={fieldIndex} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  {renderField(field)}
                </View>
              ))}
            </Animated.View>
          ))}
          
          <View style={styles.additionalSection}>
            <View style={styles.additionalSectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: Theme.colors.info + '15', borderColor: Theme.colors.info + '30' }]}>
                <MaterialIcons name="note-add" size={22} color={Theme.colors.info} />
              </View>
              <Text style={styles.sectionTitle}>
                {language === 'ar' ? 'ملاحظات إضافية' : language === 'fr' ? 'Notes supplémentaires' : 'Additional Information'}
              </Text>
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'حوادث حديثة' : language === 'fr' ? 'Accidents récents' : 'Recent Accidents'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.recentAccidents || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.recentAccidents', text)}
                placeholder={language === 'ar' ? 'اذكر أي حوادث حديثة...' : language === 'fr' ? 'Mentionner les accidents récents...' : 'Mention any recent accidents...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'تعديلات مخصصة' : language === 'fr' ? 'Modifications personnalisées' : 'Custom Modifications'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.customModifications || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.customModifications', text)}
                placeholder={language === 'ar' ? 'اذكر أي تعديلات...' : language === 'fr' ? 'Mentionner les modifications...' : 'Mention any modifications...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'ar' ? 'ملاحظات أخرى' : language === 'fr' ? 'Autres notes' : 'Other Notes'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.additionalDetails?.otherNotes || ''}
                onChangeText={(text) => handleInputChange('additionalDetails.otherNotes', text)}
                placeholder={language === 'ar' ? 'أي ملاحظات إضافية...' : language === 'fr' ? 'Notes supplémentaires...' : 'Any additional notes...'}
                placeholderTextColor={Theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>
                {language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <ModernButton
              title={isEditMode 
                ? (t.update || 'Update Status')
                : (t.save || 'Save Inspection')
              }
              onPress={handleSubmit}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...Theme.shadows.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  completionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    ...Theme.shadows.sm,
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.white,
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressStats: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.accent,
    borderRadius: 4,
    ...Theme.shadows.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressStart: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  progressEnd: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: Theme.colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    ...Theme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sectionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    ...Theme.shadows.sm,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  sectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    color: Theme.colors.text,
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  required: {
    color: Theme.colors.error,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  inputIconFilled: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
    minHeight: 52,
    ...Theme.shadows.sm,
  },
  inputWithIcon: {
    paddingLeft: 52,
  },
  inputFilled: {
    borderColor: Theme.colors.primary + '60',
    backgroundColor: Theme.colors.white,
    borderWidth: 2,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitContainer: {
    backgroundColor: Theme.colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '20',
  },
  unitLabel: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    minHeight: 52,
    ...Theme.shadows.sm,
  },
  dateIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  dateIconFilled: {
    backgroundColor: Theme.colors.primary,
  },
  inputValidationIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  dateText: {
    fontSize: 16,
    color: Theme.colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Theme.colors.textSecondary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  additionalSection: {
    backgroundColor: Theme.colors.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 120,
    ...Theme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  additionalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Theme.colors.success,
    borderRadius: 16,
    paddingVertical: 18,
    ...Theme.shadows.lg,
  },
});
