/**
 * INTELLIC Chat Module
 *
 * Chat and messaging:
 * - Real-time messaging
 * - Patient-provider communication
 * - Message history
 * - Read receipts
 * - HIPAA-compliant messaging
 */

import { collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, where, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '@/utils/logger';
import { auditService } from '@/utils/audit';
import notificationService from './notification';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: Record<string, number>;
  type: 'direct' | 'group';
  metadata?: Record<string, any>;
}

export class ChatService {
  private unsubscribers: Map<string, () => void> = new Map();

  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<string> {
    try {
      const messageData = {
        ...message,
        timestamp: Timestamp.now(),
        read: false,
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);

      // Update conversation
      await this.updateConversation(message.conversationId, message.content, message.senderId);

      // Send notification to recipient
      await notificationService.sendNotification(
        `New message from ${message.senderName}`,
        message.content.substring(0, 100),
        {
          data: {
            type: 'chat',
            conversationId: message.conversationId,
            senderId: message.senderId,
          },
        }
      );

      // Audit log
      await auditService.log(message.senderId, 'create', 'health_data', docRef.id);

      logger.info('Message sent', { messageId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Failed to send message', error);
      throw error;
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'messages', messageId), { read: true });
      await auditService.log(userId, 'read', 'health_data', messageId, {
        type: 'message',
      });
    } catch (error) {
      logger.error('Failed to mark message as read', error);
    }
  }

  subscribeToConversation(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as Message[];

      callback(messages);
    });

    this.unsubscribers.set(conversationId, unsubscribe);
    return unsubscribe;
  }

  private async updateConversation(conversationId: string, lastMessage: string, senderId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage,
        lastMessageTime: Timestamp.now(),
        [`unreadCount.${senderId}`]: 0,
      });
    } catch (error) {
      logger.error('Failed to update conversation', error);
    }
  }

  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
  }
}

export const chatService = new ChatService();
export default chatService;
