// Canonical news categories, mirroring blog/tags.yml. The blog plugin is
// configured with onInlineTags: 'throw', so a tag that is missing there fails
// the build: this list and tags.yml have to stay in sync.
//
// The order here is the order the /news category tiles are rendered in and the
// order the tag pickers rely on. `image` is the on-brand Open Graph tile used
// when a post carries no banner image of its own.

export const CATEGORY_LABELS = {
  development: 'Development',
  research: 'Research',
  governance: 'Governance',
  community: 'Community',
  ecosystem: 'Ecosystem',
  education: 'Education',
  events: 'Events',
};

// On-brand category tiles (the site's Open Graph images) used as the thumbnail
// when a post has no banner of its own.
export const CATEGORY_IMAGES = {
  development: '/img/og/developers.jpg',
  research: '/img/og/research.jpg',
  governance: '/img/og/governance.jpg',
  community: '/img/og/ambassadors.jpg',
  ecosystem: '/img/og/cardano-news.jpg',
  education: '/img/og/get-started.jpg',
  events: '/img/og/events.jpg',
};

export const DEFAULT_IMAGE = '/img/og/default.jpg';

// Category slugs in the order the tag pickers present them.
export const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS);

// Public path of a category tile, appended to the tag base path.
export function categoryPath(tagsBasePath, slug) {
  return `${(tagsBasePath || "/news/tags/").replace(/\/$/, "")}/${slug}/`;
}

// The blog plugin hands the pages locale-correct paths: mostly /news/ in an
// English build, /de/news/ in the German one. Hardcoding them would break the
// single-locale builds, so the tile paths are derived from what the plugin
// gives the page. These helpers also drop the /page/<n>/ pagination segment.
export function newsPathsFromIndexPath(permalink) {
  const index = (permalink || "/news/").replace(/page\/\d+\/?$/, "");
  return { indexPath: index, tagsBasePath: `${index.replace(/\/$/, "")}/tags/` };
}

export function newsPathsFromTagPath(tagPermalink, allTagsPath) {
  const index = (tagPermalink || "/news/").replace(/tags\/[^/]+\/?$/, "");
  return {
    indexPath: index,
    tagsBasePath: allTagsPath || `${index.replace(/\/$/, "")}/tags/`,
  };
}

// An article sits one segment below its listing: /news/<slug>/ in an English
// build, /de/news/<slug>/ in the German one.
export function newsPathsFromPostPath(postPermalink) {
  const indexPath = (postPermalink || "/news/").replace(/[^/]+\/?$/, "");
  return { indexPath, tagsBasePath: `${indexPath.replace(/\/$/, "")}/tags/` };
}

// Tag objects on a post (and on tag pages) expose a permalink such as
// /news/tags/governance/; the slug is its last path segment.
export function categorySlugFromPermalink(permalink) {
  if (!permalink) return undefined;
  const segments = permalink.split("/").filter(Boolean);
  return segments[segments.length - 1];
}
