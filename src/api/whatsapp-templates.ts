// src/api/whatsapp-templates.ts
// @ts-nocheck
import { Router, Request, Response } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ID;

// جلب القوالب المتاحة
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// إنشاء قالب جديد في Meta
router.post("/templates", async (req: Request, res: Response) => {
  const {
    name,
    category,
    language,
    body,
    header_type,
    header_content,
    footer_text,
    buttons,
  } = req.body;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          name,
          category,
          language,
          components: [
            header_type && {
              type: "HEADER",
              format: header_type.toUpperCase(),
              text: header_type === "text" ? header_content : undefined,
            },
            {
              type: "BODY",
              text: body,
            },
            footer_text && {
              type: "FOOTER",
              text: footer_text,
            },
            buttons && buttons.length > 0 && {
              type: "BUTTONS",
              buttons: buttons.map((btn: any) => ({
                type: btn.type.toUpperCase(),
                text: btn.text,
                url: btn.type === "url" ? btn.value : undefined,
                phone_number: btn.type === "call" ? btn.value : undefined,
                payload: btn.type === "reply" ? btn.value : undefined,
              })),
            },
          ].filter(Boolean),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create template");
    }

    console.log(`✅ Template created: ${data.id}`);
    res.json({ success: true, templateId: data.id });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// إرسال رسالة باستخدام قالب
router.post("/send-template", async (req: Request, res: Response) => {
  const { templateId, phoneNumber, variables } = req.body;

  if (!templateId || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "templateId and phoneNumber are required" });
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "template",
          template: {
            name: templateId,
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
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send template message");
    }

    console.log(`✅ Template message sent to ${phoneNumber}`);
    res.json({ success: true, messageId: data.messages[0].id });
  } catch (error) {
    console.error("Error sending template message:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// رفع الملف إلى WhatsApp
router.post(
  "/upload-media",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    try {
      const formData = new FormData();
      formData.append("file", new Blob([req.file.buffer]), req.file.originalname);
      formData.append("type", req.body.type);

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to upload media");
      }

      console.log(`✅ Media uploaded: ${data.id}`);
      res.json({ success: true, mediaId: data.id });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// إرسال رسالة مع الصورة/الملف
router.post("/send-media-message", async (req: Request, res: Response) => {
  const { phoneNumber, mediaId, mediaType, caption } = req.body;

  if (!phoneNumber || !mediaId || !mediaType) {
    return res.status(400).json({
      error: "phoneNumber, mediaId, and mediaType are required",
    });
  }

  try {
    const typeMap: Record<string, string> = {
      image: "image",
      document: "document",
      video: "video",
      audio: "audio",
    };

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: typeMap[mediaType],
          [typeMap[mediaType]]: {
            id: mediaId,
            caption: caption,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send media message");
    }

    console.log(`✅ Media message sent to ${phoneNumber}`);
    res.json({ success: true, messageId: data.messages[0].id });
  } catch (error) {
    console.error("Error sending media message:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// حذف الملف من WhatsApp
router.delete("/media/:mediaId", async (req: Request, res: Response) => {
  const { mediaId } = req.params;

  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${mediaId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete media");
    }

    console.log(`✅ Media deleted: ${mediaId}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
