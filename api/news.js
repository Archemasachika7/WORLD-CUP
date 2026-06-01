export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  const key = process.env.GNEWS_KEY;
  if (!key) {
    return res.status(500).json({ error: "GNEWS_KEY not configured", articles: [] });
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=FIFA+World+Cup+2026&lang=en&max=6&sortby=publishedAt&apikey=${key}`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`GNews HTTP ${upstream.status}`);
    const json = await upstream.json();
    return res.status(200).json({ articles: json.articles || [] });
  } catch (e) {
    return res.status(502).json({ error: e.message, articles: [] });
  }
}
