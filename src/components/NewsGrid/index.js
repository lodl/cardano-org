import React from "react";
import {
  CATEGORY_IMAGES,
  CATEGORY_LABELS,
  DEFAULT_IMAGE,
  categorySlugFromPermalink,
} from "@site/src/data/newsCategories";
import NewsCard from "@site/src/components/NewsCard";
import newsIndex from "@site/src/data/newsIndex.json";
import styles from "./styles.module.css";

// Card extras (banner thumbnail, summary text, source link, tag order) are
// generated for every post by scripts/generate-recent-news.js. Keyed by slug
// rather than by full permalink so the lookup also resolves on the localized
// blog routes.
const indexBySlug = new Map(
  newsIndex.posts.map((post) => [permalinkSlug(post.permalink), post]),
);

function permalinkSlug(permalink) {
  const segments = (permalink || "").split("/").filter(Boolean);
  return segments[segments.length - 1];
}

/**
 * Maps one blog list item to the props of `NewsCard`. The generated index
 * supplies the banner, the full summary and the source URL; the theme metadata
 * is the fallback, since it is present for every post.
 */
function cardFromMetadata(metadata) {
  const entry = indexBySlug.get(permalinkSlug(metadata.permalink));
  const primaryTag = metadata.tags?.[0];
  const category =
    categorySlugFromPermalink(primaryTag?.permalink) || entry?.tags?.[0];
  return {
    title: metadata.title,
    date: entry?.date || metadata.date,
    category,
    categoryLabel: primaryTag?.label || CATEGORY_LABELS[category],
    image: entry?.image || CATEGORY_IMAGES[category] || DEFAULT_IMAGE,
    // The card carries the post's own summary, not a truncated teaser.
    description: entry?.description || metadata.description || "",
    // cardano.org is a hub: the card sends the reader to the original article.
    // Only if a post somehow has no source does it fall back to its own page.
    href: entry?.sourceUrl || metadata.permalink,
    external: Boolean(entry?.sourceUrl),
    // Theme metadata names the field imageURL, authors.yml spells it imageUrl.
    author:
      entry?.authors?.[0] ||
      (metadata.authors?.[0]
        ? {
            name: metadata.authors[0].name,
            imageUrl: metadata.authors[0].imageURL,
          }
        : null),
  };
}

/**
 * News listing: one card per post of the current page. Every card links to the
 * original article behind the post, so the grid is an entry point to the
 * sources rather than an index of internal pages.
 *
 * @param {{items: Array}} props
 *   `items` are the blog list items from the theme (`{content: BlogPostContent}`),
 *   so the grid renders exactly the posts the current page owns and pagination
 *   stays server-side.
 */
export default function NewsGrid({ items }) {
  if (!items?.length) return null;

  return (
    <div className={styles.grid}>
      {items.map(({ content: BlogPostContent }) => (
        <NewsCard
          key={BlogPostContent.metadata.permalink}
          post={cardFromMetadata(BlogPostContent.metadata)}
        />
      ))}
    </div>
  );
}
