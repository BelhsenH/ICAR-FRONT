import ApiService from './api';
import config from '../config';

export interface Part {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subCategory: string;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  description?: string;
  stock: number;
  partNumber: string;
  compatibleVehicles: {
    brand: string;
    model: string;
    year: number;
  }[];
  ipiece: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  imagePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  category: string | Category;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  _id: string;
  name: string;
  imagePath?: string;
  subCategory: string | SubCategory;
  createdAt: string;
  updatedAt: string;
}

export interface PartCategory {
  _id: string;
  subCategories: {
    name: string;
    parts: Part[];
    count: number;
  }[];
}

export interface PartsRequest {
  _id?: string;
  partId?: string | Part; // Reference to existing part
  partName?: string; // For custom parts or existing part names
  item?: string | Item; // For new item-based requests
  subCategory?: string | SubCategory;
  category?: string | Category;
  requesterId: string;
  requesterModel?: 'User';
  requesterType: 'icar' | 'irepair';
  providerId?: string | {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  vehicleInfo?: {
    vin?: string;
    brand?: string;
    model?: string;
    year?: number;
    licensePlate?: string;
  };
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  urgencyLevel: 'low' | 'medium' | 'high';
  notes?: string;
  images?: string[]; // User uploaded images
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  lastContactedAt?: string;
  conversationId?: string;
  // Engagement tracking
  viewCount?: number;
  uniqueViewers?: string[];
  engagementMetrics?: {
    totalViews: number;
    uniqueViewers: number;
    interestedUsers: number; // Users who clicked for more details
    contactAttempts: number; // Users who tried to contact
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  participants: {
    userId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      userType: string;
    };
    userType: string;
    joinedAt: string;
  }[];
  partsRequestId: {
    _id: string;
    status: string;
    totalPrice: number;
    partId: {
      name: string;
      price: number;
      image: string;
    };
  };
  messages: ConversationMessage[];
  status: 'active' | 'closed';
  lastMessage: {
    content: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: Map<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    userType: string;
  };
  senderType: string;
  content: string;
  messageType: 'text' | 'image';
  images: string[];
  readBy: {
    userId: string;
    readAt: string;
  }[];
  isSystemMessage: boolean;
  createdAt: string;
}

class PartsService {
  private readonly baseEndpoint = '/api';

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    try {
      const response = await ApiService.get(`/api/parts/cats`);
      return response.categories || response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  async getSubCategories(categoryId: string): Promise<SubCategory[]> {
    try {
      const response = await ApiService.get(`/api/parts/cats/${categoryId}/subcategories`);
      return response.subCategories || response;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw new Error('Failed to fetch subcategories');
    }
  }

  async getItems(subCategoryId: string): Promise<Item[]> {
    try {
      const response = await ApiService.get(`/api/parts/cats/subcategories/${subCategoryId}/items`);
      return response.items || response;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw new Error('Failed to fetch items');
    }
  }

  // Parts endpoints
  async getAllParts(params?: {
    category?: string;
    subCategory?: string;
    availability?: string;
    search?: string;
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    parts: Part[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const url = `${this.baseEndpoint}/parts/all-parts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await ApiService.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching parts:', error);
      throw new Error('Failed to fetch parts');
    }
  }

  async getPartsByCategory(): Promise<PartCategory[]> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/categories`);
      return response;
    } catch (error) {
      console.error('Error fetching parts by category:', error);
      throw new Error('Failed to fetch parts by category');
    }
  }

  async getPartById(id: string): Promise<Part> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/part/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching part:', error);
      throw new Error('Failed to fetch part');
    }
  }

