// src/types/index.ts

// ============ WHATSAPP TYPES ============
export interface WhatsAppMessage {
  id: string;
  from?: string;
  to?: string;
  message: string;
  type: "text" | "image" | "document" | "video" | "audio" | "template";
  status: "sent" | "delivered" | "read" | "failed" | "pending";
  timestamp: Date;
  mediaUrl?: string;
  templateName?: string;
  variables?: Record<string, string>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "marketing" | "utility" | "authentication";
  language: "ar" | "en";
  templateId?: string;
  body: string;
  variables: string[];
  headerType?: "text" | "image" | "document" | "video";
  headerContent?: string;
  footerText?: string;
  buttons?: WhatsAppButton[];
  status: "pending_review" | "approved" | "rejected" | "disabled";
  created_at?: Date;
  updated_at?: Date;
}

export interface WhatsAppButton {
  type: "url" | "call" | "reply";
  text: string;
  value?: string;
}

export interface WhatsAppMedia {
  id: string;
  mediaId: string;
  type: "image" | "document" | "video" | "audio";
  url: string;
  mimeType: string;
  size: number;
  uploaded_at?: Date;
  caption?: string;
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  tags?: string[];
  lastMessage?: Date;
  messageCount?: number;
  status: "active" | "inactive" | "blocked";
  notes?: string;
  created_at?: Date;
}

export interface WhatsAppConversation {
  id: string;
  contactId: string;
  contact: WhatsAppContact;
  lastMessage?: WhatsAppMessage;
  messageCount: number;
  unreadCount: number;
  updated_at: Date;
}

export interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string };
          document?: { id: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ============ META / FACEBOOK TYPES ============
export interface MetaConfig {
  appId: string;
  appSecret: string;
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookToken: string;
  apiVersion: string;
}

export interface FacebookInsight {
  name: string;
  period: string;
  values: Array<{ value: number }>;
}

export interface FacebookPage {
  id: string;
  name: string;
  picture: string;
  about: string;
  followers_count: number;
}

// ============ SUPABASE TYPES ============
export interface DatabaseMessage {
  id: string;
  from?: string;
  to?: string;
  message: string;
  type: string;
  status: string;
  media_url?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
  integration_id: string;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  template_id?: string;
  body: string;
  variables: string[];
  header_type?: string;
  header_content?: string;
  footer_text?: string;
  buttons?: WhatsAppButton[];
  status: string;
  created_at: string;
  updated_at: string;
  integration_id: string;
}

export interface DatabaseContact {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  tags?: string[];
  last_message?: string;
  message_count?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  integration_id: string;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============ USER TYPES ============
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: "admin" | "user" | "agent";
  status: "active" | "inactive" | "suspended";
  created_at: Date;
  updated_at: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ============ ANALYTICS TYPES ============
export interface MessageStats {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  readMessages: number;
  failedMessages: number;
  avgResponseTime: number;
}

export interface DailyStats {
  date: string;
  count: number;
  revenue?: number;
}

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  inactiveContacts: number;
  newContactsToday: number;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// ============ SETTINGS TYPES ============
export interface WhatsAppSettings {
  autoReply: boolean;
  autoReplyMessage: string;
  timezone: string;
  businessHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  language: "ar" | "en";
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
}
