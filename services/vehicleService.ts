import ApiService from './api';

export interface Vehicle {
  _id: string;
  vin: string;
  marque: string;
  modele: string;
  year?: number;
  trim?: string;
  engineType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'Plug-in Hybrid' | 'LPG' | 'CNG';
  engineSize?: number;
  transmissionType?: 'Manual' | 'Automatic' | 'CVT' | 'Semi-automatic';
  drivetrain?: 'FWD' | 'RWD' | 'AWD' | '4WD';
  kilometerageUnit?: 'km' | 'mi';
  plateCountry?: string;
  plateRegion?: string;
  kilometrage?: number;
  numeroImmatriculation: string;
  immatriculationType: 'TUN' | 'RS';
  fuelType: 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'GPL';
  datePremiereMiseEnCirculation: string;
  userId: string;
  serviceHistory?: string[];
  usageData?: string[];
  maintenanceHistory?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleData {
  vin: string;
  marque: string;
  modele: string;
  year?: number;
  trim?: string;
  engineType?: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'Plug-in Hybrid' | 'LPG' | 'CNG';
  engineSize?: number;
  transmissionType?: 'Manual' | 'Automatic' | 'CVT' | 'Semi-automatic';
  drivetrain?: 'FWD' | 'RWD' | 'AWD' | '4WD';
  kilometerageUnit?: 'km' | 'mi';
  plateCountry?: string;
  plateRegion?: string;
  kilometrage?: number;
  numeroImmatriculation: string;
  immatriculationType: 'TUN' | 'RS';
  fuelType: 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' | 'GPL';
  datePremiereMiseEnCirculation: string;
}

export interface VehicleUsage {
  _id: string;
  carId: string;
  userId: string;
  sessionType: 'app_open' | 'trip_end' | 'manual_entry';
  odometerReading: number;
  tripDistance?: number;
  cityDrivingPercentage?: number;
  highwayDrivingPercentage?: number;
  averageTripLength?: number;
  idleTimePercentage?: number;
  harshAccelerationEvents?: number;
  harshBrakingEvents?: number;
  coldStartsCount?: number;
  loadCarrying?: boolean;
  towingFrequency?: 'never' | 'occasionally' | 'frequently';
  environmentalData?: {
    country?: string;
    city?: string;
    temperatureRange?: { min: number; max: number };
    humidity?: number;
    altitude?: number;
    coastalArea?: boolean;
    saltyRoads?: boolean;
  };
  parkingType?: 'garage' | 'covered' | 'street' | 'parking_lot';
  extremeTemperatureExposure?: {
    hot?: boolean;
    cold?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'rarely';
  };
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  _id: string;
  carId: string;
  userId: string;
  serviceDate: string;
  odometerAtService: number;
  workshopInfo?: {
    mechanicId?: string;
    workshopName?: string;
    workshopLocation?: string;
    contactInfo?: string;
  };
  serviceType: 'scheduled' | 'repair' | 'inspection' | 'warranty' | 'recall' | 'emergency';
  reasonForService: 'scheduled_maintenance' | 'symptom_based' | 'failure' | 'inspection' | 'warranty_work' | 'recall';
  jobLines: Array<{
    serviceCategory: 'engine' | 'transmission' | 'brakes' | 'tires' | 'electrical' | 'cooling' | 'exhaust' | 'suspension' | 'body' | 'interior' | 'other';
    description: string;
    partsReplaced?: Array<{
      partName: string;
      partSKU?: string;
      quantity: number;
      cost?: number;
    }>;
    fluidsChanged?: Array<{
      fluidType: 'engine_oil' | 'coolant' | 'brake_fluid' | 'power_steering' | 'transmission_fluid' | 'differential_oil' | 'other';
      specification?: string;
      viscosityGrade?: string;
      quantity?: number;
      cost?: number;
    }>;
    laborHours?: number;
    laborCost?: number;
  }>;
  totalCost?: {
    parts: number;
    labor: number;
    total: number;
  };
  warrantyWork?: boolean;
  recallWork?: boolean;
  recallNumber?: string;
  serviceNotes?: string;
  nextServiceDue?: {
    date?: string;
    odometer?: number;
    description?: string;
  };
  photos?: Array<{
    url: string;
    description?: string;
    type: 'before' | 'during' | 'after' | 'damage' | 'repair';
  }>;
  digitalReceipt?: {
    receiptNumber?: string;
    invoiceUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSymptomReport {
  _id: string;
  carId: string;
  userId: string;
  reportDate: string;
  odometerReading: number;
  symptoms: {
    noises?: Array<{
      type: 'squealing' | 'grinding' | 'clicking' | 'knocking' | 'rattling' | 'humming' | 'whistling' | 'other';
      location: 'engine' | 'brakes' | 'transmission' | 'wheels' | 'exhaust' | 'interior' | 'exterior' | 'other';
      when: 'startup' | 'idle' | 'acceleration' | 'braking' | 'turning' | 'constant' | 'other';
      speed: 'low_speed' | 'medium_speed' | 'high_speed' | 'all_speeds' | 'stationary';
      description?: string;
      severity: 'mild' | 'moderate' | 'severe';
    }>;
    vibrations?: Array<{
      location: 'steering_wheel' | 'brake_pedal' | 'seat' | 'floor' | 'entire_car' | 'other';
      when: 'idle' | 'acceleration' | 'braking' | 'constant_speed' | 'turning' | 'other';
      speed: 'low_speed' | 'medium_speed' | 'high_speed' | 'all_speeds' | 'stationary';
      description?: string;
      severity: 'mild' | 'moderate' | 'severe';
    }>;
    warningLights?: Array<{
      lightType: 'check_engine' | 'abs' | 'brake' | 'oil_pressure' | 'temperature' | 'battery' | 'airbag' | 'tire_pressure' | 'other';
      behavior: 'constant' | 'blinking' | 'intermittent';
      when: 'startup' | 'driving' | 'idle' | 'random' | 'always_on';
      description?: string;
    }>;
    smells?: Array<{
      type: 'burning_oil' | 'burning_rubber' | 'fuel' | 'exhaust' | 'coolant' | 'electrical' | 'other';
      location: 'engine_bay' | 'interior' | 'exterior' | 'exhaust' | 'wheels' | 'other';
      when: 'startup' | 'driving' | 'after_driving' | 'idle' | 'always' | 'other';
      intensity: 'mild' | 'moderate' | 'strong';
      description?: string;
    }>;
    performance?: {
      startingDifficulty?: boolean;
      startingDescription?: string;
      engineRoughness?: boolean;
      powerLoss?: boolean;
      fuelConsumptionIncrease?: boolean;
      transmissionIssues?: boolean;
      transmissionDescription?: string;
      steeringIssues?: boolean;
      steeringDescription?: string;
      brakeIssues?: boolean;
      brakeDescription?: string;
    };
    fluidSpots?: Array<{
      color: 'black' | 'brown' | 'red' | 'green' | 'blue' | 'clear' | 'yellow' | 'other';
      location: 'front' | 'center' | 'rear' | 'left_side' | 'right_side' | 'multiple_spots';
      consistency: 'thin' | 'thick' | 'sticky' | 'watery';
      size: 'small_drops' | 'puddle' | 'large_puddle';
      frequency: 'once' | 'occasional' | 'frequent' | 'constant';
    }>;
  };
  audioRecordings?: Array<{
    url: string;
    description?: string;
    duration?: number;
    recordingLocation?: string;
  }>;
  videoRecordings?: Array<{
    url: string;
    description?: string;
    duration?: number;
    recordingLocation?: string;
  }>;
  photos?: Array<{
    url: string;
    description?: string;
    category: 'warning_light' | 'damage' | 'fluid_spot' | 'general' | 'engine_bay' | 'interior' | 'exterior';
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  drivingSafety: 'safe_to_drive' | 'drive_with_caution' | 'avoid_highways' | 'stop_driving_immediately';
  additionalNotes?: string;
  mechanicResponse?: {
    mechanicId?: string;
    responseDate?: string;
    diagnosis?: string;
    recommendedAction?: string;
    estimatedCost?: number;
    urgencyAssessment?: 'low' | 'medium' | 'high' | 'critical';
    appointmentNeeded?: boolean;
  };
  status: 'submitted' | 'reviewed' | 'diagnosed' | 'resolved' | 'requires_inspection';
  createdAt: string;
  updatedAt: string;
}

class VehicleService {
  private readonly baseEndpoint = '/vehicles';

  async getUserVehicles(token?: string): Promise<Vehicle[]> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/user`, token);
      return response;
    } catch (error) {
      console.error('Error fetching user vehicles:', error);
      throw new Error('Failed to fetch user vehicles');
    }
  }

  async getVehicleById(id: string, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/${id}`, token);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw new Error('Failed to fetch vehicle');
    }
  }