  // Parts request endpoints
  async createItemRequest(requestData: {
    itemId: string;
    vehicleInfo?: {
      vin?: string;
      brand?: string;
      model?: string;
      year?: number;
      licensePlate?: string;
    };
    quantity?: number;
    notes?: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
    image?: string; // Base64 image or file path
  }): Promise<PartsRequest> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/parts/item-requests`, requestData);
      return response;
    } catch (error) {
      console.error('Error creating item request:', error);
      throw new Error('Failed to create item request');
    }
  }
  async createPartsRequest(requestData: {
    partId: string;
    vehicleInfo?: {
      vin?: string;
      brand?: string;
      model?: string;
      year?: number;
      licensePlate?: string;
    };
    quantity?: number;
    notes?: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
    images?: string[];
  }): Promise<PartsRequest> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/parts/requests`, requestData);
      return response;
    } catch (error) {
      console.error('Error creating parts request:', error);
      throw new Error('Failed to create parts request');
    }
  }

  async getUserPartsRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    requests: PartsRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const url = `${this.baseEndpoint}/parts/requests/my${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await ApiService.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching user parts requests:', error);
      throw new Error('Failed to fetch user parts requests');
    }
  }

  // Conversation endpoints
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/conversations`);
      return response;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/conversations/${conversationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw new Error('Failed to fetch conversation');
    }
  }

  async sendMessage(conversationId: string, messageData: {
    content: string;
    messageType?: 'text' | 'image';
    images?: string[];
  }): Promise<ConversationMessage> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/parts/conversations/${conversationId}/messages`, messageData);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async makeCall(conversationId: string, recipientId: string): Promise<{
    message: string;
    callId: string;
    recipientId: string;
  }> {
    try {
      const response = await ApiService.post(`${this.baseEndpoint}/parts/conversations/${conversationId}/call`, { recipientId });
      return response;
    } catch (error) {
      console.error('Error making call:', error);
      throw new Error('Failed to make call');
    }
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/conversations/unread/count`);
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw new Error('Failed to fetch unread count');
    }
  }

  // Image upload
  async uploadImage(imageUri: string): Promise<{ imageUrl: string }> {
    try {
      console.log('PartsService.uploadImage called with URI:', imageUri);
      
      if (!imageUri) {
        throw new Error('No image URI provided');
      }

      // Create FormData for the upload
      const formData = new FormData();
      
      // For React Native, we need to specify the file differently
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: `image_${Date.now()}.${fileExtension}`,
      } as any);

      console.log('Making request to:', `${config.apiUrl}/api/parts/upload-single`);
      
      const response = await fetch(`${config.apiUrl}/api/parts/upload-single`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Don't set Content-Type header for FormData, let the browser/RN set it
        },
        // Add timeout to prevent hanging requests
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload success result:', result);
      
      if (!result || !result.imageUrl) {
        throw new Error('Invalid response: missing imageUrl');
      }
      
      return result;
    } catch (error) {
      console.error('PartsService.uploadImage error:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to upload image');
      }
    }
  }
  async uploadImages(images: string[]): Promise<{ imageUrls: string[] }> {
    try {
      const formData = new FormData();
      
      images.forEach((imageUri, index) => {
        formData.append('images', {
          uri: imageUri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        } as any);
      });

      const response = await fetch(`${config.apiUrl}/api/parts/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it automatically with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  }

  // Request status management
  async acceptPartsRequest(requestId: string): Promise<PartsRequest> {
    try {
      const response = await ApiService.put(`${this.baseEndpoint}/parts/requests/${requestId}/accept`, {});
      return response;
    } catch (error) {
      console.error('Error accepting parts request:', error);
      throw new Error('Failed to accept parts request');
    }
  }

  async rejectPartsRequest(requestId: string, reason?: string): Promise<PartsRequest> {
    try {
      const response = await ApiService.put(`${this.baseEndpoint}/parts/requests/${requestId}/reject`, { reason });
      return response;
    } catch (error) {
      console.error('Error rejecting parts request:', error);
      throw new Error('Failed to reject parts request');
    }
  }

  async updateRequestStatus(requestId: string, status: string, notes?: string): Promise<PartsRequest> {
    try {
      const response = await ApiService.put(`${this.baseEndpoint}/parts/requests/${requestId}/status`, { 
        status, 
        notes 
      });
      return response;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw new Error('Failed to update request status');
    }
  }

  // Notifications
  async getNotifications(): Promise<{
    notifications: Array<{
      _id: string;
      type: string;
      title: string;
      message: string;
      data?: any;
      read: boolean;
      createdAt: string;
    }>;
    unreadCount: number;
  }> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/notifications`);
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await ApiService.put(`${this.baseEndpoint}/parts/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await ApiService.put(`${this.baseEndpoint}/parts/notifications/mark-all-read`, {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Engagement tracking
  async trackEngagement(requestId: string, eventType: 'view' | 'interest' | 'contact_attempt' | 'call_attempt', metadata?: any): Promise<void> {
    try {
      await ApiService.post(`${this.baseEndpoint}/parts/requests/${requestId}/engagement`, { eventType, metadata });
    } catch (error) {
      // Don't throw error for tracking - it's not critical
      console.warn('Error tracking engagement:', error);
    }
  }

  async getRequestEngagement(requestId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    interestedUsers: number;
    contactAttempts: number;
  }> {
    try {
      const response = await ApiService.get(`${this.baseEndpoint}/parts/requests/${requestId}/engagement`);
      return response;
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      throw new Error('Failed to fetch engagement data');
    }
  }
}

export default new PartsService();
