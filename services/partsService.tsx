import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

export interface VehicleInfo {
  vin?: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
}

export interface PartsRequest {
  _id: string;
  partName: string;
  partDescription?: string;
  vehicleInfo: VehicleInfo;
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  preferredCommunicationMethod: 'call' | 'message';
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  images?: string[];
  estimatedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartsRequestData {
  partId?: string;
  partName: string;
  category?: string;
  subCategory?: string;
  vehicleInfo: VehicleInfo;
  quantity: number;
  notes?: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  images?: File[];
}

export interface SearchPartsData {
  partName: string;
  vehicleId: string;
  description?: string;
}

class IcarPartsService {
  private async getHeaders() {
    const token = await AsyncStorage.getItem('@auth_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  private async getMultipartHeaders() {
    const token = await AsyncStorage.getItem('@auth_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Create a new parts request
  async createPartsRequest(requestData: CreatePartsRequestData): Promise<PartsRequest> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Parts request error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.request || data;
    } catch (error) {
      console.error('Error creating parts request:', error);
      throw error;
    }
  }

  // Get user's parts requests
  async getUserPartsRequests(): Promise<PartsRequest[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/my`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.requests || [];
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  }

  // Get a specific parts request
  async getPartsRequest(requestId: string): Promise<PartsRequest> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/request/${requestId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.request;
    } catch (error) {
      console.error('Error fetching request:', error);
      throw error;
    }
  }

  // Update a parts request
  async updatePartsRequest(
    requestId: string,
    updates: Partial<CreatePartsRequestData>
  ): Promise<PartsRequest> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/request/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.request;
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  }

  // Cancel a parts request
  async cancelPartsRequest(requestId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/request/${requestId}/cancel`, {
        method: 'PATCH',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }

  // Search for parts (this would connect to parts catalog)
  async searchParts(query: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/all-parts?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.parts || [];
    } catch (error) {
      console.error('Error searching parts:', error);
      throw error;
    }
  }

  // Get parts by category
  async getPartsByCategory(category?: string): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const url = category 
        ? `${config.apiUrl}/api/parts/parts/categories?category=${encodeURIComponent(category)}`
        : `${config.apiUrl}/api/parts/parts/categories`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.parts || [];
    } catch (error) {
      console.error('Error fetching parts by category:', error);
      throw error;
    }
  }

  // Get all parts
  async getAllParts(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/all-parts`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.parts || [];
    } catch (error) {
      console.error('Error fetching all parts:', error);
      throw error;
    }
  }
}

export default new IcarPartsService();
