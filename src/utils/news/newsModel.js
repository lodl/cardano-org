// Pure data helpers for the Cardano Newsroom. No Docusaurus or browser
// imports so Node unit tests can import this file directly.

const LEAD_PREFERRED_CATEGORIES = new Set([
  "ecosystem",
  "governance",
  "community",
  "research",
  "education",
  "events",
]);

const ROUTINE_SLUG_PATTERNS = [
  /weekly-development-report/i,
  /intersect-weekly-update/i,
  /community-digest/i,
];

const LEAD_LOOKBACK = 20;

export function normalizeText(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

export function isRoutineSeries(post) {
  if (!post) return false;
  const target = `${post.slug || ""} ${post.title || ""}`;
  return ROUTINE_SLUG_PATTERNS.some((re) => re.test(target));
}

// Select the hero lead story deterministically from the newest posts.
// Prefers editorial highlights in non-development categories over routine
// weekly reports so the top spotlight stays varied and engaging.
export function selectLeadStory(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return null;

  const recent = posts.slice(0, LEAD_LOOKBACK);

  const editorialWithMedia = recent.find((post) => {
    const primary = post.tags?.[0];
    return (
      LEAD_PREFERRED_CATEGORIES.has(primary) &&
      !isRoutineSeries(post) &&
      Boolean(post.image || post.youtubeId)
    );
  });
  if (editorialWithMedia) return editorialWithMedia;

  const nonRoutineWithMedia = recent.find(
    (post) => !isRoutineSeries(post) && Boolean(post.image || post.youtubeId)
  );
  if (nonRoutineWithMedia) return nonRoutineWithMedia;

  const nonDevelopment = recent.find((post) => post.tags?.[0] !== "development");
  if (nonDevelopment) return nonDevelopment;

  return posts[0] || null;
}

// Select 1 lead story + 2 secondary spotlights from non-routine posts with
// media, preferring distinct primary categories for visual and topical variety.
export function selectEditorialShowcase(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return { lead: null, spotlights: [] };
  }

  const lead = selectLeadStory(posts);
  if (!lead) return { lead: null, spotlights: [] };

  const nonRoutineMedia = posts.filter(
    (post) =>
      post.slug !== lead.slug &&
      !isRoutineSeries(post) &&
      Boolean(post.image || post.youtubeId)
  );

  const spotlights = [];
  const usedCategories = new Set([lead.tags?.[0]].filter(Boolean));
  const usedSlugs = new Set([lead.slug]);

  // First pass: pick up to 2 from the top 20 with distinct primary categories.
  for (const post of nonRoutineMedia.slice(0, LEAD_LOOKBACK)) {
    if (spotlights.length >= 2) break;
    const cat = post.tags?.[0];
    if (cat && !usedCategories.has(cat)) {
      spotlights.push(post);
      usedCategories.add(cat);
      usedSlugs.add(post.slug);
    }
  }

  // Second pass: fill remaining spotlight slots with newest non-routine media.
  for (const post of nonRoutineMedia) {
    if (spotlights.length >= 2) break;
    if (!usedSlugs.has(post.slug)) {
      spotlights.push(post);
      usedSlugs.add(post.slug);
    }
  }

  // Final fallback if the feed has fewer than 3 non-routine media posts.
  for (const post of posts) {
    if (spotlights.length >= 2) break;
    if (!usedSlugs.has(post.slug)) {
      spotlights.push(post);
      usedSlugs.add(post.slug);
    }
  }

  return { lead, spotlights };
}

