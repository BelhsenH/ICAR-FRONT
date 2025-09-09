import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import { useAuth } from '../../../contexts/AuthContext';
import ConversationService, { Conversation, Message } from '../../../services/conversationService';
import RealtimeService from '../../../services/realtimeService';

const ConversationDetail: React.FC = () => {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  const loadConversation = useCallback(async () => {
    if (!conversationId || !token) return;

    try {
      const conv = await ConversationService.getConversation(conversationId);
      setConversation(conv);
      setMessages(conv.messages || []);
      
      // Mark as read
      await ConversationService.markAsRead(conversationId);
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Real-time messaging setup
  useEffect(() => {
    if (!conversationId) return;

    const setupRealtime = async () => {
      try {
        await RealtimeService.connect();
        RealtimeService.joinConversation(conversationId);
      } catch (error) {
        console.error('Failed to connect to realtime service:', error);
      }
    };

    setupRealtime();

    // Listen for new messages
    const unsubscribeNewMessage = RealtimeService.onNewMessage((message) => {
      if (message.senderId !== user?._id) {
        setMessages(prev => [...prev, message]);
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // Listen for typing indicators
    const unsubscribeTyping = RealtimeService.onUserTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    });

    // Listen for read receipts
    const unsubscribeRead = RealtimeService.onMessageRead((data) => {
      if (data.conversationId === conversationId) {
        // Handle read receipt (e.g., show read indicators)
        console.log('Message read by:', data.userId);
      }
    });

    return () => {
      RealtimeService.leaveConversation(conversationId);
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeRead();
    };
  }, [conversationId, user?._id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;
    
    if (isTyping && conversationId) {
      RealtimeService.sendTyping(conversationId, true);
      
      typingTimeout = setTimeout(() => {
        RealtimeService.sendTyping(conversationId, false);
        setIsTyping(false);
      }, 3000);
    }
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [isTyping, conversationId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversation();
    setRefreshing(false);
  }, [loadConversation]);

  const pickImages = async () => {
    if (selectedImages.length >= 2) {
      Alert.alert('Limite atteinte', 'Vous pouvez télécharger au maximum 2 images par message.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Permission d\'accès à la galerie nécessaire.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: Math.min(2 - selectedImages.length, 2),
    });

    if (!result.canceled) {
      const newImages = result.assets.filter((asset, index) => selectedImages.length + index < 2);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const updated = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updated);
  };

  const sendMessage = async () => {
    if (!conversationId || !token || (!messageText.trim() && selectedImages.length === 0)) {
      return;
    }

    setSending(true);
    try {
      let imageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        setUploading(true);
        imageUrls = await ConversationService.uploadImages(selectedImages);
        setUploading(false);
      }

      const newMessage = await ConversationService.sendMessage(
        conversationId,
        messageText.trim() || '📷 Image(s)',
        imageUrls
      );

      setMessages([...messages, newMessage]);
      setMessageText('');
      setSelectedImages([]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Alert.alert(
      'Passer un appel',
      `Voulez-vous appeler ce numéro ?\n${phoneNumber}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() =>
              Alert.alert('Erreur', 'Impossible de passer l\'appel')
            );
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return messageDate.toLocaleDateString('fr-FR');
  };

  const renderMessage = (message: Message, index: number) => {
    // Check if this message is from the current user
    const isOwnMessage = message.senderId === user?._id || message.sender?._id === user?._id;
    const showAvatar = !isOwnMessage && (index === messages.length - 1 || 
      messages[index + 1]?.sender?._id !== message.sender?._id || 
      messages[index + 1]?.senderId !== message.senderId);

    // Show part request context at the beginning of conversation
    const showPartContext = index === 0 && conversation?.partsRequest;

    console.log('Message render debug:', {
      messageId: message._id,
      messageSenderId: message.senderId,
      messageSenderObjectId: message.sender?._id,
      currentUserId: user?._id,
      isOwnMessage,
      senderName: message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'No sender'
    });

    return (
      <View key={message._id}>
        {/* Part Request Context Card */}
        {showPartContext && (
          <View style={tw`mb-4 mx-2 bg-blue-50 border border-blue-200 rounded-xl p-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <Ionicons name="car-outline" size={20} color="#1E3A8A" />
              <Text style={tw`text-blue-800 font-semibold ml-2`}>Demande de pièce</Text>
            </View>
            <Text style={tw`text-blue-700 text-sm mb-1`}>Pièce: {conversation?.partsRequest || 'N/A'}</Text>
            <Text style={tw`text-blue-600 text-xs`}>Conversation créée pour cette demande</Text>
          </View>
        )}
        
        <View style={tw`mb-4`}>
        <View style={[
          tw`flex-row`,
          isOwnMessage ? tw`justify-end` : tw`justify-start`
        ]}>
          {!isOwnMessage && (
            <View style={tw`w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2 mt-1`}>
              {showAvatar ? (
                <Ionicons name="person" size={16} color="#059669" />
              ) : (
                <View style={tw`w-8 h-8`} />
              )}
            </View>
          )}
          
          <View style={[
            tw`max-w-3/4 rounded-2xl p-3`,
            isOwnMessage 
              ? tw`bg-blue-600 rounded-tr-none` 
              : tw`bg-white border border-gray-200 rounded-tl-none`
          ]}>
            {!isOwnMessage && showAvatar && message.sender && (
              <Text style={tw`text-green-600 text-xs font-semibold mb-1`}>
                {message.sender.firstName} {message.sender.lastName}
                {message.sender.userType && (
                  <Text style={tw`text-green-400`}> • {message.sender.userType}</Text>
                )}
              </Text>
            )}
            
            {message.content && (
              <Text style={[
                tw`text-base`,
                isOwnMessage ? tw`text-white` : tw`text-gray-800`
              ]}>
                {message.content}
              </Text>
            )}
            
            {message.images && message.images.length > 0 && (
              <View style={tw`${message.content ? 'mt-2' : ''}`}>
                {message.images.map((imageUrl, imgIndex) => (
                  <TouchableOpacity key={imgIndex} style={tw`mb-1`}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={tw`w-48 h-48 rounded-lg`}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {message.voiceMessage && (
              <TouchableOpacity
                style={[
                  tw`flex-row items-center p-2 rounded-lg ${message.content || message.images ? 'mt-2' : ''}`,
                  isOwnMessage ? tw`bg-blue-700` : tw`bg-gray-100`
                ]}
              >
                <Ionicons 
                  name="play" 
                  size={20} 
                  color={isOwnMessage ? 'white' : '#3B82F6'} 
                />
                <Text style={[
                  tw`ml-2 text-sm`,
                  isOwnMessage ? tw`text-white` : tw`text-blue-600`
                ]}>
                  {Math.floor(message.voiceMessage.duration / 60)}:{String(message.voiceMessage.duration % 60).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
            
            <Text style={[
              tw`text-xs mt-1`,
              isOwnMessage ? tw`text-blue-100` : tw`text-gray-500`
            ]}>
              {formatDate(message.timestamp || message.createdAt || new Date())}
            </Text>
          </View>
        </View>
        </View>
      </View>
    );
  };

  const otherParticipant = conversation?.participants?.find(p => 
    p.user && p.user._id !== user?._id
  )?.user;

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={tw`text-gray-600 mt-4`}>Chargement de la conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-gradient-to-r from-blue-900 to-blue-800 p-4 flex-row items-center shadow-lg`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-3`}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={tw`w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3 shadow-md`}>
          <Ionicons name="storefront" size={22} color="#059669" />
        </View>
        
        <View style={tw`flex-1`}>
          <Text style={tw`text-white text-lg font-bold`}>
            {otherParticipant?.firstName} {otherParticipant?.lastName}
          </Text>
          <View style={tw`flex-row items-center mt-1`}>
            <View style={tw`w-2 h-2 bg-green-400 rounded-full mr-2`} />
            <Text style={tw`text-blue-200 text-sm`}>
              Fournisseur {otherParticipant?.userType || 'ipiece'}
            </Text>
          </View>
        </View>
        
        <View style={tw`flex-row gap-2`}>
          {otherParticipant && (
            <TouchableOpacity
              style={tw`bg-green-600 rounded-full p-3 shadow-md`}
              onPress={() => handleCall('0123456789')} // Use actual phone number
            >
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={tw`bg-blue-700 rounded-full p-3 shadow-md`}
            onPress={() => {}}
          >
            <Ionicons name="information-circle-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={tw`flex-1 px-4`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={tw`py-4`}>
          {messages.length === 0 ? (
            <View style={tw`items-center justify-center py-20`}>
              <View style={tw`w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4`}>
                <Ionicons name="chatbubbles-outline" size={40} color="#3B82F6" />
              </View>
              <Text style={tw`text-gray-600 text-lg font-semibold mt-2`}>Démarrez la conversation</Text>
              <Text style={tw`text-gray-500 text-center mt-2 mx-8`}>
                Commencez à discuter avec votre fournisseur pour finaliser votre demande de pièce
              </Text>
            </View>
          ) : (
            <>
              {messages.map((message, index) => renderMessage(message, index))}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <View style={tw`flex-row justify-start mb-4`}>
                  <View style={tw`w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2 mt-1`}>
                    <Ionicons name="storefront" size={16} color="#059669" />
                  </View>
                  <View style={tw`bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 shadow-sm`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`flex-row gap-1 mr-3`}>
                        <View style={tw`w-2 h-2 bg-blue-400 rounded-full animate-pulse`} />
                        <View style={tw`w-2 h-2 bg-blue-400 rounded-full animate-pulse`} />
                        <View style={tw`w-2 h-2 bg-blue-400 rounded-full animate-pulse`} />
                      </View>
                      <Text style={tw`text-gray-600 text-sm font-medium`}>Écrit un message...</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Image Preview */}
      {selectedImages.length > 0 && (
        <View style={tw`bg-white border-t border-gray-200 p-3`}>
          <Text style={tw`text-gray-700 font-semibold mb-2`}>
            Images sélectionnées ({selectedImages.length}/2)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={tw`flex-row gap-2`}>
              {selectedImages.map((image, index) => (
                <View key={index} style={tw`relative`}>
                  <Image
                    source={{ uri: image.uri }}
                    style={tw`w-16 h-16 rounded-lg`}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 items-center justify-center`}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Message Input */}
      <View style={tw`bg-white border-t border-gray-200 p-4 shadow-lg`}>
        <View style={tw`flex-row items-end`}>
          
          <View style={tw`flex-1 bg-gray-50 rounded-2xl px-4 py-3 mr-3 max-h-32 border border-gray-200`}>
            <TextInput
              style={tw`text-base text-gray-800 min-h-6`}
              placeholder="Tapez votre message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={(text) => {
                setMessageText(text);
                if (text.trim() && !isTyping) {
                  setIsTyping(true);
                }
              }}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity
            style={[
              tw`rounded-full p-3 shadow-md`,
              (sending || uploading || (!messageText.trim() && selectedImages.length === 0))
                ? tw`bg-gray-300`
                : tw`bg-blue-600`
            ]}
            onPress={sendMessage}
            disabled={sending || uploading || (!messageText.trim() && selectedImages.length === 0)}
          >
            {(sending || uploading) ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {uploading && (
          <View style={tw`mt-3 p-3 bg-blue-50 rounded-lg flex-row items-center justify-center`}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={tw`text-blue-600 ml-2 text-sm font-medium`}>
              {uploading ? 'Téléchargement des images...' : 'Enregistrement en cours...'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ConversationDetail;
