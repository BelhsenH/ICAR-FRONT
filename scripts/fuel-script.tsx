import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config/index";

const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface FuelEntry {
  id: string;
  carId: string;
  userId: string;
  date: string;
  odometerReading: number;
  fuelQuantity: number;
  pricePerLiter: number;
  totalCost: number;
  fuelStation: string;
  drivingConditions: string;
  fuelType: string;
  distanceTraveled?: number;
  fuelConsumption?: number;
  costPerKm?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateFuelEntryData {
  carId: string;
  date: string;
  odometerReading: number;
  fuelQuantity: number;
  pricePerLiter: number;
  fuelStation: string;
  drivingConditions: string;
  fuelType: string;
}

async function makeRequest<T>(
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

    // Read the body as text first
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('Raw response:', rawText);
      // If response is HTML (like 502), show a clearer message
      if (rawText.startsWith('<html')) {
        return {
          success: false,
          error: 'Server error (Bad Gateway or unavailable)',
          message: 'The server returned a 502 Bad Gateway. Please try again later.',
        };
      }
      return {
        success: false,
        error: 'Invalid JSON response',
        message: rawText,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
        message: data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Get fuel entries for a specific car
export const getFuelEntries = async (carId: string): Promise<ApiResponse<FuelEntry[]>> => {
  const response = await makeRequest<{ fuelEntries: FuelEntry[] }>(`/api/vehicle/api/vehicle/fuel-tracking/${carId}`, {
    method: 'GET',
  });

  if (response.success && response.data && (response.data as any).fuelEntries) {
    return {
      ...response,
      data: (response.data as any).fuelEntries,
    };
  }

  return {
    ...response,
    data: [],
  };
};

// Create a new fuel entry
export const createFuelEntry = async (fuelData: CreateFuelEntryData): Promise<ApiResponse<FuelEntry>> => {
  const response = await makeRequest<FuelEntry>('/api/vehicle/api/vehicle/fuel-tracking', {
    method: 'POST',
    body: JSON.stringify(fuelData),
  });

  if (response.success && response.data && (response.data as any).fuelEntry) {
    return {
      ...response,
      data: (response.data as any).fuelEntry,
    };
  }

  return response;
};

// Update a fuel entry
export const updateFuelEntry = async (entryId: string, fuelData: Partial<CreateFuelEntryData>): Promise<ApiResponse<FuelEntry>> => {
  const response = await makeRequest<FuelEntry>(`/api/vehicle/api/vehicle/fuel-tracking/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(fuelData),
  });

  if (response.success && response.data && (response.data as any).fuelEntry) {
    return {
      ...response,
      data: (response.data as any).fuelEntry,
    };
  }

  return response;
};

// Delete a fuel entry
export const deleteFuelEntry = async (entryId: string): Promise<ApiResponse<null>> => {
  return makeRequest<null>(`/api/vehicle/api/vehicle/fuel-tracking/${entryId}`, {
    method: 'DELETE',
  });
};

// Get fuel statistics for a car
export const getFuelStatistics = async (carId: string): Promise<ApiResponse<{
  avgConsumption: number;
  avgCostPerKm: number;
  totalDistance: number;
  totalFuel: number;
  totalCost: number;
  entriesCount: number;
}>> => {
  return makeRequest(`/api/vehicle/api/vehicle/fuel-tracking/${carId}/statistics`, {
    method: 'GET',
  });
};