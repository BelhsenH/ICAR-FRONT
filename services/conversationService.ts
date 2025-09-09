import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

export interface Message {
  _id: string;
  senderId: string;
  senderType?: 'icar' | 'ipiece' | 'irepair';
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    userType: 'icar' | 'ipiece' | 'irepair';
  };
  content: string;
  images?: string[];
  timestamp?: Date;
  createdAt?: Date;
}

export interface Conversation {
  _id: string;
  partsRequest: string;
  participants: {
    userId: string;
    userType: 'icar' | 'ipiece' | 'irepair';
    user?: {
      _id: string;
      firstName: string;
      lastName: string;
      userType: 'icar' | 'ipiece' | 'irepair';
    };
    unreadCount?: number;
  }[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

class ConversationService {
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
      console.error('ConversationService: Error getting auth headers:', error);
      throw error;
    }
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expired or invalid, but don't clear storage immediately
      // Let the auth context handle token management
      console.warn('ConversationService: 401 Unauthorized - token may be invalid for this service');
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Request failed');
    }
    
    return response.json();
  }

  getApiUrl() {
    return config.apiUrl;
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${config.apiUrl}/api/parts/conversations`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await this.handleResponse(response);
      
      return data;
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message || error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    images?: string[]
  ): Promise<Message> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content, 
          images
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async createConversation(partsRequestId: string, initialMessage?: string): Promise<Conversation> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          partsRequestId,
          initialMessage 
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async initiateConversationWithRequester(
    partsRequestId: string, 
    initialMessage?: string, 
    offerDetails?: {
      price?: number;
      currency?: string;
      availability?: string;
      deliveryTime?: string;
      condition?: string;
      warranty?: string;
    }
  ): Promise<{
    conversation: Conversation;
    isExisting: boolean;
    message: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/initiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          partsRequestId,
          initialMessage,
          offerDetails
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error initiating conversation with requester:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers,
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  async uploadImages(images: any[]): Promise<string[]> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `image_${index}.jpg`,
        } as any);
      });

      const response = await fetch(`${config.apiUrl}/api/parts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await this.handleResponse(response);
      return data.imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  // Debug methods for testing
  async createTestConversation(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/test/create`, {
        method: 'POST',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating test conversation:', error);
      throw error;
    }
  }

  async debugConversations(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${config.apiUrl}/api/parts/conversations/debug/list`, {
        method: 'GET',
        headers,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error debugging conversations:', error);
      throw error;
    }
  }
}

export default new ConversationService();
