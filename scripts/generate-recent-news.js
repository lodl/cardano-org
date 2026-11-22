//
// Generates recentNews.json and newsIndex.json from blog post frontmatter for
// use on the homepage, /news, /news/tags/*, and related-news blocks.
// Command: yarn run build-news
//

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');
const { selectFeed } = require('./lib/news-feed.js');

const blogDir = path.join(__dirname, '../blog');
const outputPath = path.join(__dirname, '../src/data/recentNews.json');
const indexOutputPath = path.join(__dirname, '../src/data/newsIndex.json');
const authorsPath = path.join(__dirname, '../blog/authors.yml');
const thumbsDir = path.join(__dirname, '../static/img/news-thumbs');
const thumbsPublicBase = '/img/news-thumbs';
const THUMB_CONCURRENCY = 8;

// Load authors for resolving author keys
const authorsYaml = fs.readFileSync(authorsPath, 'utf8');
const authors = yaml.load(authorsYaml);

// Get blog directories sorted by date descending
const dirs = fs
  .readdirSync(blogDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}-/.test(d.name))
  .map((d) => d.name)
  .sort()
  .reverse();

// Return the markdown body after the YAML frontmatter.
function getPostBody(content) {
  const parts = content.split('---');
  return parts.length >= 3 ? parts.slice(2).join('---') : '';
}

