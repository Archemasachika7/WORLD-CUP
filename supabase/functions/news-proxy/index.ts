import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GNEWS_KEY = Deno.env.get("GNEWS_KEY") ?? "";
const GNEWS_BASE = "https://gnews.io/api/v4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (!GNEWS_KEY) {
      return new Response(
        JSON.stringify({ articles: [], error: "GNEWS_KEY not configured" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const url = `${GNEWS_BASE}/search?q=FIFA+World+Cup+2026&lang=en&max=10&apikey=${GNEWS_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    return new Response(JSON.stringify({ articles: json.articles || [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ articles: [], error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