// Pick the latest issue of the three recurring ecosystem series.
export function selectRecurringBeats(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const defs = [
    {
      id: "weekly-dev",
      category: "development",
      match: (p) =>
        /weekly-development-report/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
    {
      id: "community-digest",
      category: "community",
      match: (p) =>
        /community-digest/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
    {
      id: "intersect-update",
      category: "governance",
      match: (p) =>
        /intersect-weekly-update/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
  ];

  const beats = [];
  for (const def of defs) {
    const post = posts.find(def.match);
    if (post) {
      beats.push({ id: def.id, category: def.category, post });
    }
  }
  return beats;
}

// Pick latest + up to (perSeries - 1) previous issues for each recurring series.
export function selectRecurringSeriesHistory(posts, perSeries = 3) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const defs = [
    {
      id: "weekly-dev",
      category: "development",
      match: (p) =>
        /weekly-development-report/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
    {
      id: "community-digest",
      category: "community",
      match: (p) =>
        /community-digest/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
    {
      id: "intersect-update",
      category: "governance",
      match: (p) =>
        /intersect-weekly-update/i.test(`${p.slug || ""} ${p.title || ""}`),
    },
  ];

  const seriesList = [];
  for (const def of defs) {
    const matches = [];
    for (const post of posts) {
      if (def.match(post)) {
        matches.push(post);
        if (matches.length >= perSeries) break;
      }
    }
    if (matches.length > 0) {
      seriesList.push({
        id: def.id,
        category: def.category,
        latest: matches[0],
        previous: matches.slice(1),
      });
    }
  }
  return seriesList;
}

// Return the newest `limit` video dispatches (posts with an embedded YouTube ID).
export function selectLatestVideos(posts, limit = 3) {
  if (!Array.isArray(posts) || posts.length === 0) return [];
  return posts.filter((post) => Boolean(post.youtubeId)).slice(0, limit);
}

// Filter posts by category, author key, format ("all" | "article" | "video"),
// 4-digit year string, scope ("all" | "editorial" | "briefings"), and
// multi-token diacritic-insensitive query.
export function filterNews(
  posts,
  {
    category = null,
    author = null,
    format = "all",
    year = null,
    scope = "all",
    query = "",
  } = {}
) {
  if (!Array.isArray(posts)) return [];

  const tokens = normalizeText(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return posts.filter((post) => {
    if (scope === "editorial" && isRoutineSeries(post)) return false;
    if (scope === "briefings" && !isRoutineSeries(post)) return false;
    if (category && !(post.tags || []).includes(category)) return false;
    if (author && !(post.authors || []).some((a) => a.key === author)) return false;
    if (format === "video" && !post.youtubeId) return false;
    if (format === "article" && post.youtubeId) return false;
    if (year && !(post.date || "").startsWith(String(year))) return false;

    if (tokens.length > 0) {
      const haystack = normalizeText(
        [
          post.title,
          post.description,
          ...(post.authors || []).map((a) => a.name),
          ...(post.tags || []),
          post.externalHost,
        ]
          .filter(Boolean)
          .join(" ")
      );
      if (!tokens.every((token) => haystack.includes(token))) return false;
    }

    return true;
  });
}

// Compute filter counts and sorted option lists from all posts.
export function collectFilterOptions(posts) {
  const categoryCounts = {};
  const authorMap = new Map();
  const yearSet = new Set();
  let videoCount = 0;

  for (const post of posts || []) {
    for (const tag of post.tags || []) {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
    }
    for (const author of post.authors || []) {
      if (!author.key) continue;
      const existing = authorMap.get(author.key);
      if (existing) {
        existing.count += 1;
      } else {
        authorMap.set(author.key, {
          key: author.key,
          name: author.name,
          imageUrl: author.imageUrl,
          count: 1,
        });
      }
    }
    if (post.date && /^\d{4}/.test(post.date)) {
      yearSet.add(post.date.slice(0, 4));
    }
    if (post.youtubeId) {
      videoCount += 1;
    }
  }

  const authors = [...authorMap.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
  const years = [...yearSet].sort((a, b) => b.localeCompare(a));

  return {
    categoryCounts,
    authors,
    years,
    videoCount,
    totalCount: (posts || []).length,
  };
}

// Pick up to `limit` related articles for an individual post page,
// prioritizing primary-tag and shared-tag matches while preserving recency.
export function selectRelatedNews(posts, currentSlug, tags = [], limit = 3) {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  const targetTags = new Set(tags || []);
  const primaryTag = (tags || [])[0];

  return posts
    .filter((post) => post.slug !== currentSlug && post.permalink !== `/news/${currentSlug}`)
    .map((post, index) => {
      let score = 0;
      const postTags = post.tags || [];
      if (primaryTag && postTags[0] === primaryTag) score += 3;
      for (const tag of postTags) {
        if (targetTags.has(tag)) score += 2;
      }
      return { post, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.post);
}

// Format YYYY-MM-DD in local calendar components (avoids UTC day shifts).
export function formatNewsDate(dateStr, locale = "en-US") {
  if (!dateStr) return "";
  const [year, month, day] = String(dateStr).split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format YYYY-MM-DD as compact month/day (e.g. "Nov 15") for broadsheet rows.
export function formatShortNewsDate(dateStr, locale = "en-US") {
  if (!dateStr) return "";
  const [year, month, day] = String(dateStr).split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

// Resolve card thumbnail primary URL and on-brand fallback URL.
export function getPostCardImage(post, fallbackMap, defaultImg) {
  const primaryCategory = post?.tags?.[0];
  const fallbackSrc = (primaryCategory && fallbackMap?.[primaryCategory]) || defaultImg;
  const youtubeThumb = post?.youtubeId
    ? `https://i.ytimg.com/vi/${post.youtubeId}/hqdefault.jpg`
    : null;
  const primarySrc = post?.image || youtubeThumb || fallbackSrc;
  return { primarySrc, fallbackSrc };
}
