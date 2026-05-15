import { parseRssFeed } from "../adapters/rss.adapter.js";
import "dotenv/config";

const FEED_URL = process.env.RSS_FEED_URL ?? "https://feeds.bbci.co.uk/news/world/rss.xml";
const SOURCE_NAME = process.env.RSS_SOURCE_NAME ?? "BBC World";
const API_BASE_URL = process.env.INGEST_API_BASE_URL ?? "http://localhost:4000";
const API_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/articles`;
const MAX_RETRIES = Number.parseInt(process.env.INGEST_MAX_RETRIES ?? "3", 10);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postArticle(article) {
    let attempt = 0;
    let lastError;

    while (attempt < MAX_RETRIES) {
        attempt += 1;
        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(article),
            });

            if (response.status === 201 || response.status === 409) {
                return { ok: true, status: response.status };
            }

            const body = await response.text();
            throw new Error(`status=${response.status} body=${body}`);
        } catch (error) {
            lastError = error;
            console.warn(`[ingest] POST failed for ${article.url} attempt ${attempt}/${MAX_RETRIES}:`, error.message);
            console.warn("name=", error?.name, "message=", error?.message, "cause=", error?.cause);
            if (attempt < MAX_RETRIES) {
                await sleep(500 * attempt);
            }
        }
    }

    return { ok: false, error: lastError };
}

async function run() {
    console.info(`[ingest] fetching RSS feed: ${FEED_URL}`);
    const response = await fetch(FEED_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed. status=${response.status}`);
    }

    const xml = await response.text();
    const articles = parseRssFeed(xml, SOURCE_NAME);

    console.info(`[ingest] parsed ${articles.length} entries`);

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const article of articles) {
        const result = await postArticle(article);

        if (!result.ok) {
            failed += 1;
            continue;
        }

        if (result.status === 201) created += 1;
        if (result.status === 409) duplicates += 1;
    }

    console.info(`[ingest] done. created=${created} duplicates=${duplicates} failed=${failed}`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error("[ingest] job failed:", error);
    process.exitCode = 1;
});
