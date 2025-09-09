import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

interface MaintenanceCarStateData {
  currentMileage?: number;
  engineOil?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    oilType?: string;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  oilFilter?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  coolantAntifreeze?: {
    lastReplacementKm?: number;
    lastReplacementDate?: string;
    nextReplacementDue?: {
      km?: number;
      date?: string;
    };
  };
  transmissionFluid?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    isAutomatic?: boolean;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  brakeFluid?: {
    lastChangeDate?: string;
    isOverdue?: boolean;
    nextChangeDue?: string;
  };
  powerSteeringFluid?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    isHydraulic?: boolean;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  fuelFilter?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  airFilter?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  cabinFilter?: {
    lastChangeKm?: number;
    lastChangeDate?: string;
    nextChangeDue?: {
      km?: number;
      date?: string;
    };
  };
  tirePressure?: {
    frontPSI?: number;
    rearPSI?: number;
    lastCheckDate?: string;
  };
  brakePads?: {
    front?: {
      lastReplacementKm?: number;
      lastReplacementDate?: string;
      nextReplacementDue?: {
        km?: number;
        date?: string;
      };
    };
    rear?: {
      lastReplacementKm?: number;
      lastReplacementDate?: string;
      nextReplacementDue?: {
        km?: number;
        date?: string;
      };
    };
  };
  brakeDiscsRotors?: {
    front?: {
      lastReplacementKm?: number;
      lastReplacementDate?: string;
      nextReplacementDue?: {
        km?: number;
        date?: string;
      };
    };
    rear?: {
      lastReplacementKm?: number;
      lastReplacementDate?: string;
      nextReplacementDue?: {
        km?: number;
        date?: string;
      };
    };
  };
  tires?: {
    replacementDate?: string;
    mileageAtReplacement?: number;
    lastRotationDate?: string;
    lastPressureCheckDate?: string;
  };
  battery12V?: {
    installDate?: string;
    lastCheckDate?: string;
    lastVoltage?: number;
    nextCheckDue?: string;
  };
  sparkPlugsGlowPlugs?: {
    lastReplacementKm?: number;
    lastReplacementDate?: string;
    plugType?: string;
    nextReplacementDue?: {
      km?: number;
      date?: string;
    };
  };
  timingBeltChain?: {
    lastReplacementKm?: number;
    lastReplacementDate?: string;
    beltType?: string;
    isOverdue?: boolean;
    nextReplacementDue?: {
      km?: number;
      date?: string;
    };
  };
  suspension?: {
    shocksStruts?: {
      lastInspectionDate?: string;
      lastRepairDate?: string;
      condition?: string;
    };
    bushings?: {
      condition?: string;
      lastInspectionDate?: string;
    };
  };
  wiperBlades?: {
    lastReplacementDate?: string;
    nextReplacementDue?: string;
  };
  hvBattery?: {
    stateOfHealth?: number;
    lastCheckDate?: string;
    nextCheckDue?: string;
  };
  inverterCoolant?: {
    lastReplacementKm?: number;
    lastReplacementDate?: string;
    nextReplacementDue?: {
      km?: number;
      date?: string;
    };
  };
  chargingPortCable?: {
    lastInspectionDate?: string;
    condition?: string;
    conditionNotes?: string;
  };
  additionalDetails?: {
    recentAccidents?: string;
    customModifications?: string;
    fuelType?: string;
    exhaustSystemChecks?: string;
    alignmentHistory?: string;
    otherNotes?: string;
  };
  uploadedPhotos?: {
    url?: string;
    description?: string;
    type?: string;
  }[];
}

class MaintenanceCarStateAPI {
  private baseUrl = `${config.apiUrl}/api/vehicle`;

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async createMaintenanceCarState(carId: string, maintenanceRequestId: string, data: MaintenanceCarStateData) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-state/${maintenanceRequestId}`,
        {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error creating maintenance car state:', error);
      throw error;
    }
  }

  async updateMaintenanceCarState(carId: string, maintenanceRequestId: string, data: Partial<MaintenanceCarStateData>) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-state/${maintenanceRequestId}`,
        {
          method: 'PUT',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(data)
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error updating maintenance car state:', error);
      throw error;
    }
  }

  async getMaintenanceCarState(carId: string, maintenanceRequestId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-state/${maintenanceRequestId}`,
        {
          headers: await this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting maintenance car state:', error);
      throw error;
    }
  }

  async getMaintenanceCarStatesByCar(carId: string, limit: number = 20, skip: number = 0) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-states?limit=${limit}&skip=${skip}`,
        {
          headers: await this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting maintenance car states by car:', error);
      throw error;
    }
  }

  async getUserMaintenanceCarStates(limit: number = 50, skip: number = 0) {
    try {
      const response = await fetch(
        `${this.baseUrl}/user/maintenance-states?limit=${limit}&skip=${skip}`,
        {
          headers: await this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting user maintenance car states:', error);
      throw error;
    }
  }

  async deleteMaintenanceCarState(carId: string, maintenanceRequestId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-state/${maintenanceRequestId}`,
        {
          method: 'DELETE',
          headers: await this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error deleting maintenance car state:', error);
      throw error;
    }
  }

  async getMaintenanceDashboard(carId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${carId}/maintenance-dashboard`,
        {
          headers: await this.getAuthHeaders()
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting maintenance dashboard:', error);
      throw error;
    }
  }
}

export const maintenanceCarStateAPI = new MaintenanceCarStateAPI();
export type { MaintenanceCarStateData };
