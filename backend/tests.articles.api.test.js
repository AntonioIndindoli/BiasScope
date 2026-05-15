import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import articlesRoutes from './src/routes/articles.routes.js';
import { articlesService } from './src/services/articles.services.js';

const baseArticle = {
  url: 'https://example.com/a1',
  source: 'Example',
  title: 'Article 1',
  publishedAt: '2025-01-02T00:00:00.000Z',
};

function buildStore() {
  const items = [];
  let idCounter = 1;

  return {
    validateCreateArticleInput: articlesService.validateCreateArticleInput,
    parsePagination: articlesService.parsePagination,
    async createArticle(payload) {
      const duplicate = items.find((item) => item.url === payload.url || (payload.externalId && item.externalId === payload.externalId));
      if (duplicate) return { created: false, duplicate: true, article: duplicate };

      const article = {
        id: `a${idCounter++}`,
        externalId: payload.externalId,
        url: payload.url,
        canonicalUrl: payload.canonicalUrl,
        source: payload.source,
        domain: payload.domain,
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        author: payload.author,
        imageUrl: payload.imageUrl,
        language: payload.language,
        section: payload.section,
        tags: payload.tags,
        text: payload.text,
        summary: payload.summary,
        wordCount: payload.wordCount,
        readingMinutes: payload.readingMinutes,
        status: payload.status ?? 'PUBLISHED',
        biasLabel: payload.biasLabel ?? 'UNKNOWN',
        biasScore: payload.biasScore,
        sentimentScore: payload.sentimentScore,
        sentimentLabel: payload.sentimentLabel,
        clusterId: payload.clusterId,
        embeddingModel: payload.embeddingModel,
        embeddingVersion: payload.embeddingVersion,
        publishedAt: payload.publishedAt,
        scrapedAt: payload.scrapedAt,
        processedAt: payload.processedAt,
        createdAt: new Date(`2025-01-${String(idCounter).padStart(2, '0')}T00:00:00.000Z`),
        updatedAt: new Date(`2025-01-${String(idCounter).padStart(2, '0')}T00:00:00.000Z`),
      };
      items.push(article);
      return { created: true, article };
    },
    async listArticles({ limit, offset }) {
      const sorted = [...items].sort((a, b) => {
        const diff = b.publishedAt.getTime() - a.publishedAt.getTime();
        if (diff !== 0) return diff;
        return b.id.localeCompare(a.id);
      });
      return {
        items: sorted.slice(offset, offset + limit),
        pagination: { limit, offset, total: sorted.length },
      };
    },
  };
}

async function withServer(fn) {
  const app = express();
  app.use(express.json());
  app.use("/articles", articlesRoutes);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((r, rej) => server.close((err) => (err ? rej(err) : r())));
  }
}

test('POST /articles creates article and returns 201 contract', async () => {
  Object.assign(articlesService, buildStore());

  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(baseArticle),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, 'created');
    assert.equal(body.article.url, baseArticle.url);
    assert.equal(body.article.title, baseArticle.title);
  });
});

test('POST /articles duplicate ingest returns 409 with duplicate status', async () => {
  Object.assign(articlesService, buildStore());

  await withServer(async (baseUrl) => {
    for (let i = 0; i < 2; i += 1) {
      await fetch(`${baseUrl}/articles`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(baseArticle),
      });
    }

    const duplicateRes = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(baseArticle),
    });
    assert.equal(duplicateRes.status, 409);
    const duplicateBody = await duplicateRes.json();
    assert.equal(duplicateBody.status, 'duplicate');
    assert.equal(duplicateBody.article.url, baseArticle.url);
  });
});

test('GET /articles returns sorted list and pagination sanity', async () => {
  Object.assign(articlesService, buildStore());

  await withServer(async (baseUrl) => {
    const payloads = [
      { ...baseArticle, url: 'https://example.com/older', title: 'Older', publishedAt: '2025-01-01T00:00:00.000Z' },
      { ...baseArticle, url: 'https://example.com/newer', title: 'Newer', publishedAt: '2025-01-03T00:00:00.000Z' },
      { ...baseArticle, url: 'https://example.com/middle', title: 'Middle', publishedAt: '2025-01-02T00:00:00.000Z' },
    ];

    await Promise.all(payloads.map((payload) => fetch(`${baseUrl}/articles`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
    })));

    const res = await fetch(`${baseUrl}/articles?limit=2&offset=1`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.deepEqual(body.items.map((x) => x.title), ['Middle', 'Older']);
    assert.deepEqual(body.pagination, { limit: 2, offset: 1, total: 3 });
  });
});

test('POST /articles rejects malformed payload with 400', async () => {
  Object.assign(articlesService, buildStore());

  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/articles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'Example', title: 'Missing URL', publishedAt: 'bad-date' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /url is required/);
  });
});
