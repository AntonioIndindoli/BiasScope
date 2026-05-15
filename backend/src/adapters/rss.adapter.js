function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractTagValue(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : null;
}

function extractCategories(itemXml) {
  const matches = [...itemXml.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)];
  return matches.map((m) => decodeXml(m[1])).filter(Boolean);
}

function extractEnclosure(itemXml) {
  const match = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
  return match ? decodeXml(match[1]) : null;
}

function parseItem(itemXml, sourceName) {
  const link = extractTagValue(itemXml, "link");
  const title = extractTagValue(itemXml, "title");
  const publishedAtRaw = extractTagValue(itemXml, "pubDate") ?? extractTagValue(itemXml, "published");

  if (!link || !title || !publishedAtRaw) {
    return null;
  }

  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) {
    return null;
  }

  return {
    externalId: extractTagValue(itemXml, "guid"),
    url: link,
    source: sourceName,
    title,
    description: extractTagValue(itemXml, "description"),
    author: extractTagValue(itemXml, "author") ?? extractTagValue(itemXml, "dc:creator"),
    imageUrl: extractEnclosure(itemXml),
    tags: extractCategories(itemXml),
    publishedAt: publishedAt.toISOString(),
    scrapedAt: new Date().toISOString(),
  };
}

export function parseRssFeed(xml, sourceName) {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];

  return itemMatches
    .map((match) => parseItem(match[0], sourceName))
    .filter(Boolean);
}
