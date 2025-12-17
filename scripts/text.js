import axios from 'axios';
import * as cheerio from 'cheerio';

async function crawl(url) {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    $("script, style, noscript").remove();
    const text = $("body")
        .text()
        .replace(/\s+/g, " ")
        .trim();
    console.log(text);
}

async function main() {
    const startUrl = process.argv[2];

    if (!startUrl) {
        console.error("Usage: node text.js <homepage-url>");
        process.exit(1);
    }

    console.log(`Starting crawl at ${startUrl} ...\n`);
    await crawl(startUrl);
    console.log("\n--- Crawl complete ---");
}

main();