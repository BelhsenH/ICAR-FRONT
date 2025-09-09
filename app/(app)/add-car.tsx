import React, { useState, useRef, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, StyleSheet, ScrollView, Alert, Animated, StatusBar, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Text, Provider as PaperProvider, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, LightTheme, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { addCar, addCarFromCarteGrise } from '../../scripts/car-script';
import { authService } from '../../scripts/auth-script';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const carBrands: Record<string, string[]> = {
  "Alfa Romeo": ["Giulia", "Stelvio"],
  "Audi": ["A3 Berline", "A3 Sportback", "E-tron GT", "Q2", "Q3", "Q3 Sportback", "Q6 e-tron", "Q7", "Q8"],
  "Bako": ["B-Van", "Bee"],
  "Bestune": ["T77 Pro"],
  "BMW": ["i4", "i5", "iX", "iX1", "iX3", "Série 1", "Série 3", "Série 4 Coupé", "Série 4 Gran Coupé", "Série 5", "X1", "X2", "X3", "X3 Hybride", "X4", "X5 Hybride"],
  "BYD": ["Atto 3", "Dolphin", "King", "Song Plus", "Tang EV"],
  "Changan": ["Hunter", "New Star Van", "Stra Truck Double Cabine"],
  "Chery": ["Arrio 8", "Tiggo 1X populaire", "Tiggo 3X", "Tiggo 4 Pro", "Tiggo 7 Pro"],
  "Chevrolet": ["Captiva", "Equinox", "Groove"],
  "Citroen": ["Berlingo", "Berlingo Van", "C3 Populaire", "C4 X", "Jumper", "Jumpy Fourgon"],
  "Cupra": ["Leon", "Terramar"],
  "Dacia": ["Duster", "Logan", "Sandero", "Sandero Stepway"],
  "DFSK": ["C31", "C32", "Glory 500", "Glory 580", "Glory iX5", "K01H", "K025"],
  "Dongfeng": ["Forthing T5 EVO", "Rich 6"],
  "FAW": ["Besturn X40"],
  "Fiat": ["500", "Doblo", "Doblo Combi", "Ducato", "Fiorino Combi", "Scudo Combi", "Tipo Berline"],
  "Foday": ["F22 D", "F22 Max", "F22 S"],
  "Ford": ["Everest", "Ranger", "Ranger Raptor"],
  "Foton": ["TM5 3.4T Chassis Cabine", "Tunland G7 Double Cabine", "Tunland G7 Simple Cabine", "View C2 Van"],
  "GAC": ["Emkoo", "Emzoom", "GA4"],
  "Geely": ["Azkarra", "Coolray", "Emgrand", "Geometry C", "GX3 Pro", "Monjaro", "Starray", "Tugella"],
  "GWM": ["Haval H6 Hybride", "Haval Jolion", "Poer AT", "Poer MT", "Tank 300 HEV", "Tank 500 HEV", "Wingle 5 Double Cabine", "Wingle 5 Simple Cabine"],
  "Honda": ["Accord", "City", "Civic", "Civic Hybride", "Civic Type R", "CR-V", "CR-V Hybride", "HR-V", "Jazz", "ZR-V"],
  "Hyundai": ["Azera Hybride", "Bayon", "Creta", "Grand i10", "Grand i10 Populaire", "Grand i10 Sedan", "i20", "i30 Fastback", "Ioniq 5", "Ioniq 6", "Kona", "Kona Electric", "Palisade Calligraphy", "Staria 11 places", "Staria 9 places", "Tucson", "Tucson Hybride", "Venue"],
  "JAC": ["T8 Pro Double Cabine"],
  "Jaguar": ["E-Pace", "F-Pace"],
  "Jeep": ["Renegade", "Wrangler", "Wrangler Unlimited"],
  "Jetour": ["Dashing", "X70 Plus"],
  "KIA": ["EV6", "EV6 GT", "EV9", "Niro Hybride", "Picanto", "Picanto Populaire", "Seltos", "Sonet", "Sportage", "Sportage Hybride", "Stonic"],
  "Land Rover": ["Defender 110", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Mahindra": ["KUV 100", "Pick-up DC", "Pick-up SC", "XUV 300"],
  "Mercedes-Benz": ["CLA", "Classe A", "Classe A Berline", "Classe C", "Classe C Plug-in Hybride", "Classe E", "Classe E Plug-in Hybride", "Classe S", "Classe V", "CLE Coupé", "EQB", "EQE Berline", "EQE SUV", "EQS SUV", "GLA", "GLB", "GLC", "GLC Coupé", "GLC Coupé Plug-in Hybride", "GLC Plug-in Hybride", "GLE", "GLE Coupé"],
  "MG": ["3", "3 Hybrid+", "4", "5", "7", "Cyberster", "GT", "One", "RX5", "RX9", "ZS", "ZS Hybrid+"],
  "Mini": ["Aceman", "Cooper Electric", "Countryman"],
  "Mitsubishi": ["Attrage Populaire", "Eclipse Cross", "L200 Double Cabine", "Pajero", "Pajero Sport"],
  "Nissan": ["Juke", "Navara", "Qashqai e-Power"],
  "Opel": ["Combo Cargo", "Corsa", "Crossland", "Grandland", "Mokka"],
  "Peugeot": ["2008", "208", "308", "408", "Boxer", "Boxer Double Cabine", "Expert", "Expert Combi", "Landtrek Double Cabine", "Landtrek Simple Cabine", "Partner", "Rifter", "Traveller"],
  "Porche": ["911", "Cayenne", "Cayenne Coupé", "Macan Electric", "Taycan", "Taycan Cross Turismo"],
  "Renault": ["Austral", "Clio", "Express Combi", "Express Van", "Kwid Populaire", "Master", "Megane", "Megane Sedan"],
  "Seat": ["Arona", "Ateca", "Ibiza", "Leon"],
  "Skoda": ["Fabia", "Kamiq", "Kushaq", "Octavia", "Scala"],
  "SsangYong": ["Korando", "Musso", "Rexton", "Tivoli", "Torres"],
  "Suzuki": ["Baleno", "Celerio Populaire", "Ertiga", "Fronx", "Jimny 3 portes", "Jimny 5 portes", "Swift"],
  "Tata": ["Super Ace Simple Cabine", "Xenon X2 Double Cabine 4x2", "Xenon X2 Double Cabine 4x4", "Xenon X2 Simple Cabine"],
  "Toyota": ["Coaster", "Corolla Sedan", "Corolla Sedan Hybride", "Fortuner", "Hiace", "Hiace Van", "Hilux Double Cabine", "Hilux Simple Cabine", "Land Cruiser 300", "Land Cruiser 76", "Land Cruiser 79", "Prado", "RAV 4 Hybride", "Yaris Cross Hybride", "Yaris Hybride"],
  "Volkswagen": ["Amarok", "Caddy Cargo", "Golf 8", "Polo", "T-Cross", "Tiguan", "Virtus"],
  "Volvo": ["EC40", "EX30", "XC40", "XC60", "XC90"],
  "Wallyscar": ["Annibal", "Annibal XXL"]
};

const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const immatriculationTypes = ['TUN', 'RS'];

interface FormData {
  marque: string;
  modele: string;
  vin: string;
  fuelType: string;
  immatriculationType: string;
  immatriculationFirst: string;
  immatriculationSecond: string;
  immatriculation: string;
  kilometrage: string;
  datePremiereMiseEnCirculation: string;
}

const AddCar: React.FC = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [addMethod, setAddMethod] = useState<'manual' | 'qr' | 'ocr'>('manual');
  const [formData, setFormData] = useState<FormData>({
    marque: '',
    modele: '',
    vin: '',
    fuelType: '',
    immatriculationType: '',
    immatriculationFirst: '',
    immatriculationSecond: '',
    immatriculation: '',
    kilometrage: '',
    datePremiereMiseEnCirculation: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showMarqueDropdown, setShowMarqueDropdown] = useState(false);
  const [showModeleDropdown, setShowModeleDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const [showImmatDropdown, setShowImmatDropdown] = useState(false);
  const focusedInputRef = useRef<string | null>(null);

  const vinInputRef = useRef<TextInput>(null);
  const immatFirstInputRef = useRef<TextInput>(null);
  const immatSecondInputRef = useRef<TextInput>(null);
  const immatInputRef = useRef<TextInput>(null);
  const kilometrageInputRef = useRef<TextInput>(null);

  const router = useRouter();
  const { language, translations } = useLanguage();
  const t = translations[language];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUserType(response.data.type);
      }
    };
    fetchProfile();
  }, []);

  const handleMarqueSelect = React.useCallback((marque: string) => {
    setFormData(prev => ({ ...prev, marque, modele: '' }));
    setErrors(prev => ({ ...prev, marque: '' }));
    setShowMarqueDropdown(false);
  }, []);

  const handleModeleSelect = React.useCallback((modele: string) => {
    setFormData(prev => ({ ...prev, modele }));
    setErrors(prev => ({ ...prev, modele: '' }));
    setShowModeleDropdown(false);
  }, []);

  const handleImmatTypeSelect = React.useCallback((immatriculationType: string) => {
    setFormData(prev => ({ ...prev, immatriculationType, immatriculation: '', immatriculationFirst: '', immatriculationSecond: '' }));
    setErrors(prev => ({ ...prev, immatriculationType: '' }));
    setShowImmatDropdown(false);
  }, []);

  const handleFuelTypeSelect = React.useCallback((fuelType: string) => {
    setFormData(prev => ({ ...prev, fuelType }));
    setErrors(prev => ({ ...prev, fuelType: '' }));
    setShowFuelDropdown(false);
  }, []);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;

    if (!formData.marque) {
      newErrors.marque = t.brandRequired || 'Brand is required';
      isValid = false;
    }
    if (!formData.modele) {
      newErrors.modele = t.modelRequired || 'Model is required';
      isValid = false;
    }
    if (!formData.vin) {
      newErrors.vin = t.vinRequired || 'VIN code is required';
      isValid = false;
    }
    if (!formData.fuelType) {
      newErrors.fuelType = t.fuelTypeRequired || 'Fuel type is required';
      isValid = false;
    }
    if (!formData.immatriculationType) {
      newErrors.immatriculationType = t.registrationTypeRequired || 'Registration type is required';
      isValid = false;
    }
    if (formData.immatriculationType === 'TUN') {
      if (!formData.immatriculationFirst || !formData.immatriculationSecond) {
        newErrors.immatriculation = t.registrationPartsRequired || 'Both registration parts are required';
        isValid = false;
      } else if (!/^[0-9]{1,3}$/.test(formData.immatriculationFirst)) {
        newErrors.immatriculation = t.invalidFirstPart || 'First part must be 1-3 digits';
        isValid = false;
      } else if (!/^[0-9]{1,7}$/.test(formData.immatriculationSecond)) {
        newErrors.immatriculation = t.invalidSecondPart || 'Second part must be 1-7 digits';
        isValid = false;
      }
    } else if (formData.immatriculationType === 'RS') {
      if (!formData.immatriculation) {
        newErrors.immatriculation = t.registrationRequired || 'Registration number is required';
        isValid = false;
      } else if (!/^[0-9]{1,6}$/.test(formData.immatriculation)) {
        newErrors.immatriculation = t.invalidRegistration || 'Registration must be 1-6 digits';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddCar = async () => {
    if (!validateForm()) {
      Alert.alert(t.error, t.fillRequiredFields);
      return;
    }

    setLoading(true);
    try {
      const numeroImmatriculation = formData.immatriculationType === 'TUN'
        ? `${formData.immatriculationFirst} TUN ${formData.immatriculationSecond}`
        : formData.immatriculation;

      let dateStr = '';
      if (formData.datePremiereMiseEnCirculation instanceof Date) {
        const day = formData.datePremiereMiseEnCirculation.getDate().toString().padStart(2, '0');
        const month = (formData.datePremiereMiseEnCirculation.getMonth() + 1).toString().padStart(2, '0');
        const year = formData.datePremiereMiseEnCirculation.getFullYear();
        dateStr = `${day}/${month}/${year}`;
      } else if (
        typeof formData.datePremiereMiseEnCirculation === 'string' &&
        formData.datePremiereMiseEnCirculation.includes('/')
      ) {
        dateStr = formData.datePremiereMiseEnCirculation;
      }

      const payload = {
        ...formData,
        numeroImmatriculation,
        datePremiereMiseEnCirculation: dateStr,
        kilometrage: formData.kilometrage ? Number(formData.kilometrage) : 0,
        registrationSubtype: undefined,
      };

      const response = await addCar(payload);

      if (response.success) {
        Alert.alert(
          t.success,
          response.message || t.carAddedSuccess,
          [{ text: t.ok, onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t.error, response.message || t.failedToAddCar);
      }
    } catch (error) {
      Alert.alert(t.error, t.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    router.push('/(app)/qr-scanner');
  };

  const handleOCRScan = () => {
    router.push('/(app)/carte-grise-scanner');
  };

  const handleInputChange = React.useCallback((key: keyof FormData, value: string) => {
    setFormData((prev) => {
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: '' };
    });
  }, []);

  const animateDropdown = React.useCallback((toValue: number) => {
    Animated.timing(dropdownAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [dropdownAnim]);

  interface InlineDropdownProps {
    items: string[];
    visible: boolean;
    onSelect: (item: string) => void;
    onClose: () => void;
  }

  const InlineDropdown: React.FC<InlineDropdownProps> = React.memo(({ items, visible, onSelect, onClose }) => {
    useEffect(() => {
      animateDropdown(visible ? 1 : 0);
    }, [visible, animateDropdown]);

    if (!visible) return null;

    const handleItemPress = React.useCallback((item: string) => {
      onSelect(item);
      onClose();
    }, [onSelect, onClose]);

    return (
      <Animated.View style={[styles.dropdown, { opacity: dropdownAnim }]}>
        <ScrollView 
          style={styles.dropdownScroll}
          contentContainerStyle={styles.dropdownScrollContent}
          keyboardShouldPersistTaps="always"
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          bounces={true}
        >
          {items.map((item, idx) => (
            <TouchableOpacity
              key={`${item}-${idx}`}
              style={[
                styles.dropdownItem,
                idx === items.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => handleItemPress(item)}
              accessible={true}
              accessibilityLabel={`${item} option`}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownItemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  });
  InlineDropdown.displayName = 'InlineDropdown';

  const ManualForm: React.FC = React.memo(() => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.brand} *</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.marque && styles.inputError]}
          onPress={() => {
            setShowModeleDropdown(false);
            setShowFuelDropdown(false);
            setShowImmatDropdown(false);
            setShowMarqueDropdown(!showMarqueDropdown);
          }}
          accessible={true}
          accessibilityLabel={t.selectBrand}
        >
          <Text style={[styles.dropdownButtonText, !formData.marque && styles.placeholderText]}>
            {formData.marque || t.selectBrand}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {errors.marque && <Text style={styles.errorText}>{errors.marque}</Text>}
        {showMarqueDropdown && (
          <InlineDropdown
            items={Object.keys(carBrands)}
            visible={showMarqueDropdown}
            onSelect={handleMarqueSelect}
            onClose={() => setShowMarqueDropdown(false)}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.model} *</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.modele && styles.inputError]}
          onPress={() => {
            if (formData.marque) {
              Keyboard.dismiss();
              setShowMarqueDropdown(false);
              setShowFuelDropdown(false);
              setShowImmatDropdown(false);
              setShowModeleDropdown(!showModeleDropdown);
            }
          }}
          disabled={!formData.marque}
          accessible={true}
          accessibilityLabel={t.selectModel}
        >
          <Text style={[styles.dropdownButtonText, !formData.modele && styles.placeholderText]}>
            {formData.modele || t.selectModel}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {errors.modele && <Text style={styles.errorText}>{errors.modele}</Text>}
        {showModeleDropdown && (
          <InlineDropdown
            items={formData.marque ? carBrands[formData.marque as keyof typeof carBrands] || [] : []}
            visible={showModeleDropdown}
            onSelect={handleModeleSelect}
            onClose={() => setShowModeleDropdown(false)}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.vinCode} *</Text>
        <TextInput
          ref={vinInputRef}
          placeholder={t.enterVin}
          value={formData.vin}
          onChangeText={(vin) => handleInputChange('vin', vin)}
          style={[styles.inputStyle, errors.vin && styles.inputError]}
          onFocus={() => { focusedInputRef.current = 'vin'; }}
          onBlur={() => { focusedInputRef.current = null; }}
          keyboardType="default"
          autoCapitalize="characters"
          blurOnSubmit={false}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (formData.immatriculationType === 'TUN') {
              immatFirstInputRef.current?.focus();
            } else if (formData.immatriculationType === 'RS') {
              immatInputRef.current?.focus();
            }
          }}
          accessible={true}
          accessibilityLabel={t.enterVin}
        />
        {errors.vin && <Text style={styles.errorText}>{errors.vin}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.registrationType} *</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.immatriculationType && styles.inputError]}
          onPress={() => {
            Keyboard.dismiss();
            setShowMarqueDropdown(false);
            setShowModeleDropdown(false);
            setShowFuelDropdown(false);
            setShowImmatDropdown(!showImmatDropdown);
          }}
          accessible={true}
          accessibilityLabel={t.selectRegistrationType}
        >
          <Text style={[styles.dropdownButtonText, !formData.immatriculationType && styles.placeholderText]}>
            {formData.immatriculationType || t.selectRegistrationType}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {errors.immatriculationType && <Text style={styles.errorText}>{errors.immatriculationType}</Text>}
        {showImmatDropdown && (
          <InlineDropdown
            items={immatriculationTypes}
            visible={showImmatDropdown}
            onSelect={handleImmatTypeSelect}
            onClose={() => setShowImmatDropdown(false)}
          />
        )}
      </View>

      {formData.immatriculationType === 'TUN' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t.registrationNumber} *</Text>
          <View style={styles.tunInputContainer}>
            <TextInput
              ref={immatFirstInputRef}
              placeholder={language === 'fr' ? 'Ex: 123' : 'مثال: 123'}
              value={formData.immatriculationFirst}
              onChangeText={(value) => handleInputChange('immatriculationFirst', value.replace(/[^0-9]/g, '').slice(0, 3))}
              style={[styles.tunInput, styles.inputStyle, errors.immatriculation && styles.inputError]}
              keyboardType="numeric"
              onFocus={() => { focusedInputRef.current = 'immatriculationFirst'; }}
              onBlur={() => { focusedInputRef.current = null; }}
              blurOnSubmit={false}
              returnKeyType="next"
              onSubmitEditing={() => immatSecondInputRef.current?.focus()}
              accessible={true}
              accessibilityLabel={t.enterFirstPart}
            />
            <Text style={styles.tunText}>TUN</Text>
            <TextInput
              ref={immatSecondInputRef}
              placeholder={language === 'fr' ? 'Ex: 4567' : 'مثال: 4567'}
              value={formData.immatriculationSecond}
              onChangeText={(value) => handleInputChange('immatriculationSecond', value.replace(/[^0-9]/g, '').slice(0, 7))}
              style={[styles.tunInput, styles.inputStyle, errors.immatriculation && styles.inputError]}
              keyboardType="numeric"
              onFocus={() => { focusedInputRef.current = 'immatriculationSecond'; }}
              onBlur={() => { focusedInputRef.current = null; }}
              blurOnSubmit={false}
              returnKeyType="next"
              onSubmitEditing={() => kilometrageInputRef.current?.focus()}
              accessible={true}
              accessibilityLabel={t.enterSecondPart}
            />
          </View>
          {errors.immatriculation && <Text style={styles.errorText}>{errors.immatriculation}</Text>}
        </View>
      )}

      {formData.immatriculationType === 'RS' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t.registrationNumber} *</Text>
          <TextInput
            ref={immatInputRef}
            placeholder={language === 'fr' ? 'Ex: 123456' : 'مثال: 123456'}
            value={formData.immatriculation}
            onChangeText={(value) => handleInputChange('immatriculation', value.replace(/[^0-9]/g, '').slice(0, 6))}
            style={[styles.inputStyle, errors.immatriculation && styles.inputError]}
            keyboardType="numeric"
            onFocus={() => { focusedInputRef.current = 'immatriculation'; }}
            onBlur={() => { focusedInputRef.current = null; }}
            blurOnSubmit={false}
            returnKeyType="next"
            onSubmitEditing={() => kilometrageInputRef.current?.focus()}
            accessible={true}
            accessibilityLabel={t.enterRegistration}
          />
          {errors.immatriculation && <Text style={styles.errorText}>{errors.immatriculation}</Text>}
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.fuelType} *</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, errors.fuelType && styles.inputError]}
          onPress={() => {
            Keyboard.dismiss();
            setShowMarqueDropdown(false);
            setShowModeleDropdown(false);
            setShowImmatDropdown(false);
            setShowFuelDropdown(!showFuelDropdown);
          }}
          accessible={true}
          accessibilityLabel={t.selectFuelType}
        >
          <Text style={[styles.dropdownButtonText, !formData.fuelType && styles.placeholderText]}>
            {formData.fuelType || t.selectFuelType}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {errors.fuelType && <Text style={styles.errorText}>{errors.fuelType}</Text>}
        {showFuelDropdown && (
          <InlineDropdown
            items={fuelTypes}
            visible={showFuelDropdown}
            onSelect={handleFuelTypeSelect}
            onClose={() => setShowFuelDropdown(false)}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.mileage}</Text>
        <TextInput
          ref={kilometrageInputRef}
          placeholder={t.enterMileage}
          value={formData.kilometrage}
          onChangeText={(kilometrage) => handleInputChange('kilometrage', kilometrage.replace(/[^0-9]/g, ''))}
          style={[styles.inputStyle]}
          keyboardType="numeric"
          onFocus={() => { focusedInputRef.current = 'kilometrage'; }}
          onBlur={() => { focusedInputRef.current = null; }}
          blurOnSubmit={false}
          returnKeyType="done"
          accessible={true}
          accessibilityLabel={t.enterMileage}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t.firstRegistrationDate}</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            Keyboard.dismiss();
            setShowDatePicker(true);
          }}
          accessible={true}
          accessibilityLabel={t.selectDate}
        >
          <Text style={[styles.dropdownButtonText, !formData.datePremiereMiseEnCirculation && styles.placeholderText]}>
            {formData.datePremiereMiseEnCirculation || t.firstRegistrationDate}
          </Text>
          <Text style={styles.dropdownArrow}>📅</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dateValue || new Date()}
            mode="date"
            display="calendar"
            onChange={(event: any, selectedDate: Date | undefined) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDateValue(selectedDate);
                const day = selectedDate.getDate().toString().padStart(2, '0');
                const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                const year = selectedDate.getFullYear();
                setFormData({ ...formData, datePremiereMiseEnCirculation: `${day}/${month}/${year}` });
                if (focusedInputRef.current === 'kilometrage') kilometrageInputRef.current?.focus();
              }
            }}
            maximumDate={new Date()}
            accentColor={Colors.primary}
          />
        )}
        <Text style={styles.hintText}>
          {language === 'fr'
            ? 'Astuce : Cliquez sur l’année en haut du calendrier pour naviguer rapidement par année.'
            : 'ملاحظة: انقر على السنة أعلى التقويم للتنقل بسرعة بين السنوات.'}
        </Text>
      </View>

      <ModernButton
        title={t.addCar}
        onPress={handleAddCar}
        loading={loading}
        gradient={true}
        size="large"
        style={styles.addButton}
      />
    </View>
  ));
  ManualForm.displayName = 'ManualForm';

  const QRScanOption: React.FC = React.memo(() => (
    <View style={styles.qrContainer}>
      <View style={styles.qrIconContainer}>
        <Text style={styles.qrIcon}>📱</Text>
      </View>
      <Text variant="headlineSmall" style={styles.qrTitle}>
        {t.scanQrCode}
      </Text>
      <Text variant="bodyMedium" style={styles.qrDescription}>
        {t.scanQrDesc}
      </Text>
      <ModernButton
        title={t.openQrScanner}
        onPress={handleQRScan}
        gradient={true}
        size="large"
        style={styles.qrButton}
        icon="📷"
      />
    </View>
  ));
  QRScanOption.displayName = 'QRScanOption';

  const OCRScanOption: React.FC = React.memo(() => (
    <View style={styles.qrContainer}>
      <View style={styles.qrIconContainer}>
        <Text style={styles.qrIcon}>📄</Text>
      </View>
      <Text variant="headlineSmall" style={styles.qrTitle}>
        {t.scanCarteGrise || 'Scan Carte Grise'}
      </Text>
      <Text variant="bodyMedium" style={styles.qrDescription}>
        {t.scanCarteGriseDesc || 'Take photos of the front and back of your registration document. Our AI will extract the vehicle information automatically.'}
      </Text>
      <ModernButton
        title={t.openCarteGriseScanner || 'Open Document Scanner'}
        onPress={handleOCRScan}
        gradient={true}
        size="large"
        style={styles.qrButton}
        icon="📋"
      />
    </View>
  ));
  OCRScanOption.displayName = 'OCRScanOption';

  return (
    <PaperProvider theme={LightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessible={true}
            accessibilityLabel={t.goBack}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {t.addNewCar}
          </Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>

        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.methodSelector}>
            <SegmentedButtons
              value={addMethod}
              onValueChange={setAddMethod}
              buttons={[
                { value: 'manual', label: t.manualEntry, icon: 'pencil' },
                { value: 'qr', label: t.qrCode, icon: 'cellphone' },
                { value: 'ocr', label: t.carteGrise || 'Carte Grise', icon: 'camera' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
            onStartShouldSetResponder={() => false}
          >
            {addMethod === 'manual' ? <ManualForm /> : addMethod === 'qr' ? <QRScanOption /> : <OCRScanOption />}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

AddCar.displayName = 'AddCar';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
    paddingBottom: Spacing.lg,
    ...Shadows.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: Typography.fontSize.xl,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  methodSelector: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#F8FAFC',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  segmentedButtons: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  formContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: Spacing.sm,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    minHeight: 56,
    ...Shadows.md,
  },
  dropdownButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  dropdownArrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  inputStyle: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: '#F8FAFC',
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    minHeight: 56,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: '#EF4444',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    maxHeight: 200,
    zIndex: 9999,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.lg,
    elevation: 15,
  },
  dropdownScroll: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
  },
  dropdownScrollContent: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    fontWeight: '500',
  },
  addButton: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.sm,
    ...Shadows.lg,
  },
  qrContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['3xl'],
    margin: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  qrIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 3,
    borderColor: '#3B82F6',
    ...Shadows.lg,
  },
  qrIcon: {
    fontSize: 60,
  },
  qrTitle: {
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  qrDescription: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: width * 0.8,
  },
  qrButton: {
    paddingHorizontal: Spacing.xl,
  },
  tunInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  tunInput: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },
  tunText: {
    fontSize: Typography.fontSize.base,
    color: '#1E3A8A',
    marginHorizontal: Spacing.sm,
    fontWeight: '700',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
});

export default AddCar;