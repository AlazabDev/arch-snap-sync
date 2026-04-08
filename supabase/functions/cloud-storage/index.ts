import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProviderConfig {
  provider_type: string;
  bucket_name: string;
  region?: string;
  config: Record<string, any>;
}

// ========== AWS S3 ==========
async function s3Request(method: string, path: string, config: ProviderConfig, body?: Uint8Array, contentType?: string) {
  const { config: creds, bucket_name, region } = config;
  const accessKey = creds.access_key_id;
  const secretKey = creds.secret_access_key;
  const reg = region || creds.region || "us-east-1";
  const host = `${bucket_name}.s3.${reg}.amazonaws.com`;
  const url = `https://${host}${path}`;
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const shortDate = dateStamp.substring(0, 8);

  const headers: Record<string, string> = {
    host,
    "x-amz-date": dateStamp,
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map(k => `${k}:${headers[k]}\n`).join("");
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");

  const encoder = new TextEncoder();
  const sha256 = async (data: string) => {
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  };
  const hmac = async (key: ArrayBuffer | Uint8Array, msg: string) => {
    const cryptoKey = await crypto.subtle.importKey("raw", key instanceof ArrayBuffer ? key : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(msg));
  };

  const scope = `${shortDate}/${reg}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", dateStamp, scope, await sha256(canonicalRequest)].join("\n");

  let signingKey = await hmac(encoder.encode(`AWS4${secretKey}`), shortDate);
  signingKey = await hmac(signingKey, reg);
  signingKey = await hmac(signingKey, "s3");
  signingKey = await hmac(signingKey, "aws4_request");

  const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", signingKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), encoder.encode(stringToSign)))).map(b => b.toString(16).padStart(2, "0")).join("");

  headers["authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resp = await fetch(url, { method, headers, body });
  return resp;
}

async function listS3Objects(config: ProviderConfig, prefix = "") {
  const path = `/?list-type=2&prefix=${encodeURIComponent(prefix)}&delimiter=%2F`;
  const resp = await s3Request("GET", path, config);
  const text = await resp.text();
  
  const files: any[] = [];
  const folders: string[] = [];
  
  const contentMatches = text.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);
  for (const m of contentMatches) {
    const key = m[1].match(/<Key>(.*?)<\/Key>/)?.[1] || "";
    const size = parseInt(m[1].match(/<Size>(.*?)<\/Size>/)?.[1] || "0");
    const modified = m[1].match(/<LastModified>(.*?)<\/LastModified>/)?.[1] || "";
    if (key !== prefix) files.push({ key, size, last_modified: modified });
  }
  
  const prefixMatches = text.matchAll(/<CommonPrefixes><Prefix>(.*?)<\/Prefix><\/CommonPrefixes>/g);
  for (const m of prefixMatches) folders.push(m[1]);

  return { files, folders };
}

async function deleteS3Object(config: ProviderConfig, key: string) {
  const resp = await s3Request("DELETE", `/${encodeURIComponent(key)}`, config);
  return resp.ok;
}

async function getS3DownloadUrl(config: ProviderConfig, key: string) {
  const { config: creds, bucket_name, region } = config;
  const reg = region || creds.region || "us-east-1";
  return `https://${bucket_name}.s3.${reg}.amazonaws.com/${key}`;
}

// ========== OCI Object Storage ==========
async function ociRequest(method: string, url: string, _config: ProviderConfig) {
  // OCI uses pre-authenticated requests (PAR) stored in config
  const resp = await fetch(url, { method });
  return resp;
}

async function listOciObjects(config: ProviderConfig, prefix = "") {
  const { config: creds, bucket_name } = config;
  const namespace = creds.namespace;
  const reg = creds.region || "me-jeddah-1";
  const parUrl = creds.par_url; // Pre-authenticated request URL
  
  let url: string;
  if (parUrl) {
    url = `${parUrl}?prefix=${encodeURIComponent(prefix)}&delimiter=/`;
  } else {
    url = `https://objectstorage.${reg}.oraclecloud.com/n/${namespace}/b/${bucket_name}/o?prefix=${encodeURIComponent(prefix)}&delimiter=/`;
  }
  
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OCI error: ${resp.status}`);
  const data = await resp.json();
  
  const files = (data.objects || []).map((o: any) => ({
    key: o.name,
    size: o.size || 0,
    last_modified: o.timeModified || o.timeCreated || "",
  }));
  const folders = (data.prefixes || []);
  
  return { files, folders };
}

// ========== GCP Cloud Storage ==========
async function listGcpObjects(config: ProviderConfig, prefix = "") {
  const { config: creds, bucket_name } = config;
  const apiKey = creds.api_key;
  const accessToken = creds.access_token;

  let url = `https://storage.googleapis.com/storage/v1/b/${bucket_name}/o?prefix=${encodeURIComponent(prefix)}&delimiter=/`;
  
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (apiKey) {
    url += `&key=${apiKey}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`GCP error: ${resp.status}`);
  const data = await resp.json();
  
  const files = (data.items || []).map((item: any) => ({
    key: item.name,
    size: parseInt(item.size || "0"),
    last_modified: item.updated || item.timeCreated || "",
  }));
  const folders = data.prefixes || [];
  
  return { files, folders };
}

// ========== Main Handler ==========
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Check admin role
    const { data: hasRole } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!hasRole) throw new Error("Admin access required");

    const body = await req.json();
    const { action, provider_id, prefix, key } = body;

    if (action === "list-providers") {
      const { data, error } = await supabase.from("cloud_storage_providers").select("*").order("created_at");
      if (error) throw error;
      // Strip sensitive config for listing
      const safe = (data || []).map(p => ({ ...p, config: undefined }));
      return new Response(JSON.stringify({ providers: safe }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "test-connection") {
      const { data: provider } = await supabase.from("cloud_storage_providers").select("*").eq("id", provider_id).single();
      if (!provider) throw new Error("Provider not found");
      
      const conf = provider as ProviderConfig;
      try {
        if (conf.provider_type === "s3") {
          await listS3Objects(conf, "");
        } else if (conf.provider_type === "oci") {
          await listOciObjects(conf, "");
        } else if (conf.provider_type === "gcp") {
          await listGcpObjects(conf, "");
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (action === "list-objects") {
      const { data: provider } = await supabase.from("cloud_storage_providers").select("*").eq("id", provider_id).single();
      if (!provider) throw new Error("Provider not found");
      
      const conf = provider as ProviderConfig;
      let result;
      if (conf.provider_type === "s3") {
        result = await listS3Objects(conf, prefix || "");
      } else if (conf.provider_type === "oci") {
        result = await listOciObjects(conf, prefix || "");
      } else if (conf.provider_type === "gcp") {
        result = await listGcpObjects(conf, prefix || "");
      } else {
        throw new Error("Unknown provider type");
      }
      
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete-object") {
      const { data: provider } = await supabase.from("cloud_storage_providers").select("*").eq("id", provider_id).single();
      if (!provider) throw new Error("Provider not found");
      
      if (provider.provider_type === "s3") {
        await deleteS3Object(provider as ProviderConfig, key);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get-download-url") {
      const { data: provider } = await supabase.from("cloud_storage_providers").select("*").eq("id", provider_id).single();
      if (!provider) throw new Error("Provider not found");
      
      let url = "";
      if (provider.provider_type === "s3") {
        url = await getS3DownloadUrl(provider as ProviderConfig, key);
      }
      return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