// Extract first paragraph from markdown content (after frontmatter)
function extractDescription(content) {
  const body = getPostBody(content).trim();
  if (!body) return '';

  // Find first non-empty paragraph (skip images, HTML blocks, empty lines)
  const lines = body.split('\n');
  let paragraph = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (paragraph) break;
      continue;
    }
    // Skip images, HTML tags, and markdown links that are standalone
    if (trimmed.startsWith('![') || trimmed.startsWith('<') || trimmed.startsWith(':::')) continue;
    paragraph += (paragraph ? ' ' : '') + trimmed;
  }

  // Strip markdown formatting
  return paragraph
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic
    .replace(/`([^`]+)`/g, '$1'); // `code` -> code
}

// Extract embedded YouTube video ID from iframe embeds if present.
function extractYoutubeId(content) {
  const body = getPostBody(content);
  const match = body.match(
    /<iframe[^>]+src=["']https?:\/\/(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

// Extract the primary external source CTA link and stripped hostname.
function extractExternalLink(content) {
  const body = getPostBody(content);
  const match = body.match(
    /\[\*\*(?:Read more|Watch now|Listen now|Learn more|Explore|View|Download)[^*]*\*\*\]\((https?:\/\/[^)\s]+)\)/i
  );
  if (!match) return { externalUrl: null, externalHost: null };
  const externalUrl = match[1];
  try {
    const externalHost = new URL(externalUrl).hostname.replace(/^www\./i, '');
    return { externalUrl, externalHost };
  } catch {
    return { externalUrl: null, externalHost: null };
  }
}

// Find the post banner image and, for in-post files, emit a downscaled WebP
// thumbnail under static/. Returns { url, thumbFile } where thumbFile is the
// basename written to thumbsDir (or null for remote/public/missing images).
async function resolveThumbnail(dir, content, slug) {
  const body = getPostBody(content);

  // First inline markdown image, e.g. ![alt](./banner.webp "title")
  const imgMatch = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (!imgMatch) return { url: null, thumbFile: null };

  // Drop an optional title after the URL, and any surrounding whitespace
  const rawUrl = imgMatch[1].trim().split(/\s+/)[0];

  // Remote or already-public paths can be used as-is
  if (/^https?:\/\//.test(rawUrl) || rawUrl.startsWith('/')) {
    return { url: rawUrl, thumbFile: null };
  }

  // In-post relative asset: resolve on disk and emit a small WebP thumbnail
  const rel = rawUrl.replace(/^\.\//, '');
  const srcPath = path.join(blogDir, dir, rel);
  if (!fs.existsSync(srcPath)) return { url: null, thumbFile: null };

  const destName = `${slug}.webp`;
  const destPath = path.join(thumbsDir, destName);
  const srcStat = fs.statSync(srcPath);
  let needsBuild = true;
  if (fs.existsSync(destPath)) {
    const destStat = fs.statSync(destPath);
    if (destStat.mtimeMs >= srcStat.mtimeMs) {
      needsBuild = false;
    }
  }

  if (needsBuild) {
    await sharp(srcPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(destPath);
  }

  return { url: `${thumbsPublicBase}/${destName}`, thumbFile: destName };
}

// Resolve author keys to name + imageUrl (homepage schema)
function resolveAuthors(authorKeys) {
  if (!authorKeys) return [];
  const keys = Array.isArray(authorKeys) ? authorKeys : [authorKeys];
  return keys
    .filter((key) => authors[key])
    .map((key) => ({
      name: authors[key].name,
      imageUrl: authors[key].image_url,
    }));
}

// Resolve author keys to key + name + imageUrl (newsIndex schema)
function resolveAuthorsWithKeys(authorKeys) {
  if (!authorKeys) return [];
  const keys = Array.isArray(authorKeys) ? authorKeys : [authorKeys];
  return keys
    .filter((key) => authors[key])
    .map((key) => ({
      key,
      name: authors[key].name,
      imageUrl: authors[key].image_url,
    }));
}

// Read frontmatter and body of all posts, newest first.
function loadCandidates() {
  const candidates = [];
  for (const dir of dirs) {
    const indexPath = path.join(blogDir, dir, 'index.md');
    if (!fs.existsSync(indexPath)) continue;

    const content = fs.readFileSync(indexPath, 'utf8');

    // Parse frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    // Extract date from directory name
    const dateMatch = dir.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;

    const frontmatter = yaml.load(fmMatch[1]);
    candidates.push({ dir, content, date: dateMatch[1], frontmatter, tags: frontmatter.tags || [] });
  }
  return candidates;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(runners);
  return results;
}

async function main() {
  fs.mkdirSync(thumbsDir, { recursive: true });

  const candidates = loadCandidates();
  const activeThumbs = new Set();

  const resolvedAll = await mapWithConcurrency(candidates, THUMB_CONCURRENCY, async (candidate) => {
    const { dir, content, date, frontmatter, tags } = candidate;
    const slug = frontmatter.slug || dir;
    const description = frontmatter.description || extractDescription(content);
    const { url: image, thumbFile } = await resolveThumbnail(dir, content, slug);
    if (thumbFile) activeThumbs.add(thumbFile);

    const youtubeId = extractYoutubeId(content);
    const { externalUrl, externalHost } = extractExternalLink(content);

    return {
      candidate,
      slug,
      entry: {
        slug,
        title: frontmatter.title,
        permalink: `/news/${slug}`,
        date,
        description,
        image,
        youtubeId,
        externalUrl,
        externalHost,
        authors: resolveAuthorsWithKeys(frontmatter.authors),
        tags,
      },
      recentEntry: {
        title: frontmatter.title,
        permalink: `/news/${slug}`,
        date,
        description,
        image,
        authors: resolveAuthors(frontmatter.authors),
        tags,
      },
    };
  });

  // Remove orphaned thumbnails left behind by deleted or renamed posts.
  for (const file of fs.readdirSync(thumbsDir)) {
    if (!activeThumbs.has(file)) {
      fs.rmSync(path.join(thumbsDir, file), { force: true });
    }
  }

  const byCandidate = new Map(resolvedAll.map((item) => [item.candidate, item]));
  const recentNews = selectFeed(candidates).map((c) => byCandidate.get(c).recentEntry);
  const newsIndex = resolvedAll.map((item) => item.entry);

  fs.writeFileSync(outputPath, JSON.stringify(recentNews, null, 2));
  fs.writeFileSync(indexOutputPath, JSON.stringify(newsIndex, null, 2));
  console.log(`Generated recentNews.json (${recentNews.length} posts) and newsIndex.json (${newsIndex.length} posts)`);
}

main();
