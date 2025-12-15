import axios from "axios";
import * as cheerio from "cheerio";

async function fetchTextContent(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, head").remove();

  // Get all visible text
  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .split(" ");
  return text;
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