import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  try {
    // Webhook verification (GET)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // Handle incoming messages (POST)
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== "messages") continue;
          const value = change.value;
          const messages = value.messages || [];
          const contacts = value.contacts || [];

          for (const message of messages) {
            const contact = contacts.find(
              (c: any) => c.wa_id === message.from
            );
            const senderName = contact?.profile?.name || message.from;
            const senderPhone = message.from;

            // Determine file type and media info
            let fileType: string | null = null;
            let mediaId: string | null = null;
            let mimeType: string | null = null;
            let caption = message.text?.body || "";
            let fileName = "";

            if (message.type === "image") {
              fileType = "image";
              mediaId = message.image.id;
              mimeType = message.image.mime_type;
              caption = message.image.caption || caption;
              fileName = `image_${Date.now()}.${getExtension(mimeType || "image/jpeg")}`;
            } else if (message.type === "video") {
              fileType = "video";
              mediaId = message.video.id;
              mimeType = message.video.mime_type;
              caption = message.video.caption || caption;
              fileName = `video_${Date.now()}.${getExtension(mimeType || "video/mp4")}`;
            } else if (message.type === "audio") {
              fileType = "audio";
              mediaId = message.audio.id;
              mimeType = message.audio.mime_type;
              fileName = `audio_${Date.now()}.${getExtension(mimeType || "audio/ogg")}`;
            } else if (message.type === "document") {
              mediaId = message.document.id;
              mimeType = message.document.mime_type;
              fileName = message.document.filename || `document_${Date.now()}`;
              fileType = mimeType?.includes("pdf") ? "pdf" : "document";
            } else if (message.type === "text") {
              // Text-only message, skip file processing
              console.log("Text message received:", caption);
              continue;
            } else {
              console.log("Unsupported message type:", message.type);
              continue;
            }

            if (!mediaId) continue;

            // Try to extract project number from caption
            const projectNumber = extractProjectNumber(caption);

            // Find or create project
            let projectId: string | null = null;
            if (projectNumber) {
              const { data: project } = await supabase
                .from("projects")
                .select("id")
                .eq("project_number", projectNumber)
                .single();
              projectId = project?.id || null;
            }

            // If no project found, assign to a default/unassigned project
            if (!projectId) {
              const { data: defaultProject } = await supabase
                .from("projects")
                .select("id")
                .eq("project_number", "UNASSIGNED")
                .single();

              if (defaultProject) {
                projectId = defaultProject.id;
              } else {
                const { data: newProject } = await supabase
                  .from("projects")
                  .insert({
                    project_number: "UNASSIGNED",
                    name: "ملفات غير مصنفة",
                    status: "active",
                  })
                  .select("id")
                  .single();
                projectId = newProject?.id || null;
              }
            }

            if (!projectId) {
              console.error("Could not find or create project");
              continue;
            }

            // Download media from WhatsApp
            const apiVersion = Deno.env.get("WHATSAPP_API_VERSION") || "v21.0";
            const mediaUrlRes = await fetch(
              `https://graph.facebook.com/${apiVersion}/${mediaId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const mediaUrlData = await mediaUrlRes.json();
            const mediaDownloadUrl = mediaUrlData.url;

            if (!mediaDownloadUrl) {
              console.error("Could not get media URL:", mediaUrlData);
              continue;
            }

            const mediaRes = await fetch(mediaDownloadUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const mediaBlob = await mediaRes.blob();
            const fileSize = mediaBlob.size;

            // Upload to Supabase Storage
            const storagePath = `${projectId}/${fileType}/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from("project-files")
              .upload(storagePath, mediaBlob, {
                contentType: mimeType || "application/octet-stream",
                upsert: false,
              });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              continue;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("project-files")
              .getPublicUrl(storagePath);

            // Save file record
            const { error: insertError } = await supabase
              .from("project_files")
              .insert({
                project_id: projectId,
                file_name: fileName,
                file_type: fileType,
                file_url: publicUrl,
                file_size: fileSize,
                mime_type: mimeType,
                sender_name: senderName,
                sender_phone: senderPhone,
                whatsapp_message_id: message.id,
                caption: caption || null,
                storage_path: storagePath,
              });

            if (insertError) {
              console.error("DB insert error:", insertError);
            } else {
              console.log(`File saved: ${fileName} for project ${projectId}`);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/3gpp": "3gp",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/aac": "aac",
    "application/pdf": "pdf",
  };
  return map[mimeType] || "bin";
}

function extractProjectNumber(text: string): string | null {
  if (!text) return null;
  // Match patterns like PRJ-2024-001 or #PRJ-2024-001
  const match = text.match(/(?:#?\s*)(PRJ-\d{4}-\d{3})/i);
  return match ? match[1].toUpperCase() : null;
}
