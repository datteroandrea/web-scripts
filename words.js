import axios from "axios";
import * as cheerio from "cheerio";

async function fetchTextContent(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, head").remove();

  // Get all visible text
  const texts = [];
  $("p, h1, h2, h3, h4, h5, h6, li, a, span, strong, em").each((_, el) => {
    const t = $(el).text().trim();
    if (t) texts.push(t);
  });

  $("body")
    .contents()
    .each((_, node) => {
      if (node.type === "text") {
        const t = $(node).text().replace(/\s+/g, " ").trim();
        if (t) texts.push(t);
      }
    });
  return texts.join(" ").split(" ");
}

async function main() {
  const startUrl = process.argv[2];
  if (!startUrl) {
    console.error("Usage: node words.js <homepage-url>");
    process.exit(1);
  }

  const baseDomain = new URL(startUrl).origin;
  console.log(`Starting crawl at ${startUrl} ...\n`);
  const text = await fetchTextContent(startUrl, baseDomain);

  console.log("\n--- Crawl complete ---");
  console.log("All words found in page:", text);
  console.log("Total number of words: ", text.length);
}

main();