  async getVehicleByVin(vin: string, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/vin/${vin}`, token);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle by VIN:', error);
      throw new Error('Failed to fetch vehicle by VIN');
    }
  }

  async createVehicle(vehicleData: CreateVehicleData, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}`, vehicleData, token);
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw new Error('Failed to create vehicle');
    }
  }

  async updateVehicle(id: string, vehicleData: Partial<CreateVehicleData>, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.put(`${this.baseEndpoint}/${id}`, vehicleData, token);
      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw new Error('Failed to update vehicle');
    }
  }

  async deleteVehicle(id: string, token?: string): Promise<void> {
    try {
      await ApiService.delete(`${this.baseEndpoint}/${id}`, token);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error('Failed to delete vehicle');
    }
  }

  // Enhanced vehicle profile methods
  async updateVehicleProfile(id: string, profileData: Partial<CreateVehicleData>, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.put(`${this.baseEndpoint}/profile/${id}`, profileData, token);
      return response.car;
    } catch (error) {
      console.error('Error updating vehicle profile:', error);
      throw new Error('Failed to update vehicle profile');
    }
  }

  async getVehicleProfile(id: string, token?: string): Promise<Vehicle> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/profile/${id}`, token);
      return response.car;
    } catch (error) {
      console.error('Error getting vehicle profile:', error);
      throw new Error('Failed to get vehicle profile');
    }
  }

  // Usage tracking methods
  async addUsageData(carId: string, usageData: Partial<VehicleUsage>, token?: string): Promise<VehicleUsage> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/${carId}/usage`, usageData, token);
      return response.usage;
    } catch (error) {
      console.error('Error adding usage data:', error);
      throw new Error('Failed to add usage data');
    }
  }

  async getUsageData(carId: string, limit: number = 50, skip: number = 0, token?: string): Promise<{ usageData: VehicleUsage[]; total: number }> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/${carId}/usage?limit=${limit}&skip=${skip}`, token);
      return response;
    } catch (error) {
      console.error('Error getting usage data:', error);
      throw new Error('Failed to get usage data');
    }
  }

  // Maintenance history methods
  async addMaintenanceRecord(carId: string, maintenanceData: Partial<MaintenanceRecord>, token?: string): Promise<MaintenanceRecord> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/${carId}/maintenance`, maintenanceData, token);
      return response.maintenance;
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      throw new Error('Failed to add maintenance record');
    }
  }

  async getMaintenanceHistory(carId: string, limit: number = 20, skip: number = 0, token?: string): Promise<{ maintenanceHistory: MaintenanceRecord[]; total: number }> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/${carId}/maintenance?limit=${limit}&skip=${skip}`, token);
      return response;
    } catch (error) {
      console.error('Error getting maintenance history:', error);
      throw new Error('Failed to get maintenance history');
    }
  }

  // User symptom reporting methods
  async addSymptomReport(carId: string, symptomData: Partial<UserSymptomReport>, token?: string): Promise<UserSymptomReport> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/${carId}/symptoms`, symptomData, token);
      return response.symptomReport;
    } catch (error) {
      console.error('Error adding symptom report:', error);
      throw new Error('Failed to add symptom report');
    }
  }

  async getSymptomReports(carId: string, status?: string, limit: number = 20, skip: number = 0, token?: string): Promise<{ symptomReports: UserSymptomReport[]; total: number }> {
    try {
      const queryParams = new URLSearchParams({ limit: limit.toString(), skip: skip.toString() });
      if (status) queryParams.append('status', status);
      
      const response = await ApiService.get(`${this.baseEndpoint}/${carId}/symptoms?${queryParams.toString()}`, token);
      return response;
    } catch (error) {
      console.error('Error getting symptom reports:', error);
      throw new Error('Failed to get symptom reports');
    }
  }

  // Utility methods
  formatVehicleDisplayName(vehicle: Vehicle): string {
    return `${vehicle.marque} ${vehicle.modele} (${new Date(vehicle.datePremiereMiseEnCirculation).getFullYear()})`;
  }

  getVehicleImagePlaceholder(marque: string): string {
    // Return a placeholder image URL based on the brand
    return `https://via.placeholder.com/300x200/007bff/ffffff?text=${encodeURIComponent(marque)}`;
  }

  validateVin(vin: string): boolean {
    // Basic VIN validation (17 characters, alphanumeric, excluding I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin);
  }

  validateImmatriculation(numero: string, type: 'TUN' | 'RS'): boolean {
    if (type === 'TUN') {
      return /^[0-9]{1,3} TUN [0-9]{1,7}$/.test(numero);
    } else if (type === 'RS') {
      return /^[0-9]{1,6}$/.test(numero);
    }
    return false;
  }
}

export default new VehicleService();
