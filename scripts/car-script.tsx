import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config/index";

const API_BASE_URL = config.apiUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  extractedData?: any; // Add this for OCR responses
}

interface CarData {
  vin: string;
  marque: string;
  modele: string;
  fuelType: string;
  immatriculationType: string;
  numeroImmatriculation: string;
  registrationSubtype?: string;
  kilometrage?: string;
  datePremiereMiseEnCirculation: string | Date; // Updated to accept string or Date
}

interface CarResponse {
  _id: string;
  vin: string;
  marque: string;
  modele: string;
  fuelType: string;
  immatriculationType: string;
  numeroImmatriculation: string;
  registrationSubtype?: string;
  kilometrage?: number;
  datePremiereMiseEnCirculation: string;
  userId: string;
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

export const addCar = async (carData: CarData): Promise<ApiResponse<CarResponse>> => {
  const formattedDate = carData.datePremiereMiseEnCirculation instanceof Date
    ? carData.datePremiereMiseEnCirculation.toISOString()
    : new Date(
        carData.datePremiereMiseEnCirculation.split('/').reverse().join('-')
      ).toISOString();

  const formattedCarData = {
    ...carData,
    kilometrage: carData.kilometrage ? parseInt(carData.kilometrage) : undefined,
    datePremiereMiseEnCirculation: formattedDate,
  };

  const response = await makeRequest<CarResponse>('/api/vehicle/add', {
    method: 'POST',
    body: JSON.stringify(formattedCarData),
  });

  if (response.success && response.data && (response.data as any).car) {
    return {
      ...response,
      data: (response.data as any).car,
    };
  }

  return response;
};

export const addCarFromCarteGrise = async (
  imageFile: File | any,
  manualOverrides?: Partial<CarData>
): Promise<ApiResponse<CarResponse & { extractedData?: any }>> => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }

    const formData = new FormData();
    formData.append('carteGrise', imageFile);

    // Add manual overrides if provided
    if (manualOverrides) {
      Object.entries(manualOverrides).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/vehicle/add-from-carte-grise`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let the browser set it with boundary for FormData
      },
      body: formData,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const rawText = await response.text();
      console.error('Raw response:', rawText);
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
        data: data.extractedData, // Include extracted data even on failure
      };
    }

    return {
      success: true,
      data: data.car,
      message: data.message,
      extractedData: data.extractedData,
    };

  } catch (error: any) {
    console.error('Error adding car from carte grise:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
};

export const testOCR = async (imageFile: File | any): Promise<ApiResponse<any>> => {
  try {
    const formData = new FormData();
    formData.append('carteGrise', imageFile);

    const response = await fetch(`${API_BASE_URL}/api/vehicle/test-ocr`, {
      method: 'POST',
      body: formData,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const rawText = await response.text();
      console.error('Raw response:', rawText);
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
      data: data,
      message: data.message,
    };

  } catch (error: any) {
    console.error('Error testing OCR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
};

export const getUserCars = async (): Promise<ApiResponse<CarResponse[]>> => {
  const response = await makeRequest<{ cars: CarResponse[] }>('/api/vehicle/my-cars', {
    method: 'GET',
  });

  if (response.success && response.data && (response.data as any).cars) {
    return {
      ...response,
      data: (response.data as any).cars,
    };
  }

  return {
    ...response,
    data: undefined,
  };
};

export const generateQrCode = async (carId: string): Promise<ApiResponse<{ qrCode: string; qrData: any }>> => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    if (!token) {
      return { success: false, message: 'No token found' };
    }

    const response = await fetch(`${API_BASE_URL}/api/vehicle/generate-qr/${carId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { success: false, message: 'Failed to generate QR code' };
  }
};

export const getCarById = async (carId: string): Promise<ApiResponse<CarResponse>> => {
  return makeRequest<CarResponse>(`/api/vehicle/car/${carId}`, {
    method: 'GET',
  });
};

export const editCar = async (carId: string, carData: CarData): Promise<ApiResponse<CarResponse>> => {
  const formattedDate = carData.datePremiereMiseEnCirculation instanceof Date
    ? carData.datePremiereMiseEnCirculation.toISOString()
    : new Date(
        carData.datePremiereMiseEnCirculation.split('/').reverse().join('-')
      ).toISOString();

  const formattedCarData = {
    ...carData,
    kilometrage: carData.kilometrage ? parseInt(carData.kilometrage) : undefined,
    datePremiereMiseEnCirculation: formattedDate,
  };

  const response = await makeRequest<CarResponse>(`/api/vehicle/edit/${carId}`, {
    method: 'PUT',
    body: JSON.stringify(formattedCarData),
  });

  if (response.success && response.data && (response.data as any).car) {
    return {
      ...response,
      data: (response.data as any).car,
    };
  }

  return response;
};

export const deleteCar = async (carId: string): Promise<ApiResponse<null>> => {
  return makeRequest<null>(`/api/vehicle/delete/${carId}`, {
    method: 'DELETE',
  });
};

export const exportCar = async (carId: string): Promise<ApiResponse<CarResponse>> => {
  const response = await makeRequest<CarResponse>(`/api/vehicle/export/${carId}`, {
    method: 'POST',
  });

  if (response.success && response.data && (response.data as any).car) {
    return {
      ...response,
      data: (response.data as any).car,
    };
  }

  return response;
};