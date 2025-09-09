import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/index';

const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface IrepairUser {
  _id: string;
  type: string;
  nomGarage: string;
  adresse: string;
  zoneGeo: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  nomResponsable: string;
  phoneNumber: string;
  email: string;
  typeService: string[];
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

class UserService {
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
          error: data.error || data.message || 'An error occurred',
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

  async getAllIrepairs(): Promise<ApiResponse<IrepairUser[]>> {
    return this.makeRequest<IrepairUser[]>('/api/user/irepairs', {
      method: 'GET',
    });
  }

  async getIrepairById(userId: string): Promise<ApiResponse<IrepairUser>> {
    return this.makeRequest<IrepairUser>(`/api/user/irepair/${userId}`, {
      method: 'GET',
    });
  }
}

export const userService = new UserService();
export type { IrepairUser };