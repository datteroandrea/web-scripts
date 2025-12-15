// usage: node sitemap.js https://example.com

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const visited = new Set();

async function crawl(url, baseDomain) {
  const normalizedUrl = url.split("#")[0];
  if (visited.has(normalizedUrl)) return;
  visited.add(normalizedUrl);

  try {
    const res = await axios.get(normalizedUrl, { timeout: 10000 });
    if (res.status !== 200) return;

    console.log(`✅ Crawled: ${normalizedUrl}`);

    const $ = cheerio.load(res.data);
    const links = $("a[href]")
      .map((_, a) => $(a).attr("href"))
      .get()
      .filter(
        href =>
          href &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:")
      );

    for (const link of links) {
      let fullUrl;
      try {
        fullUrl = new URL(link, normalizedUrl).href.split("#")[0];
      } catch {
        continue;
      }

      if (fullUrl.startsWith(baseDomain)) {
        await crawl(fullUrl, baseDomain);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Failed to crawl: ${normalizedUrl}`);
  }
}

function generateSitemap(urls, baseDomain) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  const xmlUrls = [...urls]
    .sort()
    .map(
      url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === baseDomain + "/" ? "1.0" : "0.7"}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

async function main() {
  const startUrl = process.argv[2];
  if (!startUrl) {
    console.error("Usage: node sitemap.js <homepage-url>");
    process.exit(1);
  }

  const baseDomain = new URL(startUrl).origin;
  console.log(`Starting crawl at ${startUrl}...\n`);

  await crawl(startUrl, baseDomain);

  const sitemap = generateSitemap(visited, baseDomain);
  fs.writeFileSync("sitemap.xml", sitemap.trim());

  console.log("\n--- Sitemap generated ---");
  console.log(`Total URLs: ${visited.size}`);
  console.log("Saved as sitemap.xml");
}

main();
