import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { ModernButton } from '../../components/modern/ModernButton';
import { ModernInput } from '../../components/modern/ModernInput';
import { authService } from '../../scripts/auth-script';
import { SafeAreaView } from 'react-native-safe-area-context'; // Add this import

const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
};

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  accountType: 'personal' | 'enterprise';
}

export default function ProfileScreen() {
  const { language, translations, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '👤',
    accountType: 'personal',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setProfile({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: response.data.phoneNumber || '',
          avatar: '👤',
          accountType: response.data.type === 'personal' ? 'personal' : 'enterprise',
        });
      } else {
        Alert.alert(t.error, response.error || t.errorFetchingProfile);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const updateData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    };
    const response = await authService.updateProfile(updateData);
    if (response.success) {
      Alert.alert(
        t.success,
        t.profileUpdated,
        [{ text: t.ok, onPress: () => setIsEditing(false) }]
      );
    } else {
      Alert.alert(t.error, response.error || t.errorUpdatingProfile);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t.logout,
      t.confirmLogout,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.avatar}</Text>
        </View>
        <TouchableOpacity style={styles.editAvatarButton}>
          <Ionicons name="camera" size={20} color={Theme.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
        <View style={styles.accountTypeBadge}>
          <Text style={styles.accountTypeText}>
            {profile.accountType === 'personal' ? t.personal : t.enterprise}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPersonalInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.personalInfo}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons
            name={isEditing ? "checkmark" : "pencil"}
            size={20}
            color={Theme.colors.primary}
          />
          <Text style={styles.editButtonText}>
            {isEditing ? t.save : t.edit}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <ModernInput
          label={t.firstName}
          value={profile.firstName}
          onChangeText={(text) => setProfile({ ...profile, firstName: text })}
          disabled={!isEditing}
          style={!isEditing ? styles.disabledInput : undefined}
        />
        <ModernInput
          label={t.lastName}
          value={profile.lastName}
          onChangeText={(text) => setProfile({ ...profile, lastName: text })}
          disabled={!isEditing}
          style={!isEditing ? styles.disabledInput : undefined}
        />
        <ModernInput
          label={t.email}
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          keyboardType="email-address"
          disabled={!isEditing}
          style={!isEditing ? styles.disabledInput : undefined}
        />
        <ModernInput
          label={t.phone}
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          keyboardType="phone-pad"
          disabled
          style={styles.disabledInput}
        />
      </View>

      {isEditing && (
        <View style={styles.saveButtonContainer}>
          <ModernButton
            title={t.save}
            onPress={handleSaveProfile}
            style={styles.saveButton}
          />
        </View>
      )}
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.appSettings}</Text>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="language" size={24} color={Theme.colors.primary} />
          <Text style={styles.settingLabel}>{t.languageSettings}</Text>
        </View>
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageText}>
            {language === 'fr' ? 'Français' : 'العربية'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="notifications" size={24} color={Theme.colors.primary} />
          <Text style={styles.settingLabel}>{t.pushNotifications}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggle,
            pushNotifications && styles.toggleActive,
          ]}
          onPress={() => setPushNotifications(!pushNotifications)}
        >
          <View style={[
            styles.toggleThumb,
            pushNotifications && styles.toggleThumbActive,
          ]} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="mail" size={24} color={Theme.colors.primary} />
          <Text style={styles.settingLabel}>{t.emailNotifications}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggle,
            emailNotifications && styles.toggleActive,
          ]}
          onPress={() => setEmailNotifications(!emailNotifications)}
        >
          <View style={[
            styles.toggleThumb,
            emailNotifications && styles.toggleThumbActive,
          ]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.actionItem}>
        <Ionicons name="help-circle" size={24} color={Theme.colors.info} />
        <Text style={styles.actionLabel}>{t.helpSupport}</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem}>
        <Ionicons name="document-text" size={24} color={Theme.colors.info} />
        <Text style={styles.actionLabel}>Privacy Policy</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem}>
        <Ionicons name="information-circle" size={24} color={Theme.colors.info} />
        <Text style={styles.actionLabel}>About</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionItem, styles.logoutItem]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={24} color={Theme.colors.error} />
        <Text style={[styles.actionLabel, styles.logoutLabel]}>{t.logout}</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
          <Text style={styles.headerTitle}>{t.profile}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderProfileSection()}
          {renderPersonalInfoSection()}
          {/*renderSettingsSection()*/}
          {/*renderActionsSection()*/}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.md,
  },
  avatarText: {
    fontSize: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
  },
  accountTypeBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  accountTypeText: {
    fontSize: 12,
    color: Theme.colors.white,
    fontWeight: '500',
    textTransform: 'uppercase',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editButtonText: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  formContainer: {
    gap: 15,
  },
  disabledInput: {
    opacity: 0.7,
  },
  saveButtonContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginTop: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surface,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 15,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.surface,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.white,
    ...Theme.shadows.sm,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surface,
  },
  actionLabel: {
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 15,
    flex: 1,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutLabel: {
    color: Theme.colors.error,
  },
});