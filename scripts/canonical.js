import axios from 'axios';
import * as cheerio from 'cheerio';

const visited = new Set();
const broken = new Set();

function handler(url, response) {
    const $ = cheerio.load(response.data);
    const canonical = $($("link[rel='canonical']")?.get(0))?.attr("href");

    if (canonical !== url) {
        broken.add({ url, canonical });
        console.log("❌ Canonical tag: " + canonical + " is different from url: " + url)
    } else {
        console.log("✅ Canonical tag for " + url + " is valid.")
    }
}

async function crawl(url, baseDomain, handler) {
    if (visited.has(url))
        return;
    visited.add(url);

    try {
        const response = await axios.get(url);

        const $ = cheerio.load(response.data);

        const links = $("a[href]")
            .map((_, a) => $(a).attr("href"))
            .get()
            .filter(href => href && !href.startsWith("mailto:") && !href.startsWith("tel:"));

        handler(url, response);

        for (const link of links) {
            let fullUrl;
            try {
                fullUrl = new URL(link, url).href;
            } catch {
                continue;
            }

            if (fullUrl.startsWith(baseDomain)) {
                await crawl(fullUrl, baseDomain, handler);
            }
        }
    } catch (err) {
        console.log(`❌ Failed: ${url} (${err.message})`);
        broken.add(url);
    }
}

async function main() {
    const startUrl = process.argv[2];

    if (!startUrl) {
        console.error("Usage: node canonical.js <homepage-url>");
        process.exit(1);
    }

    const baseDomain = new URL(startUrl).origin;
    console.log(`Starting crawl at ${startUrl} ...\n`);
    await crawl(startUrl, baseDomain, handler);

    console.log("\n--- Crawl complete ---");
    console.log(`Total visited: ${visited.size}`);
    console.log(`Broken links found: ${broken.size}`);

    if (broken.size > 0) {
        console.log("\nBroken URLs:");
        for (const url of broken) console.log(url);
    }
}

main();