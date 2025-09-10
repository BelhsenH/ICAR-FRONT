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
              <Animated.View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </Animated.View>
            )}
            <TextInput
              style={[styles.input, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              value={value as string}
              onChangeText={(text) => handleInputChange(field.key, text)}
              placeholder={field.label}
              placeholderTextColor={Theme.colors.textSecondary}
            />
          </View>
        );
        
      case 'number':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <Animated.View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </Animated.View>
            )}
            <View style={[styles.inputWithUnit, field.icon && { marginLeft: 40 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }, hasValue && styles.inputFilled]}
                value={value?.toString() || ''}
                onChangeText={(text) => handleInputChange(field.key, text ? parseFloat(text) : undefined)}
                placeholder={field.label}
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric"
              />
              {field.unit && (
                <View style={styles.unitContainer}>
                  <Text style={styles.unitLabel}>{field.unit}</Text>
                </View>
              )}
            </View>
          </View>
        );
        
      case 'date':
        return (
          <View style={styles.inputContainer}>
            {field.icon && (
              <Animated.View style={[styles.inputIcon, hasValue && styles.inputIconFilled]}>
                <Ionicons name={field.icon as any} size={20} color={hasValue ? Theme.colors.white : Theme.colors.textSecondary} />
              </Animated.View>
            )}
            <TouchableOpacity
              style={[styles.dateInput, field.icon && styles.inputWithIcon, hasValue && styles.inputFilled]}
              onPress={() => setShowDatePicker(field.key)}
            >
              <Text style={[styles.dateText, !value && styles.placeholderText]}>
                {value ? new Date(value).toLocaleDateString() : field.label}
              </Text>
              <View style={styles.dateIcon}>
                <Ionicons name="calendar-outline" size={20} color={hasValue ? Theme.colors.primary : Theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
            
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
    <LinearGradient
      colors={[Theme.colors.primary, Theme.colors.secondary]}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.header, 
          {
            opacity: animatedValue,
            transform: [{
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }]
          }
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditMode 
              ? (language === 'ar' ? 'تحديث حالة السيارة' : language === 'fr' ? 'Mettre à jour l\'état' : 'Update Car State')
              : (language === 'ar' ? 'حالة السيارة' : language === 'fr' ? 'État du véhicule' : 'Car State')
            }
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {Math.round((completedFields / (totalFields || 1)) * 100)}% {language === 'ar' ? 'مكتمل' : language === 'fr' ? 'terminé' : 'complete'}
              </Text>
              <Text style={styles.progressCount}>
                {completedFields}/{totalFields} {language === 'ar' ? 'حقل' : language === 'fr' ? 'champs' : 'fields'}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <ProgressBar 
                progress={totalFields > 0 ? completedFields / totalFields : 0} 
                color={Theme.colors.accent}
                style={styles.progressBar}
              />
              <View style={[styles.progressFill, { width: `${Math.round((completedFields / (totalFields || 1)) * 100)}%` }]} />
            </View>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

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
                <View style={[styles.sectionIconContainer, { backgroundColor: section.color + '20' }]}>
                  <MaterialIcons name={section.icon as any} size={24} color={section.color} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionStatus}>
                  <View style={styles.sectionProgress}>
                    <Text style={[styles.sectionProgressText, { color: section.color }]}>
                      {section.fields.filter(field => {
                        const value = getFieldValue(field.key);
                        return value !== null && value !== undefined && value !== '';
                      }).length}/{section.fields.length}
                    </Text>
                    <View style={[styles.miniProgressBar, { backgroundColor: section.color + '20' }]}>
                      <View 
                        style={[styles.miniProgressFill, 
                          { 
                            backgroundColor: section.color,
                            width: `${(section.fields.filter(field => {
                              const value = getFieldValue(field.key);
                              return value !== null && value !== undefined && value !== '';
                            }).length / section.fields.length) * 100}%`
                          }
                        ]}
                      />
                    </View>
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
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'ملاحظات إضافية' : language === 'fr' ? 'Notes supplémentaires' : 'Additional Notes'}
            </Text>
            
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
          <ModernButton
            title={isEditMode 
              ? (t.update || 'Update')
              : (t.save || 'Save')
            }
            onPress={handleSubmit}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  progressCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    width: '80%',
    position: 'relative',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: Theme.colors.accent,
    borderRadius: 3,
    ...Theme.shadows.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: Theme.colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  sectionStatus: {
    marginLeft: 8,
  },
  sectionProgress: {
    alignItems: 'center',
    minWidth: 60,
  },
  sectionProgressText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  miniProgressBar: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 16,
    color: Theme.colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  required: {
    color: Theme.colors.error,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease',
  },
  inputIconFilled: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
    transition: 'border-color 0.2s',
  },
  inputWithIcon: {
    paddingLeft: 50,
  },
  inputFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.white,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitContainer: {
    backgroundColor: Theme.colors.primary + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  unitLabel: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 2,
    borderColor: Theme.colors.textLight,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  dateIcon: {
    padding: 4,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 100,
    ...Theme.shadows.lg,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    ...Theme.shadows.lg,
  },
  saveButton: {
    backgroundColor: Theme.colors.success,
    borderRadius: 16,
    paddingVertical: 16,
  },
});
