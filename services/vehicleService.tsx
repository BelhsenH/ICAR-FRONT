import config from '../config';

export interface Vehicle {
  _id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  engineType?: string;
  fuelType?: string;
  color?: string;
  mileage?: number;
  registrationDate?: string;
  insuranceExpiryDate?: string;
  nextMaintenanceDate?: string;
  photos?: string[];
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleData {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  engineType?: string;
  fuelType?: string;
  color?: string;
  mileage?: number;
  registrationDate?: string;
  insuranceExpiryDate?: string;
  photos?: File[];
}

class VehicleService {
  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private getMultipartHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async getUserVehicles(token: string): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/user`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.vehicles || [];
    } catch (error) {
      console.error('Error fetching user vehicles:', error);
      throw error;
    }
  }

  async getVehicleById(vehicleId: string, token: string): Promise<Vehicle> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/${vehicleId}`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.vehicle;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  async createVehicle(vehicleData: CreateVehicleData, token: string): Promise<Vehicle> {
    try {
      const formData = new FormData();
      
      // Add vehicle data
      Object.keys(vehicleData).forEach(key => {
        const value = vehicleData[key as keyof CreateVehicleData];
        if (key === 'photos' && Array.isArray(value)) {
          value.forEach((photo, index) => {
            formData.append(`photos`, photo, `photo-${index}.jpg`);
          });
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch(`${config.apiUrl}/vehicles`, {
        method: 'POST',
        headers: this.getMultipartHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.vehicle;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  async updateVehicle(vehicleId: string, vehicleData: Partial<CreateVehicleData>, token: string): Promise<Vehicle> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.vehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  async deleteVehicle(vehicleId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  async uploadVehiclePhotos(vehicleId: string, photos: File[], token: string): Promise<string[]> {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append(`photos`, photo, `photo-${index}.jpg`);
      });

      const response = await fetch(`${config.apiUrl}/vehicles/${vehicleId}/photos`, {
        method: 'POST',
        headers: this.getMultipartHeaders(token),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.photos;
    } catch (error) {
      console.error('Error uploading vehicle photos:', error);
      throw error;
    }
  }

  async deleteVehiclePhoto(vehicleId: string, photoUrl: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/${vehicleId}/photos`, {
        method: 'DELETE',
        headers: this.getHeaders(token),
        body: JSON.stringify({ photoUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting vehicle photo:', error);
      throw error;
    }
  }

  // Search vehicles by brand, model, or license plate
  async searchVehicles(query: string, token: string): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${config.apiUrl}/vehicles/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.vehicles || [];
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }
}

export default new VehicleService();
