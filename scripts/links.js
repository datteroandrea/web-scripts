// usage: node links.js https://example.com

import axios from 'axios';
import * as cheerio from 'cheerio';

const visited = new Set();
const brokenLinks = new Set();

async function crawl(url, baseDomain, parent) {
  if (visited.has(url)) return;
  visited.add(url);

  try {
    const res = await axios.get(url, { timeout: 10000 });
    if (res.status !== 200) {
      console.log(`❌ Broken: ${url} (status ${res.status})`);
      brokenLinks.add(url);
      return;
    }

    console.log(`✅ OK: ${url}`);

    const $ = cheerio.load(res.data);
    const links = $("a[href]")
      .map((_, a) => $(a).attr("href"))
      .get()
      .filter(href => href && !href.startsWith("mailto:") && !href.startsWith("tel:"));

    for (const link of links) {
      let fullUrl;
      try {
        fullUrl = new URL(link, url).href;
      } catch {
        continue;
      }

      if (fullUrl.startsWith(baseDomain)) {
        await crawl(fullUrl, baseDomain, url);
      }
    }
  } catch (err) {
    console.log(`❌ Failed: ${url} (${err.message}) found at ${parent}`);
    brokenLinks.add(url);
  }
}

async function main() {
  const startUrl = process.argv[2];
  if (!startUrl) {
    console.error("Usage: node links.js <homepage-url>");
    process.exit(1);
  }

  const baseDomain = new URL(startUrl).origin;
  console.log(`Starting crawl at ${startUrl} ...\n`);
  await crawl(startUrl, baseDomain);

  console.log("\n--- Crawl complete ---");
  console.log(`Total visited: ${visited.size}`);
  console.log(`Broken links found: ${brokenLinks.size}`);

  if (brokenLinks.size > 0) {
    console.log("\nBroken URLs:");
    for (const url of brokenLinks) console.log(url);
  }
}

main();
