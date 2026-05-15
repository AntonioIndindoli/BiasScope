import { Prisma } from "@prisma/client";
import { getPrisma } from "../db/prisma.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toArticleDto(article) {
  return {
    id: article.id,
    externalId: article.externalId,
    url: article.url,
    canonicalUrl: article.canonicalUrl,
    source: article.source,
    domain: article.domain,
    title: article.title,
    subtitle: article.subtitle,
    description: article.description,
    author: article.author,
    imageUrl: article.imageUrl,
    language: article.language,
    section: article.section,
    tags: article.tags,
    text: article.text,
    summary: article.summary,
    wordCount: article.wordCount,
    readingMinutes: article.readingMinutes,
    status: article.status,
    biasLabel: article.biasLabel,
    biasScore: article.biasScore,
    sentimentScore: article.sentimentScore,
    sentimentLabel: article.sentimentLabel,
    clusterId: article.clusterId,
    embeddingModel: article.embeddingModel,
    embeddingVersion: article.embeddingVersion,
    publishedAt: article.publishedAt,
    scrapedAt: article.scrapedAt,
    processedAt: article.processedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function parsePagination(query) {
  const limitRaw = query.limit;
  const offsetRaw = query.offset;

  const limit = limitRaw === undefined ? DEFAULT_LIMIT : Number.parseInt(limitRaw, 10);
  const offset = offsetRaw === undefined ? 0 : Number.parseInt(offsetRaw, 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
  }

  if (!Number.isInteger(offset) || offset < 0) {
    return { error: "offset must be an integer greater than or equal to 0" };
  }

  return { limit, offset };
}

function validateCreateArticleInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Request body must be a JSON object" };
  }

  const requiredStringFields = ["url", "source", "title", "publishedAt"];

  for (const field of requiredStringFields) {
    if (typeof payload[field] !== "string" || payload[field].trim().length === 0) {
      return { error: `${field} is required and must be a non-empty string` };
    }
  }

  const publishedAt = new Date(payload.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) {
    return { error: "publishedAt must be a valid ISO-8601 date string" };
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags) || payload.tags.some((tag) => typeof tag !== "string")) {
      return { error: "tags must be an array of strings" };
    }
  }

  return {
    data: {
      externalId: normalizeOptionalString(payload.externalId),
      url: payload.url.trim(),
      canonicalUrl: normalizeOptionalString(payload.canonicalUrl),
      source: payload.source.trim(),
      domain: normalizeOptionalString(payload.domain),
      title: payload.title.trim(),
      subtitle: normalizeOptionalString(payload.subtitle),
      description: normalizeOptionalString(payload.description),
      author: normalizeOptionalString(payload.author),
      imageUrl: normalizeOptionalString(payload.imageUrl),
      language: normalizeOptionalString(payload.language) ?? "en",
      section: normalizeOptionalString(payload.section),
      tags: payload.tags ?? [],
      text: normalizeOptionalString(payload.text),
      summary: normalizeOptionalString(payload.summary),
      wordCount: payload.wordCount ?? null,
      readingMinutes: payload.readingMinutes ?? null,
      status: payload.status,
      biasLabel: payload.biasLabel,
      biasScore: payload.biasScore ?? null,
      sentimentScore: payload.sentimentScore ?? null,
      sentimentLabel: normalizeOptionalString(payload.sentimentLabel),
      clusterId: normalizeOptionalString(payload.clusterId),
      embeddingModel: normalizeOptionalString(payload.embeddingModel),
      embeddingVersion: normalizeOptionalString(payload.embeddingVersion),
      publishedAt,
      scrapedAt: payload.scrapedAt ? new Date(payload.scrapedAt) : null,
      processedAt: payload.processedAt ? new Date(payload.processedAt) : null,
    },
  };
}

export const articlesService = {
  validateCreateArticleInput,

  parsePagination,

  async createArticle(payload) {
    const client = getPrisma();

    try {
      const article = await client.article.create({ data: payload });
      return { created: true, article: toArticleDto(article) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await client.article.findFirst({
          where: {
            OR: [
              { url: payload.url },
              ...(payload.externalId ? [{ externalId: payload.externalId }] : []),
            ],
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });

        return {
          created: false,
          duplicate: true,
          article: existing ? toArticleDto(existing) : null,
        };
      }

      throw error;
    }
  },

  async listArticles({ limit, offset }) {
    const client = getPrisma();

    const [rows, total] = await Promise.all([
      client.article.findMany({
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit,
        skip: offset,
      }),
      client.article.count(),
    ]);

    return {
      items: rows.map(toArticleDto),
      pagination: {
        limit,
        offset,
        total,
      },
    };
  },
};
