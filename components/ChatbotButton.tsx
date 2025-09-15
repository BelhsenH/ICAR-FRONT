import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/Theme';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotButtonProps {
  style?: object;
}

const CHATBOT_API_URL = 'http://192.168.100.14:8000'; // Backend URL - adjust as needed

export const ChatbotButton: React.FC<ChatbotButtonProps> = ({ style }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  const { language, translations } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(300)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the floating button
  useEffect(() => {
    const pulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    pulse();
  }, []);

  // Check backend connection
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      console.log('ChatBot: Checking connection to:', `${CHATBOT_API_URL}/health`);
      const response = await fetch(`${CHATBOT_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('ChatBot: Health check response:', { status: response.status, ok: response.ok });
      setIsConnected(response.ok);
    } catch (error) {
      console.warn('ChatBot: Backend connection failed:', error);
      setIsConnected(false);
    }
  };

  const openModal = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
    
    setIsModalVisible(true);
    
    // Slide up and fade in animation for modal content
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Add welcome message if it's the first time opening
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: getWelcomeMessage(),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const closeModal = () => {
    // Slide down and fade out animation
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeInAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsModalVisible(false);
    });
  };

  const getWelcomeMessage = () => {
    const welcomeMessages = {
      en: "Hello! I'm iCarChat, your automotive assistant. I can help you with car diagnostics, maintenance, spare parts, and find nearby mechanics. How can I assist you today?",
      fr: "Bonjour ! Je suis iCarChat, votre assistant automobile. Je peux vous aider avec le diagnostic auto, la maintenance, les pièces de rechange et trouver des mécaniciens à proximité. Comment puis-je vous aider aujourd'hui ?",
      ar: "مرحباً! أنا iCarChat، مساعدك في مجال السيارات. يمكنني مساعدتك في تشخيص السيارات والصيانة وقطع الغيار والعثور على الميكانيكيين القريبين. كيف يمكنني مساعدتك اليوم؟"
    };
    return welcomeMessages[language] || welcomeMessages.en;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageCount(prev => prev + 1);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    // Detect language from input text
    let detectedLanguage = language; // Use current language as default
    if (detectArabicText(userMessage.text)) {
      detectedLanguage = 'ar';
    }

    // Start typing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      console.log('ChatBot: Starting message send...', { isConnected, userMessage: userMessage.text, language: detectedLanguage });
      
      if (!isConnected) {
        console.log('ChatBot: Backend not connected');
        throw new Error('Backend not available');
      }

      console.log('ChatBot: Sending request to:', `${CHATBOT_API_URL}/chat`);
      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          language: detectedLanguage,
        }),
      });

      console.log('ChatBot: Response received:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('ChatBot: Response error:', errorText);
        throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('ChatBot: Response data:', data);
      
      // Handle error responses from backend
      let responseText = data.response || 'I apologize, but I encountered an error processing your request.';
      
      // If the response is just an error message without details, provide more context
      if (responseText.includes('حدث خطأ: ') || responseText.includes('Error occurred:')) {
        const errorContextMessages = {
          en: "I'm having trouble connecting to the AI service. Please make sure the backend server and Ollama are running properly.",
          fr: "J'ai des difficultés à me connecter au service IA. Veuillez vous assurer que le serveur backend et Ollama fonctionnent correctement.",
          ar: "أواجه مشكلة في الاتصال بخدمة الذكاء الاصطناعي. يرجى التأكد من تشغيل الخادم الخلفي و Ollama بشكل صحيح."
        };
        responseText = errorContextMessages[detectedLanguage] || errorContextMessages.en;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      console.log('ChatBot: Bot message added successfully');

    } catch (error) {
      console.error('ChatBot: Error sending message:', error);
      console.error('ChatBot: Error details:', { message: error.message, stack: error.stack });
      
      // Shake animation for error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
      
      const fallbackText = getFallbackMessage();
      console.log('ChatBot: Using fallback message:', fallbackText);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      typingAnim.stopAnimation();
      typingAnim.setValue(0);
    }

    // Final scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Detect Arabic text in input
  const detectArabicText = (text: string): boolean => {
    // Arabic Unicode range: \u0600-\u06FF (Arabic block)
    // Arabic Supplement: \u0750-\u077F
    // Arabic Extended-A: \u08A0-\u08FF
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
  };

  const getFallbackMessage = () => {
    const fallbackMessages = {
      en: "I'm sorry, but I'm currently unable to connect to the chat service. Please make sure the backend server is running and try again later.",
      fr: "Je suis désolé, mais je ne peux pas me connecter au service de chat pour le moment. Veuillez vous assurer que le serveur backend fonctionne et réessayez plus tard.",
      ar: "أعتذر، لكنني لا أستطيع الاتصال بخدمة الدردشة حالياً. يرجى التأكد من تشغيل الخادم الخلفي والمحاولة مرة أخرى لاحقاً."
    };
    return fallbackMessages[language] || fallbackMessages.en;
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.isUser ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userMessageBubble : styles.botMessageBubble
      ]}>
        {!message.isUser && (
          <View style={styles.botIcon}>
            <Text style={styles.botIconText}>🤖</Text>
          </View>
        )}
        <View style={styles.messageTextContainer}>
          <Text style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.botMessageText
          ]}>
            {message.text}
          </Text>
          <Text style={[
            styles.messageTime,
            message.isUser ? styles.userMessageTime : styles.botMessageTime
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {message.isUser && (
          <View style={styles.userIcon}>
            <Text style={styles.userIconText}>👤</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      {/* Enhanced Floating Chatbot Button */}
      <Animated.View style={[
        styles.floatingButton, 
        style, 
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity 
          onPress={openModal} 
          activeOpacity={0.8}
          style={styles.floatingButtonTouchable}
        >
          <LinearGradient
            colors={isConnected 
              ? [Colors.primary, Colors.primary + 'DD', Colors.primary + 'AA'] 
              : ['#666', '#555', '#444']
            }
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Main chat icon */}
            <Text style={styles.buttonText}>💬</Text>
            
            {/* Connection status indicators */}
            {isConnected ? (
              <View style={styles.onlineIndicator} />
            ) : (
              <View style={styles.offlineIndicator} />
            )}
            
            {/* Message count badge */}
            {messageCount > 0 && (
              <View style={styles.floatingBadge}>
                <Text style={styles.floatingBadgeText}>
                  {messageCount > 99 ? '99+' : messageCount}
                </Text>
              </View>
            )}
            
            {/* Shimmer effect */}
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 255, 255, 0.3)',
                'transparent'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonShimmer}
            />
          </LinearGradient>
          
          {/* Enhanced pulse animation ring */}
          <Animated.View 
            style={[
              styles.pulseRing,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.2],
                  })
                }]
              }
            ]}
          />
          
          {/* Secondary pulse ring */}
          <Animated.View 
            style={[
              styles.secondaryPulseRing,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.4, 0],
                }),
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.6],
                  })
                }]
              }
            ]}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          {/* Header */}
          <View style={styles.modalHeader}>
            <LinearGradient
              colors={[Colors.primary, Colors.primary + 'E0']}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.chatbotAvatar}>
                    <Text style={styles.chatbotAvatarText}>🤖</Text>
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>iCarChat</Text>
                    <Text style={styles.headerSubtitle}>
                      {isConnected ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Messages */}
          <Animated.View style={[
            styles.messagesWrapper,
            {
              transform: [{ translateY: slideUpAnim }],
              opacity: fadeInAnim,
            }
          ]}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => renderMessage(message, index))}
            
            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingBubble}>
                  <Text style={styles.loadingText}>...</Text>
                </View>
              </View>
            )}
            </ScrollView>
            
            {/* Message counter badge */}
            {messageCount > 0 && (
              <View style={styles.messageCountBadge}>
                <Text style={styles.messageCountText}>{messageCount}</Text>
              </View>
            )}
          </Animated.View>

          {/* Enhanced Input Area */}
          <Animated.View style={[
            styles.inputContainer,
            {
              transform: [{ translateX: shakeAnim }],
              opacity: fadeInAnim,
            }
          ]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={language === 'ar' ? 'اكتب رسالتك...' : language === 'fr' ? 'Tapez votre message...' : 'Type your message...'}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={(!inputText.trim() || isLoading) 
                    ? ['#ccc', '#aaa'] 
                    : [Colors.primary, Colors.primary + 'DD']
                  }
                  style={styles.sendButtonGradient}
                >
                  <Text style={styles.sendButtonText}>
                    {isLoading ? '⏳' : '➤'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Spacing.xl + 20,
    right: Spacing.lg,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    ...Shadows.lg,
    zIndex: 100,
    elevation: 15,
  },
  floatingButtonTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
  },
  buttonGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonText: {
    fontSize: 26,
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  floatingBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    bottom: 0,
    opacity: 0.3,
    borderRadius: 32.5,
  },
  pulseRing: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: Colors.primary,
    top: 0,
    left: 0,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  secondaryPulseRing: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: Colors.primary + '30',
    top: 0,
    left: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    height: height * 0.8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  messagesWrapper: {
    flex: 1,
    position: 'relative',
  },
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatbotAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  chatbotAvatarText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    flexGrow: 1,
    padding: Spacing.md,
  },
  messageContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: width * 0.85,
  },
  userMessageBubble: {
    flexDirection: 'row-reverse',
  },
  messageContentBubble: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  userMessageContentBubble: {
    borderBottomRightRadius: 6,
  },
  botMessageContentBubble: {
    borderBottomLeftRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.textLight,
  },
  messageGradient: {
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  botMessageContent: {
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  botMessageBubble: {
    flexDirection: 'row',
  },
  messageTextContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
    padding: Spacing.md,
  },
  botMessageBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.textLight,
  },
  messageText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
    fontWeight: '400',
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botMessageTime: {
    color: Colors.textSecondary,
  },
  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: 'flex-end',
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  botIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  botIconText: {
    fontSize: 16,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: 'flex-end',
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  userIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  userIconText: {
    fontSize: 14,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  typingBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: 6,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.textLight,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    ...Shadows.sm,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  messageCountBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    ...Shadows.sm,
  },
  messageCountText: {
    color: 'white',
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.textLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.textLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
    minHeight: 52,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});