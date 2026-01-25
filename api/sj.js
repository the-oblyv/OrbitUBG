import fetch from "node-fetch";

export default async function handler(req, res) {
  const urlObj = new URL(req.url, `https://${req.headers.host}`);
  const path = urlObj.pathname.replace("/sj/", "");
  const decoded = decodeURIComponent(path);
  const target = decoded.startsWith("http") ? decoded : "https://" + decoded;

  const response = await fetch(target);
  const body = await response.arrayBuffer();

  res.setHeader("content-type", response.headers.get("content-type") || "text/html");
  res.setHeader("cache-control", "public, max-age=0, must-revalidate");
  res.status(response.status).send(Buffer.from(body));
}
