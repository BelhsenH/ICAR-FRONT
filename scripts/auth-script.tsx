import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/index';

const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  type: 'entreprise' | 'personal';
  password: string;
}

interface LoginData {
  phoneNumber: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
    password: string;
    type: 'particulier' | 'professionnel';
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface VerifyPhoneData {
  phoneNumber: string;
  code: string;
}

interface ForgotPasswordData {
  phoneNumber: string;
}

interface ResetPasswordData {
  phoneNumber: string;
  code: string;
  newPassword: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/icar/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyPhone(data: VerifyPhoneData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/icar/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginData): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>('/api/auth/icar/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      await AsyncStorage.setItem('@auth_token', response.data.token);
    }

    return response;
  }

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/icar/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/icar/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/me', {
      method: 'GET',
    });
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resendVerificationCode(phoneNumber: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/icar/resend-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/api/auth/icar/logout', {
      method: 'POST',
    });
    
    await AsyncStorage.removeItem('@auth_token');
    return response;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('@auth_token');
    return !!token;
  }
}

export const authService = new AuthService();
export type { RegisterData, LoginData, VerifyPhoneData, ForgotPasswordData, ResetPasswordData, ChangePasswordData, UpdateProfileData };