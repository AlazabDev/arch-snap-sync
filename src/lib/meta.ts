// src/lib/meta.ts
import axios, { AxiosInstance } from "axios";

interface MetaConfig {
  appId: string;
  appSecret: string;
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  webhookToken: string;
  apiVersion: string;
}

class MetaClient {
  private config: MetaConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_META_APP_ID,
      appSecret: import.meta.env.VITE_META_APP_SECRET,
      businessAccountId: import.meta.env.VITE_WHATSAPP_BUSINESS_ID,
      phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
      accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
      webhookToken: import.meta.env.VITE_WHATSAPP_WEBHOOK_TOKEN,
      apiVersion: import.meta.env.VITE_WHATSAPP_API_VERSION || "v18.0",
    };

    if (
      !this.config.appId ||
      !this.config.businessAccountId ||
      !this.config.phoneNumberId ||
      !this.config.accessToken
    ) {
      throw new Error("Missing Meta/WhatsApp credentials in environment variables");
    }

    this.client = axios.create({
      baseURL: `https://graph.instagram.com/${this.config.apiVersion}`,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
    });
  }

  // إرسال رسالة نصية
  async sendTextMessage(phoneNumber: string, message: string) {
    try {
      const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: message,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // إرسال رسالة من قالب
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    variables?: Record<string, string>
  ) {
    try {
      const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "ar",
          },
          body: variables
            ? {
                parameters: Object.values(variables).map((v) => ({
                  type: "text",
                  text: v,
                })),
              }
            : undefined,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // إرسال صورة
  async sendImage(phoneNumber: string, imageUrl: string, caption?: string) {
    try {
      const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // إرسال ملف
  async sendDocument(phoneNumber: string, fileUrl: string, caption?: string) {
    try {
      const response = await this.client.post(`/${this.config.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "document",
        document: {
          link: fileUrl,
          caption: caption,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // إنشاء قالب
  async createTemplate(
    name: string,
    category: string,
    language: string,
    components: any[]
  ) {
    try {
      const response = await this.client.post(
        `/${this.config.businessAccountId}/message_templates`,
        {
          name,
          category,
          language,
          components,
        }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // جلب القوالب
  async getTemplates() {
    try {
      const response = await this.client.get(
        `/${this.config.businessAccountId}/message_templates`
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // رفع ملف
  async uploadMedia(formData: FormData) {
    try {
      const response = await this.client.post(
        `/${this.config.phoneNumberId}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // معالجة الأخطاء
  private handleError(error: any) {
    if (error.response) {
      const errorData = error.response.data;
      console.error("Meta API Error:", {
        status: error.response.status,
        data: errorData,
      });
      throw new Error(
        errorData?.error?.message || `Meta API Error: ${error.response.status}`
      );
    } else if (error.request) {
      console.error("No response from Meta API:", error.request);
      throw new Error("No response from Meta API");
    } else {
      console.error("Error setting up Meta API request:", error.message);
      throw error;
    }
  }
}

export const metaClient = new MetaClient();
