import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, RegisterData, LoginData, VerifyPhoneData, ForgotPasswordData, ResetPasswordData } from '../scripts/auth-script';

interface AuthFlowState {
  // User data
  currentUser: any | null;
  isAuthenticated: boolean;
  
  // Flow state
  pendingVerification: string | null; // phone number waiting for verification
  resetFlowPhone: string | null; // phone number in password reset flow
  resetFlowCode: string | null; // verification code for password reset
  
  // Loading states
  isLoading: boolean;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isVerifying: boolean;
  isResettingPassword: boolean;
}

interface AuthFlowContextType extends AuthFlowState {
  // Auth actions
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  login: (credentials: LoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Verification actions
  verifyPhone: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<{ success: boolean; error?: string }>;
  
  // Password reset actions
  initiatePasswordReset: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyResetCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  completePasswordReset: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Flow management
  clearAuthFlow: () => void;
  refreshAuthState: () => Promise<void>;
}

const AuthFlowContext = createContext<AuthFlowContextType | undefined>(undefined);

export const useAuthFlow = () => {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within an AuthFlowProvider');
  }
  return context;
};

export const AuthFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthFlowState>({
    currentUser: null,
    isAuthenticated: false,
    pendingVerification: null,
    resetFlowPhone: null,
    resetFlowCode: null,
    isLoading: false,
    isRegistering: false,
    isLoggingIn: false,
    isVerifying: false,
    isResettingPassword: false,
  });

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuthState();
  }, []);

  const initializeAuthState = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [token, userPhone, resetPhone, resetCode] = await Promise.all([
        AsyncStorage.getItem('@auth_token'),
        AsyncStorage.getItem('userPhone'),
        AsyncStorage.getItem('resetPhone'),
        AsyncStorage.getItem('resetCode'),
      ]);

      const isAuth = await authService.isAuthenticated();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        pendingVerification: userPhone,
        resetFlowPhone: resetPhone,
        resetFlowCode: resetCode,
        isLoading: false,
      }));

      // Get user profile if authenticated
      if (isAuth) {
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success) {
            setState(prev => ({ ...prev, currentUser: profileResponse.data }));
          }
        } catch (error) {
          console.error('Failed to get user profile:', error);
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const register = async (userData: RegisterData) => {
    setState(prev => ({ ...prev, isRegistering: true }));
    
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        await AsyncStorage.setItem('userPhone', userData.phoneNumber);
        setState(prev => ({
          ...prev,
          pendingVerification: userData.phoneNumber,
          isRegistering: false,
        }));
      } else {
        setState(prev => ({ ...prev, isRegistering: false }));
      }
      
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isRegistering: false }));
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const login = async (credentials: LoginData) => {
    setState(prev => ({ ...prev, isLoggingIn: true }));
    
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentUser: response.data.user,
          isAuthenticated: true,
          pendingVerification: null,
          isLoggingIn: false,
        }));
        
        // Clear any pending verification
        await AsyncStorage.removeItem('userPhone');
      } else {
        setState(prev => ({ ...prev, isLoggingIn: false }));
      }
      
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isLoggingIn: false }));
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      await clearAllStorageData();
      
      setState({
        currentUser: null,
        isAuthenticated: false,
        pendingVerification: null,
        resetFlowPhone: null,
        resetFlowCode: null,
        isLoading: false,
        isRegistering: false,
        isLoggingIn: false,
        isVerifying: false,
        isResettingPassword: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const verifyPhone = async (code: string) => {
    if (!state.pendingVerification) {
      return { success: false, error: 'No phone number pending verification' };
    }

    setState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      const response = await authService.verifyPhone({
        phoneNumber: state.pendingVerification,
        code,
      });
      
      if (response.success) {
        await AsyncStorage.removeItem('userPhone');
        setState(prev => ({
          ...prev,
          pendingVerification: null,
          isVerifying: false,
        }));
      } else {
        setState(prev => ({ ...prev, isVerifying: false }));
      }
      
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isVerifying: false }));
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  };

  const resendVerificationCode = async () => {
    if (!state.pendingVerification) {
      return { success: false, error: 'No phone number pending verification' };
    }

    try {
      return await authService.resendVerificationCode(state.pendingVerification);
    } catch (error) {
      return { success: false, error: 'Failed to resend code. Please try again.' };
    }
  };

  const initiatePasswordReset = async (phoneNumber: string) => {
    setState(prev => ({ ...prev, isResettingPassword: true }));
    
    try {
      const response = await authService.forgotPassword({ phoneNumber });
      
      if (response.success) {
        await AsyncStorage.setItem('resetPhone', phoneNumber);
        setState(prev => ({
          ...prev,
          resetFlowPhone: phoneNumber,
          resetFlowCode: null,
          isResettingPassword: false,
        }));
      } else {
        setState(prev => ({ ...prev, isResettingPassword: false }));
      }
      
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isResettingPassword: false }));
      return { success: false, error: 'Failed to send reset code. Please try again.' };
    }
  };

  const verifyResetCode = async (code: string) => {
    if (!state.resetFlowPhone) {
      return { success: false, error: 'No reset flow in progress' };
    }

    setState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Store the code for the reset password step
      await AsyncStorage.setItem('resetCode', code);
      setState(prev => ({
        ...prev,
        resetFlowCode: code,
        isVerifying: false,
      }));
      
      return { success: true };
    } catch (error) {
      setState(prev => ({ ...prev, isVerifying: false }));
      return { success: false, error: 'Failed to verify reset code.' };
    }
  };

  const completePasswordReset = async (newPassword: string) => {
    if (!state.resetFlowPhone || !state.resetFlowCode) {
      return { success: false, error: 'Reset flow incomplete. Please start over.' };
    }

    setState(prev => ({ ...prev, isResettingPassword: true }));
    
    try {
      const response = await authService.resetPassword({
        phoneNumber: state.resetFlowPhone,
        code: state.resetFlowCode,
        newPassword,
      });
      
      if (response.success) {
        // Clear reset flow data
        await AsyncStorage.multiRemove(['resetPhone', 'resetCode']);
        setState(prev => ({
          ...prev,
          resetFlowPhone: null,
          resetFlowCode: null,
          isResettingPassword: false,
        }));
      } else {
        setState(prev => ({ ...prev, isResettingPassword: false }));
      }
      
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isResettingPassword: false }));
      return { success: false, error: 'Failed to reset password. Please try again.' };
    }
  };

  const clearAuthFlow = () => {
    setState(prev => ({
      ...prev,
      pendingVerification: null,
      resetFlowPhone: null,
      resetFlowCode: null,
    }));
    
    AsyncStorage.multiRemove(['userPhone', 'resetPhone', 'resetCode']).catch(error => {
      console.error('Failed to clear auth flow data:', error);
    });
  };

  const refreshAuthState = async () => {
    await initializeAuthState();
  };

  const clearAllStorageData = async () => {
    const keys = ['@auth_token', 'userPhone', 'resetPhone', 'resetCode'];
    await AsyncStorage.multiRemove(keys);
  };

  const contextValue: AuthFlowContextType = {
    ...state,
    register,
    login,
    logout,
    verifyPhone,
    resendVerificationCode,
    initiatePasswordReset,
    verifyResetCode,
    completePasswordReset,
    clearAuthFlow,
    refreshAuthState,
  };

  return (
    <AuthFlowContext.Provider value={contextValue}>
      {children}
    </AuthFlowContext.Provider>
  );
};