// src/api/whatsapp.ts - Web API Routes
import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();
const WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || "your_webhook_token";
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Webhook للتحقق من Meta
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_TOKEN) {
    console.log("✅ Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// استقبال الرسائل من Meta
router.post("/webhook", (req: Request, res: Response) => {
  const body = req.body;

  // التحقق من التوقيع
  const signature = req.headers["x-hub-signature-256"] as string;
  const hash = crypto
    .createHmac("sha256", ACCESS_TOKEN || "")
    .update(JSON.stringify(body))
    .digest("hex");

  if (signature !== `sha256=${hash}`) {
    console.log("❌ Invalid signature");
    return res.sendStatus(403);
  }

  // معالجة الرسائل الواردة
  if (
    body.object === "whatsapp_business_account" &&
    body.entry &&
    body.entry[0] &&
    body.entry[0].changes &&
    body.entry[0].changes[0]
  ) {
    const change = body.entry[0].changes[0];

    if (change.value.messages && change.value.messages[0]) {
      const message = change.value.messages[0];
      const from = message.from;
      const msgBody = message.text?.body || "";
      const msgId = message.id;
      const timestamp = new Date(message.timestamp * 1000);

      console.log(`📨 Received message from ${from}: ${msgBody}`);

      // حفظ الرسالة في قاعدة البيانات
      saveMessage({
        id: msgId,
        from,
        message: msgBody,
        timestamp,
        status: "received",
      });

      // الرد التلقائي
      sendWhatsAppMessage(from, "شكراً لرسالتك. سنرد عليك قريباً 👋");
    }

    // معالجة حالة التسليم
    if (change.value.statuses && change.value.statuses[0]) {
      const status = change.value.statuses[0];
      console.log(`📤 Message ${status.id} status: ${status.status}`);

      // تحديث حالة الرسالة
      updateMessageStatus(status.id, status.status);
    }
  }

  res.sendStatus(200);
});

// إرسال رسالة
router.post("/send-message", async (req: Request, res: Response) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "رقم الهاتف والرسالة مطلوبان" });
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
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send message");
    }

    console.log(`✅ Message sent to ${phoneNumber}`);

    // حفظ الرسالة المرسلة
    saveMessage({
      id: data.messages[0].id,
      to: phoneNumber,
      message,
      timestamp: new Date(),
      status: "sent",
    });

    res.json({ success: true, messageId: data.messages[0].id });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// جلب الحوارات
router.get("/conversations", async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${BUSINESS_ACCOUNT_ID}/conversations`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// حفظ الرسالة
async function saveMessage(message: any) {
  try {
    const { supabase } = await import("@/lib/supabase");
    await supabase.from("whatsapp_messages").insert([message]);
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

// تحديث حالة الرسالة
async function updateMessageStatus(messageId: string, status: string) {
  try {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("whatsapp_messages")
      .update({ status })
      .eq("id", messageId);
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

// إرسال رسالة
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
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
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to send message");
    }

    console.log(`✅ Auto reply sent to ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Error sending auto reply:", error);
  }
}

export default router;
