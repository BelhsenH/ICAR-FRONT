import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import PartsService, { Conversation } from '../../services/partsService';

const ConversationsScreen = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const { language, translations } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!token) return;

    try {
      const data = await PartsService.getConversations(token);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Unable to load conversations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to conversation detail - will be implemented
    console.log('Opening conversation:', conversation._id);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.userId._id !== user?.id)?.userId;
  };

  const getUnreadCount = () => {
    // Mock implementation - should be implemented properly
    return Math.floor(Math.random() * 5);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherParticipant(item);
    const unreadCount = getUnreadCount();
    
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(otherUser.userType) }]}>
            <Text style={styles.avatarText}>
              {otherUser.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(otherUser.userType) }]}>
            <Text style={styles.userTypeText}>{otherUser.userType}</Text>
          </View>
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>
              {otherUser.name}
            </Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.lastMessage.sentAt)}
              </Text>
            )}
          </View>
          
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.lastMessage.content || 'Image sent'}
            </Text>
          )}
          
          {!item.lastMessage && (
            <Text style={[styles.lastMessage, styles.noMessages]}>
              {translations[language].conversationStarted || 'Conversation started'}
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getAvatarColor = (userType: string) => {
    switch (userType) {
      case 'ipiece': return '#4CAF50';
      case 'irepair': return '#FF9800';
      default: return Colors.primary;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'ipiece': return '#4CAF50';
      case 'irepair': return '#FF9800';
      default: return Colors.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {translations[language].messages || 'Messages'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {translations[language].loadingConversations || 'Loading conversations...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {translations[language].messages || 'Messages'}
        </Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.conversationsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {translations[language].noConversations || 'No Conversations'}
            </Text>
            <Text style={styles.emptyText}>
              {translations[language].noConversationsDescription || 
                'Your conversations with parts suppliers will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  conversationsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  userTypeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userTypeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  lastMessage: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  noMessages: {
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  unreadText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
});

export default ConversationsScreen;
