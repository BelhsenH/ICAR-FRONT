import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AuthProvider } from '../contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

export const unstable_settings = {
  initialRouteName: '(auth)/splash',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null; // Avoid rendering before fonts are ready
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Auth stack */}
          <Stack.Screen name="(auth)/splash" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/intro" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/verify" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/reset-code" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/new-password" options={{ headerShown: false }} />
          {/* App stack (authenticated routes) */}
          <Stack.Screen name="(app)/dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/add-car" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/qr-scanner" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/car-profile/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/mechanics-map" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/mechanics-map/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/my-cars" options={{ headerShown: false }} />
          <Stack.Screen name="(app)/book-service/[carId]" options={{ headerShown: false }} />
          <Stack.Screen name='(app)/profile' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/settings' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/service-history' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/spare-parts' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/create-parts-request' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/part-details/[itemId]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/book-service-v2/[carId]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/carte-grise-scanner' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/parts-requests' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/conversations' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/conversation/[id]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/notifications' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/parts-marketplace' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/mechanic-profile/[id]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/maintenance-dashboard/[id]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/maintenance-car-state/[carId]/[maintenanceRequestId]' options={{ headerShown: false }} />
          <Stack.Screen name='(app)/fuel-tracking/[id]' options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
    </AuthProvider>
  );
}