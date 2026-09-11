//
// Generates recentNews.json (the newest posts, consumed by the homepage news
// section) and newsIndex.json (every post, consumed by the /news card grid and
// the category tiles) from blog post frontmatter.
// Command: yarn run build-news
//

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const sharp = require('sharp');

const blogDir = path.join(__dirname, '../blog');
const outputPath = path.join(__dirname, '../src/data/recentNews.json');
const indexPath = path.join(__dirname, '../src/data/newsIndex.json');
const authorsPath = path.join(__dirname, '../blog/authors.yml');
const thumbsDir = path.join(__dirname, '../static/img/news-thumbs');
const thumbsPublicBase = '/img/news-thumbs';

// How many of the newest posts the homepage section consumes.
const RECENT_COUNT = 6;

// Card thumbnails are never displayed wider than this; every extra pixel is
// dead weight in the published site.
const THUMB_WIDTH = 640;
// The card shows the post's own summary in full, so this is only a guard
// against the odd outlier paragraph. It keeps newsIndex.json (which ships with
// the page bundle) from growing without bound.
const DESCRIPTION_LIMIT = 600;
// sharp work is I/O bound: a few conversions in flight keep the build quick.
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

// Cut an excerpt on a word boundary so the card never ends mid-word.
function toExcerpt(description) {
  if (description.length <= DESCRIPTION_LIMIT) return description;
  return `${description.slice(0, DESCRIPTION_LIMIT).replace(/\s+\S*$/, '')}…`;
}

// Link to the original article. The authoring guide asks for a bolded
// "Read more" link below the summary; some older posts only carry the link.
// The grid sends readers straight there, so the card needs it.
function extractSourceUrl(content) {
  const body = getPostBody(content);
  const readMore = body.match(
    /\[\s*\*{0,2}read more\*{0,2}\s*\]\((https?:\/\/[^)\s]+)\)/i,
  );
  if (readMore) return readMore[1];
  const firstExternal = body.match(/\]\((https?:\/\/[^)\s]+)\)/);
  return firstExternal ? firstExternal[1] : null;
}

// Find the post banner image. Returns the public URL to use as the card
// thumbnail plus, for in-post files, a job that emits a downscaled WebP under
// static/ (the URL is only valid once that job ran). `image` stays null when
// the post has no usable image, so the card falls back to its category image.
function resolveBanner(dir, content, slug) {
  const body = getPostBody(content);

  // First inline markdown image, e.g. ![alt](./banner.webp "title")
  const imgMatch = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (!imgMatch) return { image: null, job: null };

  // Drop an optional title after the URL, and any surrounding whitespace
  const rawUrl = imgMatch[1].trim().split(/\s+/)[0];

  // Remote or already-public paths can be used as-is
  if (/^https?:\/\//.test(rawUrl) || rawUrl.startsWith('/')) {
    return { image: rawUrl, job: null };
  }

  // In-post relative asset: resolve on disk and emit a small WebP thumbnail
  const rel = rawUrl.replace(/^\.\//, '');
  const srcPath = path.join(blogDir, dir, rel);
  if (!fs.existsSync(srcPath)) return { image: null, job: null };

  const destName = `${slug}.webp`;
  const destPath = path.join(thumbsDir, destName);
  return {
    image: `${thumbsPublicBase}/${destName}`,
    job: async () => {
      await sharp(srcPath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(destPath);
    },
  };
}

// Resolve author keys to name + imageUrl
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

// Run async jobs with a bounded number of them in flight.
async function runJobs(jobs) {
  let next = 0;
  const workers = Array.from({ length: Math.min(THUMB_CONCURRENCY, jobs.length) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next];
      next += 1;
      await job();
    }
  });
  await Promise.all(workers);
}

async function main() {
  // Start from a clean thumbnails directory so stale banners don't linger
  fs.rmSync(thumbsDir, { recursive: true, force: true });
  fs.mkdirSync(thumbsDir, { recursive: true });

  const posts = [];
  const jobs = [];
  const tagCounts = {};

  for (const dir of dirs) {
    const postPath = path.join(blogDir, dir, 'index.md');
    if (!fs.existsSync(postPath)) continue;

    const content = fs.readFileSync(postPath, 'utf8');

    // Parse frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const frontmatter = yaml.load(fmMatch[1]);

    // Extract date from directory name
    const dateMatch = dir.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;

    const slug = frontmatter.slug || dir;
    const tags = frontmatter.tags || [];

    // Post counts per canonical tag, shown on the /news category tiles. A post
    // counts once per tag it carries, so the numbers can exceed the post count.
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    const banner = resolveBanner(dir, content, slug);
    if (banner.job) jobs.push(banner.job);

    posts.push({
      title: frontmatter.title,
      permalink: `/news/${slug}`,
      date: dateMatch[1],
      // The card text is the post's own summary (the first paragraph). The
      // `description` frontmatter field is the search/social meta description
      // and reads differently, so it is only the fallback.
      description: extractDescription(content) || frontmatter.description,
      image: banner.image,
      authors: resolveAuthors(frontmatter.authors),
      tags,
      sourceUrl: extractSourceUrl(content),
    });
  }

  await runJobs(jobs);

  const newsIndex = {
    tagCounts,
    posts: posts.map(
      ({ permalink, date, description, image, tags: postTags, sourceUrl }) => ({
        permalink,
        date,
        description: toExcerpt(description),
        image,
        tags: postTags,
        sourceUrl,
      }),
    ),
  };

  // The homepage section shows only the newest handful of posts
  fs.writeFileSync(
    outputPath,
    JSON.stringify(posts.slice(0, RECENT_COUNT), null, 2),
  );

  // The /news grid paginates through every post. Minified: it ships to the
  // client with the page bundle and is never read by a human.
  fs.writeFileSync(
    indexPath,
    `${JSON.stringify(newsIndex)}\n`,
  );

  console.log(
    `✅ Generated recentNews.json (${posts.slice(0, RECENT_COUNT).length} posts) and newsIndex.json (${posts.length} posts, ${Object.keys(tagCounts).length} tags)`,
  );
}

main();
