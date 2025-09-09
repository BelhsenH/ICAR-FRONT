import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernInput } from '../../components/modern/ModernInput';
import { authService } from '../../scripts/auth-script';

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsScreen() {
  const { language, translations } = useLanguage();
  const t = translations[language];

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t.error, t.passwordsDontMatch || 'Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert(t.error, t.passwordTooShort || 'Password too short');
      return;
    }

    const response = await authService.updateProfile({
      password: passwordData.newPassword,
    });

    if (response.success) {
      Alert.alert(
        t.success,
        t.passwordUpdated || 'Password updated successfully',
        [
          {
            text: t.ok,
            onPress: () => {
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(t.error, response.error || t.errorUpdatingPassword || 'Error updating password');
    }
  };

  const renderPasswordSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.changePassword}</Text>
      </View>

      <View style={styles.formContainer}>
        <ModernInput
          label={t.currentPassword}
          value={passwordData.currentPassword}
          onChangeText={(text) =>
            setPasswordData({ ...passwordData, currentPassword: text })
          }
          secureTextEntry
          placeholder={t.enterCurrentPassword || 'Enter current password'}
        />
        <ModernInput
          label={t.newPassword}
          value={passwordData.newPassword}
          onChangeText={(text) =>
            setPasswordData({ ...passwordData, newPassword: text })
          }
          secureTextEntry
          placeholder={t.enterNewPassword || 'Enter new password'}
        />
        <ModernInput
          label={t.confirmNewPassword || t.confirmPassword}
          value={passwordData.confirmPassword}
          onChangeText={(text) =>
            setPasswordData({ ...passwordData, confirmPassword: text })
          }
          secureTextEntry
          placeholder={t.confirmNewPassword || 'Confirm new password'}
        />
      </View>

      <View style={styles.saveButtonContainer}>
        <ModernButton
          title={t.save}
          onPress={handleChangePassword}
          style={styles.saveButton}
        />
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t.settings}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPasswordSection()}
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
    backgroundColor: Theme.colors.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...Theme.shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  formContainer: {
    gap: 15,
  },
  saveButtonContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 0,
  },
});