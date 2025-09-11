import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/index';

const API_BASE_URL = config.apiUrl || 'http://localhost:3004';

interface ServiceRequestData {
  serviceId: string;
  date?: string; // Made optional
  time: string;
  paymentMethod: 'cash' | 'card';
  description?: string;
}

interface ManualServiceRequestData {
  serviceType: string;
  description: string;
  date: string;
  isManual: boolean;
  serviceName?: string;
}

// Helper function to create fetch request with timeout and better error handling
const createFetchRequest = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 10000
): Promise<Response> => {
  const token = await AsyncStorage.getItem('@auth_token');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper function to handle common HTTP errors
const handleHttpError = (response: Response, defaultMessage: string): never => {
  if (response.status === 401) {
    throw new Error('Authentication failed. Please login again.');
  } else if (response.status === 404) {
    throw new Error('Resource not found.');
  } else if (response.status === 500) {
    throw new Error('Server error. Please try again later.');
  }
  throw new Error(`${defaultMessage} (${response.status})`);
};

export const serviceAPI = {
  // Get services by category/type
  async getServicesByType(type: string, location?: string) {
    try {
      const encodedType = encodeURIComponent(type);
      const url = `${API_BASE_URL}/api/maintenance/service/type/${encodedType}${location ? `?location=${encodeURIComponent(location)}` : ''}`;
      
      const response = await createFetchRequest(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No services found for this category.');
        }
        handleHttpError(response, 'Failed to fetch services');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      console.error('Error fetching services by type:', error);
      throw error;
    }
  },

  // Get all services
  async getAllServices(params?: { type?: string; location?: string; limit?: number; includeInactive?: boolean }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append('type', params.type);
      if (params?.location) queryParams.append('location', params.location);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.includeInactive) queryParams.append('includeInactive', 'true');
      
      const url = `${API_BASE_URL}/api/maintenance/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await createFetchRequest(url);

      if (!response.ok) {
        handleHttpError(response, 'Failed to fetch services');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Create service request
  async createServiceRequest(carId: string, requestData: ServiceRequestData) {
    try {
      const response = await createFetchRequest(
        `${API_BASE_URL}/api/maintenance/request/${carId}`,
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        },
        15000 // 15 second timeout for POST
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request data.');
        } else if (response.status === 404) {
          throw new Error('Car not found.');
        }
        handleHttpError(response, errorData.error || 'Failed to create service request');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      console.error('Error creating service request:', error);
      throw error;
    }
  },

  // Get service requests by car
  async getServiceRequestsByCar(carId: string) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/car/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service requests:', error);
      throw error;
    }
  },

  // Get service requests by icar
  async getServiceRequestsByIcar(icarId: string) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/icar/${icarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service requests for icar:', error);
      throw error;
    }
  },

  // Get service history for current authenticated user
  async getMyServiceHistory() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/my-service-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service history:', error);
      throw error;
    }
  },

  // Update service request status (for irepair)
  async updateServiceRequestStatus(
    requestId: string, 
    status: string, 
    description?: string, 
    actualCost?: number, 
    notes?: string
  ) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/request/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, description, actualCost, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service request status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating service request status:', error);
      throw error;
    }
  },

  // Get single service request
  async getServiceRequest(requestId: string) {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/maintenance/request/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch service request');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching service request:', error);
      throw error;
    }
  },

  // Create manual service request
  async createManualServiceRequest(carId: string, requestData: ManualServiceRequestData) {
    try {
      const response = await createFetchRequest(
        `${API_BASE_URL}/api/maintenance/request/${carId}/manual`,
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        },
        15000 // 15 second timeout for POST
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request data.');
        } else if (response.status === 404) {
          throw new Error('Car not found.');
        }
        handleHttpError(response, errorData.error || 'Failed to create manual service request');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      console.error('Error creating manual service request:', error);
      throw error;
    }
  },
};
