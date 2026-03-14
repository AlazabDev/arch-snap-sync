import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MaintenancePayload {
  title: string;
  description?: string;
  fault_category?: string;
  priority?: string;
  building?: string;
  unit?: string;
  floor?: string;
  requester_name: string;
  requester_phone?: string;
  requester_email?: string;
  source: string;
  source_reference?: string;
  attachments?: string[];
}

const VALID_SOURCES = ["whatsapp", "form", "erp", "app", "web"];
const VALID_CATEGORIES = ["electrical", "plumbing", "hvac", "structural", "painting", "carpentry", "cleaning", "other"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // GET: Health check / API info
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          service: "Maintenance API Gateway",
          version: "1.0.0",
          status: "active",
          endpoints: {
            "POST /": "Create a new maintenance request",
            "GET /": "API info and health check",
          },
          required_fields: ["title", "requester_name", "source"],
          optional_fields: [
            "description", "fault_category", "priority",
            "building", "unit", "floor",
            "requester_phone", "requester_email",
            "source_reference", "attachments"
          ],
          valid_sources: VALID_SOURCES,
          valid_categories: VALID_CATEGORIES,
          valid_priorities: VALID_PRIORITIES,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MaintenancePayload = await req.json();

    // Validate required fields
    if (!body.title || !body.requester_name || !body.source) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["title", "requester_name", "source"],
          received: { title: !!body.title, requester_name: !!body.requester_name, source: !!body.source },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate source
    if (!VALID_SOURCES.includes(body.source)) {
      return new Response(
        JSON.stringify({ error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate category if provided
    const category = body.fault_category && VALID_CATEGORIES.includes(body.fault_category)
      ? body.fault_category : "other";

    // Validate priority if provided
    const priority = body.priority && VALID_PRIORITIES.includes(body.priority)
      ? body.priority : "medium";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate source_reference
    if (body.source_reference) {
      const { data: existing } = await supabase
        .from("maintenance_requests")
        .select("id, ticket_number")
        .eq("source_reference", body.source_reference)
        .eq("source", body.source)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            status: "duplicate",
            message: "Request already exists",
            ticket_number: existing.ticket_number,
            id: existing.id,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Determine created_by from auth header if present
    let createdBy: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      if (data?.claims?.sub) {
        createdBy = data.claims.sub as string;
      }
    }

    const { data, error } = await supabase
      .from("maintenance_requests")
      .insert({
        title: body.title.trim().substring(0, 200),
        description: body.description?.trim().substring(0, 2000) || null,
        fault_category: category,
        priority: priority,
        building: body.building?.trim().substring(0, 100) || null,
        unit: body.unit?.trim().substring(0, 50) || null,
        floor: body.floor?.trim().substring(0, 20) || null,
        requester_name: body.requester_name.trim().substring(0, 100),
        requester_phone: body.requester_phone?.trim().substring(0, 20) || null,
        requester_email: body.requester_email?.trim().substring(0, 100) || null,
        source: body.source,
        source_reference: body.source_reference || null,
        attachments: body.attachments || [],
        created_by: createdBy,
      })
      .select("id, ticket_number, status, created_at")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create request", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "created",
        message: "Maintenance request created successfully",
        ticket_number: data.ticket_number,
        id: data.id,
        request_status: data.status,
        created_at: data.created_at,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Gateway error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
