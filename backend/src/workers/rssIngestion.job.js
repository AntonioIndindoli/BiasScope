import { parseRssFeed } from "../adapters/rss.adapter.js";
import { getIngestionSources } from "../config/sources.js";
import "dotenv/config";

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

async function ingestSource(source) {
    console.info(`[ingest] fetching RSS feed for ${source.name}: ${source.feedUrl}`);

    const response = await fetch(source.feedUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed. status=${response.status}`);
    }

    const xml = await response.text();
    const articles = parseRssFeed(xml, source.name);

    console.info(`[ingest] parsed ${articles.length} entries for ${source.name}`);

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

    return {
        source: source.name,
        total: articles.length,
        created,
        duplicates,
        failed,
    };
}

async function run() {
    const sources = getIngestionSources();

    if (sources.length === 0) {
        throw new Error("No ingestion sources configured. Set RSS_SOURCES_JSON to a non-empty JSON array.");
    }

    let totalCreated = 0;
    let totalDuplicates = 0;
    let totalFailed = 0;

    for (const source of sources) {
        try {
            const result = await ingestSource(source);
            totalCreated += result.created;
            totalDuplicates += result.duplicates;
            totalFailed += result.failed;

            console.info(
                `[ingest] source=${result.source} total=${result.total} created=${result.created} duplicates=${result.duplicates} failed=${result.failed}`
            );
        } catch (error) {
            totalFailed += 1;
            console.error(`[ingest] source failed: ${source.name}`, error);
        }
    }

    console.info(`[ingest] done. created=${totalCreated} duplicates=${totalDuplicates} failed=${totalFailed}`);

    if (totalFailed > 0) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error("[ingest] job failed:", error);
    process.exitCode = 1;
});
