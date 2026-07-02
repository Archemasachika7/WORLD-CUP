import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FD_KEY = Deno.env.get("FD_KEY") ?? "";
const FD_BASE = "https://api.football-data.org/v4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "competitions/WC/matches";
    
    // Build the full API URL
    let apiUrl = `${FD_BASE}/${endpoint}`;
    
    // Add API key if available
    if (FD_KEY) {
      apiUrl += `?${endpoint.includes("?") ? "&" : "?"}apikey=${FD_KEY}`;
    }

    console.log(`Fetching: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      headers: {
        "X-Auth-Token": FD_KEY || "",
      },
    });

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${res.status}`, data: null }),
        {
          status: res.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const json = await res.json();

    return new Response(JSON.stringify(json), {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // 5 minute cache for live scores
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: String(err), data: null }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
