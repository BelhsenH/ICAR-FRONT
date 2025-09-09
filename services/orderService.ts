import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

export interface OrderItem {
  _id: string;
  partId: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    category: string;
    subCategory?: string;
  };
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'shipped' | 'delivered';
  providerId?: string;
  provider?: {
    _id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    phoneNumber: string;
  };
  communicationMethod?: 'message' | 'call';
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  shippingAddress?: string;
  notes?: string;
}

class OrderService {
  private async getAuthHeaders() {
    try {
      // Small delay to ensure AsyncStorage is ready
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('OrderService: Error getting auth headers:', error);
      throw error;
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      console.warn('OrderService: 401 Unauthorized - token may be invalid for this service');
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Request failed');
    }
    
    return response.json();
  }

  async getMyOrders(): Promise<OrderItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/my`, {
        method: 'GET',
        headers,
      });

      const data = await this.handleResponse(response);
      return data;
    } catch (error: any) {
      console.error('Error fetching orders:', error.message || error);
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<OrderItem> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/${orderId}`, {
        method: 'GET',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

  async trackOrder(orderId: string): Promise<OrderItem> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/${orderId}/track`, {
        method: 'GET',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error tracking order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/${orderId}/cancel`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason }),
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async contactProvider(orderId: string, method: 'message' | 'call'): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/requests/${orderId}/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ communicationMethod: method }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error contacting provider:', error);
      throw error;
    }
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': '#F59E0B', // amber-500
      'accepted': '#3B82F6', // blue-500
      'processing': '#8B5CF6', // violet-500
      'shipped': '#10B981', // emerald-500
      'delivered': '#059669', // emerald-600
      'completed': '#059669', // emerald-600
      'rejected': '#EF4444', // red-500
      'cancelled': '#6B7280', // gray-500
    };
    return statusColors[status] || '#6B7280';
  }

  getStatusText(status: string): string {
    const statusText: { [key: string]: string } = {
      'pending': 'En attente',
      'accepted': 'Acceptée',
      'processing': 'En traitement',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'completed': 'Terminée',
      'rejected': 'Refusée',
      'cancelled': 'Annulée',
    };
    return statusText[status] || status;
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'time-outline',
      'accepted': 'checkmark-circle-outline',
      'processing': 'construct-outline',
      'shipped': 'airplane-outline',
      'delivered': 'checkmark-done-circle-outline',
      'completed': 'trophy-outline',
      'rejected': 'close-circle-outline',
      'cancelled': 'ban-outline',
    };
    return statusIcons[status] || 'help-circle-outline';
  }
}

export default new OrderService();
