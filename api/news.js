// Vercel Serverless Function — secure GNews proxy
// Keeps the API key server-side. Set GNEWS_KEY in Vercel → Project → Settings → Environment Variables.
// Reachable at /api/news on the deployed site.

export default async function handler(req, res) {
  const key = process.env.GNEWS_KEY;

  // Cache at the edge for 30 min to stay within the free GNews quota
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

  if (!key) {
    return res.status(200).json({ articles: [], fallback: true, reason: "GNEWS_KEY not configured" });
  }

  const q = encodeURIComponent("FIFA World Cup 2026");
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=10&apikey=${key}`;

  try {
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(200).json({ articles: [], fallback: true, reason: `GNews ${r.status}` });
    }
    const json = await r.json();
    const articles = (json.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      image: a.image || null,
      publishedAt: a.publishedAt,
      source: { name: a.source?.name || "GNews" },
      tag: "Live News",
    }));
    return res.status(200).json({ articles, fallback: false });
  } catch (e) {
    return res.status(200).json({ articles: [], fallback: true, reason: e.message });
  }
}
